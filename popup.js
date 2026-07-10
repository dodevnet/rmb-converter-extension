/**
 * 人民币大写转换器 v2.0.0 - Popup 交互逻辑
 */

// ========== DOM 引用 ==========

const amountInput = document.getElementById('amountInput');
const resultText = document.getElementById('resultText');
const hint = document.getElementById('hint');
const clearBtn = document.getElementById('clearBtn');
const toast = document.getElementById('toast');
const toastText = document.getElementById('toastText');
const thousandSep = document.getElementById('thousandSep');
const currencyBtns = document.querySelectorAll('.currency-btn');
const currencyBar = document.getElementById('currencyBar');
const tabBtns = document.querySelectorAll('.tab-btn');
const batchToggle = document.getElementById('batchToggle');
const singleInputArea = document.getElementById('singleInputArea');
const batchInputArea = document.getElementById('batchInputArea');
const batchTextarea = document.getElementById('batchTextarea');
const batchActions = document.getElementById('batchActions');
const batchResults = document.getElementById('batchResults');
const batchConvertBtn = document.getElementById('batchConvertBtn');
const batchCopyBtn = document.getElementById('batchCopyBtn');
const singleResultArea = document.getElementById('singleResultArea');
const historyHeader = document.getElementById('historyHeader');
const historyList = document.getElementById('historyList');
const historyCount = document.getElementById('historyCount');
const historyClear = document.getElementById('historyClear');

// ========== 状态 ==========

let currentCurrency = 'CNY';
let currentMode = 'forward';
let isBatch = false;
let toastTimer = null;
let debounceTimer = null;
let historyItems = [];
let historyReadyResolve = null;
const historyReady = new Promise((resolve) => { historyReadyResolve = resolve; });

// ========== 历史记录 ==========

const HISTORY_KEY = 'rmb_converter_history';
const MAX_HISTORY = 20;

function loadHistory() {
  return new Promise((resolve) => {
    chrome.storage.local.get([HISTORY_KEY], (data) => {
      historyItems = data[HISTORY_KEY] || [];
      renderHistory();
      historyReadyResolve();
      resolve();
    });
  });
}

function saveHistory() {
  if (historyItems.length > MAX_HISTORY) {
    historyItems = historyItems.slice(0, MAX_HISTORY);
  }
  chrome.storage.local.set({ [HISTORY_KEY]: historyItems });
}

async function addHistory(amount, result) {
  await historyReady;
  const idx = historyItems.findIndex(h => h.amount === amount && h.result === result);
  if (idx !== -1) historyItems.splice(idx, 1);
  historyItems.unshift({ amount, result, time: Date.now() });
  saveHistory();
  renderHistory();
}

function clearHistory() {
  historyItems = [];
  chrome.storage.local.remove(HISTORY_KEY);
  renderHistory();
}

function formatTime(ts) {
  const d = new Date(ts);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

function renderHistory() {
  historyCount.textContent = historyItems.length > 0 ? `(${historyItems.length})` : '';
  if (historyItems.length === 0) {
    historyList.innerHTML = '<div class="history-empty">暂无记录</div>';
    return;
  }
  historyList.innerHTML = historyItems.map((h, i) => `
    <div class="history-item" data-index="${i}">
      <span class="h-amount">${escHtml(h.amount)}</span>
      <span class="h-result">${escHtml(h.result)}</span>
      <span class="h-time">${formatTime(h.time)}</span>
    </div>
  `).join('');

  historyList.querySelectorAll('.history-item').forEach(item => {
    item.addEventListener('click', () => {
      const idx = parseInt(item.dataset.index);
      if (idx >= 0 && idx < historyItems.length) {
        copyToClipboard(historyItems[idx].result);
      }
    });
  });
}

function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

historyHeader.addEventListener('click', () => {
  const expanded = historyList.classList.toggle('open');
  historyHeader.classList.toggle('expanded', expanded);
});

historyClear.addEventListener('click', (e) => {
  e.stopPropagation();
  clearHistory();
});

// ========== 模式切换 ==========

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentMode = btn.dataset.mode;

    if (currentMode === 'reverse') {
      currencyBar.classList.add('hidden');
      amountInput.placeholder = '输入大写金额';
      batchTextarea.placeholder = '每行输入一个大写金额';
    } else {
      currencyBar.classList.remove('hidden');
      amountInput.placeholder = '输入金额';
      batchTextarea.placeholder = '每行输入一个金额';
    }
    clearInput(false);
  });
});

batchToggle.addEventListener('click', () => {
  isBatch = !isBatch;
  batchToggle.classList.toggle('active', isBatch);
  if (isBatch) {
    singleInputArea.classList.add('hidden');
    batchInputArea.classList.remove('hidden');
    batchActions.classList.remove('hidden');
    singleResultArea.classList.add('hidden');
    thousandSep.classList.add('hidden');
    hint.classList.add('hidden');
    batchTextarea.focus();
  } else {
    singleInputArea.classList.remove('hidden');
    batchInputArea.classList.add('hidden');
    batchActions.classList.add('hidden');
    batchResults.classList.add('hidden');
    singleResultArea.classList.remove('hidden');
    thousandSep.classList.remove('hidden');
    hint.classList.remove('hidden');
    amountInput.focus();
    updateResult(amountInput.value);
  }
});

// ========== 币种切换 ==========

function switchCurrency(btn) {
  currencyBtns.forEach(b => { b.classList.remove('active'); b.setAttribute('aria-checked', 'false'); });
  btn.classList.add('active');
  btn.setAttribute('aria-checked', 'true');
  currentCurrency = btn.dataset.currency;
  updateResult(amountInput.value);
}

currencyBtns.forEach(btn => {
  btn.addEventListener('click', () => switchCurrency(btn));
});

// ========== 千分位 ==========

function updateThousandSep(value) {
  const trimmed = value.trim();
  if (!trimmed || currentMode === 'reverse') {
    thousandSep.textContent = '';
    return;
  }
  if (/^\d+(\.\d{0,2})?$/.test(trimmed)) {
    thousandSep.textContent = formatNumber(trimmed);
  } else {
    thousandSep.textContent = '';
  }
}

// ========== 结果显示（防抖 200ms） ==========

function showLoading() {
  resultText.innerHTML = '加载中<span class="loading-dots active"><span></span><span></span><span></span></span>';
}

function updateResult(value) {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    const trimmed = value.trim();
    if (!trimmed) {
      resultText.textContent = '等待输入…';
      resultText.className = '';
      hint.classList.remove('hidden');
      clearBtn.classList.remove('visible');
      thousandSep.textContent = '';
      return;
    }

    let result;
    if (currentMode === 'reverse') {
      result = capitalToNumber(trimmed);
    } else {
      result = convertToCapital(trimmed, currentCurrency);
    }

    const isError = result.includes('有误') || result.includes('超出') || result.includes('不支持') || result.includes('为空') || result.includes('无法识别');

    resultText.className = isError ? 'error' : 'filled';
    resultText.textContent = result;
    resultText.classList.add('pop-in');
    setTimeout(() => resultText.classList.remove('pop-in'), 300);

    hint.classList.toggle('hidden', isError);
    clearBtn.classList.add('visible');

    if (!isError && currentMode === 'forward' && trimmed) {
      updateThousandSep(trimmed);
    } else {
      thousandSep.textContent = '';
    }

  }, 200);
}

amountInput.addEventListener('input', (e) => {
  const val = e.target.value;
  updateThousandSep(val);
  if (val.trim()) showLoading();
  updateResult(val);
});

// ========== Toast ==========

function showToast(msg) {
  if (toastTimer) clearTimeout(toastTimer);
  toastText.textContent = msg || '已复制';
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1500);
}

// ========== 复制 ==========

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast();
  } catch (_) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(textarea);
    showToast();
  }
}

function copyResult() {
  const text = resultText.textContent;
  if (!text || text === '等待输入…' || resultText.classList.contains('error')) return;
  copyToClipboard(text);
  const inputVal = amountInput.value.trim();
  if (currentMode === 'forward' && inputVal) {
    addHistory(inputVal, text);
  }
}

// ========== 清空（带淡出动画） ==========

function clearInput(animate = true) {
  if (animate && amountInput.value) {
    resultText.style.opacity = '0';
    resultText.style.transform = 'scale(0.95)';
    setTimeout(() => {
      resultText.style.opacity = '1';
      resultText.style.transform = 'scale(1)';
    }, 150);
  }
  amountInput.value = '';
  batchTextarea.value = '';
  batchResults.innerHTML = '';
  batchResults.classList.add('hidden');
  resultText.textContent = '等待输入…';
  resultText.className = '';
  thousandSep.textContent = '';
  hint.classList.remove('hidden');
  clearBtn.classList.remove('visible');
  amountInput.focus();
}

clearBtn.addEventListener('click', () => clearInput());

// ========== 批量转换 ==========

batchConvertBtn.addEventListener('click', () => {
  const lines = batchTextarea.value.split('\n').filter(l => l.trim() !== '');
  if (lines.length === 0) return;

  let html = '';
  const outputs = [];
  const records = [];

  lines.forEach(line => {
    const trimmed = line.trim();
    let result;
    if (currentMode === 'reverse') {
      result = capitalToNumber(trimmed);
    } else {
      result = convertToCapital(trimmed, currentCurrency);
    }
    const isError = result.includes('有误') || result.includes('超出') || result.includes('不支持') || result.includes('为空') || result.includes('无法识别');
    if (!isError && result) {
      outputs.push(result);
      records.push({ amount: trimmed, result });
    }

    html += `<div class="batch-item">
      <span class="batch-input">${escHtml(trimmed)}</span>
      <span class="${isError ? 'batch-error' : 'batch-output'}">${escHtml(result)}</span>
    </div>`;
  });

  batchResults.innerHTML = html;
  batchResults.classList.remove('hidden');
  batchResults.dataset.allOutputs = outputs.join('\n');
  batchResults.dataset.records = JSON.stringify(records);
});

batchCopyBtn.addEventListener('click', () => {
  const allText = batchResults.dataset.allOutputs || '';
  if (allText) copyToClipboard(allText);
  const recordsJson = batchResults.dataset.records || '[]';
  try {
    const records = JSON.parse(recordsJson);
    records.forEach(r => addHistory(r.amount, r.result));
  } catch (_) {}
});

// ========== 键盘 ==========

amountInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    if (resultText.textContent && resultText.textContent !== '等待输入…' && !resultText.classList.contains('error')) {
      copyResult();
    }
  }
  if (e.key === 'Escape') {
    e.preventDefault();
    clearInput();
  }
});

resultText.addEventListener('click', copyResult);

// ========== 初始化 ==========

loadHistory();
amountInput.focus();
