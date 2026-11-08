// 기획 문서(docs/*.md) 5종 + 화면 이미지를 파일 하나짜리 HTML 기획안으로 묶습니다.
//   npm run plan:html   →   docs/AXProof_기획안_v2.html
// 이미지가 HTML 안에 들어가 있어 카카오톡·메일로 보내도 그대로 열립니다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const here = path.dirname(fileURLToPath(import.meta.url));
const DOCS = path.resolve(here, '..', '..', 'docs');
const OUT = path.join(DOCS, 'AXProof_기획안_v2.html');
const CHAPTERS = [
  ['01_AXProof_서비스기획서_v2.md', '서비스 기획서 · Why · What · How'],
  ['02_사용자시나리오_v3.md', '사용자 시나리오'],
  ['03_화면설계_기능명세.md', '화면 설계 · 기능 명세'],
  ['04_멘토피드백_반영표.md', '멘토 피드백 · 결정사항 반영표'],
  ['05_앞으로의_방향성과_배포가이드.md', '앞으로의 방향성 · 배포 가이드'],
  ['06_플랫폼확장과실서비스전환_v1.2.md', 'v1.2 확장 · 실제 서비스 연결'],
  ['07_OBYB_멘토리뷰.md', '링커스 OB·YB 간편 멘토 리뷰']
];

const slug = (t) => t.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '');
function inlineImages(html) {
  return html.replace(/<img([^>]*?)src="([^"]+)"([^>]*)>/g, (m, a, src, b) => {
    if (/^(https?:|data:)/.test(src)) return m;
    const f = path.join(DOCS, decodeURIComponent(src));
    if (!fs.existsSync(f)) return m;
    const ext = path.extname(f).slice(1).toLowerCase();
    const mime = ext === 'jpg' ? 'image/jpeg' : 'image/' + ext;
    return `<img${a}src="data:${mime};base64,${fs.readFileSync(f).toString('base64')}"${b}>`;
  });
}

const toc = [];
const sections = CHAPTERS.map(([file, title], ci) => {
  const md = fs.readFileSync(path.join(DOCS, file), 'utf8');
  let html = marked.parse(md);
  // 장 안의 h1·h2에 id를 달고 목차에 추가
  html = html.replace(/<h([12])>(.*?)<\/h\1>/g, (m, lv, inner) => {
    const text = inner.replace(/<[^>]+>/g, '');
    const id = 'c' + (ci + 1) + '-' + slug(text).slice(0, 40);
    if (lv === '1' || /^#?\s*\d|Why|What|How|Part/.test(text)) toc.push({ ci, lv: Number(lv), id, text });
    return `<h${lv} id="${id}">${inner}</h${lv}>`;
  });
  return `<section class="chapter" id="ch${ci + 1}"><div class="chap-tag">CHAPTER ${ci + 1}</div>${inlineImages(html)}</section>`;
});

const tocHtml = CHAPTERS.map(([, title], ci) => `<li><a href="#ch${ci + 1}"><b>${ci + 1}. ${title}</b></a><ul>${toc.filter(t => t.ci === ci && t.lv === 2).slice(0, 8).map(t => `<li><a href="#${t.id}">${t.text}</a></li>`).join('')}</ul></li>`).join('');
const today = new Date().toISOString().slice(0, 10);

const page = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>AX Proof 기획안 v2</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<style>
:root{--bg:#F4F2ED;--ink:#1B2420;--muted:#5E6B64;--line:#E4E0D7;--brand:#0E6B4B;--brand-ink:#0A4F37;--soft:#E2F0E9;--side:#163D30}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;font-family:'Pretendard Variable',Pretendard,'Malgun Gothic',sans-serif;background:var(--bg);color:var(--ink);line-height:1.75;word-break:keep-all;overflow-wrap:anywhere}
.cover{background:var(--side);color:#fff;padding:72px 24px 64px}
.cover .in,.wrap{max-width:1000px;margin:0 auto}
.cover .tag{display:inline-block;font-size:13px;font-weight:700;color:#8FE0B9;background:rgba(63,191,138,.14);padding:5px 12px;border-radius:99px}
.cover h1{font-size:44px;line-height:1.25;margin:18px 0 0;letter-spacing:-.02em}
.cover p{color:#CFE3D9;font-size:17px;max-width:720px}
.cover .meta{color:#8FB3A3;font-size:13px;margin-top:28px}
.layout{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:260px minmax(0,1fr);gap:28px;padding:28px 20px 80px}
nav.toc{position:sticky;top:16px;align-self:start;max-height:calc(100vh - 32px);overflow:auto;font-size:13.5px;background:#fff;border:1px solid var(--line);border-radius:16px;padding:16px}
nav.toc ul{list-style:none;margin:0;padding:0}nav.toc li{margin:6px 0}nav.toc ul ul{padding-left:12px;margin-top:4px}nav.toc ul ul li{margin:3px 0}
nav.toc a{color:var(--ink);text-decoration:none}nav.toc ul ul a{color:var(--muted)}nav.toc a:hover{color:var(--brand)}
.chapter{background:#fff;border:1px solid var(--line);border-radius:20px;padding:40px 48px;margin-bottom:24px}
.chap-tag{font-size:12px;font-weight:800;color:var(--brand);letter-spacing:.08em}
.chapter h1{font-size:28px;line-height:1.35;margin:8px 0 14px;padding-top:12px}
.chapter h1+h1,.chapter hr+h1{border-top:2px solid var(--soft);margin-top:36px}
.chapter h2{font-size:21px;color:var(--brand-ink);margin:32px 0 10px}.chapter h3{font-size:17px;margin:24px 0 8px}
blockquote{margin:16px 0;padding:12px 18px;background:var(--soft);border-left:4px solid var(--brand);border-radius:0 12px 12px 0}blockquote p{margin:4px 0}
table{width:100%;border-collapse:collapse;margin:14px 0;font-size:14.5px;display:block;overflow-x:auto}
th,td{border:1px solid var(--line);padding:8px 10px;text-align:left;vertical-align:top}th{background:#FAF9F6;white-space:nowrap}
td img{width:100%;max-width:560px;border:1px solid var(--line);border-radius:10px;display:block}
code{background:#F2F0EA;padding:1px 6px;border-radius:6px;font-size:13.5px}
pre{background:#F7F5F0;padding:14px 16px;border-radius:12px;overflow-x:auto;font-size:13px;line-height:1.6}pre code{background:none;padding:0}
hr{border:0;border-top:1px solid var(--line);margin:28px 0}a{color:var(--brand)}
.foot{text-align:center;color:var(--muted);font-size:12.5px;margin-top:20px}
@media(max-width:900px){.layout{grid-template-columns:1fr}nav.toc{position:static;max-height:none}.chapter{padding:24px 18px;border-radius:14px}.cover h1{font-size:30px}td img{max-width:100%}}
@media print{nav.toc{display:none}.layout{display:block;padding:0}.chapter{border:0;page-break-before:always;padding:0}.cover{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<header class="cover"><div class="in"><span class="tag">AX Proof · 기획안 v2</span>
<h1>AI 활용을 넘어, 일을 잘하는 인재로.</h1>
<p>AI 사수와 함께 현업 과제를 수행하며 판단력과 AI 활용 역량을 훈련하고, 그 과정이 그대로 검증 가능한 포트폴리오가 되는 실무 역량 훈련 플랫폼 — 링커스 20기 파일럿</p>
<div class="meta">${today} · 우서진 · 서비스 기획서 · 사용자 시나리오 · 화면 설계·기능 명세 · 피드백 반영표 · 방향성·배포 가이드</div></div></header>
<div class="layout"><nav class="toc"><b>목차</b><ul class="mt">${tocHtml}</ul></nav>
<main>${sections.join('\n')}<p class="foot">AX Proof · 이 파일은 docs 폴더의 문서에서 자동으로 만들어졌습니다 (web: npm run plan:html)</p></main></div>
</body></html>`;

fs.writeFileSync(OUT, page);
console.log('[plan:html] ' + OUT + ' (' + Math.round(page.length / 1024) + ' KB)');
