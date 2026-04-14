/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   여행 탭 로직
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function goToMain(){
  document.getElementById('screen-splash').classList.remove('active');
  document.getElementById('screen-main').classList.add('active');
  document.getElementById('main-tab-bar').style.display = 'flex';
  renderTravel();
  shuffleRecs();
}

function switchTab(tab){
  document.querySelectorAll('.bottom-sheet').forEach(s=>s.classList.remove('open'));
  document.querySelectorAll('.bottom-sheet-bg').forEach(s=>s.classList.remove('open'));
  document.querySelectorAll('.tab-page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.tab-item').forEach(n=>n.classList.remove('active'));
  document.getElementById('tab-'+tab).classList.add('active');
  document.getElementById('nav-'+tab).classList.add('active');
  if(tab==='travel') renderTravel();
  if(tab==='stats'){ renderRecentViews(); drawDonuts(); renderCalendar(); }
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
      const photos = d.photos || (d.photo ? [d.photo] : []);
      if(photos.length > 0){
        const cid = 'c-'+p.id.replace(/[^a-z0-9]/gi,'-');
        const cp = document.createElementNS('http://www.w3.org/2000/svg','clipPath');
        cp.setAttribute('id', cid);
        const u = document.createElementNS('http://www.w3.org/2000/svg','use');
        u.setAttribute('href','#'+p.id);
        cp.appendChild(u); defs.appendChild(cp);
        const b = p.getBBox();
        const img = document.createElementNS('http://www.w3.org/2000/svg','image');
        img.setAttribute('class','mask-img');
        img.setAttribute('href', photos[0]);
        img.setAttribute('x',b.x); img.setAttribute('y',b.y);
        img.setAttribute('width',b.width); img.setAttribute('height',b.height);
        img.setAttribute('preserveAspectRatio','xMidYMid slice');
        img.setAttribute('clip-path','url(#'+cid+')');
        img.style.pointerEvents='none';
        svg.appendChild(img);
        p.style.fill='rgba(139,94,60,.15)';
      } else { p.style.fill='rgba(139,94,60,.5)'; }
      p.style.stroke='#8b5e3c'; p.style.strokeWidth=p.id.startsWith('seoul_')?'2':'0.5';
    } else if(d && d.status==='wish'){
      p.style.fill='transparent'; p.style.stroke='#2980b9'; p.style.strokeWidth=p.id.startsWith('seoul_')?'2':'1.5'; p.style.strokeDasharray='3,2';
    } else {
      p.style.fill='#e8dcc8'; p.style.stroke='#b0a090'; p.style.strokeWidth=p.id.startsWith('seoul_')?'1':'0.3';
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
  const all = Object.entries(visits).filter(([id])=>id.startsWith(cfg.prefix)).sort((a,b)=>(b[1].date||'').localeCompare(a[1].date||''));
  const show = showAll ? all : all.slice(0,5);
  const extra = all.length - 5;
  const btnMore = document.getElementById('btn-more');
  btnMore.style.display = all.length > 5 ? 'block' : 'none';
  btnMore.textContent = showAll ? '접기' : `더보기 (${extra}개)`;
  document.getElementById('record-list').innerHTML = show.map(([id,d])=>{
    const name = getRegionName(id);
    const photos = d.photos || (d.photo ? [d.photo] : []);
    const thumb = photos.length ? `<img class="rec-thumb" src="${photos[0]}">` : `<div class="rec-thumb-empty">${d.status==='wish'?'🔖':'📍'}</div>`;
    const tag = d.status==='wish' ? '<span style="font-size:11px;color:var(--wish);font-weight:700;">[가고 싶어요]</span>' : '';
    return `<div class="rec-row" onclick="openRecModal('${id}')">${thumb}
      <div class="rec-info-row">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:4px">
          <span class="name">${name}</span><span class="date">${d.date||''}</span>
        </div>
        ${tag}
        ${d.tags ? `<div style="font-size:11px;color:var(--primary);margin-top:2px">${d.tags}</div>` : ''}
        ${d.memo ? `<div class="memo">${d.memo}</div>` : ''}
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
  closeMapPicker(); resetZoom(); showAll=false; renderTravel();
}

/* ── 기록 관리 ── */
function openRecModal(id){
  activeRegion=id; const d=visits[id]||{status:'visited',photos:[],date:new Date().toISOString().split('T')[0],memo:'',tags:''};
  tempPhotos = d.photos ? [...d.photos] : (d.photo ? [d.photo] : []);
  tempStatus = d.status||'visited';
  document.getElementById('rec-title').textContent=getRegionName(id);
  document.getElementById('rec-date').value=d.date||'';
  document.getElementById('rec-tags').value=d.tags||'';
  document.getElementById('rec-memo').value=d.memo||'';
  document.getElementById('btn-del-rec').style.display=visits[id]?'block':'none';
  setStatus(tempStatus); renderGallery(); document.getElementById('rec-modal').classList.add('open');
  const regionName = getRegionName(id);
  recentViews = [{id, name: regionName}, ...recentViews.filter(v=>(typeof v==='string'?v:v.id)!==id)].slice(0,10);
  saveRecent();
}
function setStatus(s){
  tempStatus=s;
  document.getElementById('sb-v').className='sts-btn'+(s==='visited'?' on-v':'');
  document.getElementById('sb-w').className='sts-btn'+(s==='wish'?' on-w':'');
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
function saveRecord(){
  visits[activeRegion]={ status:tempStatus, photos:tempPhotos, photo:tempPhotos[0]||null, date:document.getElementById('rec-date').value, tags:document.getElementById('rec-tags').value, memo:document.getElementById('rec-memo').value };
  saveVisits(); closeRecModal(); renderTravel(); drawDonuts(); renderCalendar(); showToast('저장되었습니다 ✓');
}
function deleteRecord(){
  if(!confirm('이 기록을 삭제할까요?')) return;
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
  if(!recentViews.length){ el.innerHTML = '<div style="font-size:13px;color:var(--muted);padding:4px 0">아직 열어본 지역이 없어요.</div>'; return; }
  el.innerHTML = recentViews.map(item=>{
    const id = typeof item === 'string' ? item : item.id;
    const name = typeof item === 'string' ? getRegionName(id) : (item.name || getRegionName(id));
    const d = visits[id]; const photos = d?.photos || (d?.photo?[d.photo]:[]);
    const imgTag = photos.length ? `<img class="recent-tile-img" src="${photos[0]}">` : '';
    return `<div class="recent-chip" onclick="switchTab('travel');setTimeout(()=>openRecModal('${id}'),100)"><div class="recent-tile">${imgTag}<span class="recent-tile-name">${name}</span></div></div>`;
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
    kr:    { visited: Object.keys(visits).filter(id=>id.startsWith('region_')&&visits[id].status==='visited').length, total:229,  color:'#8b5e3c' },
    seoul: { visited: Object.keys(visits).filter(id=>id.startsWith('seoul_') &&visits[id].status==='visited').length, total:25,   color:'#5b8c5a' },
    jp:    { visited: Object.keys(visits).filter(id=>id.startsWith('JP-')    &&visits[id].status==='visited').length, total:47,   color:'#c19a6b' },
    world: { visited: Object.keys(visits).filter(id=>id.startsWith('wld_')   &&visits[id].status==='visited').length, total:195,  color:'#4a7fb5' },
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
  const ctx=document.getElementById(id).getContext('2d'); const pct=t>0?c/t:0;
  ctx.clearRect(0,0,100,100); ctx.lineWidth=10; ctx.lineCap='round';
  ctx.beginPath(); ctx.arc(50,50,38,0,Math.PI*2); ctx.strokeStyle='#eee'; ctx.stroke();
  if(pct>0){ ctx.beginPath(); ctx.arc(50,50,38,-Math.PI/2,-Math.PI/2+Math.PI*2*pct); ctx.strokeStyle=color; ctx.stroke(); }
  ctx.textAlign='center'; ctx.font='bold 15px -apple-system,sans-serif'; ctx.fillStyle='#3d2b1f'; ctx.fillText(Math.round(pct*100)+'%',50,55);
}

/* ── 캘린더 ── */
function renderCalendar(){
  const y=calMonth.getFullYear(), m=calMonth.getMonth();
  document.getElementById('cal-title').textContent=`${y}년 ${m+1}월`;
  // 날짜별 방문 데이터 수집 (사진 포함)
  const vDates={};
  Object.values(visits).forEach(v=>{
    if(v.date && v.status==='visited'){
      if(!vDates[v.date]) vDates[v.date]={count:0, photo:null};
      vDates[v.date].count++;
      if(!vDates[v.date].photo && (v.photos?.[0] || v.photo)) vDates[v.date].photo = v.photos?.[0] || v.photo;
    }
  });
  const first=new Date(y,m,1).getDay(); const days=new Date(y,m+1,0).getDate();
  const today=new Date().toISOString().split('T')[0]; const dows=['일','월','화','수','목','금','토'];
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
  const found=Object.entries(visits).filter(([,v])=>v.date===ds&&v.status==='visited');
  if(!found.length){ showToast('이 날 방문 기록이 없어요'); return; }
  showToast('📍 '+found.map(([id])=>getRegionName(id)).join(', '));
}

/* ── 기타 ── */
function shareMap(){
  if(typeof html2canvas==='undefined'){ showToast('공유 기능 로딩 중...'); return; }
  showToast('지도를 캡처하는 중...');
  html2canvas(mapArea,{useCORS:true,logging:false}).then(canvas=>{
    canvas.toBlob(blob=>{
      const file=new File([blob],'my_map.png',{type:'image/png'});
      const cfg=getMap(currentMap);
      const visited=Object.keys(visits).filter(id=>id.startsWith(cfg.prefix)&&visits[id].status==='visited').length;
      const txt=`나의 ${cfg.name} 여행 ${visited}/${cfg.total} 완료! #여정앱`;
      if(navigator.share){ navigator.share({files:[file],title:'나의 여행 지도',text:txt}).catch(()=>{}); }
      else { const a=document.createElement('a'); a.href=canvas.toDataURL(); a.download='my_map.png'; a.click(); showToast('이미지가 저장되었습니다.'); }
    });
  });
}
function exportData(){
  try{ const url=URL.createObjectURL(new Blob([JSON.stringify(visits,null,2)],{type:'application/json'})); const a=document.createElement('a'); a.href=url; a.download='yeojeong_backup.json'; a.click(); URL.revokeObjectURL(url); showToast('백업 파일을 저장했습니다.'); }
  catch(e){ showToast('저장 실패: '+e.message); }
}
function resetData(){
  if(!confirm('모든 여행 기록이 삭제됩니다. 계속할까요?')) return;
  localStorage.removeItem('travel_v2'); visits={}; renderTravel(); showToast('초기화되었습니다.');
}

/* ── 초기화 ── */
document.addEventListener('DOMContentLoaded', () => {
  loadAll();
  renderCalendar();
});
