"use strict";
/* Parser matemático sem eval(), Function() ou dependências externas. */
(function (root) {
  function evaluate(expression, mode = "deg", ans = 0) {
    if (!['deg', 'rad'].includes(mode)) throw Error('Modo angular inválido.');
    const source = String(expression).replace(/−/g, '-').replace(/[×·]/g, '*').replace(/÷/g, '/')
      .replace(/,/g, '.').trim();
    if (!source || source.length > 180) throw Error('Digite uma expressão de até 180 caracteres.');
    const pattern = /\s+|(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|[A-Za-z]+|π|[+\-*/^()%!]/gy;
    const tokens = [];
    for (let i = 0; i < source.length;) {
      pattern.lastIndex = i;
      const match = pattern.exec(source);
      if (!match || match.index !== i) throw Error('Símbolo não reconhecido na posição ' + (i + 1) + '.');
      if (!/^\s+$/.test(match[0])) tokens.push(match[0]);
      i = pattern.lastIndex;
    }
    if (tokens.length > 150) throw Error('Expressão excessivamente longa.');
    let cursor = 0;
    const peek = () => tokens[cursor];
    const consume = () => tokens[cursor++];
    const take = text => peek() === text ? (cursor++, true) : false;
    const expect = text => { if (!take(text)) throw Error('Falta ' + text + '.'); };
    const rad = value => mode === 'deg' ? value * Math.PI / 180 : value;
    const unrad = value => mode === 'deg' ? value * 180 / Math.PI : value;
    const funcs = {
      sin: x => Math.sin(rad(x)), cos: x => Math.cos(rad(x)), tan: x => { const a = rad(x); if (Math.abs(Math.cos(a)) < 1e-14) throw Error("Tangente indefinida neste ângulo."); return Math.tan(a); },
      asin: x => unrad(Math.asin(x)), acos: x => unrad(Math.acos(x)), atan: x => unrad(Math.atan(x)),
      sqrt: x => Math.sqrt(x), ln: x => Math.log(x), log: x => Math.log10(x),
      abs: x => Math.abs(x), exp: x => Math.exp(x)
    };
    function atom() {
      const token = consume();
      if (token === '(') { const n = sum(); expect(')'); return n; }
      if (token == null) throw Error('Expressão incompleta.');
      if (/^(?:\d|\.)/.test(token)) {
        const num = Number(token);
        if (!Number.isFinite(num)) throw Error('Número fora do intervalo.');
        return num;
      }
      const name = token.toLowerCase();
      if (name === 'π' || name === 'pi') return Math.PI;
      if (name === 'e') return Math.E;
      if (name === 'ans') return ans;
      if (Object.prototype.hasOwnProperty.call(funcs, name)) {
        expect('('); const x = sum(); expect(')');
        const value = funcs[name](x);
        if (!Number.isFinite(value)) throw Error('Domínio inválido para ' + name + '.');
        return value;
      }
      throw Error('Termo inválido: ' + token + '.');
    }
    function postfix() {
      let x = atom();
      while (peek() === '%' || peek() === '!') {
        const op = consume();
        if (op === '%') x /= 100;
        else {
          if (!Number.isInteger(x) || x < 0 || x > 170) throw Error('Fatorial exige inteiro de 0 a 170.');
          let fact = 1; for (let n = 2; n <= x; n++) fact *= n; x = fact;
        }
      }
      return x;
    }
    function pow() {
      let x = postfix();
      if (take('^')) x = Math.pow(x, unary()); // associatividade à direita
      return x;
    }
    function unary() {
      if (take('+')) return unary();
      if (take('-')) return -unary();
      return pow();
    }
    function product() {
      let x = unary();
      while (peek() === '*' || peek() === '/') {
        const op = consume(), y = unary();
        if (op === '/' && y === 0) throw Error('Divisão por zero.');
        x = op === '*' ? x * y : x / y;
      }
      return x;
    }
    function sum() {
      let x = product();
      while (peek() === '+' || peek() === '-') {
        const op = consume(), y = product();
        x = op === '+' ? x + y : x - y;
      }
      return x;
    }
    const x = sum();
    if (cursor !== tokens.length) throw Error('Confira operadores e parênteses.');
    if (!Number.isFinite(x)) throw Error('Resultado numérico inválido ou fora do intervalo.');
    return Object.is(x, -0) ? 0 : x;
  }
  const core = { evaluate, format: value => String(Number(value.toPrecision(12))) };
  root.EletronicaCalc = core;
  if (typeof module !== 'undefined' && module.exports) module.exports = core;
})(typeof window !== 'undefined' ? window : globalThis);
