/**
 * Seoul_districts.svg → www/assets/seoul-map.svg 변환 스크립트
 * - class="region" 추가
 * - id="seoul_N" 형식으로 변경
 * - data-name="한국어구이름" 추가
 * - fill/stroke 제거 (travel.js가 JS로 설정)
 */
const fs = require('fs');
const path = require('path');

const SRC  = 'C:/Users/34ehd/Desktop/Seoul_districts.svg';
const DEST = path.resolve(__dirname, '../www/assets/seoul-map.svg');

// 영문 id → [순번, 한국어 이름]
const ID_MAP = {
  'Dobong-gu':           [0,  '도봉구'],
  'Dongdaemun-gu':       [1,  '동대문구'],
  'Dongjak-gu':          [2,  '동작구'],
  'Eunpyeong-gu':        [3,  '은평구'],
  'Gangbuk-gu':          [4,  '강북구'],
  'Gangdong-gu':         [5,  '강동구'],
  'Gangseo-gu':          [6,  '강서구'],
  'Geumcheon-gu':        [7,  '금천구'],
  'Guro-gu':             [8,  '구로구'],
  'Gwanak-gu':           [9,  '관악구'],
  'Gwangjin-gu':         [10, '광진구'],
  'Gangnam-gu':          [11, '강남구'],
  'Jongno-gu':           [12, '종로구'],
  'Jung-gu':             [13, '중구'],
  'Jungnang-gu':         [14, '중랑구'],
  'Mapo-gu':             [15, '마포구'],
  'Nowon-gu':            [16, '노원구'],
  'Seocho-gu':           [17, '서초구'],
  'Seodaemun-gu':        [18, '서대문구'],
  'Seongbuk-gu':         [19, '성북구'],
  'Seongdong-gu':        [20, '성동구'],
  'Songpa-gu':           [21, '송파구'],
  'Yangcheon-gu':        [22, '양천구'],
  'Yeongdeungpo-gu_1_':  [23, '영등포구'],
  'Yongsan-gu':          [24, '용산구'],
};

let svg = fs.readFileSync(SRC, 'utf8');

// 각 <path id="..." ...> 변환
svg = svg.replace(/<path\s+id="([^"]+)"\s+fill-rule="evenodd"\s+clip-rule="evenodd"\s+fill="#C8C8C8"/g, (match, engId) => {
  const entry = ID_MAP[engId];
  if (!entry) {
    console.warn('Unknown id:', engId);
    return match;
  }
  const [idx, krName] = entry;
  return `<path class="region" id="seoul_${idx}" data-name="${krName}"`;
});

// 기존 SVG 헤더의 width/height 유지, style 추가
svg = svg.replace(
  /<svg([^>]*)>/,
  `<svg$1>\n<style>\n  .region { fill: #e8dcc8; stroke: #b0a090; vector-effect: non-scaling-stroke; }\n  .region:hover { fill: rgba(139,94,60,0.3); cursor: pointer; }\n</style>`
);

fs.writeFileSync(DEST, svg, 'utf8');
console.log('Converted ->', DEST);
console.log('Districts:', Object.keys(ID_MAP).length);
