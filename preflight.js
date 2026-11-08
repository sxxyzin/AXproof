import fs from 'node:fs';
for (const line of (fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : '').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const { getSecret } = await import('../api/_lib/util.js');
const production = process.argv.includes('--production');
const checks = [
  ['토큰 서명 키(32자 이상)', getSecret('AXP_SECRET').length >= 32],
  ['운영진 초대 코드(12자 이상)', getSecret('AXP_ADMIN_CODE').length >= 12 && getSecret('AXP_ADMIN_CODE') !== 'axproof-admin'],
  ['OpenAI 키 입력(실제 연결 시험은 별도)', !!getSecret('OPENAI_API_KEY') && !/[^\x21-\x7e]/.test(getSecret('OPENAI_API_KEY'))],
  ['Supabase URL', /^https:\/\//.test(getSecret('SUPABASE_URL'))],
  ['Supabase 서버 키', !!getSecret('SUPABASE_SERVICE_ROLE_KEY')],
  ['실제 운영의 둘러보기 비활성화', ['0', 'false'].includes(getSecret('AXP_DEMO'))],
  ['Vercel 설정·DB 스키마', fs.existsSync('vercel.json') && fs.existsSync('supabase/schema.sql')]
];
for (const [name, ok] of checks) console.log((ok ? 'OK   ' : production ? 'NEED ' : 'TODO ') + name);
console.log('키 값은 출력하지 않습니다. 이 점검은 설정 확인이며 실제 AI 응답·Supabase 쓰기 검증을 대신하지 않습니다.');
if (production && checks.some(([, ok]) => !ok)) process.exitCode = 1;
