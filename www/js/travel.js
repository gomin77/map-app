/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   여행 탭 로직
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function goToMain(){
  document.getElementById('screen-splash').classList.remove('active');
  document.getElementById('screen-main').classList.add('active');
  document.getElementById('main-tab-bar').style.display = 'flex';
  renderTravel();
  shuffleRecs();
  updateBannerForTab('recommend');
  if (shouldShowOnboard()) showOnboard();
}

function switchTab(tab){
  document.querySelectorAll('.bottom-sheet').forEach(s=>s.classList.remove('open'));
  document.querySelectorAll('.bottom-sheet-bg').forEach(s=>s.classList.remove('open'));
  document.querySelectorAll('.tab-page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.tab-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('tab-'+tab).classList.add('active');
  document.getElementById('nav-'+tab).classList.add('active');
  updateBannerForTab(tab);
  if(tab==='travel') renderTravel();
  if(tab==='stats'){ renderRecentViews(); renderCalendar(); renderTimeline(); }
  if(tab==='report'){ drawDonuts(); switchBadgeFilter(badgeFilter); }
}

/* ── ⚙️ 설정 패널 ── */
function openSettings(){
  document.getElementById('settings-panel').classList.add('open');
  updateBannerForTab('settings');
}
function closeSettings(){
  document.getElementById('settings-panel').classList.remove('open');
  const activeTab = document.querySelector('.tab-page.active')?.id?.replace('tab-', '') || 'recommend';
  updateBannerForTab(activeTab);
}

/* ── 지도 렌더링 ── */
async function initMap(type){
  const cfg = getMap(type);
  if(!cfg) return;
  const box = document.getElementById(type+'-box');
  if(!box) return;

  if(!box.querySelector('svg')){
    try{
      const res = await fetch(cfg.file);
      const txt = await res.text();
      box.innerHTML = txt;
      const svg = box.querySelector('svg');

      // viewBox 없는 SVG (서울 등): width/height 변경 전에 원본 크기로 viewBox 설정
      if(!svg.getAttribute('viewBox')){
        const ow = parseFloat(svg.getAttribute('width')) || 800;
        const oh = parseFloat(svg.getAttribute('height')) || 600;
        svg.setAttribute('viewBox', `0 0 ${ow} ${oh}`);
        svg.removeAttribute('overflow');
      }
      svg.setAttribute('width','100%'); svg.setAttribute('height','100%');
      if(!svg.querySelector('defs')) svg.prepend(document.createElementNS('http://www.w3.org/2000/svg','defs'));

      if(type==='jp'){
        svg.querySelectorAll('.land').forEach(p=>{
          p.classList.add('region');
          if(!p.getAttribute('data-name') && p.getAttribute('title'))
            p.setAttribute('data-name', p.getAttribute('title'));
        });
      }

      if(type==='world'){
        svg.querySelectorAll('.land').forEach(p=>{
          p.classList.add('region');
          const iso = p.getAttribute('id') || '';
          p.setAttribute('id', 'wld_' + iso);
          if(!p.getAttribute('data-name') && p.getAttribute('title'))
            p.setAttribute('data-name', p.getAttribute('title'));
        });
      }

      // 서울: SVG에 pre-marked .region이 없을 경우에만 폴백 처리
      if(type==='seoul'){
        if(svg.querySelectorAll('.region').length === 0){
          const SEOUL_DISTRICTS = [
            '도봉구','노원구','강북구','성북구','종로구','중구','용산구','은평구','서대문구',
            '마포구','강서구','양천구','구로구','영등포구','동작구','관악구','금천구',
            '강남구','서초구','송파구','강동구','광진구','성동구','동대문구','중랑구'
          ];
          Array.from(svg.querySelectorAll('path')).forEach((p, i) => {
            p.setAttribute('id', 'seoul_'+i);
            p.setAttribute('data-name', SEOUL_DISTRICTS[i] || '서울_'+i);
            p.classList.add('region');
          });
        }
      }
      svg.querySelectorAll('.region').forEach(p=>{
        p.addEventListener('click', e=>{ e.stopPropagation(); openRecModal(p.id); });
      });
      requestAnimationFrame(()=>requestAnimationFrame(()=>{
        fitLabels(svg);
        applyTextOverrides(svg, type);
      }));
    }catch(e){ console.error('SVG load failed:', e); }
  }
  updateColors(box.querySelector('svg'));
}

function applyTextOverrides(svg, type){
  if(!svg) return;
  svg.querySelectorAll('text').forEach(t=>{
    if(window.getComputedStyle(t).display==='none') return;
    const content = t.textContent.trim();
    if(type==='jp') t.style.setProperty('font-size','2.5px','important');
    if(type==='kr'){
      const small = ['부천','광명','과천','안양','군포','의왕'];
      if(small.some(n=>content.includes(n))) t.style.setProperty('font-size','3px','important');
      if(content==='울주군'){
        const curX = parseFloat(t.getAttribute('x')||0);
        t.setAttribute('x', curX - 15);
      }
    }
  });
}

function fitLabels(svg){
  if(!svg) return;
  const regions = Array.from(svg.querySelectorAll('.region'));
  const regionCenters = regions.map(r=>{
    const b = r.getBBox();
    return { el:r, cx:b.x+b.width/2, cy:b.y+b.height/2, w:b.width, h:b.height };
  });
  svg.querySelectorAll('text').forEach(t=>{
    if(window.getComputedStyle(t).display==='none') return;
    const tx = parseFloat(t.getAttribute('x')||0);
    const ty = parseFloat(t.getAttribute('y')||0);
    let best=null, minD=Infinity;
    regionCenters.forEach(rc=>{
      const d=Math.hypot(tx-rc.cx, ty-rc.cy);
      if(d<minD){ minD=d; best=rc; }
    });
    if(!best) return;
    const tb = t.getBBox();
    if(tb.width<=0) return;
    const maxW = best.w * 0.88;
    const maxH = best.h * 0.88;
    if(tb.width > maxW || tb.height > maxH){
      const scale = Math.min(maxW/tb.width, maxH/tb.height);
      const cur = parseFloat(window.getComputedStyle(t).fontSize) || 5;
      const newSize = Math.max(2.5, cur * scale);
      t.style.setProperty('font-size', newSize+'px', 'important');
    }
  });
}

function updateColors(svg){
  if(!svg) return;
  const defs = svg.querySelector('defs');
  defs.innerHTML = '';
  svg.querySelectorAll('.mask-img').forEach(i=>i.remove());
  svg.querySelectorAll('.region').forEach(p=>{
    const d = visits[p.id];
    p.style.strokeDasharray = 'none';
    if(d && d.status==='visited'){
      const thumb = getRegionThumb(d);
      if(thumb){
        const cid = 'c-'+p.id.replace(/[^a-z0-9]/gi,'-');
        const cp = document.createElementNS('http://www.w3.org/2000/svg','clipPath');
        cp.setAttribute('id', cid);
        const u = document.createElementNS('http://www.w3.org/2000/svg','use');
        u.setAttribute('href','#'+p.id);
        cp.appendChild(u); defs.appendChild(cp);
        const b = p.getBBox();
        const img = document.createElementNS('http://www.w3.org/2000/svg','image');
        img.setAttribute('class','mask-img');
        img.setAttribute('href', thumb);
        img.setAttribute('x',b.x); img.setAttribute('y',b.y);
        img.setAttribute('width',b.width); img.setAttribute('height',b.height);
        img.setAttribute('preserveAspectRatio','xMidYMid slice');
        img.setAttribute('clip-path','url(#'+cid+')');
        img.style.pointerEvents='none';
        svg.appendChild(img);
        p.style.fill='rgba(41,182,246,.15)';
      } else { p.style.fill='rgba(41,182,246,.5)'; }
      p.style.stroke='#29b6f6'; p.style.strokeWidth=p.id.startsWith('seoul_')?'2':'0.5';
    } else if(d && d.status==='wish'){
      p.style.fill='transparent'; p.style.stroke='#1565c0'; p.style.strokeWidth=p.id.startsWith('seoul_')?'2':'1.5'; p.style.strokeDasharray='3,2';
    } else {
      p.style.fill='#ffffff'; p.style.stroke='#8ecbe8'; p.style.strokeWidth=p.id.startsWith('seoul_')?'1':'0.3';
    }
  });
}

function renderTravel(){
  const cfg = getMap(currentMap);
  if(!cfg) return;
  initMap(currentMap);
  const visited = Object.keys(visits).filter(id=>id.startsWith(cfg.prefix)&&visits[id].status==='visited').length;
  const pct = cfg.total > 0 ? Math.round(visited/cfg.total*100) : 0;
  document.getElementById('stat-pct').textContent = pct+'%';
  document.getElementById('prog-fill').style.width = pct+'%';
  renderRecordList();
}

function renderRecordList(){
  const cfg = getMap(currentMap);
  if(!cfg) return;
  const flat = [];
  Object.entries(visits).filter(([id])=>id.startsWith(cfg.prefix)).forEach(([id,d])=>{
    if(d.status==='visited'){
      (d.records||[]).forEach(r=>flat.push({id, d, r}));
    } else if(d.status==='wish'){
      flat.push({id, d, r:null});
    }
  });
  flat.sort((a,b)=>{
    const da = a.r ? (a.r.startDate||'') : (a.d.date||'');
    const db = b.r ? (b.r.startDate||'') : (b.d.date||'');
    return db.localeCompare(da);
  });
  const show = showAll ? flat : flat.slice(0,5);
  const extra = flat.length - 5;
  const btnMore = document.getElementById('btn-more');
  btnMore.style.display = flat.length > 5 ? 'block' : 'none';
  btnMore.textContent = showAll ? '접기' : `더보기 (${extra}개)`;
  document.getElementById('record-list').innerHTML = show.map(({id,d,r})=>{
    const name = getRegionName(id);
    const photos = r ? (r.photos||[]) : (d.photos || (d.photo ? [d.photo] : []));
    const thumb = photos.length ? `<img class="rec-thumb" src="${photos[0]}">` : `<div class="rec-thumb-empty">${d.status==='wish'?'🔖':'📍'}</div>`;
    const tag = d.status==='wish' ? '<span style="font-size:11px;color:var(--wish);font-weight:700;">[가고 싶어요]</span>' : '';
    const dateLabel = r ? getRecordDateLabel(r) : (d.date||'');
    const tags = r ? r.tags : d.tags;
    const memo = r ? r.memo : d.memo;
    return `<div class="rec-row" onclick="openRecModal('${id}')">${thumb}
      <div class="rec-info-row">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:4px">
          <span class="name">${name}</span><span class="date">${dateLabel}</span>
        </div>
        ${tag}
        ${tags ? `<div style="font-size:11px;color:var(--primary);margin-top:2px">${tags}</div>` : ''}
        ${memo ? `<div class="memo">${memo}</div>` : ''}
      </div></div>`;
  }).join('');
}
function toggleRecords(){ showAll=!showAll; renderRecordList(); }

/* ── 줌/팬 핸들링 ── */
const mapArea = document.getElementById('map-area');
const zoomLayer = document.getElementById('zoom-layer');
mapArea.addEventListener('touchstart', e=>{
  if(e.touches.length===2){
    isPinch=true; isDrag=false;
    startDist=Math.hypot(e.touches[0].pageX-e.touches[1].pageX, e.touches[0].pageY-e.touches[1].pageY);
    startZoom=zoom;
    const rect=mapArea.getBoundingClientRect();
    pinchMidX=((e.touches[0].pageX+e.touches[1].pageX)/2)-rect.left;
    pinchMidY=((e.touches[0].pageY+e.touches[1].pageY)/2)-rect.top;
    pinchStartOffX=offX; pinchStartOffY=offY;
  } else {
    isDrag=true; startX=e.touches[0].pageX-offX; startY=e.touches[0].pageY-offY;
    const now=Date.now(); if(now-lastTap<300) resetZoom(); lastTap=now;
  }
},{ passive:true });
mapArea.addEventListener('touchmove', e=>{
  e.preventDefault();
  if(isPinch && e.touches.length===2){
    const d=Math.hypot(e.touches[0].pageX-e.touches[1].pageX, e.touches[0].pageY-e.touches[1].pageY);
    const newZoom=Math.min(Math.max(startZoom*(d/startDist),0.8),12);
    const contentX=(pinchMidX-pinchStartOffX)/startZoom;
    const contentY=(pinchMidY-pinchStartOffY)/startZoom;
    offX=pinchMidX-contentX*newZoom; offY=pinchMidY-contentY*newZoom; zoom=newZoom;
  } else if(isDrag && e.touches.length===1){
    offX=e.touches[0].pageX-startX; offY=e.touches[0].pageY-startY;
  }
  applyTransform();
},{ passive:false });
mapArea.addEventListener('touchend', ()=>{ isPinch=false; isDrag=false; });
function applyTransform(){
  // 지도 이동 한계 (지도가 화면 밖으로 완전히 벗어나지 않도록)
  const rect = mapArea.getBoundingClientRect();
  const mapW = rect.width * zoom;
  const mapH = rect.height * zoom;
  const maxX = rect.width * 0.8;
  const maxY = rect.height * 0.8;
  const minX = -(mapW - rect.width * 0.2);
  const minY = -(mapH - rect.height * 0.2);
  offX = Math.min(maxX, Math.max(minX, offX));
  offY = Math.min(maxY, Math.max(minY, offY));
  zoomLayer.style.transform=`translate(${offX}px,${offY}px) scale(${zoom})`;
}
function resetZoom(){ zoom=1; offX=0; offY=0; applyTransform(); }

/* ── 지도 선택 ── */
function openMapPicker(){
  const mk = (maps, elId) => {
    document.getElementById(elId).innerHTML = maps.map(m=>{
      const cnt = Object.keys(visits).filter(id=>id.startsWith(m.prefix)&&visits[id].status==='visited').length;
      return `<div class="mp-card${m.id===currentMap?' sel':''}${!m.avail?' na':''}" onclick="${m.avail?`selectMap('${m.id}')`:"showToast('곧 추가됩니다 🙌')"}">
        <div class="mp-icon">${m.icon}</div><div class="mp-name">${m.name}</div>
        ${m.avail ? `<div class="mp-cnt">${cnt} / ${m.total}</div>` : '<span class="mp-badge">준비 중</span>'}
      </div>`;
    }).join('');
  };
  mk(MAPS.domestic,'mp-domestic'); mk(MAPS.intl,'mp-intl');
  document.getElementById('mp-modal').classList.add('open');
}
function closeMapPicker(e){ if(!e||e.target.id==='mp-modal') document.getElementById('mp-modal').classList.remove('open'); }
function selectMap(id){
  currentMap=id; const cfg=getMap(id);
  document.getElementById('map-hd-name').textContent=cfg.name+' ▾';
  document.getElementById('kr-box').classList.toggle('active',id==='kr');
  document.getElementById('jp-box').classList.toggle('active',id==='jp');
  const seoulBox=document.getElementById('seoul-box');
  if(seoulBox) seoulBox.classList.toggle('active',id==='seoul');
  const worldBox=document.getElementById('world-box');
  if(worldBox) worldBox.classList.toggle('active',id==='world');
  const jejuBox=document.getElementById('jeju-box');
  if(jejuBox) jejuBox.classList.toggle('active',id==='jeju');
  closeMapPicker(); resetZoom(); showAll=false; renderTravel();
}

/* ── 지도 지명 검색 (현재 보고 있는 지도 내부로 한정) ── */
function openMapSearch(){
  const input = document.getElementById('search-input');
  input.value = '';
  renderSearchResults('');
  document.getElementById('search-modal').classList.add('open');
  setTimeout(()=>input.focus(), 150);
}
function closeMapSearch(e){
  if(!e || e.target.id==='search-modal') document.getElementById('search-modal').classList.remove('open');
}
function renderSearchResults(query){
  const resultsEl = document.getElementById('search-results');
  const cfg = getMap(currentMap);
  const box = cfg && document.getElementById(cfg.id+'-box');
  const svg = box && box.querySelector('svg');
  if(!svg){
    resultsEl.innerHTML = '<div class="search-empty">지도를 불러오는 중입니다. 잠시 후 다시 시도해주세요.</div>';
    return;
  }
  const q = (query||'').trim();
  let regions = Array.from(svg.querySelectorAll('.region')).map(el=>({ id:el.id, name:getRegionName(el.id) }));
  if(q){
    regions = regions.filter(r=>r.name.includes(q));
    regions.sort((a,b)=>{
      const as = a.name.startsWith(q) ? 0 : 1, bs = b.name.startsWith(q) ? 0 : 1;
      if(as!==bs) return as-bs;
      return a.name.localeCompare(b.name,'ko');
    });
  } else {
    regions.sort((a,b)=>a.name.localeCompare(b.name,'ko'));
  }
  if(!regions.length){
    resultsEl.innerHTML = '<div class="search-empty">검색 결과가 없습니다.</div>';
    return;
  }
  resultsEl.innerHTML = regions.slice(0,50).map(r=>{
    const d = visits[r.id];
    const icon = d?.status==='visited' ? '✅' : d?.status==='wish' ? '🔖' : '📍';
    return `<div class="search-result-row" onclick="focusRegion('${r.id}')"><span class="search-result-icon">${icon}</span><span class="search-result-name">${r.name}</span></div>`;
  }).join('');
}
function focusRegion(id){
  closeMapSearch();
  const el = document.getElementById(id);
  const svg = document.querySelector('#zoom-layer .svg-box.active svg');
  if(!el || !svg){ showToast('지역을 찾을 수 없습니다'); return; }
  const rect = mapArea.getBoundingClientRect();
  const vb = svg.viewBox.baseVal;
  const b = el.getBBox();
  // letterboxing 보정 (svg는 preserveAspectRatio 기본값 xMidYMid meet)
  const svgScale = Math.min(rect.width/vb.width, rect.height/vb.height);
  const letterboxX = (rect.width - vb.width*svgScale) / 2;
  const letterboxY = (rect.height - vb.height*svgScale) / 2;
  const cx = b.x + b.width/2, cy = b.y + b.height/2;
  const screenCx = letterboxX + cx*svgScale;
  const screenCy = letterboxY + cy*svgScale;
  const targetZoom = Math.min(Math.max(300/Math.max(b.width*svgScale, b.height*svgScale), 3), 8);
  zoom = targetZoom;
  offX = rect.width/2 - screenCx*targetZoom;
  offY = rect.height/2 - screenCy*targetZoom;
  applyTransform();
  el.classList.remove('region-pulse');
  void el.offsetWidth; // reflow로 애니메이션 재시작
  el.classList.add('region-pulse');
  setTimeout(()=>el.classList.remove('region-pulse'), 1900);
  showToast(getRegionName(id)+' 위치로 이동했습니다');
}

/* ── 기록 관리 ── */
function openRecModal(id){
  activeRegion=id;
  const d=visits[id];
  const status = d ? d.status : 'visited';
  tempStatus = status;
  document.getElementById('rec-title').textContent=getRegionName(id);
  document.getElementById('btn-del-rec').style.display=d?'block':'none';
  document.getElementById('sb-v').className='sts-btn'+(status==='visited'?' on-v':'');
  document.getElementById('sb-w').className='sts-btn'+(status==='wish'?' on-w':'');
  showStatusSection(status);
  if(status==='wish'){
    loadWishFormFields();
  } else {
    renderRecordsInModal(id);
  }
  document.getElementById('rec-modal').classList.add('open');
  const regionName = getRegionName(id);
  recentViews = [{id, name: regionName}, ...recentViews.filter(v=>(typeof v==='string'?v:v.id)!==id)].slice(0,10);
  saveRecent();
}
function showStatusSection(s){
  document.getElementById('wish-form').style.display = s==='wish' ? 'block' : 'none';
  document.getElementById('records-section').style.display = s==='visited' ? 'block' : 'none';
}
function loadWishFormFields(){
  const d = visits[activeRegion] || {};
  tempPhotos = d.photos ? [...d.photos] : (d.photo ? [d.photo] : []);
  document.getElementById('rec-date').value = d.date||'';
  document.getElementById('rec-tags').value = d.tags||'';
  document.getElementById('rec-memo').value = d.memo||'';
  renderGallery();
}
// ✅/🔖 버튼 클릭 시 즉시 상태를 저장 (매번 "저장하기"를 누를 필요 없음)
function setStatus(s){
  tempStatus=s;
  document.getElementById('sb-v').className='sts-btn'+(s==='visited'?' on-v':'');
  document.getElementById('sb-w').className='sts-btn'+(s==='wish'?' on-w':'');
  showStatusSection(s);

  const prevStatus = visits[activeRegion] ? visits[activeRegion].status : null;
  if(prevStatus===s){
    if(s==='wish') loadWishFormFields(); else renderRecordsInModal(activeRegion);
    return;
  }
  if(!visits[activeRegion]) visits[activeRegion]={};
  visits[activeRegion].status = s;
  if(s==='visited' && !visits[activeRegion].records) visits[activeRegion].records=[];
  saveVisits();
  document.getElementById('btn-del-rec').style.display='block';
  renderTravel(); drawDonuts(); renderCalendar();
  if(s==='wish') loadWishFormFields(); else renderRecordsInModal(activeRegion);
  if(s==='visited' && prevStatus!=='visited') checkBadge(getMapIdByRegionId(activeRegion));
}
function renderGallery(){
  const g=document.getElementById('photo-gallery');
  g.innerHTML = tempPhotos.map((p,i)=>`<div class="photo-item"><img src="${p}"><button class="photo-del" onclick="delPhoto(${i})">×</button></div>`).join('') + (tempPhotos.length<5 ? `<label class="photo-add-label" for="photo-inp">+</label>` : '');
}
function addPhotos(inp){
  const rem = 5 - tempPhotos.length; if (rem <= 0) return;
  const files = Array.from(inp.files).slice(0, rem); inp.value = '';
  function processNext(idx) {
    if (idx >= files.length) return;
    const r = new FileReader();
    r.onload = e => openCropModal(e.target.result, cropped => {
      resizeImg(cropped, res => { tempPhotos.push(res); renderGallery(); processNext(idx + 1); });
    }, () => processNext(idx + 1));
    r.readAsDataURL(files[idx]);
  }
  processNext(0);
}
function delPhoto(i){ tempPhotos.splice(i,1); renderGallery(); }
// 가고 싶어요(wish) 상태 전용 저장 (단일 메모)
function saveRecord(){
  visits[activeRegion]={ status:'wish', photos:tempPhotos, photo:tempPhotos[0]||null, date:document.getElementById('rec-date').value, tags:document.getElementById('rec-tags').value, memo:document.getElementById('rec-memo').value };
  saveVisits(); closeRecModal(); renderTravel(); drawDonuts(); renderCalendar(); showToast('저장되었습니다 ✓');
}

/* ── 방문 기록(records[]) 목록 렌더 & 작성/수정 모달 ── */
function renderRecordsInModal(id){
  const d = visits[id];
  const records = getRegionRecords(d);
  const list = document.getElementById('records-list');
  if(!records.length){
    list.innerHTML = '<div style="text-align:center;color:var(--text-sub);padding:20px 0;font-size:13px;line-height:1.6">아직 방문 기록이 없어요.<br>아래 버튼으로 첫 기록을 남겨보세요!</div>';
    return;
  }
  const sorted = records.slice().sort((a,b)=>(b.startDate||'').localeCompare(a.startDate||''));
  list.innerHTML = sorted.map(r=>{
    const photos = r.photos||[];
    const thumb = photos.length ? `<img class="rec-thumb" src="${photos[0]}">` : `<div class="rec-thumb-empty">📍</div>`;
    return `<div class="rec-row" onclick="openRecordForm('${r.id}')">${thumb}
      <div class="rec-info-row">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:4px">
          <span class="date">${getRecordDateLabel(r)}</span>
        </div>
        ${r.tags ? `<div style="font-size:11px;color:var(--primary);margin-top:2px">${r.tags}</div>` : ''}
        ${r.memo ? `<div class="memo">${r.memo}</div>` : ''}
      </div></div>`;
  }).join('');
}
function openRecordForm(recordId){
  editingRecordId = recordId || null;
  const d = visits[activeRegion];
  const rec = editingRecordId ? (d?.records||[]).find(r=>r.id===editingRecordId) : null;
  document.getElementById('record-form-title').textContent = rec ? '방문 기록 수정' : '새 방문 기록';
  rfPhotos = rec && rec.photos ? [...rec.photos] : [];
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('rf-start-date').value = rec ? rec.startDate : today;
  document.getElementById('rf-end-date').value = rec ? (rec.endDate||rec.startDate) : today;
  document.getElementById('rf-end-date').min = document.getElementById('rf-start-date').value;
  document.getElementById('rf-tags').value = rec ? (rec.tags||'') : '';
  document.getElementById('rf-memo').value = rec ? (rec.memo||'') : '';
  document.getElementById('rf-btn-delete').style.display = rec ? 'block' : 'none';
  renderRfGallery();
  document.getElementById('record-form-modal').classList.add('open');
}
function closeRecordForm(e){
  if(!e || e.target.id==='record-form-modal') document.getElementById('record-form-modal').classList.remove('open');
}
function syncRecordFormEndMin(){
  const start = document.getElementById('rf-start-date').value;
  const endInput = document.getElementById('rf-end-date');
  endInput.min = start;
  if(endInput.value && endInput.value < start) endInput.value = start;
}
function renderRfGallery(){
  const g = document.getElementById('rf-photo-gallery');
  g.innerHTML = rfPhotos.map((p,i)=>`<div class="photo-item"><img src="${p}"><button class="photo-del" onclick="delRfPhoto(${i})">×</button></div>`).join('') + (rfPhotos.length<5 ? `<label class="photo-add-label" for="rf-photo-inp">+</label>` : '');
}
function addRecordFormPhotos(inp){
  const rem = 5 - rfPhotos.length; if(rem<=0) return;
  const files = Array.from(inp.files).slice(0, rem); inp.value='';
  function processNext(idx){
    if(idx>=files.length) return;
    const r = new FileReader();
    r.onload = e => openCropModal(e.target.result, cropped => {
      resizeImg(cropped, res => { rfPhotos.push(res); renderRfGallery(); processNext(idx+1); });
    }, () => processNext(idx+1));
    r.readAsDataURL(files[idx]);
  }
  processNext(0);
}
function delRfPhoto(i){ rfPhotos.splice(i,1); renderRfGallery(); }
function saveRecordForm(){
  const startDate = document.getElementById('rf-start-date').value;
  let endDate = document.getElementById('rf-end-date').value;
  if(!startDate){ showToast('시작일을 입력해주세요'); return; }
  if(!endDate || endDate < startDate) endDate = startDate;
  const tags = document.getElementById('rf-tags').value;
  const memo = document.getElementById('rf-memo').value;

  const prevStatus = visits[activeRegion] ? visits[activeRegion].status : null;
  if(!visits[activeRegion]) visits[activeRegion] = { status:'visited', records:[] };
  visits[activeRegion].status = 'visited';
  if(!visits[activeRegion].records) visits[activeRegion].records = [];

  if(editingRecordId){
    const idx = visits[activeRegion].records.findIndex(r=>r.id===editingRecordId);
    if(idx>=0) visits[activeRegion].records[idx] = { id:editingRecordId, startDate, endDate, tags, memo, photos:rfPhotos };
  } else {
    visits[activeRegion].records.push({ id:genRecordId(), startDate, endDate, tags, memo, photos:rfPhotos });
  }
  saveVisits();
  closeRecordForm();
  document.getElementById('btn-del-rec').style.display='block';
  renderRecordsInModal(activeRegion);
  renderTravel(); drawDonuts(); renderCalendar();
  showToast('저장되었습니다 ✓');
  if(prevStatus!=='visited') checkBadge(getMapIdByRegionId(activeRegion));
}
function deleteRecordForm(){
  if(!editingRecordId) return;
  if(!confirm('이 기록을 삭제할까요?')) return;
  const d = visits[activeRegion];
  d.records = (d.records||[]).filter(r=>r.id!==editingRecordId);
  const regionRemoved = d.records.length===0;
  if(regionRemoved) delete visits[activeRegion]; // 기록이 0개가 되면 방문 취소 처리
  saveVisits();
  closeRecordForm();
  if(regionRemoved){ closeRecModal(); } else { renderRecordsInModal(activeRegion); }
  renderTravel(); drawDonuts(); renderCalendar();
  showToast('삭제되었습니다.');
}

/* ── 달성 배지 ── */
const BADGE_MILESTONES = [10,25,50,75,100];
const BADGE_INFO = {
  kr: {
    10:  {emoji:'🥉', title:'브론즈 여행가', desc:'한국 10% 달성 — 여행의 시작!', tier:'bronze'},
    25:  {emoji:'🥈', title:'실버 탐험가', desc:'한국 25% 달성 — 본격적인 탐험!', tier:'silver'},
    50:  {emoji:'🥇', title:'골드 모험가', desc:'한국 50% 달성 — 절반을 정복하다!', tier:'gold'},
    75:  {emoji:'💎', title:'다이아몬드 정복자', desc:'한국 75% 달성 — 거의 다 왔어요!', tier:'diamond'},
    100: {emoji:'👑', title:'챌린저 완전정복', desc:'한국 100% 달성 — 전설의 여행자!', tier:'challenger'},
  },
  seoul: {
    10:  {emoji:'🥉', title:'브론즈 서울러', desc:'서울 10% 달성 — 도심 탐험 시작!', tier:'bronze'},
    25:  {emoji:'🥈', title:'실버 서울러', desc:'서울 25% 달성 — 골목길 탐험가!', tier:'silver'},
    50:  {emoji:'🥇', title:'골드 서울러', desc:'서울 50% 달성 — 한강 너머까지!', tier:'gold'},
    75:  {emoji:'💎', title:'다이아몬드 서울러', desc:'서울 75% 달성 — 거의 다 왔어요!', tier:'diamond'},
    100: {emoji:'👑', title:'챌린저 서울 마스터', desc:'서울 100% 달성 — 서울의 주인!', tier:'challenger'},
  },
  jp: {
    10:  {emoji:'🥉', title:'브론즈 재패니즈', desc:'일본 10% 달성 — 일본 탐험 시작!', tier:'bronze'},
    25:  {emoji:'🥈', title:'실버 재패니즈', desc:'일본 25% 달성 — 섬나라 탐험가!', tier:'silver'},
    50:  {emoji:'🥇', title:'골드 재패니즈', desc:'일본 50% 달성 — 절반을 정복하다!', tier:'gold'},
    75:  {emoji:'💎', title:'다이아몬드 재패니즈', desc:'일본 75% 달성 — 거의 다 왔어요!', tier:'diamond'},
    100: {emoji:'👑', title:'챌린저 재팬 마스터', desc:'일본 100% 달성 — 일본 전역 정복!', tier:'challenger'},
  },
  world: {
    10:  {emoji:'🥉', title:'브론즈 글로벌', desc:'세계 10% 달성 — 세계 탐험 시작!', tier:'bronze'},
    25:  {emoji:'🥈', title:'실버 글로벌', desc:'세계 25% 달성 — 대륙 탐험가!', tier:'silver'},
    50:  {emoji:'🥇', title:'골드 글로벌', desc:'세계 50% 달성 — 절반의 세계!', tier:'gold'},
    75:  {emoji:'💎', title:'다이아몬드 글로벌', desc:'세계 75% 달성 — 거의 다 왔어요!', tier:'diamond'},
    100: {emoji:'👑', title:'챌린저 월드 마스터', desc:'세계 100% 달성 — 전 세계 정복!', tier:'challenger'},
  }
};
const BADGE_TIER_STYLES = {
  bronze:     {bg:'#cd7f32', shadow:'0 4px 12px rgba(205,127,50,0.3)', glow:'0 0 20px rgba(205,127,50,0.2)'},
  silver:     {bg:'#a0a0a0', shadow:'0 4px 12px rgba(160,160,160,0.3)', glow:'0 0 20px rgba(160,160,160,0.2)'},
  gold:       {bg:'#daa520', shadow:'0 4px 12px rgba(218,165,32,0.3)', glow:'0 0 20px rgba(218,165,32,0.2)'},
  diamond:    {bg:'#00bfff', shadow:'0 4px 12px rgba(0,191,255,0.3)', glow:'0 0 20px rgba(0,191,255,0.2)'},
  challenger: {bg:'#ff4757', shadow:'0 4px 12px rgba(255,71,87,0.3)', glow:'0 0 20px rgba(255,71,87,0.2)'},
};
function badgeKey(mapId){ return 'badge_achieved_' + mapId; }
function getMapIdByRegionId(id){
  if(id.startsWith('region_')) return 'kr';
  if(id.startsWith('seoul_')) return 'seoul';
  if(id.startsWith('JP-')) return 'jp';
  if(id.startsWith('wld_')) return 'world';
  return 'kr';
}
function checkBadge(mapId){
  const cfg = getMap(mapId); if(!cfg) return;
  const visited = Object.keys(visits).filter(id=>id.startsWith(cfg.prefix)&&visits[id].status==='visited').length;
  const pct = cfg.total > 0 ? Math.round(visited/cfg.total*100) : 0;
  const key = badgeKey(mapId);
  const achieved = JSON.parse(localStorage.getItem(key)||'[]');
  const infoMap = BADGE_INFO[mapId] || BADGE_INFO.kr;
  for(const ms of BADGE_MILESTONES){
    if(pct>=ms && !achieved.includes(ms)){
      achieved.push(ms);
      localStorage.setItem(key, JSON.stringify(achieved));
      showBadgeModal(infoMap[ms], pct);
      break;
    }
  }
}
function showBadgeModal(info, pct){
  const style = BADGE_TIER_STYLES[info.tier] || BADGE_TIER_STYLES.bronze;
  document.getElementById('badge-emoji').textContent = info.emoji;
  document.getElementById('badge-title').textContent = info.title;
  document.getElementById('badge-desc').textContent = info.desc;
  document.getElementById('badge-pct').textContent = pct+'%';
  document.getElementById('badge-tier-label').textContent = info.tier.toUpperCase();
  document.getElementById('badge-tier-label').style.background = style.bg;
  document.getElementById('badge-modal-content').style.boxShadow = style.glow;
  document.getElementById('badge-modal').classList.add('open');
}
function closeBadgeModal(){ document.getElementById('badge-modal').classList.remove('open'); }

/* ── 배지 모음 (통계 탭 인라인 렌더) ── */
let badgeFilter = 'kr';
function switchBadgeFilter(mapId){
  badgeFilter = mapId;
  ['kr','seoul','jp','world'].forEach(k=>{
    const btn = document.getElementById('bbf-'+k);
    if(btn) btn.classList.toggle('active', k===mapId);
  });
  renderBadgeList(mapId);
}
function renderBadgeList(mapId){
  mapId = mapId || badgeFilter || 'kr';
  const cfg = getMap(mapId);
  const key = badgeKey(mapId);
  const achieved = JSON.parse(localStorage.getItem(key)||'[]');
  const visited = cfg ? Object.keys(visits).filter(id=>id.startsWith(cfg.prefix)&&visits[id].status==='visited').length : 0;
  const pct = cfg && cfg.total > 0 ? Math.round(visited/cfg.total*100) : 0;
  const infoMap = BADGE_INFO[mapId] || BADGE_INFO.kr;

  let html = '<div class="badge-wall">';
  BADGE_MILESTONES.forEach(ms=>{
    const info = infoMap[ms];
    const got = achieved.includes(ms);
    const cls = got ? info.tier : info.tier + ' locked';
    html += `
      <div class="achievement" title="${info.desc}\n진행률: ${pct}% / ${ms}%">
        <div class="badge-hex ${cls}">${got ? info.emoji : '🔒'}</div>
        <span class="badge-title ${got ? 'earned' : ''}">${info.title}</span>
      </div>`;
  });
  html += '</div>';
  document.getElementById('badge-list-inline').innerHTML = html;
}
function deleteRecord(){
  if(!confirm('이 기록을 삭제할까요?')) return;
  const mid = getMapIdByRegionId(activeRegion);
  delete visits[activeRegion]; saveVisits(); closeRecModal(); renderTravel(); drawDonuts(); renderCalendar(); showToast('삭제되었습니다.');
}
function closeRecModal(e){ if(!e||e.target.id==='rec-modal') document.getElementById('rec-modal').classList.remove('open'); }

/* ── 프로필 관리 ── */
function updateProfileUI(){
  const nick = profile.nickname||'여정객';
  document.getElementById('my-nickname').textContent=nick;
  const av=document.getElementById('my-avatar');
  av.innerHTML = profile.avatar ? `<img src="${profile.avatar}">` : nick.charAt(0);
}
function openProfileEdit(){
  document.getElementById('edit-nick').value=profile.nickname||'';
  const av=document.getElementById('edit-avatar');
  av.innerHTML = profile.avatar ? `<img src="${profile.avatar}">` : (profile.nickname||'여').charAt(0);
  document.getElementById('prof-modal').classList.add('open');
}
function handleAvatar(inp){
  if(!inp.files||!inp.files[0]) return;
  const r=new FileReader();
  r.onload=e=>resizeImg(e.target.result, res=>{ profile.avatar=res; document.getElementById('edit-avatar').innerHTML=`<img src="${res}">`; });
  r.readAsDataURL(inp.files[0]);
}
function saveProfile(){
  profile.nickname=document.getElementById('edit-nick').value||'여정객';
  localStorage.setItem('user_profile', JSON.stringify(profile)); updateProfileUI(); closeProfModal(); showToast('프로필이 수정되었습니다.');
}
function closeProfModal(e){ if(!e||e.target.id==='prof-modal') document.getElementById('prof-modal').classList.remove('open'); }

/* ── 통계 및 최근 본 지역 ── */
function renderRecentViews(){
  const el = document.getElementById('recent-scroll');
  if(!recentViews.length){ el.innerHTML = '<div style="font-size:13px;color:var(--muted);padding:10px 16px 12px">아직 열어본 지역이 없어요.</div>'; return; }
  el.innerHTML = recentViews.map(item=>{
    const id = typeof item === 'string' ? item : item.id;
    const name = typeof item === 'string' ? getRegionName(id) : (item.name || getRegionName(id));
    const d = visits[id]; const photos = d?.photos || (d?.photo?[d.photo]:[]);
    const imgTag = photos.length ? `<img class="recent-tile-img" src="${photos[0]}">` : '';
    return `<div class="recent-chip" onclick="switchTab('travel');setTimeout(()=>openRecModal('${id}'),100)">
      <div class="recent-tile" style="height:45px;min-height:45px;width:80px;min-width:80px">
        ${imgTag}<span class="recent-tile-name">${name}</span>
      </div>
    </div>`;
  }).join('');
}
function closeModal(id, e){ if(!e || e.target.id===id) document.getElementById(id).classList.remove('open'); }
function openNoticeModal(){ document.getElementById('notice-modal').classList.add('open'); }
function openNotiSettings(){
  const NOTI_ITEMS = [{key:'travel', label:'여행 기록 알림', desc:'지역 방문 후 기록 유도 알림'},{key:'notice', label:'공지사항 알림', desc:'업데이트 및 중요 공지'},{key:'weekly', label:'주간 여행 리포트', desc:'매주 월요일 방문 통계 요약'}];
  document.getElementById('noti-list').innerHTML = NOTI_ITEMS.map(item=>`<div class="noti-row"><div><div style="font-size:14px;font-weight:700">${item.label}</div><div style="font-size:12px;color:var(--muted);margin-top:2px">${item.desc}</div></div><div class="toggle-track${notiSettings[item.key]?' on':''}" id="noti-${item.key}" onclick="toggleNoti('${item.key}')"><div class="toggle-thumb"></div></div></div>`).join('');
  document.getElementById('noti-modal').classList.add('open');
}
function toggleNoti(key){ notiSettings[key] = !notiSettings[key]; saveNoti(); document.getElementById('noti-'+key).classList.toggle('on', notiSettings[key]); }
function rateApp(){ showToast('응원해 주셔서 감사합니다! 더 좋은 여정을 만들겠습니다 🙏'); }
function reportBug(){
  const body = encodeURIComponent('앱 버전: v3.0.1\n\n[버그 또는 개선사항을 적어주세요]\n\n');
  const link = `mailto:gomin7734@gmail.com?subject=${encodeURIComponent('[여정] 버그신고/개선요청')}&body=${body}`;
  try{ window.open(link,'_self'); }catch(e){ showToast('gomin7734@gmail.com 으로 메일을 보내주세요.'); }
}
let statsFilter = 'kr';
function switchStatsFilter(id){
  statsFilter = id;
  ['kr','seoul','jp','world'].forEach(k=>{
    const btn = document.getElementById('sfb-'+k);
    const cw  = document.getElementById('cw-'+k);
    if(btn) btn.classList.toggle('active', k===id);
    if(cw)  cw.style.display = k===id ? '' : 'none';
  });
  drawDonuts();
}

function drawDonuts(){
  const data = {
    kr:    { visited: Object.keys(visits).filter(id=>id.startsWith('region_')&&visits[id].status==='visited').length, total:229,  color:'#29b6f6' },
    seoul: { visited: Object.keys(visits).filter(id=>id.startsWith('seoul_') &&visits[id].status==='visited').length, total:25,   color:'#5b8c5a' },
    jp:    { visited: Object.keys(visits).filter(id=>id.startsWith('JP-')    &&visits[id].status==='visited').length, total:47,   color:'#00acc1' },
    world: { visited: Object.keys(visits).filter(id=>id.startsWith('wld_')   &&visits[id].status==='visited').length, total:195,  color:'#1565c0' },
  };
  // 스토리탭 카드 통계 업데이트
  Object.entries(data).forEach(([k, d]) => {
    const bar = document.getElementById('smc-bar-'+k);
    const cnt = document.getElementById('smc-count-'+k);
    if(bar) bar.style.width = (d.total>0 ? (d.visited/d.total*100) : 0)+'%';
    if(cnt) cnt.textContent = `${d.visited} / ${d.total}`;
  });
  const d = data[statsFilter];
  if(!d) return;
  donut('ch-'+statsFilter, d.visited, d.total, d.color);
  const cc = document.getElementById('cc-'+statsFilter);
  if(cc) cc.textContent = `${d.visited} / ${d.total}개 방문`;
}
function donut(id,c,t,color){
  const el=document.getElementById(id); if(!el) return;
  const ctx=el.getContext('2d'); const pct=t>0?c/t:0;
  ctx.clearRect(0,0,100,100); ctx.lineWidth=10; ctx.lineCap='round';
  ctx.beginPath(); ctx.arc(50,50,38,0,Math.PI*2); ctx.strokeStyle='#eee'; ctx.stroke();
  if(pct>0){ ctx.beginPath(); ctx.arc(50,50,38,-Math.PI/2,-Math.PI/2+Math.PI*2*pct); ctx.strokeStyle=color; ctx.stroke(); }
  ctx.textAlign='center'; ctx.font='bold 15px -apple-system,sans-serif'; ctx.fillStyle='#14324d'; ctx.fillText(Math.round(pct*100)+'%',50,55);
}

/* ── 방문 통계 상세 모달 ── */
function openStatsDetail(mapId){
  const cfg = getMap(mapId); if(!cfg) return;
  const entries = Object.entries(visits).filter(([id,d])=>id.startsWith(cfg.prefix)&&d.status==='visited');
  const visited = entries.length;
  const pct = cfg.total > 0 ? Math.round(visited/cfg.total*100) : 0;

  document.getElementById('stats-detail-title').textContent = cfg.icon + ' ' + cfg.name + ' 방문 기록';
  document.getElementById('stats-detail-pct').textContent = pct + '%';
  document.getElementById('stats-detail-label').textContent = `${visited} / ${cfg.total}`;
  document.getElementById('stats-detail-summary').innerHTML = `
    <span>방문 지역</span><strong>${visited}개</strong>
    <span>전체 지역</span><strong>${cfg.total}개</strong>
    <span>달성률</span><strong>${pct}%</strong>`;

  // 방문한 지역 리스트 (최신 기록 순)
  const list = entries.map(([id,d])=>{
    const records = (d.records||[]).slice().sort((a,b)=>(b.startDate||'').localeCompare(a.startDate||''));
    const latest = records[0];
    const photo = latest?.photos?.[0] || (d.photos?.[0]) || (d.photo);
    const thumb = photo ? `<img class="sd-region-thumb" src="${photo}">` : `<div class="sd-region-thumb empty">📍</div>`;
    const dateLabel = latest ? getRecordDateLabel(latest) : '';
    const tags = latest?.tags ? `<span class="sd-tag">${latest.tags}</span>` : '';
    return `<div class="sd-region-item" onclick="closeStatsDetail();switchTab('travel');setTimeout(()=>openRecModal('${id}'),300)">
      ${thumb}
      <div class="sd-region-info">
        <div class="sd-region-name">${getRegionName(id)}</div>
        <div class="sd-region-meta">${dateLabel}${tags}</div>
      </div>
    </div>`;
  }).join('');

  document.getElementById('stats-detail-regions').innerHTML = list || '<div class="sd-empty">아직 방문한 지역이 없어요.</div>';

  document.getElementById('stats-detail-bg').classList.add('open');
  // canvas 사이즈 200x200에 맞춰 큰 도넛 그리기
  const canvas = document.getElementById('ch-detail');
  if(canvas){
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,200,200);
    ctx.lineWidth = 20; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(100,100,76,0,Math.PI*2); ctx.strokeStyle='#eee'; ctx.stroke();
    if(pct>0){ ctx.beginPath(); ctx.arc(100,100,76,-Math.PI/2,-Math.PI/2+Math.PI*2*(pct/100)); ctx.strokeStyle=cfg.color||'#29b6f6'; ctx.stroke(); }
  }
}
function closeStatsDetail(e){ if(!e || e.target.id==='stats-detail-bg' || e.target===document.getElementById('stats-detail-bg')) document.getElementById('stats-detail-bg').classList.remove('open'); }

/* ── 캘린더 ── */
function renderCalendar(){
  const y=calMonth.getFullYear(), m=calMonth.getMonth();
  document.getElementById('cal-title').textContent=`${y}년 ${m+1}월`;
  // 날짜별 방문 데이터 수집 (기간 전체를 마킹, 사진 포함)
  const vDates={};
  const MAX_RANGE_DAYS = 90; // 비정상적으로 긴 기간 방어용 상한선
  Object.values(visits).forEach(v=>{
    if(v.status!=='visited') return;
    (v.records||[]).forEach(r=>{
      if(!r.startDate) return;
      const start = new Date(r.startDate+'T00:00:00');
      const end = new Date((r.endDate||r.startDate)+'T00:00:00');
      if(isNaN(start.getTime())||isNaN(end.getTime())) return;
      let days = Math.round((end-start)/86400000)+1;
      if(days<1) days=1;
      if(days>MAX_RANGE_DAYS) days=MAX_RANGE_DAYS;
      for(let i=0;i<days;i++){
        const cur = new Date(start); cur.setDate(cur.getDate()+i);
        const ds = `${cur.getFullYear()}-${String(cur.getMonth()+1).padStart(2,'0')}-${String(cur.getDate()).padStart(2,'0')}`;
        if(!vDates[ds]) vDates[ds]={count:0, photo:null};
        vDates[ds].count++;
        if(!vDates[ds].photo && r.photos && r.photos[0]) vDates[ds].photo = r.photos[0];
      }
    });
  });
  const first=new Date(y,m,1).getDay(); const days=new Date(y,m+1,0).getDate();
  const now=new Date();
  const localToday=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const today=localToday;
  const dows=['일','월','화','수','목','금','토'];
  let html=dows.map(d=>`<div class="cal-dow">${d}</div>`).join('');
  for(let i=0;i<first;i++) html+='<div></div>';
  for(let d=1;d<=days;d++){
    const ds=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const info=vDates[ds], has=info?.count>0, isT=ds===today;
    const inner = has && info.photo
      ? `<img class="cal-photo-thumb" src="${info.photo}">`
      : has ? '<div class="cal-dot"></div>' : '';
    html+=`<div class="cal-day${isT?' today':''}${has?' has-visit':''}" onclick="showDayVisits('${ds}')"><span>${d}</span>${inner}</div>`;
  }
  document.getElementById('cal-grid').innerHTML=html;
}
function calPrev(){ calMonth.setMonth(calMonth.getMonth()-1); renderCalendar(); }
function calNext(){ calMonth.setMonth(calMonth.getMonth()+1); renderCalendar(); }
function showDayVisits(ds){
  const found=[];
  Object.entries(visits).forEach(([id,d])=>{
    if(d.status!=='visited') return;
    (d.records||[]).forEach(r=>{
      if(!r.startDate) return;
      const start=r.startDate, end=r.endDate||r.startDate;
      if(ds>=start && ds<=end) found.push({id, r});
    });
  });
  if(!found.length){ showToast('이 날 방문 기록이 없어요'); return; }
  openDayModal(ds, found);
}
function openDayModal(ds, found){
  const [y,mo,day] = ds.split('-');
  document.getElementById('day-modal-title').textContent = `${parseInt(mo)}월 ${parseInt(day)}일 방문 기록`;
  document.getElementById('day-modal-body').innerHTML = found.map(({id,r})=>{
    const name = getRegionName(id);
    const photos = r.photos||[];
    const mainPhoto = photos[0] ? `<img class="day-record-photo" src="${photos[0]}">` : `<div class="day-record-photo-empty">📍</div>`;
    return `<div class="day-record-item" onclick="closeDayModal();switchTab('travel');setTimeout(()=>openRecModal('${id}'),300)">
        ${mainPhoto}
        <div class="day-record-info">
          <div class="day-record-name">${name}</div>
          <div style="font-size:11px;color:var(--text-sub);margin-top:2px">${getRecordDateLabel(r)}</div>
          ${r.tags ? `<div style="font-size:12px;color:var(--primary);margin-top:2px">${r.tags}</div>` : ''}
          ${r.memo ? `<div class="day-record-memo">${r.memo}</div>` : ''}
        </div>
      </div>`;
  }).join('');
  document.getElementById('day-modal-bg').classList.add('open');
}
function closeDayModal(e){
  if(!e || e.target.id==='day-modal-bg') document.getElementById('day-modal-bg').classList.remove('open');
}

/* ── 링크 공유 ── */
async function shareLink(){
  const cfg = getMap(currentMap);
  if(!cfg){ showToast('지도를 선택해주세요'); return; }
  showToast('링크를 생성하는 중...');
  try{
    const result = await createShare(currentMap, visits, profile);
    showToast('링크로 공유합니다!');
    const txt = `${profile.nickname||'여정객'}님의 ${cfg.name} 지도를 공유합니다!`;
    if(navigator.share){
      await navigator.share({ title:'나의 여행 지도', text:txt, url:result.url });
    } else {
      await navigator.clipboard.writeText(result.url);
      showToast('링크가 복사되었습니다 ✓');
    }
  } catch(e){
    console.error(e);
    showToast('링크 생성 실패: '+e.message);
  }
}
function exportData(){
  try{ const url=URL.createObjectURL(new Blob([JSON.stringify(visits,null,2)],{type:'application/json'})); const a=document.createElement('a'); a.href=url; a.download='yeojeong_backup.json'; a.click(); URL.revokeObjectURL(url); showToast('백업 파일을 저장했습니다.'); }
  catch(e){ showToast('저장 실패: '+e.message); }
}

/* ── 타임라인 ── */
function renderTimeline(){
  const el = document.getElementById('timeline-list'); if(!el) return;
  const flat = [];
  Object.entries(visits).forEach(([id,d])=>{
    if(d.status!=='visited') return;
    (d.records||[]).forEach(r=>{
      if(r.startDate) flat.push({id, r});
    });
  });
  if(!flat.length){
    el.innerHTML='<div style="text-align:center;color:var(--muted);padding:24px 0;font-size:14px">아직 방문한 지역이 없어요</div>';
    return;
  }
  // 시작일 기준 그룹화
  const grouped = {};
  flat.forEach(({id,r})=>{
    if(!grouped[r.startDate]) grouped[r.startDate]=[];
    grouped[r.startDate].push({id,r});
  });
  el.innerHTML = Object.entries(grouped).sort((a,b)=>b[0].localeCompare(a[0])).map(([date, items], idx, arr)=>{
    const [y,mo,day] = date.split('-');
    const dateStr = `${y}년 ${parseInt(mo)}월 ${parseInt(day)}일`;
    const itemsHtml = items.map(({id,r})=>{
      const name = getRegionName(id);
      const photo = r.photos?.[0] || null;
      const mapCfg = allMaps().find(m=>id.startsWith(m.prefix));
      const mapLabel = mapCfg ? `<span class="badge">${mapCfg.icon} ${mapCfg.name}</span>` : '';
      const tags = r.tags ? `<span class="badge">${r.tags}</span>` : '';
      const rangeLabel = `<span class="badge">${getRecordDateLabel(r)}</span>`;
      return `
        <div class="timeline-card" onclick="switchTab('travel');setTimeout(()=>openRecModal('${id}'),300)" style="cursor:pointer">
          ${photo ? `<img src="${photo}" alt="${name}">` : ''}
          <div class="timeline-badges">${mapLabel}${rangeLabel}${tags}</div>
          <div class="timeline-title">${name}</div>
          ${r.memo ? `<div class="timeline-memo">${r.memo}</div>` : ''}
        </div>`;
    }).join('');
    const isLast = idx === arr.length - 1;
    return `
      <div class="timeline-item" style="margin-bottom:${isLast?'0':'24px'}">
        <div class="timeline-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
          </svg>
        </div>
        <div class="timeline-content">
          <div style="font-size:13px;font-weight:900;color:var(--primary);margin-bottom:8px">${dateStr}</div>
          ${itemsHtml}
        </div>
      </div>`;
  }).join('');
}
function resetData(){
  if(!confirm('모든 여행 기록이 삭제됩니다. 계속할까요?')) return;
  localStorage.removeItem('travel_v2');
  localStorage.removeItem(ONBOARD_KEY);
  localStorage.removeItem(TOUR_KEY);
  visits={}; renderTravel(); showToast('초기화되었습니다.');
}

/* ── 초기화 ── */
document.addEventListener('DOMContentLoaded', () => {
  loadAll();
  renderCalendar();
});
