import "./historico-core.js";
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
    if (key === globalThis.CalcHistory.KEY) {
      return data && typeof data === 'object' && !Array.isArray(data) &&
        typeof data.clear === 'string' && (data.clear === '' || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(data.clear) && Number.isFinite(Date.parse(data.clear))) &&
        Array.isArray(data.entries) && data.entries.length <= 80 && data.entries.every(globalThis.CalcHistory.valid) &&
        new Set(data.entries.map(x=>x.id)).size === data.entries.length;
    }
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

const encoder = new TextEncoder();

async function tokenHash(value) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
}

function secureEqual(a, b) {
  let mismatch = a.length ^ b.length;
  for (let index = 0; index < a.length; index++) mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index);
  return mismatch === 0;
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

async function passwordHash(password, salt, iterations = 100000) {
  const material = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]);
  const derived = await crypto.subtle.deriveBits({name: "PBKDF2", salt: encoder.encode(salt), iterations, hash: "SHA-256"}, material, 256);
  return Array.from(new Uint8Array(derived), byte => byte.toString(16).padStart(2, "0")).join("");
}

async function createSession(db) {
  const token = randomToken();
  const now = Math.floor(Date.now() / 1000);
  await db.batch([
    db.prepare("DELETE FROM access_sessions WHERE expires_at <= ?").bind(now),
    db.prepare("INSERT INTO access_sessions (token_hash, expires_at, created_at) VALUES (?, ?, ?)")
      .bind(await tokenHash(token), now + 180 * 86400, now),
  ]);
  return token;
}

async function authenticate(request, env) {
  const token = request.headers.get("Authorization")?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1];
  if (!token) return null;
  const hash = await tokenHash(token);
  if (env.TOKEN_HASH && secureEqual(hash, env.TOKEN_HASH)) return {recovery: true, hash};
  const session = await env.DB.prepare("SELECT token_hash FROM access_sessions WHERE token_hash = ? AND expires_at > ?")
    .bind(hash, Math.floor(Date.now() / 1000)).first();
  return session ? {hash, recovery: false} : null;
}

async function handleSignIn(request, env, path, reply) {
  const now = Math.floor(Date.now() / 1000);
  const identity = await tokenHash(request.headers.get("CF-Connecting-IP") || "unknown");
  const bucket = identity + ":" + Math.floor(now / 900);
  const limit = await env.DB.prepare("INSERT INTO auth_limits (key, attempts, expires_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET attempts = attempts + 1 RETURNING attempts")
    .bind(bucket, now + 900).first();
  await env.DB.prepare("DELETE FROM auth_limits WHERE expires_at < ?").bind(now).run();
  if (limit.attempts > 8) return reply({error: "Muitas tentativas. Aguarde 15 minutos antes de tentar novamente."}, 429);
  const raw = await request.text();
  if (raw.length > 4096) return reply({error: "Dados de acesso muito longos."}, 400);
  let input;
  try { input = JSON.parse(raw); } catch { return reply({error: "Formato inválido."}, 400); }
  const username = typeof input?.username === "string" ? input.username.trim().toLowerCase() : "";
  const password = input?.password;
  if (!/^[a-z0-9._-]{3,32}$/.test(username) || typeof password !== "string" || password.length < 8 || password.length > 128) {
    return reply({error: "Use um usuário de 3 a 32 letras sem acentos, números, ponto, hífen ou sublinhado e uma senha de 8 a 128 caracteres."}, 400);
  }
  if (path === "/auth/setup") {
    if (typeof input.ticket !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(input.ticket)) return reply({error: "Abra o link privado de primeiro acesso."}, 403);
    const setupHash = await tokenHash(input.ticket);
    const available = await env.DB.prepare("SELECT token_hash FROM setup_links WHERE token_hash = ? AND used = 0 AND expires_at > ?").bind(setupHash, now).first();
    if (!available) return reply({error: "Este link foi usado ou expirou. Se o acesso já foi criado, entre com seu usuário e senha."}, 403);
    const salt = randomToken();
    const hash = await passwordHash(password, salt);
    const result = await env.DB.batch([
      env.DB.prepare("INSERT INTO owner_access (id, username, password_hash, salt, iterations) SELECT 1, ?, ?, ?, 100000 WHERE EXISTS (SELECT 1 FROM setup_links WHERE token_hash = ? AND used = 0 AND expires_at > ?) ON CONFLICT(id) DO NOTHING RETURNING id")
        .bind(username, hash, salt, setupHash, now),
      env.DB.prepare("UPDATE setup_links SET used = 1 WHERE token_hash = ? AND EXISTS (SELECT 1 FROM owner_access WHERE username = ? AND password_hash = ?)").bind(setupHash, username, hash),
    ]);
    if (!result[0].results?.length) return reply({error: "O acesso já foi criado. Entre com seu usuário e senha."}, 409);
    await env.DB.prepare("DELETE FROM auth_limits WHERE key = ?").bind(bucket).run();
    return reply({token: await createSession(env.DB)});
  }
  const owner = await env.DB.prepare("SELECT username, password_hash, salt, iterations FROM owner_access WHERE id = 1").first();
  const hash = await passwordHash(password, owner?.salt || "unconfigured-owner", owner?.iterations || 100000);
  if (!owner || owner.username !== username || !secureEqual(hash, owner.password_hash)) {
    return reply({error: "Usuário ou senha incorretos."}, 401);
  }
  await env.DB.prepare("DELETE FROM auth_limits WHERE key = ?").bind(bucket).run();
  return reply({token: await createSession(env.DB)});
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
      headers["Access-Control-Allow-Methods"] = "GET, PUT, POST, OPTIONS";
      headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type";
      headers["Access-Control-Max-Age"] = "3600";
    }
    const reply = (body, status = 200) => new Response(JSON.stringify(body), {status, headers});
    if (requestOrigin && requestOrigin !== origin) return reply({error: "Origem não autorizada."}, 403);
    if (request.method === "OPTIONS") return new Response(null, {status: 204, headers});
    const url = new URL(request.url);
    if (url.pathname === "/health" && request.method === "GET") return reply({ok: true, version: "materiais-20261112", calculatorHistory: true});
    try {
      if (["/auth/login", "/auth/setup"].includes(url.pathname) && request.method === "POST") {
        return await handleSignIn(request, env, url.pathname, reply);
      }
      const session = await authenticate(request, env);
      if (!session) return reply({error: "Entre novamente com seu usuário e senha ou use o código de recuperação."}, 401);
      if (url.pathname === "/auth/logout" && request.method === "POST") {
        if (!session.recovery) await env.DB.prepare("DELETE FROM access_sessions WHERE token_hash = ?").bind(session.hash).run();
        return reply({ok: true});
      }
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
      console.error(JSON.stringify({event:"sync_failure",path:url.pathname}));
      return reply({error: "A nuvem está temporariamente indisponível. Suas alterações locais serão reenviadas."}, 503);
    }
  },
};
