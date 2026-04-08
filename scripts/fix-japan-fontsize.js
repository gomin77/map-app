const fs = require('fs');
const f = 'C:/Users/34ehd/.verdent/verdent-projects/map masking app/www/assets/japan-map.svg';
// BOM 없이 UTF-8 읽기
const s = fs.readFileSync(f, { encoding: 'utf8' });
// font-size 속성만 절반으로
const result = s.replace(/font-size="([\d.]+)"/g, function(m, n) {
  return 'font-size="' + Math.round(parseFloat(n) / 2 * 100) / 100 + '"';
});
// BOM 없이 UTF-8로 저장
fs.writeFileSync(f, result, { encoding: 'utf8' });
// 검증
const check = result.match(/font-size="[\d.]+"/g);
console.log('done:', check ? check.slice(0, 3) : 'no match');
