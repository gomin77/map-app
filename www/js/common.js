/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   상수
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const REGIONS_KR = [
  {id:"region_11",name:"서울특별시"},{id:"region_21",name:"부산광역시"},{id:"region_21310",name:"기장군"},
  {id:"region_22",name:"대구광역시"},{id:"region_22310",name:"달성군"},{id:"region_23",name:"인천광역시"},
  {id:"region_23310",name:"강화군"},{id:"region_23320",name:"옹진군"},{id:"region_24",name:"광주광역시"},
  {id:"region_25",name:"대전광역시"},{id:"region_26",name:"울산광역시"},{id:"region_26310",name:"울주군"},
  {id:"region_29",name:"세종특별자치시"},{id:"region_3101",name:"수원시"},{id:"region_3102",name:"성남시"},
  {id:"region_31030",name:"의정부시"},{id:"region_3104",name:"안양시"},{id:"region_31050",name:"부천시"},
  {id:"region_31060",name:"광명시"},{id:"region_31070",name:"평택시"},{id:"region_31080",name:"동두천시"},
  {id:"region_3109",name:"안산시"},{id:"region_3110",name:"고양시"},{id:"region_31110",name:"과천시"},
  {id:"region_31120",name:"구리시"},{id:"region_31130",name:"남양주시"},{id:"region_31140",name:"오산시"},
  {id:"region_31150",name:"시흥시"},{id:"region_31160",name:"군포시"},{id:"region_31170",name:"의왕시"},
  {id:"region_31180",name:"하남시"},{id:"region_3119",name:"용인시"},{id:"region_31200",name:"파주시"},
  {id:"region_31210",name:"이천시"},{id:"region_31220",name:"안성시"},{id:"region_31230",name:"김포시"},
  {id:"region_31240",name:"화성시"},{id:"region_31250",name:"광주시"},{id:"region_31260",name:"양주시"},
  {id:"region_31270",name:"포천시"},{id:"region_31280",name:"여주시"},{id:"region_31350",name:"연천군"},
  {id:"region_31370",name:"가평군"},{id:"region_31380",name:"양평군"},{id:"region_32010",name:"춘천시"},
  {id:"region_32020",name:"원주시"},{id:"region_32030",name:"강릉시"},{id:"region_32040",name:"동해시"},
  {id:"region_32050",name:"태백시"},{id:"region_32060",name:"속초시"},{id:"region_32070",name:"삼척시"},
  {id:"region_32310",name:"홍천군"},{id:"region_32320",name:"횡성군"},{id:"region_32330",name:"영월군"},
  {id:"region_32340",name:"평창군"},{id:"region_32350",name:"정선군"},{id:"region_32360",name:"철원군"},
  {id:"region_32370",name:"화천군"},{id:"region_32380",name:"양구군"},{id:"region_32390",name:"인제군"},
  {id:"region_32400",name:"고성군"},{id:"region_32410",name:"양양군"},{id:"region_33020",name:"청주시"},
  {id:"region_33030",name:"충주시"},{id:"region_3304",name:"제천시"},{id:"region_33320",name:"보은군"},
  {id:"region_33330",name:"옥천군"},{id:"region_33340",name:"영동군"},{id:"region_33350",name:"증평군"},
  {id:"region_33360",name:"진천군"},{id:"region_33370",name:"괴산군"},{id:"region_33380",name:"음성군"},
  {id:"region_33390",name:"단양군"},{id:"region_3401",name:"천안시"},{id:"region_34020",name:"공주시"},
  {id:"region_34030",name:"보령시"},{id:"region_34040",name:"아산시"},{id:"region_34050",name:"서산시"},
  {id:"region_34060",name:"논산시"},{id:"region_34070",name:"계룡시"},{id:"region_34080",name:"당진시"},
  {id:"region_34310",name:"금산군"},{id:"region_34330",name:"부여군"},{id:"region_34340",name:"서천군"},
  {id:"region_34350",name:"청양군"},{id:"region_34360",name:"홍성군"},{id:"region_34370",name:"예산군"},
  {id:"region_34380",name:"태안군"},{id:"region_3501",name:"전주시"},{id:"region_35020",name:"군산시"},
  {id:"region_35030",name:"익산시"},{id:"region_35040",name:"정읍시"},{id:"region_35050",name:"남원시"},
  {id:"region_35060",name:"김제시"},{id:"region_35310",name:"완주군"},{id:"region_35320",name:"진안군"},
  {id:"region_35330",name:"무주군"},{id:"region_35340",name:"장수군"},{id:"region_35350",name:"임실군"},
  {id:"region_35360",name:"순창군"},{id:"region_35370",name:"고창군"},{id:"region_35380",name:"부안군"},
  {id:"region_36010",name:"목포시"},{id:"region_36020",name:"여수시"},{id:"region_36030",name:"순천시"},
  {id:"region_36040",name:"나주시"},{id:"region_36060",name:"광양시"},{id:"region_36310",name:"담양군"},
  {id:"region_36320",name:"곡성군"},{id:"region_36330",name:"구례군"},{id:"region_36350",name:"고흥군"},
  {id:"region_36360",name:"보성군"},{id:"region_36370",name:"화순군"},{id:"region_36380",name:"장흥군"},
  {id:"region_36390",name:"강진군"},{id:"region_36400",name:"해남군"},{id:"region_36410",name:"영암군"},
  {id:"region_36420",name:"무안군"},{id:"region_36430",name:"함평군"},{id:"region_36440",name:"영광군"},
  {id:"region_36450",name:"장성군"},{id:"region_36460",name:"완도군"},{id:"region_36470",name:"진도군"},
  {id:"region_36480",name:"신안군"},{id:"region_3701",name:"포항시"},{id:"region_37020",name:"경주시"},
  {id:"region_37030",name:"김천시"},{id:"region_37040",name:"안동시"},{id:"region_37050",name:"구미시"},
  {id:"region_37060",name:"영주시"},{id:"region_37070",name:"영천시"},{id:"region_37080",name:"상주시"},
  {id:"region_37090",name:"문경시"},{id:"region_37100",name:"경산시"},{id:"region_37310",name:"의성군"},
  {id:"region_37320",name:"청송군"},{id:"region_37330",name:"영양군"},{id:"region_37340",name:"영덕군"},
  {id:"region_37350",name:"청도군"},{id:"region_37360",name:"고령군"},{id:"region_37370",name:"성주군"},
  {id:"region_37380",name:"칠곡군"},{id:"region_37390",name:"예천군"},{id:"region_37400",name:"봉화군"},
  {id:"region_37410",name:"울진군"},{id:"region_37420",name:"울릉군"},{id:"region_38030",name:"창원시"},
  {id:"region_38050",name:"진주시"},{id:"region_38060",name:"통영시"},{id:"region_38070",name:"사천시"},
  {id:"region_38080",name:"김해시"},{id:"region_38090",name:"밀양시"},{id:"region_38100",name:"거제시"},
  {id:"region_3811",name:"양산시"},{id:"region_38310",name:"의령군"},{id:"region_38320",name:"함안군"},
  {id:"region_38330",name:"창녕군"},{id:"region_38340",name:"고성군"},{id:"region_38350",name:"남해군"},
  {id:"region_38360",name:"하동군"},{id:"region_38370",name:"산청군"},{id:"region_38380",name:"함양군"},
  {id:"region_38390",name:"거창군"},{id:"region_38400",name:"합천군"},{id:"region_39010",name:"제주시"},
  {id:"region_39020",name:"서귀포시"}
];

const MAPS = {
  domestic: [
    {id:'kr', name:'한국 전체', icon:'🗺️', total:229, file:'assets/korea-map-detail.svg', prefix:'region_', avail:true},
    {id:'jeju', name:'제주도', icon:'🏝️', total:0, prefix:'jeju_', avail:false},
    {id:'seoul', name:'서울', icon:'🏙️', total:25, file:'assets/seoul-map.svg', prefix:'seoul_', avail:true},
  ],
  intl: [
    {id:'jp',    name:'일본', icon:'🗾', total:47,  file:'assets/japan-map.svg', prefix:'JP-',  avail:true},
    {id:'world', name:'세계', icon:'🌍', total:195, file:'assets/world-map.svg', prefix:'wld_', avail:true},
  ]
};
function allMaps(){ return [...MAPS.domestic, ...MAPS.intl]; }
function getMap(id){ return allMaps().find(m=>m.id===id); }

const TOUR_AREAS = [
  {label:'전체',      code:'',   desc:'대한민국의 구석구석, 새로운 여정을 시작해보세요.'},
  {label:'서울특별시', code:'1',  desc:'역사와 현대가 공존하는 대한민국의 수도'},
  {label:'부산광역시', code:'6',  desc:'푸른 바다와 활기찬 항구가 어우러진 도시'},
  {label:'대구광역시', code:'4',  desc:'패션·문화·음식의 색깔 있는 도시'},
  {label:'인천광역시', code:'2',  desc:'섬과 항구, 이국적인 문화가 어우러진 도시'},
  {label:'광주광역시', code:'5',  desc:'예향과 의향, 맛과 멋의 고장'},
  {label:'대전광역시', code:'3',  desc:'과학과 문화가 어우러진 중부권 중심 도시'},
  {label:'울산광역시', code:'7',  desc:'산업과 자연이 공존하는 동해안 도시'},
  {label:'제주',      code:'39', desc:'에메랄드빛 바다와 화산섬의 신비로운 자연'},
  {label:'경기도',    code:'31', desc:'수도권의 역사와 자연을 두루 품은 곳'},
  {label:'강원도',    code:'32', desc:'웅장한 산맥과 푸른 동해바다의 낭만'},
  {label:'충청북도',  code:'33', desc:'청풍명월, 내륙의 아름다운 산과 호수'},
  {label:'충청남도',  code:'34', desc:'서해안 낙조와 백제 문화의 숨결'},
  {label:'전라북도',  code:'37', desc:'가장 한국적인 전통과 맛이 살아있는 곳'},
  {label:'전라남도',  code:'38', desc:'아름다운 밤바다와 풍성한 남도의 미식'},
  {label:'경상북도',  code:'35', desc:'천년의 숨결이 살아있는 문화유산의 보고'},
  {label:'경상남도',  code:'36', desc:'통영·거제·남해의 아름다운 한려수도'},
];

/* 시/군/구 코드는 TourAPI areaCode2로 실시간 조회 → 캐시 저장 */
let SIGUNGU_CACHE = {};

const TOUR_API_KEY = '5414fb6bf16660fe5e5afcde77bb274391e8f23f76ac2be3f0bcdcd47ff993b5';
const TOUR_API_BASE = 'https://apis.data.go.kr/B551011/KorService2';
const BACKEND_URL = 'https://api.yourserver.com';

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   상태
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
let visits = {};
let profile = {nickname:'여정객', avatar:null};
let activeRegion = null;
let currentMap = 'kr';
let currentAreaCode = '';
let tempPhotos = [];
let tempStatus = 'visited';
let showAll = false;
let recFilter = '';
let openProvince = null; // 아코디언 열린 도/시
let calMonth = new Date();
let zoom = 1, offX = 0, offY = 0;
let isPinch = false, startDist = 0, startZoom = 1;
let pinchMidX = 0, pinchMidY = 0, pinchStartOffX = 0, pinchStartOffY = 0;
let isDrag = false, startX = 0, startY = 0;
let lastTap = 0, backOnce = false;
let recentViews = [];   // 최근 본 지역 ID 배열 (최대 10개)
let notiSettings = {travel:true, notice:true, weekly:false}; // 알림 설정
let admobReady = false;
let admobBannerCreated = false;
const ADMOB_CONFIG = {
  enabledTabs: ['my'],
  isTest: true,
  bannerId: 10001,
  units: {
    banner: {
      test: 'ca-app-pub-3940256099942544/9214589741',
      production: 'ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy'
    }
  }
};
let admobBannerPosition = 'top';
const APP_CONFIG = {
  ads: {
    mode: 'test'
  }
};

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   데이터 IO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function loadAll(){
  try{ visits = JSON.parse(localStorage.getItem('travel_v2')||'{}'); }catch{ visits={}; }
  try{ profile = JSON.parse(localStorage.getItem('user_profile')||'{"nickname":"여정객","avatar":null}'); }catch{}
  try{ recentViews = JSON.parse(localStorage.getItem('recent_views')||'[]'); }catch{ recentViews=[]; }
  try{ notiSettings = JSON.parse(localStorage.getItem('noti_settings')||'{"travel":true,"notice":true,"weekly":false}'); }catch{}
  if (typeof updateProfileUI === 'function') updateProfileUI();
}
function saveVisits(){ 
  localStorage.setItem('travel_v2', JSON.stringify(visits)); 
  // 클라우드 자동 동기화
  autoSyncToCloud();
}
function saveProfile(){ localStorage.setItem('user_profile', JSON.stringify(profile)); }
function saveRecent(){ localStorage.setItem('recent_views', JSON.stringify(recentViews)); }
function saveNoti(){ localStorage.setItem('noti_settings', JSON.stringify(notiSettings)); }

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   뒤로가기 종료 확인
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function handleBack(){
  if(document.querySelector('.modal-bg.open')){
    document.querySelectorAll('.modal-bg').forEach(m=>m.classList.remove('open'));
    return;
  }
  if(document.getElementById('screen-splash').classList.contains('active')){
    tryExit(); return;
  }
  if(!document.getElementById('tab-recommend').classList.contains('active')){
    switchTab('recommend'); return;
  }
  tryExit();
}
function tryExit(){
  if(backOnce){
    try{
      if(window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.App)
        window.Capacitor.Plugins.App.exitApp();
    }catch(e){}
  } else {
    backOnce = true;
    showToast('뒤로 버튼을 한 번 더 누르면 종료됩니다.');
    setTimeout(()=>{ backOnce=false; }, 2200);
  }
}
document.addEventListener('backbutton', handleBack, false);

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   유틸리티
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg; t.classList.add('show');
  clearTimeout(t._t);
  t._t=setTimeout(()=>t.classList.remove('show'),2300);
}

function getAdMobPlugin() {
  return window.Capacitor?.Plugins?.AdMobPlus || null;
}

function getAdMode() {
  const stored = localStorage.getItem('admob_mode');
  if (stored === 'production' || stored === 'test') return stored;
  return APP_CONFIG.ads.mode;
}

function isProductionAdMode() {
  return getAdMode() === 'production';
}

function getBannerAdUnitId() {
  return isProductionAdMode() ? ADMOB_CONFIG.units.banner.production : ADMOB_CONFIG.units.banner.test;
}

function validateAdMobConfig() {
  if (isProductionAdMode() && ADMOB_CONFIG.units.banner.production.includes('xxxxxxxx')) {
    console.warn('AdMob production banner unit id is not configured. Falling back to test ads.');
    return false;
  }
  return true;
}

async function ensureAdMobReady() {
  const plugin = getAdMobPlugin();
  if (!plugin || admobReady) return plugin;
  try {
    await plugin.start();
    admobReady = true;
  } catch (error) {
    console.error('AdMob start failed:', error);
  }
  return plugin;
}

async function showBannerAd() {
  const plugin = await ensureAdMobReady();
  if (!plugin) return;
  try {
    const adUnitId = validateAdMobConfig() ? getBannerAdUnitId() : ADMOB_CONFIG.units.banner.test;
    if (!admobBannerCreated) {
      await plugin.adCreate({
        id: ADMOB_CONFIG.bannerId,
        adUnitId,
        cls: 'BannerAd',
        position: admobBannerPosition
      });
      admobBannerCreated = true;
    }
    await plugin.adLoad({ id: ADMOB_CONFIG.bannerId });
    await plugin.adShow({ id: ADMOB_CONFIG.bannerId });
    document.body.classList.add('admob-banner-top-visible');
  } catch (error) {
    console.error('AdMob banner failed:', error);
  }
}

async function hideBannerAd() {
  const plugin = getAdMobPlugin();
  document.body.classList.remove('admob-banner-top-visible');
  if (!plugin || !admobBannerCreated) return;
  try {
    await plugin.adHide({ id: ADMOB_CONFIG.bannerId });
  } catch (error) {
    console.error('AdMob banner hide failed:', error);
  }
}

async function updateBannerForTab(tab) {
  if (ADMOB_CONFIG.enabledTabs.includes(tab)) {
    admobBannerPosition = 'top';
    showBannerAd();
    return;
  }
  hideBannerAd();
}

function setAdMobMode(mode) {
  if (mode !== 'test' && mode !== 'production') return;
  localStorage.setItem('admob_mode', mode);
  if (admobBannerCreated) {
    admobBannerCreated = false;
    hideBannerAd().finally(() => updateBannerForTab(document.querySelector('.tab-page.active')?.id?.replace('tab-','') || 'recommend'));
  }
}

function shuffle(arr){ return arr.slice().sort(()=>Math.random()-.5); }

function getRegionName(id){
  if(id.startsWith('region_')) return (REGIONS_KR.find(r=>r.id===id)||{}).name||id;
  const el=document.getElementById(id);
  return el?(el.getAttribute('data-name')||el.getAttribute('title')||id):id;
}

function resizeImg(src,cb){
  const img=new Image();
  img.onload=()=>{
    const c=document.createElement('canvas');
    let w=img.width, h=img.height;
    if(w>800){h=h*800/w;w=800;}
    c.width=w; c.height=h;
    c.getContext('2d').drawImage(img,0,0,w,h);
    cb(c.toDataURL('image/jpeg',0.72));
  };
  img.src=src;
}

/* ── 이미지 크롭 모달 로직 ── */
let _cropCb       = null;
let _cropCancelCb = null;
let _cropImg      = null;
let _cropScale    = 1;
let _cropBox      = null;
let _cropDrag     = null;

function openCropModal(dataUrl, onConfirm, onCancel) {
  _cropCb       = onConfirm;
  _cropCancelCb = onCancel || null;
  const modal   = document.getElementById('crop-modal');
  const canvas  = document.getElementById('crop-canvas');
  _cropImg      = new Image();
  _cropImg.onload = () => {
    const maxW = window.innerWidth  - 32;
    const maxH = window.innerHeight - 140;
    _cropScale  = Math.min(1, maxW / _cropImg.width, maxH / _cropImg.height);
    canvas.width  = Math.round(_cropImg.width  * _cropScale);
    canvas.height = Math.round(_cropImg.height * _cropScale);
    _cropBox = { x: 0, y: 0, w: canvas.width, h: canvas.height };
    _drawCropOverlay();
    modal.classList.add('open');
    _bindCropEvents(canvas);
  };
  _cropImg.src = dataUrl;
}

function _drawCropOverlay() {
  const canvas = document.getElementById('crop-canvas');
  const ctx    = canvas.getContext('2d');
  const { x, y, w, h } = _cropBox;
  ctx.drawImage(_cropImg, 0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0,  0,  canvas.width, y);
  ctx.fillRect(0,  y+h, canvas.width, canvas.height - y - h);
  ctx.fillRect(0,  y,  x,       h);
  ctx.fillRect(x+w, y,  canvas.width - x - w, h);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth   = 2;
  ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth   = 1;
  for (let i = 1; i < 3; i++) {
    ctx.beginPath(); ctx.moveTo(x + w*i/3, y); ctx.lineTo(x + w*i/3, y+h); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, y + h*i/3); ctx.lineTo(x+w, y + h*i/3); ctx.stroke();
  }
  ctx.fillStyle = '#fff';
  [[x,y],[x+w,y],[x,y+h],[x+w,y+h]].forEach(([hx,hy]) => {
    ctx.fillRect(hx-6, hy-6, 12, 12);
  });
}

function _cropPointerToCanvas(e, canvas) {
  const r  = canvas.getBoundingClientRect();
  const cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
  const cy = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
  return [cx, cy];
}

function _cropHitHandle(px, py) {
  const { x, y, w, h } = _cropBox;
  const corners = { nw:[x,y], ne:[x+w,y], sw:[x,y+h], se:[x+w,y+h] };
  for (const [name,[hx,hy]] of Object.entries(corners)) {
    if (Math.abs(px-hx) < 18 && Math.abs(py-hy) < 18) return name;
  }
  if (px > x && px < x+w && py > y && py < y+h) return 'move';
  return 'new';
}

function _bindCropEvents(canvas) {
  const onDown = e => {
    e.preventDefault();
    const [px, py] = _cropPointerToCanvas(e, canvas);
    const mode = _cropHitHandle(px, py);
    _cropDrag = { mode, sx: px, sy: py, origBox: { ..._cropBox } };
  };
  const onMove = e => {
    e.preventDefault();
    if (!_cropDrag) return;
    const [px, py] = _cropPointerToCanvas(e, canvas);
    const dx = px - _cropDrag.sx, dy = py - _cropDrag.sy;
    const ob = _cropDrag.origBox;
    const cw = canvas.width, ch = canvas.height;
    let { x, y, w, h } = ob;
    const mode = _cropDrag.mode;
    if (mode === 'move') {
      x = Math.max(0, Math.min(cw - w, ob.x + dx));
      y = Math.max(0, Math.min(ch - h, ob.y + dy));
    } else if (mode === 'new') {
      x = Math.max(0, Math.min(px, _cropDrag.sx));
      y = Math.max(0, Math.min(py, _cropDrag.sy));
      w = Math.min(cw - x, Math.abs(dx));
      h = Math.min(ch - y, Math.abs(dy));
    } else {
      if (mode === 'nw') { x = Math.min(ob.x+ob.w-40, ob.x+dx); y = Math.min(ob.y+ob.h-40, ob.y+dy); w = ob.x+ob.w-x; h = ob.y+ob.h-y; }
      if (mode === 'ne') { w = Math.max(40, ob.w+dx); y = Math.min(ob.y+ob.h-40, ob.y+dy); h = ob.y+ob.h-y; }
      if (mode === 'sw') { x = Math.min(ob.x+ob.w-40, ob.x+dx); w = ob.x+ob.w-x; h = Math.max(40, ob.h+dy); }
      if (mode === 'se') { w = Math.max(40, ob.w+dx); h = Math.max(40, ob.h+dy); }
      x = Math.max(0, x); y = Math.max(0, y);
      w = Math.min(cw - x, Math.max(40, w));
      h = Math.min(ch - y, Math.max(40, h));
    }
    _cropBox = { x, y, w, h };
    _drawCropOverlay();
  };
  const onUp = e => { e.preventDefault(); _cropDrag = null; };

  canvas.addEventListener('mousedown',  onDown, { passive:false });
  canvas.addEventListener('mousemove',  onMove, { passive:false });
  canvas.addEventListener('mouseup',    onUp,   { passive:false });
  canvas.addEventListener('touchstart', onDown, { passive:false });
  canvas.addEventListener('touchmove',  onMove, { passive:false });
  canvas.addEventListener('touchend',   onUp,   { passive:false });
}

function confirmCrop() {
  const { x, y, w, h } = _cropBox;
  const s   = 1 / _cropScale;
  const out = document.createElement('canvas');
  out.width  = Math.round(w * s);
  out.height = Math.round(h * s);
  out.getContext('2d').drawImage(_cropImg,
    Math.round(x*s), Math.round(y*s), out.width, out.height,
    0, 0, out.width, out.height
  );
  const result = out.toDataURL('image/jpeg', 0.92);
  const cb = _cropCb;
  _closeCropModal();
  if (cb) cb(result);
}

function cancelCrop() {
  _closeCropModal();
  if (_cropCancelCb) _cropCancelCb();
}

function _closeCropModal() {
  document.getElementById('crop-modal').classList.remove('open');
  _cropCb = null; _cropCancelCb = null; _cropImg = null; _cropDrag = null;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   온보딩 가이드
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const ONBOARD_KEY = 'onboard_done_v1';
const OB_TOTAL = 7;
let obIdx = 0;
let obTouchStartX = 0;

function shouldShowOnboard() {
  return !localStorage.getItem(ONBOARD_KEY);
}

function showOnboard() {
  obIdx = 0;
  const el = document.getElementById('screen-onboard');
  if (!el) return;
  el.classList.add('active');
  _obRenderDots();
  _obMoveTo(0);
  initSwipeOnboard();
}

function finishOnboard() {
  localStorage.setItem(ONBOARD_KEY, '1');
  const el = document.getElementById('screen-onboard');
  if (el) el.classList.remove('active');
  setTimeout(() => startAppTour(), 300);
}

function obNext() {
  if (obIdx >= OB_TOTAL - 1) { finishOnboard(); return; }
  obIdx++;
  _obMoveTo(obIdx);
}

function obPrev() {
  if (obIdx <= 0) return;
  obIdx--;
  _obMoveTo(obIdx);
}

function obGoTo(idx) {
  obIdx = idx;
  _obMoveTo(obIdx);
}

function _obMoveTo(idx) {
  const wrap = document.getElementById('ob-slides-wrap');
  if (wrap) wrap.style.transform = `translateX(-${idx * 100}%)`;
  // 인디케이터
  document.querySelectorAll('.ob-dot').forEach((d, i) => {
    d.classList.toggle('active', i === idx);
  });
  // 스텝 레이블
  const lbl = document.getElementById('ob-step-label');
  if (lbl) lbl.textContent = `${idx + 1} / ${OB_TOTAL}`;
  // 이전 버튼
  const prevBtn = document.getElementById('ob-btn-prev');
  if (prevBtn) prevBtn.disabled = (idx === 0);
  // 다음 버튼
  const nextBtn = document.getElementById('ob-btn-next');
  if (nextBtn) nextBtn.textContent = (idx === OB_TOTAL - 1) ? '시작하기' : '다음';
}

function _obRenderDots() {
  const wrap = document.getElementById('ob-dots');
  if (!wrap) return;
  wrap.innerHTML = '';
  for (let i = 0; i < OB_TOTAL; i++) {
    const d = document.createElement('div');
    d.className = 'ob-dot' + (i === 0 ? ' active' : '');
    d.onclick = () => obGoTo(i);
    wrap.appendChild(d);
  }
}

function initSwipeOnboard() {
  const track = document.getElementById('ob-track');
  if (!track || track._obSwipeInit) return;
  track._obSwipeInit = true;
  track.addEventListener('touchstart', e => {
    obTouchStartX = e.touches[0].clientX;
  }, { passive: true });
  track.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - obTouchStartX;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) obNext();
    else obPrev();
  }, { passive: true });
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   스포트라이트 투어 (실제 앱 화면 위 가이드)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const TOUR_KEY = 'tour_done_v1';
const TOUR_STEPS = [
  {
    selector: '#map-area',
    tab: 'travel',
    icon: '📍',
    title: '지도에서 지역 탭하기',
    desc: '지도 위 지역을 <b>탭</b>하면 방문 기록창이 열려요.\n방문 완료 / 가고 싶어요를 선택하고\n날짜·태그·메모·사진을 남길 수 있어요.'
  },
  {
    selector: '.map-hd',
    tab: 'travel',
    icon: '🧭',
    title: '지도 전환',
    desc: '상단의 <b>지도 이름</b>을 탭하면\n한국 전체 · 서울 · 일본 · 세계\n4가지 지도로 전환할 수 있어요.'
  },
  {
    selector: '#nav-stats',
    tab: 'travel',
    icon: '📊',
    title: '스토리 탭',
    desc: '<b>스토리 탭</b>에서 방문 통계와\n도넛 차트, 여행 캘린더를 확인해요.\n날짜를 탭하면 그날 기록을 바로 조회해요.'
  },
  {
    selector: '#nav-recommend',
    tab: 'travel',
    icon: '🏖️',
    title: '추천 탭',
    desc: '<b>추천 탭</b>에서 지역별 관광지를\n추천받고 즐겨찾기할 수 있어요.\n🔀 버튼으로 새 목록을 랜덤으로 불러와요.'
  },
  {
    selector: '#nav-my',
    tab: 'travel',
    icon: '👤',
    title: 'MY 탭',
    desc: '<b>MY 탭</b>에서 프로필을 수정하고\n데이터 백업 및 초기화를 할 수 있어요.\n소셜 로그인으로 기기 간 동기화도 돼요.'
  },
  {
    selector: '#main-tab-bar',
    tab: 'travel',
    icon: '✅',
    title: '준비 완료!',
    desc: '하단 <b>탭 바</b>로 언제든 화면을 전환해요.\n여행 · 스토리 · 추천 · MY\n이제 여정을 시작해보세요!'
  }
];
let tourIdx = 0;

function shouldShowTour() {
  return !localStorage.getItem(TOUR_KEY);
}

function startAppTour() {
  if (!shouldShowTour()) return;
  tourIdx = 0;
  switchTab('travel');
  setTimeout(() => _tourRender(), 350);
}

function _tourRender() {
  const step = TOUR_STEPS[tourIdx];
  const total = TOUR_STEPS.length;
  // 텍스트 업데이트
  document.getElementById('ob-tour-icon').textContent = step.icon;
  document.getElementById('ob-tour-title').textContent = step.title;
  document.getElementById('ob-tour-desc').innerHTML = step.desc.replace(/\n/g, '<br>');
  document.getElementById('ob-tour-step-label').textContent = `${tourIdx + 1} / ${total}`;
  document.getElementById('ob-tour-btn-prev').disabled = (tourIdx === 0);
  document.getElementById('ob-tour-btn-next').textContent = (tourIdx === total - 1) ? '완료' : '다음';
  // 활성화
  document.getElementById('ob-tour-overlay').classList.add('active');
  document.getElementById('ob-tour-card').classList.add('active');
  // 하이라이트 링 위치
  const target = document.querySelector(step.selector);
  const ring = document.getElementById('ob-tour-highlight-ring');
  if (target && ring) {
    const r = target.getBoundingClientRect();
    const pad = 6;
    ring.style.top    = (r.top    - pad) + 'px';
    ring.style.left   = (r.left   - pad) + 'px';
    ring.style.width  = (r.width  + pad * 2) + 'px';
    ring.style.height = (r.height + pad * 2) + 'px';
    ring.classList.add('active');
  } else if (ring) {
    ring.classList.remove('active');
  }
}

function tourNext() {
  if (tourIdx >= TOUR_STEPS.length - 1) { finishTour(); return; }
  tourIdx++;
  _tourRender();
}

function tourPrev() {
  if (tourIdx <= 0) return;
  tourIdx--;
  _tourRender();
}

function finishTour() {
  localStorage.setItem(TOUR_KEY, '1');
  document.getElementById('ob-tour-overlay').classList.remove('active');
  document.getElementById('ob-tour-card').classList.remove('active');
  document.getElementById('ob-tour-highlight-ring').classList.remove('active');
}
