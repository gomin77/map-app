/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   추천 탭 로직
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
async function fetchTourAttractions(areaCode, sigunguCode) {
  if (TOUR_API_KEY.includes('YOUR_TOUR')) return null;
  const sg = sigunguCode ? `&sigunguCode=${sigunguCode}` : '';
  const url = `${TOUR_API_BASE}/areaBasedList2?ServiceKey=${TOUR_API_KEY}&numOfRows=12&pageNo=1&MobileOS=ETC&MobileApp=JourneyApp&_type=json&areaCode=${areaCode || ''}${sg}&contentTypeId=12&arrange=Q`;
  try {
    const res = await fetch(url);
    const json = await res.json();
    const items = json?.response?.body?.items?.item;
    if (!items) return null;
    let itemList = Array.isArray(items) ? items : [items];
    itemList = itemList.map(i => ({
      ...i,
      firstimage: i.firstimage ? i.firstimage.replace('http://', 'https://') : '',
      firstimage2: i.firstimage2 ? i.firstimage2.replace('http://', 'https://') : '',
    }));
    return itemList.sort((a, b) => (b.firstimage ? 1 : 0) - (a.firstimage ? 1 : 0));
  } catch(e) {
    console.error('API Fetch failed:', e);
    return null;
  }
}

function initFilterRow(){
  document.getElementById('filter-row').innerHTML = TOUR_AREAS.map(f=>
    `<div class="chip${f.code===recFilter?' active':''}" data-code="${f.code}" onclick="selectFilter('${f.code}',this)">${f.label}</div>`
  ).join('');
}

function selectFilter(code, el){
  document.querySelectorAll('#filter-row .chip').forEach(c=>c.classList.remove('active'));
  el.classList.add('active');
  recFilter = code;
  loadRecommendations(code);
}

async function loadRecommendations(areaCode, sigunguCode, displayName){
  const targetArea = TOUR_AREAS.find(a => a.code === areaCode) || TOUR_AREAS[1];
  const label = displayName || targetArea.label;
  const grid = document.getElementById('rec-grid');
  const bannerWrap = document.getElementById('rec-banner-wrap');
  const labelEl = document.getElementById('rec-grid-label');

  labelEl.textContent = `📍 ${label} 주요 관광지`;
  grid.innerHTML = Array(4).fill('<div class="rec-card skeleton" style="height:200px"></div>').join('');

  const items = await fetchTourAttractions(areaCode, sigunguCode);

  if (!items || items.length === 0) {
    bannerWrap.innerHTML = '';
    grid.innerHTML = '<div class="rec-empty">불러올 수 있는 관광 정보가 없습니다 🥲<br>잠시 후 다시 시도해 주세요.</div>';
    return;
  }

  const mainImg = items[0]?.firstimage || '';
  bannerWrap.innerHTML = mainImg ? `
    <div class="rec-banner" style="background-image:url('${mainImg}')">
      <div class="rec-banner-overlay">
        <div class="rec-banner-region">${label}</div>
        <div class="rec-banner-desc">${targetArea.desc}</div>
      </div>
    </div>` : '';

  grid.innerHTML = items.map(i => {
    const itemJson = JSON.stringify(i).replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    const fav = isFav(i.contentid);
    return `
    <div class="rec-card" onclick="openDetail(JSON.parse(this.dataset.item))" data-item="${itemJson}">
      <img class="rec-img" src="${i.firstimage||''}"
           onerror="this.style.display='none'">
      <button class="rec-card-fav ${fav?'active':''}" data-id="${i.contentid}"
              onclick="event.stopPropagation();toggleFavorite(JSON.parse(this.closest('.rec-card').dataset.item))"
              title="${fav?'즐겨찾기 해제':'즐겨찾기 추가'}">${fav?'♥':'♡'}</button>
      <div class="rec-info">
        <div class="rec-title">${i.title}</div>
        <div class="rec-addr">${i.addr1||''}</div>
      </div>
    </div>`;
  }).join('');
}

function shuffleRecs(){
  const pool = TOUR_AREAS.slice(1);
  const picked = pool[Math.floor(Math.random() * pool.length)];
  currentAreaCode = picked.code;
  document.getElementById('area-selector-label').textContent = `📍 ${picked.label}`;
  loadRecommendations(picked.code);
}

/* ── 지역 선택 아코디언 ── */
function openAreaSelector() {
  openProvince = null;
  SIGUNGU_CACHE = {}; 
  renderAreaAccordion();
  document.getElementById('area-modal-bg').classList.add('open');
  document.getElementById('area-modal').classList.add('open');
}

function renderAreaAccordion() {
  const grid = document.getElementById('area-grid');
  grid.innerHTML = TOUR_AREAS.slice(1).map(a => {
    const isOpen = openProvince === a.code;
    const subs = SIGUNGU_CACHE[a.code];
    let subContent = '';
    if (isOpen) {
      if (subs === undefined || subs === null) {
        subContent = '<div class="sigungu-loading">⏳ 불러오는 중...</div>';
      } else if (subs.length === 0) {
        subContent = `<div class="sigungu-retry" onclick="retryProvince('${a.code}')">⚠️ 불러오기 실패 — 다시 시도</div>`;
      } else {
        subContent = `<div class="sigungu-grid">
          <div class="sigungu-chip sigungu-all" onclick="selectSigungu('${a.code}','','${a.label} 전체')">${a.label} 전체</div>
          ${subs.map(s=>`<div class="sigungu-chip" onclick="selectSigungu('${a.code}','${s.c}','${a.label} ${s.n}')">${s.n}</div>`).join('')}
        </div>`;
      }
    }
    return `
      <div class="province-item">
        <div class="province-row${isOpen?' is-open':''}" onclick="toggleProvince('${a.code}')">
          <span class="province-name">${a.label}</span>
          <span class="province-arrow">›</span>
        </div>
        ${subContent}
      </div>`;
  }).join('');
}

async function fetchSigungu(code) {
  const url = `${TOUR_API_BASE}/areaCode2?ServiceKey=${TOUR_API_KEY}&numOfRows=50&pageNo=1&MobileOS=ETC&MobileApp=JourneyApp&_type=json&areaCode=${code}`;
  const res = await fetch(url);
  const json = await res.json();
  const raw = json?.response?.body?.items?.item;
  if (!raw) throw new Error('no items');
  const list = Array.isArray(raw) ? raw : [raw];
  const EXCLUDE = code === '39' ? ['1','2'] : [];
  return list.filter(i => i.code && i.name && !EXCLUDE.includes(String(i.code))).map(i => ({c: String(i.code), n: i.name}));
}

async function toggleProvince(code) {
  if (openProvince === code) {
    openProvince = null;
    renderAreaAccordion();
    return;
  }
  openProvince = code;
  if (SIGUNGU_CACHE[code] === undefined) {
    SIGUNGU_CACHE[code] = null;
    renderAreaAccordion();
    try {
      SIGUNGU_CACHE[code] = await fetchSigungu(code);
    } catch(e) {
      SIGUNGU_CACHE[code] = [];
    }
  }
  renderAreaAccordion();
}

async function retryProvince(code) {
  SIGUNGU_CACHE[code] = null;
  renderAreaAccordion();
  try {
    SIGUNGU_CACHE[code] = await fetchSigungu(code);
  } catch(e) {
    SIGUNGU_CACHE[code] = [];
  }
  renderAreaAccordion();
}

function selectSigungu(areaCode, sigunguCode, displayName) {
  currentAreaCode = areaCode;
  document.getElementById('area-selector-label').textContent = `📍 ${displayName}`;
  closeAreaSelector();
  loadRecommendations(areaCode, sigunguCode, displayName);
}

function closeAreaSelector() {
  document.getElementById('area-modal-bg').classList.remove('open');
  document.getElementById('area-modal').classList.remove('open');
}

function selectArea(code, label) {
  currentAreaCode = code;
  document.getElementById('area-selector-label').textContent = `📍 ${label}`;
  closeAreaSelector();
  loadRecommendations(code, '', label);
}

/* ── 즐겨찾기 로직 ── */
let tourFavorites = JSON.parse(localStorage.getItem('tourFavorites') || '[]');
let detailCurrentItem = null;

function saveFavs() { localStorage.setItem('tourFavorites', JSON.stringify(tourFavorites)); }
function isFav(contentid) { return tourFavorites.some(f => f.contentid === contentid); }

function toggleFavorite(item) {
  if (isFav(item.contentid)) {
    tourFavorites = tourFavorites.filter(f => f.contentid !== item.contentid);
    showToast('즐겨찾기에서 삭제됐습니다');
  } else {
    tourFavorites.unshift(item);
    showToast('♥ 즐겨찾기에 추가됐습니다!');
  }
  saveFavs();
  refreshCardFavBtns();
  if (detailCurrentItem?.contentid === item.contentid) {
    const btn = document.getElementById('detail-fav-btn');
    btn.textContent = isFav(item.contentid) ? '♥' : '♡';
    btn.className = 'detail-fav-btn' + (isFav(item.contentid) ? ' active' : '');
  }
}

function toggleFavoriteFromDetail() { if (!detailCurrentItem) return; toggleFavorite(detailCurrentItem); }

function refreshCardFavBtns() {
  document.querySelectorAll('.rec-card-fav').forEach(btn => {
    const id = btn.dataset.id;
    btn.textContent = isFav(id) ? '♥' : '♡';
    btn.className = 'rec-card-fav' + (isFav(id) ? ' active' : '');
  });
}

function showFavorites() {
  const list = document.getElementById('fav-list');
  if (tourFavorites.length === 0) {
    list.innerHTML = '<div class="fav-empty">아직 즐겨찾기한 관광지가 없습니다 🗺️</div>';
  } else {
    list.innerHTML = tourFavorites.map(f => `
      <div class="fav-item" onclick="openDetail(${JSON.stringify(f).replace(/"/g,'&quot;')})">
        <img class="fav-thumb" src="${f.firstimage||''}" onerror="this.src=''" >
        <div class="fav-info">
          <div class="fav-name">${f.title}</div>
          <div class="fav-addr">${f.addr1||''}</div>
        </div>
        <button class="fav-del" onclick="event.stopPropagation();removeFav('${f.contentid}')">✕</button>
      </div>
    `).join('');
  }
  document.getElementById('fav-modal-bg').classList.add('open');
  document.getElementById('fav-modal').classList.add('open');
}

function removeFav(contentid) {
  tourFavorites = tourFavorites.filter(f => f.contentid !== contentid);
  saveFavs();
  showFavorites();
  refreshCardFavBtns();
}

function closeFavorites() {
  document.getElementById('fav-modal-bg').classList.remove('open');
  document.getElementById('fav-modal').classList.remove('open');
}

/* ── 상세보기 모달 ── */
async function openDetail(item) {
  detailCurrentItem = item;
  document.getElementById('detail-modal-bg').classList.add('open');
  const modalEl = document.getElementById('detail-modal');
  modalEl.classList.add('open');
  const scrollEl = document.getElementById('detail-scroll');
  if (scrollEl) scrollEl.scrollTop = 0;

  const imgEl = document.getElementById('detail-img');
  const placeholder = document.getElementById('detail-img-placeholder');
  imgEl.style.display = 'block';
  if (placeholder) placeholder.style.display = 'none';

  if (item.firstimage) {
    imgEl.src = item.firstimage;
    imgEl.onload = () => { if (placeholder) placeholder.style.display = 'none'; };
    imgEl.onerror = () => {
      imgEl.style.display = 'none';
      if (placeholder) placeholder.style.display = 'flex';
    };
  } else {
    imgEl.style.display = 'none';
    if (placeholder) placeholder.style.display = 'flex';
  }

  document.getElementById('detail-title').textContent = item.title;
  document.getElementById('detail-addr').textContent = item.addr1 || '';
  document.getElementById('detail-tel').textContent = item.tel ? `📞 ${item.tel}` : '';
  document.getElementById('detail-overview').textContent = '소개를 불러오는 중...';
  const favBtn = document.getElementById('detail-fav-btn');
  favBtn.textContent = isFav(item.contentid) ? '♥' : '♡';
  favBtn.className = 'detail-fav-btn' + (isFav(item.contentid) ? ' active' : '');

  try {
    const url = `${TOUR_API_BASE}/detailCommon2?ServiceKey=${TOUR_API_KEY}&contentId=${item.contentid}&MobileOS=ETC&MobileApp=JourneyApp&_type=json`;
    const res = await fetch(url);
    const json = await res.json();
    const detail = json?.response?.body?.items?.item;
    const info = Array.isArray(detail) ? detail[0] : detail;
    const overview = info?.overview || '소개 정보가 없습니다.';
    const cleanOverview = overview
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#\d+;/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    document.getElementById('detail-overview').textContent = cleanOverview;
    if (info?.firstimage) {
      const hiResUrl = info.firstimage.replace('http://','https://');
      imgEl.style.display = 'block';
      if (placeholder) placeholder.style.display = 'none';
      imgEl.src = hiResUrl;
    }
  } catch(e) {
    document.getElementById('detail-overview').textContent = '소개 정보를 불러올 수 없습니다.';
  }
}

function closeDetail() {
  document.getElementById('detail-modal-bg').classList.remove('open');
  document.getElementById('detail-modal').classList.remove('open');
}
