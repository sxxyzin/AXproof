// AI 공급자 연결: OpenAI(Responses API, 기본) · Claude(공식 SDK, 선택)
import Anthropic from '@anthropic-ai/sdk';
import { getSecret } from './util.js';

export const DEFAULT_AI = {
  provider: 'openai',
  models: {
    openai: { chat: getSecret('OPENAI_CHAT_MODEL') || 'gpt-5.6', quick: getSecret('OPENAI_QUICK_MODEL') || 'gpt-5.6', deep: getSecret('OPENAI_DEEP_MODEL') || 'gpt-5.6' },
    anthropic: { chat: 'claude-opus-5-5', quick: 'claude-opus-5-5', deep: 'claude-opus-5-5' }
  },
  // OpenAI reasoning effort (none·minimal·low·medium·high). 모델이 지원하지 않으면 서버가 자동으로 낮춰 다시 보냄
  openaiEffort: { chat: 'low', quick: 'low', deep: 'medium' },
  // Claude effort (low·medium·high)
  effort: { chat: 'low', quick: 'low', deep: 'medium' },
  allowLearnerProviderChoice: true
};

export function keyFor(provider) {
  return provider === 'anthropic' ? getSecret('ANTHROPIC_API_KEY') : getSecret('OPENAI_API_KEY');
}

// 키 값에 설명 문구·한글이 섞여 들어간 경우를 미리 잡아냄 (HRD Voice Analyzer에서 겪은 오류)
export function checkKey(provider) {
  const k = keyFor(provider);
  if (!k) return 'no_key';
  if (/[^\x21-\x7e]/.test(k)) return (provider === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY') + ' 값에 API 키가 아닌 글자(한글·공백 등)가 들어 있어요. 실제 키로 바꿔 주세요.';
  return '';
}

function supportsFallback(model) {
  return /^claude-(opus-5|sonnet-5-5|fable-5)/.test(model);
}

// 메시지 정리: user로 시작, user/assistant 번갈아
export function normalizeMessages(messages) {
  const out = [];
  for (const m of messages || []) {
    if (!m || !m.content) continue;
    const role = m.role === 'assistant' ? 'assistant' : 'user';
    const content = String(m.content).slice(0, 60000);
    if (out.length && out[out.length - 1].role === role) out[out.length - 1].content += '\n\n' + content;
    else out.push({ role, content });
  }
  if (!out.length || out[0].role !== 'user') out.unshift({ role: 'user', content: '(대화를 시작합니다)' });
  if (out[out.length - 1].role !== 'user') out.push({ role: 'user', content: '(계속)' });
  return out;
}

/**
 * 텍스트 생성. onText가 있으면 스트리밍.
 * @returns {Promise<{text:string, usage:{input:number, output:number}, model:string}>}
 */
export async function generate({ provider, model, effort, system, messages, json, schema, maxTokens, onText, signal }) {
  const bad = checkKey(provider);
  if (bad === 'no_key') throw Object.assign(new Error('no_key'), { status: 503 });
  if (bad) throw Object.assign(new Error(bad), { status: 500 });
  const msgs = normalizeMessages(messages);
  if (provider === 'anthropic') return anthropicGenerate({ model, effort, system, messages: msgs, onText, signal });
  return openaiGenerate({ model, effort, system, messages: msgs, json, schema, maxTokens, onText, signal });
}

/* ---------- OpenAI · Responses API ---------- */
function openaiError(status, data) {
  const msg = (data && data.error && data.error.message) || '';
  const code = (data && data.error && (data.error.code || data.error.type)) || '';
  if (status === 401) return Object.assign(new Error('OpenAI API 키가 올바르지 않아요. OPENAI_API_KEY를 확인해 주세요.'), { status: 401 });
  if (status === 429 && /quota|billing|credit/i.test(code + msg)) return Object.assign(new Error('OpenAI API 크레딧이 부족해요. OpenAI Platform → Billing을 확인해 주세요.'), { status: 402 });
  if (status === 429) return Object.assign(new Error('요청이 몰려 잠시 처리할 수 없어요. 1분쯤 뒤 다시 시도해 주세요.'), { status: 429 });
  if (status === 404 || /model/i.test(code)) return Object.assign(new Error('모델 이름을 찾지 못했어요. 운영진 > AI 설정의 GPT 모델명을 확인해 주세요. (' + msg.slice(0, 120) + ')'), { status: 500 });
  if (status >= 500) return Object.assign(new Error('OpenAI 서버에 일시적인 문제가 있어요. 잠시 뒤 다시 시도해 주세요.'), { status: 502 });
  return Object.assign(new Error('AI 요청이 거절됐어요: ' + (msg || code || status)), { status: 502 });
}

async function openaiGenerate({ model, effort, system, messages, json, schema, maxTokens, onText, signal }) {
  const apiKey = keyFor('openai');
  let eff = effort || null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const body = {
      model,
      instructions: system || '',
      input: messages.map(m => ({ role: m.role, content: m.content })),
      store: false,
      max_output_tokens: maxTokens || (onText ? 16000 : 12000)
    };
    if (eff) body.reasoning = { effort: eff };
    if (schema) body.text = { format: { type: 'json_schema', name: 'decision_evidence', strict: true, schema } };
    else if (json) {
      body.text = { format: { type: 'json_object' } };
      // JSON mode는 instructions만으로는 부족하며 input 메시지에도 JSON 지시가 필요합니다.
      body.input.unshift({ role: 'developer', content: 'Return a valid JSON object only, matching the format in the instructions.' });
    }
    if (onText) body.stream = true;
    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST', signal: signal || AbortSignal.timeout(45000),
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
      body: JSON.stringify(body)
    });
    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      const hint = ((data.error && data.error.param) || '') + ' ' + ((data.error && data.error.message) || '');
      if (r.status === 400 && eff && /reasoning|effort/i.test(hint)) { eff = eff === 'none' ? 'low' : (eff === 'low' ? 'minimal' : null); continue; }
      throw openaiError(r.status, data);
    }
    if (!onText) {
      const data = await r.json();
      if (data.status === 'incomplete') throw Object.assign(new Error('AI 답이 길이 제한에 걸려 끊겼어요. 내용을 나눠 다시 시도해 주세요.'), { status: 502 });
      let text = '';
      for (const item of data.output || []) for (const part of item.content || []) {
        if (part.type === 'refusal') throw Object.assign(new Error('AI가 이 요청에 답하지 않았어요. 표현을 바꿔 다시 시도해 주세요.'), { status: 422 });
        if (part.type === 'output_text') text += part.text || '';
      }
      return { text, model: data.model || model, usage: { input: (data.usage && data.usage.input_tokens) || 0, output: (data.usage && data.usage.output_tokens) || 0 } };
    }
    // 스트리밍(SSE): response.output_text.delta → 글자, response.completed → 사용량
    const reader = r.body.getReader();
    const dec = new TextDecoder();
    let buf = '', text = '', usage = { input: 0, output: 0 }, finalModel = model;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf('\n')) >= 0) {
        const line = buf.slice(0, i).trim(); buf = buf.slice(i + 1);
        if (!line.startsWith('data:')) continue;
        const raw = line.slice(5).trim();
        if (!raw || raw === '[DONE]') continue;
        let ev; try { ev = JSON.parse(raw); } catch { continue; }
        if (ev.type === 'response.output_text.delta' && ev.delta) { text += ev.delta; onText(ev.delta); }
        else if (ev.type === 'response.completed' && ev.response) {
          finalModel = ev.response.model || model;
          const u = ev.response.usage || {}; usage = { input: u.input_tokens || 0, output: u.output_tokens || 0 };
        } else if (ev.type === 'response.incomplete' || ev.type === 'response.failed' || ev.type === 'error') {
          const m = (ev.response && ev.response.error && ev.response.error.message) || (ev.error && ev.error.message) || ev.message || '응답이 끊겼어요';
          throw Object.assign(new Error(m), { status: 502 });
        }
      }
    }
    return { text, model: finalModel, usage };
  }
  throw Object.assign(new Error('모델 설정을 확인해 주세요 (GPT 모델명·reasoning effort).'), { status: 500 });
}

/* ---------- Claude · 공식 SDK ---------- */
async function anthropicGenerate({ model, effort, system, messages, onText, signal }) {
  const client = new Anthropic({ apiKey: keyFor('anthropic') });
  const params = { model, max_tokens: onText ? 64000 : 16000, system, messages, output_config: { effort: effort || 'low' } };
  if (supportsFallback(model)) { params.betas = ['server-side-fallback-2026-07-01']; params.fallbacks = 'default'; }
  let message;
  try {
    if (onText) {
      const stream = client.beta.messages.stream(params, { signal });
      for await (const ev of stream) {
        if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') onText(ev.delta.text);
      }
      message = await stream.finalMessage();
    } else {
      message = await client.beta.messages.create(params, { signal });
    }
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) throw Object.assign(new Error('Claude API 키가 올바르지 않아요'), { status: 401 });
    if (e instanceof Anthropic.RateLimitError) throw Object.assign(new Error('요청이 많아요. 잠시 뒤 다시 시도해 주세요'), { status: 429 });
    if (e instanceof Anthropic.BadRequestError) throw Object.assign(new Error('요청 형식 오류: ' + e.message), { status: 400 });
    if (e instanceof Anthropic.APIConnectionError) throw Object.assign(new Error('Claude API에 연결하지 못했어요'), { status: 502 });
    if (e instanceof Anthropic.APIError) throw Object.assign(new Error('Claude API 오류: ' + e.message), { status: 502 });
    throw e;
  }
  if (message.stop_reason === 'refusal') throw Object.assign(new Error('이 요청에는 답할 수 없었어요. 표현을 바꿔 다시 시도해 주세요'), { status: 422 });
  const text = message.content.filter(b => b.type === 'text').map(b => b.text).join('');
  return { text, model: message.model || model, usage: { input: message.usage?.input_tokens || 0, output: message.usage?.output_tokens || 0 } };
}
