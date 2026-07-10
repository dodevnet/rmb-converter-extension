/**
 * 多币种金额大写转换核心算法
 *
 * 使用中文大写数字（壹贰叁肆伍陆柒捌玖）输出金额，支持：
 * - 人民币 (CNY)：元/角/分模式，无小数加"整"
 * - 美元 (USD)、沙特里亚尔 (SAR)、阿联酋迪拉姆 (AED)：主币+辅币直接模式
 * - 乌干达先令 (UGX)：无辅币模式（忽略小数）
 *
 * 最大整数位：15 位（千万亿级别），小数最多 2 位。
 *
 * @module converter
 */

const DIGITS = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
const UNITS = ['', '拾', '佰', '仟'];
const SECTIONS = ['', '万', '亿', '万亿'];

/**
 * 币种配置映射
 * @readonly
 * @enum {Object}
 */
const CURRENCIES = {
  CNY: {
    name: '人民币',
    symbol: '¥',
    unit: '元',
    subunit: ['角', '分'],
    subunitMode: 'cn',   // 分角模式（角 + 分）
    addZheng: true       // 小数部分为零时加"整"
  },
  USD: {
    name: '美元',
    symbol: '$',
    unit: '美元',
    subunit: ['美分'],
    subunitMode: 'direct', // 两位小数合并为辅币单位
    addZheng: true
  },
  SAR: {
    name: '沙特里亚尔',
    symbol: '﷼',
    unit: '里亚尔',
    subunit: ['哈拉拉'],
    subunitMode: 'direct',
    addZheng: true
  },
  AED: {
    name: '阿联酋迪拉姆',
    symbol: 'د.إ',
    unit: '迪拉姆',
    subunit: ['费尔'],
    subunitMode: 'direct',
    addZheng: true
  },
  UGX: {
    name: '乌干达先令',
    symbol: 'USh',
    unit: '先令',
    subunit: [],
    subunitMode: 'none',   // 无辅币（忽略小数）
    addZheng: true
  }
};

/**
 * 将 1~4 位整数段转为中文大写（不含节单位：万/亿）。
 *
 * 规则：
 * - 前导零不输出（如 "0001" → "壹"）
 * - 内部零合并为一个"零"（如 "1002" → "壹仟零贰"）
 * - 末尾零剔除（如 "1200" → "壹仟贰佰"）
 *
 * @param {number|string} section - 四位以内的整数段
 * @returns {string} 该段的大写字符串
 */
function sectionToCapital(section) {
  let result = '';
  const str = section.toString();
  const len = str.length;

  for (let i = 0; i < len; i++) {
    const digit = parseInt(str[i], 10);
    const unit = UNITS[len - 1 - i];

    if (digit === 0) {
      // 仅当已有内容且末尾非"零"时追加单个"零"
      if (result.length > 0 && result[result.length - 1] !== '零') {
        result += '零';
      }
    } else {
      result += DIGITS[digit] + unit;
    }
  }

  return result.replace(/零+$/, '');
}

/**
 * 将金额数字转为中文大写字符串。
 *
 * 最大支持 15 位整数（千万亿级别），小数限 2 位。
 * 负数前自动加"负"。
 *
 * @param {string|number} amount - 输入金额
 * @param {string} [currency='CNY'] - 币种代码
 * @returns {string} 大写金额字符串；非法输入返回错误提示
 */
function convertToCapital(amount, currency = 'CNY') {
  const config = CURRENCIES[currency] || CURRENCIES.CNY;

  if (amount === '' || amount === null || amount === undefined) {
    return '';
  }

  const numStr = String(amount).trim();

  // 验证格式：允许负数、整数、最多两位小数
  if (!/^-?\d+(\.\d{0,2})?$/.test(numStr)) {
    return '输入格式有误，请输入有效数字（最多两位小数）';
  }

  // 处理负数符号
  let isNegative = false;
  let processStr = numStr;
  if (numStr.startsWith('-')) {
    isNegative = true;
    processStr = numStr.slice(1);
  }

  // 零值特殊处理（含 "-0"、"0.00" 等变体）
  if (/^0+(\.0+)?$/.test(processStr)) {
    return '零' + config.unit + (config.addZheng ? '整' : '');
  }

  const [intPart, decPart = ''] = processStr.split('.');

  // 检查金额范围
  if (intPart.replace(/^0+/, '').length > 15) {
    return '金额超出范围（最大支持千万亿级别）';
  }

  let result = '';

  // 处理整数部分
  const intNum = parseInt(intPart);
  if (intNum > 0) {
    const cleanInt = intPart.replace(/^0+/, '');

    // 按 4 位分段（从右往左）
    const segments = [];
    let remaining = cleanInt;
    while (remaining.length > 0) {
      segments.unshift(remaining.slice(-4));
      remaining = remaining.slice(0, -4);
    }

    for (let i = 0; i < segments.length; i++) {
      const segVal = parseInt(segments[i]);
      const sectionIndex = segments.length - 1 - i;

      if (segVal === 0) {
        let hasNonZeroAfter = false;
        for (let j = i + 1; j < segments.length; j++) {
          if (parseInt(segments[j]) !== 0) { hasNonZeroAfter = true; break; }
        }
        if (result.length > 0 && hasNonZeroAfter) {
          if (result[result.length - 1] !== '零') {
            result += '零';
          }
        }
        continue;
      }

      const sectionStr = sectionToCapital(segVal);

      if (result.length > 0 && segments[i].length === 4 && segments[i][0] === '0') {
        if (result[result.length - 1] !== '零') {
          result += '零';
        }
      }

      result += sectionStr + SECTIONS[sectionIndex];
    }

    result += config.unit;
  }

  // 处理小数部分
  if (config.subunitMode === 'cn') {
    // 人民币模式：角+分
    const jiao = decPart[0] ? parseInt(decPart[0]) : 0;
    const fen = decPart[1] ? parseInt(decPart[1]) : 0;

    if (jiao === 0 && fen === 0) {
      result += '整';
    } else if (jiao > 0) {
      result += DIGITS[jiao] + config.subunit[0];
      if (fen > 0) {
        result += DIGITS[fen] + config.subunit[1];
      } else {
        result += '整';
      }
    } else {
      if (result.length > 0 && result[result.length - 1] !== '零') {
        result += '零';
      }
      result += DIGITS[fen] + config.subunit[1];
    }
  } else if (config.subunitMode === 'none') {
    // 无辅币模式（如乌干达先令），直接加整，忽略小数
    if (config.addZheng) result += '整';
  } else {
    // 直接模式：两位小数合并为辅币单位
    const subunitValue = parseInt(decPart.padEnd(2, '0').slice(0, 2));
    if (subunitValue === 0) {
      if (config.addZheng) result += '整';
    } else {
      result += sectionToCapital(subunitValue) + config.subunit[0];
    }
  }

  return isNegative ? '负' + result : result;
}

/**
 * 为数字字符串添加千分位逗号（仅用于展示，不参与转换逻辑）。
 *
 * @param {string|number} numStr - 数字字符串
 * @returns {string} 添加千分位逗号后的字符串
 * @example formatNumber('1234567.89') → '1,234,567.89'
 */
function formatNumber(numStr) {
  const parts = String(numStr).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

/**
 * 获取当前支持的币种代码列表。
 *
 * @returns {string[]} 币种代码数组，如 ['CNY', 'USD', 'SAR', 'AED', 'UGX']
 */
function getSupportedCurrencies() {
  return Object.keys(CURRENCIES);
}
