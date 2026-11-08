// POST /api/fetch-url {url} — 지식 에이전트: 채용공고(직무기술서)·기업 소식 페이지를 가져와 텍스트로 변환
import { readBody, send, fail, requireUser, getSecret, IS_SERVERLESS } from './_lib/util.js';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

const PRIVATE = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|0\.|\[::1\]|172\.(1[6-9]|2\d|3[01])\.)/i;
async function checkURL(u) {
  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (!/^https?:$/.test(u.protocol) || u.username || u.password || PRIVATE.test(host) || isIP(host)) throw Object.assign(new Error('가져올 수 없는 주소입니다'), { status: 400 });
  const allowed = getSecret('AXP_FETCH_ALLOWED_HOSTS').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  if ((IS_SERVERLESS || allowed.length) && !allowed.includes(host)) throw Object.assign(new Error('이 출처는 아직 수집 허용 목록에 없습니다. 운영진이 검토 후 등록해 주세요.'), { status: 400 });
  const addresses = await lookup(host, { all: true });
  if (!addresses.length || addresses.some(a => PRIVATE.test(a.address) || /^(::|fc|fd|fe[89ab]|2001:db8)/i.test(a.address))) throw Object.assign(new Error('사설망 주소는 수집할 수 없습니다'), { status: 400 });
}

export function htmlToText(html) {
  const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1] || '';
  const text = html
    .replace(/<(script|style|noscript|svg|nav|footer|header)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li|h\d|tr|section|article)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
  return { title: title.replace(/\s+/g, ' ').trim(), text };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return send(res, 405, { error: 'POST만 지원합니다' });
  try {
    await requireUser(req, ['admin', 'mentor']);
    const { url } = await readBody(req);
    let u;
    try { u = new URL(String(url || '')); } catch { return send(res, 400, { error: '주소 형식이 아닙니다' }); }
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 12000);
    try {
    let r;
    for (let redirects = 0; redirects <= 3; redirects++) {
      await checkURL(u);
      r = await fetch(u, { signal: ac.signal, redirect: 'manual', headers: { 'User-Agent': 'AXProof-KnowledgeAgent/1.0', Accept: 'text/html,text/plain' } });
      if (r.status >= 300 && r.status < 400) { const next = r.headers.get('location'); await r.body?.cancel(); if (!next || redirects === 3) throw Object.assign(new Error('페이지 이동이 너무 많습니다'), { status: 400 }); u = new URL(next, u); continue; }
      break;
    }
    if (!r.ok) return send(res, 502, { error: '페이지를 가져오지 못했습니다 (' + r.status + ')' });
    if (!/text\/|application\/json/i.test(r.headers.get('content-type') || '')) return send(res, 415, { error: '텍스트 자료만 수집할 수 있습니다' });
    const chunks = []; let size = 0;
    for await (const chunk of r.body) { size += chunk.length; if (size > 3 * 1024 * 1024) { ac.abort(); throw Object.assign(new Error('자료가 3MB를 넘습니다'), { status: 413 }); } chunks.push(Buffer.from(chunk)); }
    const buf = Buffer.concat(chunks);
    const raw = buf.toString('utf8');
    const ct = r.headers.get('content-type') || '';
    const out = ct.includes('html') ? htmlToText(raw) : { title: u.hostname, text: raw };
    send(res, 200, { url: u.toString(), title: out.title || u.hostname, text: out.text.slice(0, 30000), length: out.text.length });
    } finally { clearTimeout(t); }
  } catch (e) { fail(res, e); }
}
