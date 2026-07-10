/**
 * 人民币大写转换器 - 单元测试
 *
 * 运行方式：node converter.test.js
 */

const {
  convertToCapital,
  formatNumber,
  getSupportedCurrencies,
  capitalToNumber
} = require('./converter.js');

let passed = 0;
let failed = 0;

function assert(condition, description) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${description}`);
  } else {
    failed++;
    console.error(`  ✗ ${description}`);
  }
}

function assertEqual(actual, expected, description) {
  if (actual === expected) {
    passed++;
    console.log(`  ✓ ${description}`);
  } else {
    failed++;
    console.error(`  ✗ ${description}`);
    console.error(`    Expected: "${expected}"`);
    console.error(`    Got:      "${actual}"`);
  }
}

// ========== 数字 → 大写 ==========

console.log('\n【整数转换】');
assertEqual(convertToCapital('0'), '零元整', '0 → 零元整');
assertEqual(convertToCapital('1'), '壹元整', '1 → 壹元整');
assertEqual(convertToCapital('10'), '壹拾元整', '10 → 壹拾元整');
assertEqual(convertToCapital('100'), '壹佰元整', '100 → 壹佰元整');
assertEqual(convertToCapital('1000'), '壹仟元整', '1000 → 壹仟元整');
assertEqual(convertToCapital('10000'), '壹万元整', '10000 → 壹万元整');
assertEqual(convertToCapital('100000'), '壹拾万元整', '100000 → 壹拾万元整');
assertEqual(convertToCapital('1234567'), '壹佰贰拾叁万肆仟伍佰陆拾柒元整', '1234567');

console.log('\n【小数转换】');
assertEqual(convertToCapital('1.23'), '壹元贰角叁分', '1.23');
assertEqual(convertToCapital('1.20'), '壹元贰角整', '1.20');
assertEqual(convertToCapital('1.02'), '壹元零贰分', '1.02');
assertEqual(convertToCapital('0.50'), '零元伍角整', '0.50');
assertEqual(convertToCapital('0.05'), '零元零伍分', '0.05');
assertEqual(convertToCapital('1234.56'), '壹仟贰佰叁拾肆元伍角陆分', '1234.56');

console.log('\n【零值处理】');
assertEqual(convertToCapital('0.00'), '零元整', '0.00');
assertEqual(convertToCapital('0'), '零元整', '0');

console.log('\n【边界值】');
assertEqual(convertToCapital('9999999999999999'), '玖仟玖佰玖拾玖万玖仟玖佰玖拾玖亿玖仟玖佰玖拾玖万玖仟玖佰玖拾玖元整', '16位整数最大');
// 17位应报错
assert(convertToCapital('10000000000000000').includes('超出'), '17位超出范围报错');

console.log('\n【非法输入】');
assert(convertToCapital('abc').includes('有误'), '非数字输入报错');
assert(convertToCapital('1.234').includes('最多两位小数'), '三位小数报错');
assert(convertToCapital('-100').includes('不支持负数'), '负数提示');
assert(convertToCapital('').length === 0, '空字符串返回空');

console.log('\n【多币种】');
assertEqual(convertToCapital('1', 'USD'), '壹美元整', 'USD 1');
assertEqual(convertToCapital('1.50', 'USD'), '壹美元伍拾美分', 'USD 1.50');
assertEqual(convertToCapital('1', 'SAR'), '壹里亚尔整', 'SAR 1');
assertEqual(convertToCapital('1.50', 'SAR'), '壹里亚尔伍拾哈拉拉', 'SAR 1.50');
assertEqual(convertToCapital('1', 'AED'), '壹迪拉姆整', 'AED 1');
assertEqual(convertToCapital('1.50', 'AED'), '壹迪拉姆伍拾费尔', 'AED 1.50');
assertEqual(convertToCapital('1', 'UGX'), '壹先令整', 'UGX 1');
assertEqual(convertToCapital('1.50', 'UGX'), '壹先令整', 'UGX 忽略小数');

// ========== 千分位格式化 ==========

console.log('\n【千分位格式化】');
assertEqual(formatNumber('1234567'), '1,234,567', '整数千分位');
assertEqual(formatNumber('1234567.89'), '1,234,567.89', '带小数千分位');
assertEqual(formatNumber('1000'), '1,000', '1000');
assertEqual(formatNumber('999'), '999', '不超过千位不加逗号');

// ========== 大写 → 数字 ==========

console.log('\n【反向转换 - 整数】');
assertEqual(capitalToNumber('壹元整'), '1.00', '壹元整 → 1.00');
assertEqual(capitalToNumber('壹拾元整'), '10.00', '壹拾元整 → 10.00');
assertEqual(capitalToNumber('壹佰元整'), '100.00', '壹佰元整 → 100.00');
assertEqual(capitalToNumber('壹仟元整'), '1000.00', '壹仟元整 → 1000.00');
assertEqual(capitalToNumber('壹万元整'), '10000.00', '壹万元整 → 10000.00');
assertEqual(capitalToNumber('壹拾贰万元整'), '120000.00', '壹拾贰万元整 → 120000.00');
assertEqual(capitalToNumber('壹佰贰拾叁万肆仟伍佰陆拾柒元整'), '1234567.00', '1234567');

console.log('\n【反向转换 - 带角分】');
assertEqual(capitalToNumber('壹元贰角叁分'), '1.23', '1.23');
assertEqual(capitalToNumber('壹元贰角整'), '1.20', '1.20');
assertEqual(capitalToNumber('壹元零贰分'), '1.02', '1.02');
assertEqual(capitalToNumber('壹仟贰佰叁拾肆元伍角陆分'), '1234.56', '1234.56');

console.log('\n【反向转换 - 大数】');
assertEqual(capitalToNumber('壹亿贰仟叁佰肆拾伍万陆仟柒佰捌拾玖元整'), '123456789.00', '亿级');
assertEqual(capitalToNumber('壹拾贰亿叁仟肆佰伍拾陆万柒仟捌佰玖拾元整'), '1234567890.00', '拾亿级');

console.log('\n【反向转换 - 非法输入】');
assert(capitalToNumber('').includes('为空'), '空字符串报错');
assert(capitalToNumber('没有元字').includes('有误'), '无"元"字报错');

// ========== 汇总 ==========

console.log('\n' + '='.repeat(50));
console.log(`测试完成：${passed} 通过，${failed} 失败，共 ${passed + failed} 项`);
console.log('='.repeat(50));

if (failed > 0) {
  process.exit(1);
}
