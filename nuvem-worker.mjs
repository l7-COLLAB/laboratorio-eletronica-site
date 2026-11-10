const categories = ["Circuitos e eletrônica", "Computação e lógica", "Física e medições", "Matemática", "Método de estudo", "Microeletrônica", "Pesquisa e comunicação"];
const noteKeys = new Set(categories.map(name => "laboratorio-eletronica:anotacoes:v1:" + encodeURIComponent(name)));
const stageIds = new Set([
  ...Array.from({length: 14}, (_, index) => "M" + String(index).padStart(2, "0")),
  ...Array.from({length: 10}, (_, index) => "S" + String(index + 1).padStart(2, "0")),
]);
const origin = "https://l7-collab.github.io";

function validEntry(key, value) {
  if (typeof value !== "string" || value.length > 60000) return false;
  if (noteKeys.has(key)) return value.length <= 20000;
  try {
    const data = JSON.parse(value);
    if (key === "laboratorio-eletronica:revisados:v1") {
      return Array.isArray(data) && data.length <= 14 &&
        data.every(id => stageIds.has(id) && id.startsWith("M"));
    }
    if (key !== "laboratorio-eletronica:trilha:v1" || !data || typeof data !== "object") return false;
    if (!Array.isArray(data.passed) || data.passed.length > 24 || data.passed.some(id => !stageIds.has(id))) return false;
    if (![10, 15, 20].includes(data.minutes)) return false;
    if (data.lastGoal !== null && (!Number.isInteger(data.lastGoal) || data.lastGoal < 0 || data.lastGoal > 100000)) return false;
    for (const [id, review] of Object.entries(data.reviews ?? {})) {
      if (!stageIds.has(id) || !review || !Number.isInteger(review.round) || review.round < 0 || review.round > 3 ||
          !Number.isInteger(review.due) || review.due < 0 || review.due > 100000) return false;
    }
    for (const [id, answers] of Object.entries(data.attempts ?? {})) {
      if (!stageIds.has(id) || !Array.isArray(answers) || answers.length !== 3 ||
          answers.some(answer => typeof answer !== "string" || answer.length > 500)) return false;
    }
    return true;
  } catch {
    return false;
  }
}

export default {
  async fetch(request, env) {
    const requestOrigin = request.headers.get("Origin");
    const headers = {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Vary": "Origin",
    };
    if (requestOrigin === origin) {
      headers["Access-Control-Allow-Origin"] = origin;
      headers["Access-Control-Allow-Methods"] = "GET, PUT, OPTIONS";
      headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type";
      headers["Access-Control-Max-Age"] = "3600";
    }
    const reply = (body, status = 200) => new Response(JSON.stringify(body), {status, headers});
    if (requestOrigin && requestOrigin !== origin) return reply({error: "Origem não autorizada."}, 403);
    if (request.method === "OPTIONS") return new Response(null, {status: 204, headers});
    const url = new URL(request.url);
    if (url.pathname === "/health" && request.method === "GET") return reply({ok: true});
    const token = request.headers.get("Authorization")?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];
    if (!token || !env.TOKEN_HASH) return reply({error: "Código de acesso necessário."}, 401);
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
    const hex = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
    let mismatch = hex.length ^ env.TOKEN_HASH.length;
    for (let i = 0; i < hex.length; i++) mismatch |= hex.charCodeAt(i) ^ env.TOKEN_HASH.charCodeAt(i);
    if (mismatch) return reply({error: "Código de acesso inválido."}, 401);
    try {
      if (url.pathname === "/state" && request.method === "GET") {
        const data = await env.DB.prepare("SELECT key, value, revision, updated_at FROM entries ORDER BY key").all();
        return reply({entries: data.results});
      }
      if (url.pathname === "/history" && request.method === "GET") {
        const key = url.searchParams.get("key");
        if (!noteKeys.has(key) && !["laboratorio-eletronica:trilha:v1", "laboratorio-eletronica:revisados:v1"].includes(key)) {
          return reply({error: "Categoria inválida."}, 400);
        }
        const data = await env.DB.prepare("SELECT value, revision, updated_at FROM versions WHERE key = ? ORDER BY id DESC LIMIT 10").bind(key).all();
        return reply({versions: data.results});
      }
      if (url.pathname !== "/state" || request.method !== "PUT") return reply({error: "Endereço inválido."}, 404);
      if (Number(request.headers.get("Content-Length")) > 300000) return reply({error: "Anotação muito longa."}, 413);
      const raw = await request.text();
      if (raw.length > 300000) return reply({error: "Anotação muito longa."}, 413);
      let input;
      try { input = JSON.parse(raw); } catch { return reply({error: "Formato inválido."}, 400); }
      const {key, value, revision} = input ?? {};
      if (!validEntry(key, value) || !Number.isSafeInteger(revision) || revision < 0) return reply({error: "Dados inválidos ou anotação acima do limite de 20.000 caracteres."}, 400);
      const now = new Date().toISOString();
      const saved = revision === 0
        ? await env.DB.prepare("INSERT OR IGNORE INTO entries (key, value, revision, updated_at) VALUES (?, ?, 1, ?) RETURNING key, value, revision, updated_at").bind(key, value, now).first()
        : await env.DB.prepare("UPDATE entries SET value = ?, revision = revision + 1, updated_at = ? WHERE key = ? AND revision = ? RETURNING key, value, revision, updated_at").bind(value, now, key, revision).first();
      if (saved) return reply({entry: saved});
      const current = await env.DB.prepare("SELECT key, value, revision, updated_at FROM entries WHERE key = ?").bind(key).first();
      return reply({error: "Este registro mudou em outro aparelho.", current}, 409);
    } catch {
      return reply({error: "A nuvem está temporariamente indisponível. Suas alterações locais serão reenviadas."}, 503);
    }
  },
};
