/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   위치 기반 방문 제안 (포그라운드 1회성, 백그라운드 위치추적 없음)
   - 앱을 열 때 하루 최대 1회만 대략적 위치(도시 단위)를 확인
   - Nominatim(무료, 키 불필요) 역지오코딩으로 행정구역명을 얻어
     REGIONS_KR 지역명과 매칭 → 미방문 지역이면 배너로 기록 제안
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const LOC_SUGGEST_KEY = 'loc_suggest_last_check';
const LOC_SUGGEST_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 1일 1회

function getGeolocationPlugin() {
  return window.Capacitor?.Plugins?.Geolocation || null;
}

async function checkLocationSuggestion() {
  try {
    const Geo = getGeolocationPlugin();
    if (!Geo) return;

    const last = parseInt(localStorage.getItem(LOC_SUGGEST_KEY) || '0', 10);
    if (Date.now() - last < LOC_SUGGEST_COOLDOWN_MS) return;

    let perm = await Geo.checkPermissions();
    if (perm.location !== 'granted' && perm.coarseLocation !== 'granted') {
      perm = await Geo.requestPermissions({ permissions: ['coarseLocation'] });
    }
    // 쿨다운은 권한 결과와 무관하게 갱신 (거부 시 매번 재요청하지 않도록)
    localStorage.setItem(LOC_SUGGEST_KEY, String(Date.now()));
    if (perm.location !== 'granted' && perm.coarseLocation !== 'granted') return;

    const pos = await Geo.getCurrentPosition({ enableHighAccuracy: false, timeout: 8000 });
    const regionName = await reverseGeocodeToRegionName(pos.coords.latitude, pos.coords.longitude);
    if (!regionName) return;

    const match = REGIONS_KR.find(r => regionName.includes(r.name) || r.name.includes(regionName));
    if (!match) return;

    const d = visits[match.id];
    if (d && d.status) return; // 이미 방문/희망 기록이 있으면 제안하지 않음

    showLocationSuggestion(match.id, match.name);
  } catch (e) {
    console.error('위치 기반 제안 확인 실패:', e);
  }
}

async function reverseGeocodeToRegionName(lat, lon) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&accept-language=ko&zoom=10`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const a = data.address || {};
    return a.city || a.county || a.town || a.borough || a.city_district || null;
  } catch (e) {
    console.error('역지오코딩 실패:', e);
    return null;
  }
}

function showLocationSuggestion(regionId, regionName) {
  const banner = document.getElementById('loc-suggest-banner');
  const textEl = document.getElementById('loc-suggest-text');
  if (!banner || !textEl) return;
  textEl.textContent = `지금 계신 곳은 아직 기록하지 않은 ${regionName}이에요! 기록해보시겠어요?`;
  banner.dataset.regionId = regionId;
  banner.style.display = 'flex';
  if (typeof trackEvent === 'function') trackEvent('location_suggestion_shown', { region_id: regionId });
}

function openLocationSuggestion() {
  const banner = document.getElementById('loc-suggest-banner');
  const id = banner?.dataset.regionId;
  dismissLocationSuggestion();
  if (!id) return;
  if (typeof trackEvent === 'function') trackEvent('location_suggestion_open', { region_id: id });
  if (typeof selectMap === 'function') selectMap('kr');
  if (typeof switchTab === 'function') switchTab('travel');
  setTimeout(() => { if (typeof openRecModal === 'function') openRecModal(id); }, 300);
}

function dismissLocationSuggestion() {
  const banner = document.getElementById('loc-suggest-banner');
  if (banner) banner.style.display = 'none';
}
