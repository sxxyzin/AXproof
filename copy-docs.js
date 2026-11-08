// 배포 빌드: ../docs 의 기획 문서와 화면 이미지를 public/docs 로 복사 (plan.html 에서 읽음)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(here, '..', '..', 'docs');
const dst = path.resolve(here, '..', 'public', 'docs');

if (!fs.existsSync(src)) {
  console.log('[copy-docs] ../docs 폴더가 없어 건너뜁니다 (web 폴더만 배포한 경우).');
  process.exit(0);
}
fs.mkdirSync(dst, { recursive: true });
// plan.html에 필요한 마크다운과 화면 이미지만 (파일 하나짜리 HTML 기획안은 제외)
fs.cpSync(src, dst, { recursive: true, filter: (f) => !/\.html?$/i.test(f) });
console.log('[copy-docs] 문서를 public/docs 로 복사했습니다.');
