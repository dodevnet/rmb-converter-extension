/**
 * 金额大写转换器 - Popup 交互逻辑
 *
 * 负责：输入监听、币种切换、结果展示、复制（含 Toast 反馈）、清空。
 */

const amountInput = document.getElementById('amountInput');
const resultText = document.getElementById('resultText');
const hint = document.getElementById('hint');
const clearBtn = document.getElementById('clearBtn');
const toast = document.getElementById('toast');
const currencyBtns = document.querySelectorAll('.currency-btn');

let currentCurrency = 'CNY';
let toastTimer = null;

// ---------- 币种切换 ----------

function switchCurrency(btn) {
  currencyBtns.forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-checked', 'false');
  });
  btn.classList.add('active');
  btn.setAttribute('aria-checked', 'true');
  currentCurrency = btn.dataset.currency;
  updateResult(amountInput.value);
}

currencyBtns.forEach(btn => {
  btn.addEventListener('click', () => switchCurrency(btn));
  // 键盘支持：Enter / Space 切换币种
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      switchCurrency(btn);
    }
    // 左右方向键在币种按钮间导航
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const siblings = [...currencyBtns];
      const idx = siblings.indexOf(btn);
      const next = e.key === 'ArrowRight'
        ? siblings[(idx + 1) % siblings.length]
        : siblings[(idx - 1 + siblings.length) % siblings.length];
      next.focus();
    }
  });
});

// ---------- 结果显示 ----------

function updateResult(value) {
  const trimmed = value.trim();

  if (!trimmed) {
    resultText.textContent = '等待输入\u2026';
    resultText.className = '';
    hint.classList.remove('hidden');
    clearBtn.classList.remove('visible');
    return;
  }

  const result = convertToCapital(trimmed, currentCurrency);
  const isError = result.includes('有误') || result.includes('超出');

  resultText.className = isError ? 'error' : 'filled';
  resultText.textContent = result;
  hint.classList.toggle('hidden', isError);
  clearBtn.classList.add('visible');
}

// ---------- Toast 反馈 ----------

function showToast() {
  if (toastTimer) clearTimeout(toastTimer);
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1500);
}

// ---------- 复制 ----------

function copyResult() {
  const text = resultText.textContent;
  // 不复制空状态和错误信息
  if (!text || text === '等待输入\u2026' || resultText.classList.contains('error')) {
    return;
  }

  navigator.clipboard.writeText(text)
    .then(() => showToast())
    .catch(() => {
      // 降级方案：execCommand（已废弃，仅用于旧环境兼容）
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try { document.execCommand('copy'); } catch (_) { /* 静默失败 */ }
      document.body.removeChild(textarea);
      showToast();
    });
}

// ---------- 清空 ----------

function clearInput() {
  amountInput.value = '';
  updateResult('');
  amountInput.focus();
}

clearBtn.addEventListener('click', clearInput);

// ---------- 事件监听 ----------

amountInput.addEventListener('input', (e) => updateResult(e.target.value));

// Enter 复制
amountInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    copyResult();
  }
});

// Escape 清空
amountInput.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    e.preventDefault();
    clearInput();
  }
});

resultText.addEventListener('click', copyResult);

// 聚焦输入框
amountInput.focus();
