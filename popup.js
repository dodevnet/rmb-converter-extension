/**
 * 金额大写转换器 - Popup 交互逻辑
 */

const amountInput = document.getElementById('amountInput');
const resultText = document.getElementById('resultText');
const hint = document.getElementById('hint');
const currencyBtns = document.querySelectorAll('.currency-btn');

let currentCurrency = 'CNY';

// 切换币种
currencyBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    currencyBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCurrency = btn.dataset.currency;
    updateResult(amountInput.value);
  });
});

// 更新结果显示
function updateResult(value) {
  const trimmed = value.trim();

  if (!trimmed) {
    resultText.textContent = '等待输入…';
    resultText.className = '';
    hint.classList.add('hidden');
    return;
  }

  const result = convertToCapital(trimmed, currentCurrency);
  const isError = result.includes('有误') || result.includes('超出');

  resultText.className = isError ? 'error' : 'filled';
  resultText.textContent = result;
  hint.classList.toggle('hidden', isError);
}

// 复制结果
function copyResult() {
  const text = resultText.textContent;
  if (!text || text === '等待输入…') return;

  navigator.clipboard.writeText(text).catch(() => {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  });
}

// 事件监听
amountInput.addEventListener('input', (e) => updateResult(e.target.value));

amountInput.addEventListener('paste', () => {
  setTimeout(() => updateResult(amountInput.value), 10);
});

amountInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    copyResult();
  }
});

resultText.addEventListener('click', copyResult);

amountInput.focus();
