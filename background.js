/**
 * 人民币大写转换器 - Service Worker
 *
 * 负责右键菜单注册与选中文字转换。
 */

importScripts('converter.js');

// ---------- 右键菜单注册 ----------

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'convert-to-capital',
    title: '转为大写人民币',
    contexts: ['selection']
  });
});

// ---------- 右键菜单点击处理 ----------

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'convert-to-capital' && info.selectionText) {
    const selected = info.selectionText.trim();
    const result = convertToCapital(selected, 'CNY');

    if (result && !result.includes('有误') && !result.includes('超出')) {
      // 通过 offscreen 文档或直接通知（MV3 限制，clipboard 需要在页面上执行）
      // 使用 chrome.scripting 向当前 tab 注入复制逻辑
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (text) => {
          return navigator.clipboard.writeText(text);
        },
        args: [result]
      }).then(() => {
        // 复制成功通知
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: '人民币大写转换器',
          message: '已复制：' + (result.length > 30 ? result.slice(0, 30) + '…' : result),
          priority: 0
        });
      }).catch(() => {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: '人民币大写转换器',
          message: '转换结果：' + (result.length > 30 ? result.slice(0, 30) + '…' : result),
          priority: 0
        });
      });
    } else {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: '人民币大写转换器',
        message: result || '无法转换选中内容',
        priority: 0
      });
    }
  }
});
