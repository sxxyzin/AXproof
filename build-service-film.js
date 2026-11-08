// 코드로 제작한 원본 서비스 흐름 영상. 실제 사용자 화면 녹화가 아닌 예시 데이터입니다.
// 제작 도구만 node_modules/.axp-media-tools 아래에 설치하며 서비스 런타임에는 필요 없습니다.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);
const bin = process.env.AXP_FFMPEG || path.join(root, 'node_modules/.axp-media-tools/node_modules/@ffmpeg-installer/win32-x64/ffmpeg.exe');
const font = process.env.AXP_VIDEO_FONT || 'C:/Windows/Fonts/malgun.ttf';
if (!fs.existsSync(bin) || !fs.existsSync(font)) throw new Error('FFmpeg와 한글 폰트가 필요합니다. AXP_FFMPEG / AXP_VIDEO_FONT로 경로를 지정할 수 있습니다.');
const temp = 'node_modules/.axp-media-tools/render';
fs.mkdirSync(temp, { recursive: true }); fs.mkdirSync('public/assets/media', { recursive: true });
fs.copyFileSync(font, temp + '/font.ttf');
const filters = [];
function box(x, y, w, h, color, start = 0) { filters.push(`drawbox=x=${x}:y=${y}:w=${w}:h=${h}:color=${color}:t=fill:enable='gte(t,${start})'`); }
let n = 0;
function text(value, x, y, size = 24, color = '0x18392d', start = 0, end = 18) {
  const file = temp + '/line-' + n++ + '.txt'; fs.writeFileSync(file, value, 'utf8');
  filters.push(`drawtext=fontfile=${temp}/font.ttf:textfile=${file}:expansion=none:x=${x}:y=${y}:fontsize=${size}:fontcolor=${color}:line_spacing=12:alpha='if(between(t,${start},${end}),min(1,(t-${start})*3),0)'`);
}
text('AX Proof', 65, 36, 28, '0xa4e5be');
text('AI 시대의 첫 실무 경험', 875, 42, 20, '0xb5cbbf');
text('당신의 판단이 실력이 되는 순간.', 65, 105, 42, 'white');
text('서비스 흐름 소개 · 예시 데이터', 68, 166, 18, '0xb5cbbf');
box(64, 216, 1152, 400, '0xf8f8f2'); box(642, 216, 574, 400, '0xe6efe8');
box(90, 242, 102, 28, '0xdcecdf'); text('AI 사수', 106, 245, 16);
text('01 / 함께 생각하기', 112, 290, 23);
box(112, 340, 482, 82, 'white');
text('교육 의견의 40%는 비용 부담입니다.\n이 결과로 보고서를 작성할까요?', 130, 356, 22, '0x4c6155', 0.5);
box(146, 448, 448, 115, '0xcfe5d7', 2.5);
text('그 숫자는 출처가 없으니 쓰지 않을게요.\n우리 데이터 20건을 먼저 대조한 뒤\n분류 기준을 정하겠습니다.', 165, 468, 21, '0x153f2a', 2.5);
text('02 / 나의 선택을 발견하기', 680, 290, 23, '0x18392d', 6);
box(680, 340, 494, 110, 'white', 6.2);
text('판단 포착 · AI 검증', 701, 356, 16, '0x0e6b4b', 6.2);
text('출처 없는 수치는 사용하지 않음.\n우리 데이터로 확인한 후 기준을 정함.', 701, 385, 20, '0x18392d', 6.6);
box(680, 464, 494, 100, '0x153f2a', 11);
text('03 / 비공개 포트폴리오에 연결', 702, 480, 18, '0xb6edca', 11);
text('내가 내린 선택과 이유가\n설명할 수 있는 실무 경험이 됩니다.', 702, 512, 20, 'white', 11.4);
box(65, 642, 365, 3, '0x496456'); box(445, 642, 365, 3, '0x496456'); box(825, 642, 390, 3, '0x496456');
box(65, 642, 365, 3, '0xa4e5be', 0.5); box(445, 642, 365, 3, '0xa4e5be', 6); box(825, 642, 390, 3, '0xa4e5be', 11);
text('AI의 제안을 읽고', 65, 664, 20, '0xb5cbbf', 0, 6);
text('내 기준으로 확인하고', 65, 664, 20, '0xb5cbbf', 6, 11);
text('선택과 이유를 나의 증거로 남깁니다.', 65, 664, 20, '0xb5cbbf', 11, 18);
text('AX PROOF / PRODUCT WALKTHROUGH', 841, 670, 14, '0xb5cbbf');
filters.push('fade=t=in:st=0:d=0.4', 'fade=t=out:st=17.5:d=0.5');
const script = temp + '/filters.txt'; fs.writeFileSync(script, filters.join(','), 'utf8');
function run(args) { const r = spawnSync(bin, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { encoding: 'utf8', windowsHide: true }); if (r.status !== 0) throw new Error(r.stderr || '영상 제작 실패'); }
run(['-f', 'lavfi', '-i', 'color=c=0x102f25:s=1280x720:r=24:d=18', '-filter_script:v', script, '-an', '-c:v', 'libx264', '-preset', 'fast', '-crf', '23', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', 'public/assets/media/axproof-walkthrough.mp4']);
run(['-ss', '13', '-i', 'public/assets/media/axproof-walkthrough.mp4', '-frames:v', '1', '-q:v', '2', 'public/assets/media/axproof-walkthrough-poster.jpg']);
console.log('서비스 흐름 영상 18초와 포스터를 제작했습니다. ' + Math.round(fs.statSync('public/assets/media/axproof-walkthrough.mp4').size / 1024) + ' KB');
