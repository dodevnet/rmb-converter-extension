/**
 * 多币种金额大写转换核心算法
 *
 * 使用中文大写数字（壹贰叁肆伍陆柒捌玖）输出金额，支持：
 * - 人民币 (CNY)：元/角/分模式，无小数加"整"
 * - 美元 (USD)、沙特里亚尔 (SAR)、阿联酋迪拉姆 (AED)：主币+辅币直接模式
 * - 乌干达先令 (UGX)：无辅币模式（忽略小数）
 *
 * 正向转换最大整数位：16 位（千万亿级别），小数最多 2 位。
 * 反向转换支持：大写金额 → 小写数字。
 *
 * @module converter
 */

const DIGITS = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
const UNITS = ['', '拾', '佰', '仟'];
const SECTIONS = ['', '万', '亿', '万亿'];

/**
 * 币种配置映射
 * @readonly
 */
const CURRENCIES = {
  CNY: {
    name: '人民币',
    symbol: '¥',
    unit: '元',
    subunit: ['角', '分'],
    subunitMode: 'cn',
    addZheng: true
  },
  USD: {
    name: '美元',
    symbol: '$',
    unit: '美元',
    subunit: ['美分'],
    subunitMode: 'direct',
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
    subunitMode: 'none',
    addZheng: true
  }
};

function sectionToCapital(section) {
  let result = '';
  const str = section.toString();
  const len = str.length;

  for (let i = 0; i < len; i++) {
    const digit = parseInt(str[i], 10);
    const unit = UNITS[len - 1 - i];

    if (digit === 0) {
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

  if (!/^-?\d+(\.\d{0,2})?$/.test(numStr)) {
    return '输入格式有误，请输入有效数字（最多两位小数）';
  }

  if (numStr.startsWith('-')) {
    return '暂不支持负数转换，请输入正数金额';
  }

  if (/^0+(\.0+)?$/.test(numStr)) {
    return '零' + config.unit + (config.addZheng ? '整' : '');
  }

  const [intPart, decPart = ''] = numStr.split('.');

  const cleanInt = intPart.replace(/^0+/, '');
  if (cleanInt.length > 16) {
    return '金额超出范围（整数部分最多 16 位，即千万亿级别）';
  }

  if (decPart.length > 2) {
    return '小数部分最多 2 位';
  }

  let result = '';
  const intNum = parseInt(intPart);

  if (intNum > 0) {
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

  if (config.subunitMode === 'cn') {
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
    if (config.addZheng) result += '整';
  } else {
    const subunitValue = parseInt(decPart.padEnd(2, '0').slice(0, 2));
    if (subunitValue === 0) {
      if (config.addZheng) result += '整';
    } else {
      result += sectionToCapital(subunitValue) + config.subunit[0];
    }
  }

  return result;
}

function formatNumber(numStr) {
  const parts = String(numStr).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

function getSupportedCurrencies() {
  return Object.keys(CURRENCIES);
}

// ========== 反向转换 ==========

const CAPITAL_TO_DIGIT = {
  '壹': 1, '贰': 2, '叁': 3, '肆': 4, '伍': 5,
  '陆': 6, '柒': 7, '捌': 8, '玖': 9, '零': 0
};

function parseThousandSegment(segment) {
  if (!segment || segment.length === 0) return 0;
  let result = 0;
  let currentNum = 0;
  let hasDigit = false;

  for (let i = 0; i < segment.length; i++) {
    const ch = segment[i];
    if (CAPITAL_TO_DIGIT[ch] !== undefined) {
      currentNum = CAPITAL_TO_DIGIT[ch];
      hasDigit = true;
    } else if (ch === '拾') {
      if (!hasDigit) currentNum = 1;
      result += currentNum * 10;
      currentNum = 0;
      hasDigit = false;
    } else if (ch === '佰') {
      if (!hasDigit) currentNum = 1;
      result += currentNum * 100;
      currentNum = 0;
      hasDigit = false;
    } else if (ch === '仟') {
      if (!hasDigit) currentNum = 1;
      result += currentNum * 1000;
      currentNum = 0;
      hasDigit = false;
    } else if (ch === '零') {
      hasDigit = false;
    } else {
      return null;
    }
  }
  if (hasDigit) result += currentNum;
  return result;
}

function parseCapitalSegment(segment) {
  if (!segment || segment.length === 0) return 0;

  const yiIdx = segment.indexOf('亿');
  let yiBefore = '';
  let yiAfter = '';
  if (yiIdx !== -1) {
    yiBefore = segment.slice(0, yiIdx);
    yiAfter = segment.slice(yiIdx + 1);
  } else {
    yiAfter = segment;
  }

  const wanIdx = yiAfter.indexOf('万');
  let wanBefore = '';
  let wanAfter = '';
  if (wanIdx !== -1) {
    wanBefore = yiAfter.slice(0, wanIdx);
    wanAfter = yiAfter.slice(wanIdx + 1);
  } else {
    wanAfter = yiAfter;
  }

  let result = 0;
  if (yiBefore) {
    const val = parseThousandSegment(yiBefore);
    if (val === null) return null;
    result += val * 100000000;
  }
  if (wanBefore) {
    const val = parseThousandSegment(wanBefore);
    if (val === null) return null;
    result += val * 10000;
  }
  if (wanAfter) {
    const val = parseThousandSegment(wanAfter);
    if (val === null) return null;
    result += val;
  }
  return result;
}

/**
 * 反向转换：大写金额 → 小写数字。
 *
 * @param {string} capitalStr - 大写金额字符串
 * @returns {string} 保留两位小数的小写数字字符串；非法输入返回错误提示
 */
function capitalToNumber(capitalStr) {
  if (!capitalStr || typeof capitalStr !== 'string') {
    return '输入为空，请输入大写金额';
  }

  let str = capitalStr.trim();
  str = str.replace(/整$/, '');

  const yuanIndex = str.indexOf('元');
  if (yuanIndex === -1) {
    return '输入格式有误，请包含"元"字（如 壹佰元整）';
  }

  const yuanPart = str.slice(0, yuanIndex);
  const jiaoFenPart = str.slice(yuanIndex + 1);

  let integerResult = 0;
  if (yuanPart.length > 0) {
    const parsed = parseCapitalSegment(yuanPart);
    if (parsed === null) {
      return '大写数字格式有误，无法识别：' + yuanPart;
    }
    integerResult = parsed;
  }

  let decimalResult = 0;
  if (jiaoFenPart.length > 0) {
    const jiaoMatch = jiaoFenPart.match(/([壹贰叁肆伍陆柒捌玖])角/);
    const fenMatch = jiaoFenPart.match(/([壹贰叁肆伍陆柒捌玖])分/);
    if (jiaoMatch) decimalResult += CAPITAL_TO_DIGIT[jiaoMatch[1]] * 0.1;
    if (fenMatch) decimalResult += CAPITAL_TO_DIGIT[fenMatch[1]] * 0.01;
    if (!jiaoMatch && !fenMatch) {
      return '角分部分格式有误：' + jiaoFenPart;
    }
  }

  return (integerResult + decimalResult).toFixed(2);
}

// ========== 模块导出 ==========

if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
  module.exports = {
    convertToCapital,
    formatNumber,
    getSupportedCurrencies,
    capitalToNumber,
    parseCapitalSegment,
    parseThousandSegment,
    CURRENCIES
  };
}
