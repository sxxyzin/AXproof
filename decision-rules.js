/* 키 없는 체험용 판단 탐지. 반드시 사용자 원문만 기록합니다. */
(function (root) {
  root.AXP_DECISIONS = {
    detect: function (text) {
      text = String(text || '').trim();
      if (text.length < 15 || !/때문|왜냐|근거|출처|확인했|비교했|검증했|대조했|그래서/.test(text) ||
          !/선택|결정|고르|골랐|고치|고쳤|바꾸|바꿨|버리|버렸|쓰지|사용하지|보류|하겠|하기로|제외/.test(text)) return null;
      return { quote: text, kind: /확인|출처|검증|대조/.test(text) ? 'AI 검증' : '대안 선택', action: /버리|버렸|제외|쓰지|사용하지/.test(text) ? '버린다' : /보류/.test(text) ? '보류' : '고친다' };
    }
  };
})(typeof window !== 'undefined' ? window : globalThis);
