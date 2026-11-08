import fs from 'node:fs';
import crypto from 'node:crypto';
let source = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : fs.readFileSync('.env.example', 'utf8');
let saved = {}; try { saved = JSON.parse(fs.readFileSync('data/secrets.json', 'utf8')); } catch {}
for (const [key, value] of Object.entries({ AXP_SECRET: saved.AXP_SECRET || crypto.randomBytes(32).toString('hex'), AXP_ADMIN_CODE: crypto.randomBytes(18).toString('base64url') })) {
  const re = new RegExp('^' + key + '=(.*)$', 'm'), match = source.match(re);
  if (!match) source += '\n' + key + '=' + value + '\n';
  else if (!match[1].trim()) source = source.replace(re, key + '=' + value);
}
fs.writeFileSync('.env', source);
console.log('.env 준비 완료. 기존 값은 보존했습니다. API 키와 DB 값은 직접 입력해 주세요. 비밀값은 출력하지 않습니다.');
