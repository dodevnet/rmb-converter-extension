# 人民币大写转换器（RMB Converter）

一个功能强大的 Chrome 浏览器扩展，将小写数字金额与中文大写人民币写法互相转换，支持多种币种、右键菜单、历史记录和批量处理。

## 功能特性

- **双向转换**：数字 ↔ 大写金额，一键切换方向
- **多币种**：人民币 / 美元 / 沙特里亚尔 / 阿联酋迪拉姆 / 乌干达先令
- **右键菜单**：选中网页上的数字 → 右键 → "转为大写人民币"，自动复制结果并通知
- **历史记录**：保留最近 20 条转换记录，可折叠查看，点击一键复制
- **批量转换**：每行一个数字，批量转换并一键复制全部结果
- **千分位展示**：输入数字时实时显示千分位格式化（如 1,234,567.89）
- **快捷键**：`Command+Shift+R` (Mac) / `Ctrl+Shift+R` (Win) 唤起 popup
- **动画微交互**：结果弹入、复制 Toast + 勾号、清空淡出、Loading 跳动点
- **输入防抖**：200ms 防抖避免频繁转换，转换中显示加载指示
- **深色/亮色模式**：自动跟随系统主题
- **金额校验**：整数最多 16 位，小数最多 2 位，超出友好提示
- 离线可用，无需网络

## 安装方法

1. 下载代码或 zip
2. 打开 Chrome 地址栏输入 `chrome://extensions/`
3. 开启右上角「开发者模式」
4. 点击「加载已解压的扩展程序」选择本目录

## 使用说明

### 基础使用
点击工具栏图标，输入金额数字自动显示大写结果，点击结果一键复制。

### 反向转换
点击「大写→数字」Tab，输入如"壹佰贰拾叁元肆角伍分"一键转回数字。

### 右键菜单
在任意网页选中数字文本 → 右键 → "转为大写人民币" → 自动复制结果并弹通知。

### 批量转换
点击「批量」按钮，在文本框中每行输入一个数字，点击「转换」批量处理，再点「一键复制全部」。

### 快捷键
`Command+Shift+R` (Mac) / `Ctrl+Shift+R` (Win) 快速唤起转换器。

## 运行单元测试

需要 Node.js 环境：

```bash
cd rmb-converter-extension
node converter.test.js
```

测试覆盖：整数转换、小数转换、零值、边界值、非法输入、反向转换、千分位格式化、多币种。

## 技术栈

- Manifest V3 + Service Worker
- HTML / CSS / JavaScript (Vanilla)
- chrome.storage.local（历史记录持久化）
- chrome.contextMenus + chrome.notifications（右键菜单）
- chrome.commands（快捷键）

## 仓库地址

[https://github.com/dodevnet/rmb-converter-extension](https://github.com/dodevnet/rmb-converter-extension)

## 更新日志

### v2.0.1 (2026-07-11)

- **修复**：确认历史记录（chrome.storage.local 读写/渲染/折叠/复制/清空）功能完整可用
- **修复**：确认批量转换（模式切换/多行解析/一键复制全部）功能完整可用
- **修复**：确认千分位格式化（formatNumber + updateThousandSep 实时展示）功能完整可用
- **配置**：manifest.json 版本升至 2.0.1，description 补充千分位格式化说明

### v2.0.0 (2026-07-11)

- **功能**：右键菜单转换 - 网页选中数字 → 右键转为大写人民币，自动复制并通知
- **功能**：历史记录 - 最近 20 条转换记录，可折叠、一键复制、清空
- **功能**：千分位格式化 - 输入时实时显示千分位数字
- **功能**：反向转换 - 大写金额 → 小写数字，Tab 切换
- **功能**：批量转换 - 多行数字一键批量转换并复制全部
- **功能**：快捷键唤起 - `Command+Shift+R` / `Ctrl+Shift+R` 打开 popup
- **体验**：输入防抖 200ms + Loading 跳动点动画
- **体验**：结果弹入动画、复制 Toast 带勾号图标、清空淡出
- **体验**：金额范围校验增强（整数 ≤ 16 位，小数 ≤ 2 位），负数友好提示
- **技术**：升级为 Service Worker 架构（background.js）
- **技术**：新增 converter.test.js 单元测试（Node.js 可运行）
- **配置**：manifest.json 版本升至 2.0.0，新增 permissions（contextMenus / notifications / storage / scripting / commands）

### v1.2.1 (2026-07-11)

- **UI**：popup 窗口外框四角圆润化（14px border-radius + overflow: hidden）
- **UI**：微调内部元素边距（18px），确保圆角裁切后内容不贴边

### v1.2.0 (2026-07-11)

- **主题**：支持深色/亮色模式自动切换
- **UI**：全局统一圆角化（8-12px）
- **过渡动画**：0.3s 平滑过渡

### v1.1.0 (2026-07-11)

- **安全**：移除不必要的 clipboardRead 权限
- **体验**：复制 Toast 提示、清空按钮、Escape 清空
- **无障碍**：aria 标签 + 键盘导航

### v1.0.0 (2026-05-13)

- 初始版本，支持五种币种

## License

[MIT](LICENSE)
