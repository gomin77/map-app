/**
 * Seoul SVG에 구 이름 레이블 추가 (정확한 위치 하드코딩)
 * viewBox: 0 0 1400 1400
 */
const fs   = require('fs');
const path = require('path');

// 먼저 labels가 없는 순수 변환본으로 초기화
const BASE = path.resolve(__dirname, '../www/assets/seoul-map.svg');
let svg = fs.readFileSync(BASE, 'utf8');

// 기존 text 요소 및 이전에 추가된 label 스타일 제거 (재실행 대비)
svg = svg.replace(/<text class="map-label"[^<]*<\/text>\n?/g, '');
svg = svg.replace(/\s*\.map-label \{[\s\S]*?\}\n/g, '');

// 각 구별 레이블 위치 — 첨부 이미지 기준으로 SVG 좌표계(0 0 1400 1400) 매핑
const LABELS = [
  { id:'seoul_0',  name:'도봉구',   x: 772, y: 233 },
  { id:'seoul_1',  name:'동대문구', x: 877, y: 686 },
  { id:'seoul_2',  name:'동작구',   x: 547, y: 988 },
  { id:'seoul_3',  name:'은평구',   x: 429, y: 547 },
  { id:'seoul_4',  name:'강북구',   x: 736, y: 428 },
  { id:'seoul_5',  name:'강동구',   x:1211, y: 815 },
  { id:'seoul_6',  name:'강서구',   x: 126, y: 858 },
  { id:'seoul_7',  name:'금천구',   x: 368, y:1133 },
  { id:'seoul_8',  name:'구로구',   x: 228, y:1052 },
  { id:'seoul_9',  name:'관악구',   x: 538, y:1097 },
  { id:'seoul_10', name:'광진구',   x:1010, y: 815 },
  { id:'seoul_11', name:'강남구',   x: 867, y:1016 },
  { id:'seoul_12', name:'종로구',   x: 631, y: 678 },
  { id:'seoul_13', name:'중구',     x: 750, y: 798 },
  { id:'seoul_14', name:'중랑구',   x:1057, y: 592 },
  { id:'seoul_15', name:'마포구',   x: 343, y: 798 },
  { id:'seoul_16', name:'노원구',   x:1002, y: 308 },
  { id:'seoul_17', name:'서초구',   x: 704, y:1065 },
  { id:'seoul_18', name:'서대문구', x: 449, y: 695 },
  { id:'seoul_19', name:'성북구',   x: 772, y: 574 },
  { id:'seoul_20', name:'성동구',   x: 856, y: 815 },
  { id:'seoul_21', name:'송파구',   x:1086, y: 988 },
  { id:'seoul_22', name:'양천구',   x: 237, y: 954 },
  { id:'seoul_23', name:'영등포구', x: 375, y: 947 },
  { id:'seoul_24', name:'용산구',   x: 609, y: 909 },
];

// map-label 스타일 추가
svg = svg.replace(
  '.region:hover { fill: rgba(139,94,60,0.3); cursor: pointer; }\n</style>',
  `.region:hover { fill: rgba(139,94,60,0.3); cursor: pointer; }
  .map-label {
    font-size: 22px;
    font-weight: 700;
    fill: #3d2b1f;
    text-anchor: middle;
    dominant-baseline: middle;
    pointer-events: none;
    font-family: -apple-system, 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
    paint-order: stroke;
    stroke: rgba(255,255,255,0.7);
    stroke-width: 3px;
    stroke-linejoin: round;
  }
</style>`
);

// text 요소 생성 후 </svg> 직전 삽입
const textElems = LABELS.map(l =>
  `<text class="map-label" data-for="${l.id}" x="${l.x}" y="${l.y}">${l.name}</text>`
).join('\n');

svg = svg.replace('</svg>', `${textElems}\n</svg>`);

fs.writeFileSync(BASE, svg, 'utf8');
console.log('Labels added:', LABELS.length);
