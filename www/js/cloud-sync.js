/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Firebase Firestore 클라우드 동기화
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

// Firebase 설정 (google-services.json 기반)
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCivnI_Tx2S_zrAvj3I6VIcLZi3gtPaShc",
  authDomain: "journey-6e8a0.firebaseapp.com",
  projectId: "journey-6e8a0",
  storageBucket: "journey-6e8a0.firebasestorage.app",
  messagingSenderId: "669464241658",
  appId: "1:669464241658:web:226cbf47523f4f4e91f043"
};

// Firebase 초기화
let firebaseApp = null;
let db = null;
let currentUserId = null;

function initCloud() {
  if (typeof firebase === 'undefined') {
    console.warn('Firebase SDK not loaded');
    return false;
  }
  if (!firebaseApp) {
    firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.firestore();
    console.log('Firebase initialized');
  }
  return true;
}

// 사진(base64)을 Firestore 서브컬렉션에 기록 단위로 저장 (문서당 1MB 제한 회피용, Storage 유료 이슈 없이 무료로 백업)
async function savePhotosToCloud(uid, keyId, regionId, photos) {
  if (!db || !photos || !photos.length) return;
  try {
    await db.collection('users').doc(uid).collection('photos').doc(keyId).set({ regionId, photos });
  } catch (e) {
    console.error('Photo backup failed:', keyId, e);
  }
}

async function deleteCloudPhotos(uid, keyId) {
  if (!db) return;
  try {
    await db.collection('users').doc(uid).collection('photos').doc(keyId).delete();
  } catch (e) {
    console.error('Photo delete failed:', keyId, e);
  }
}

// 사용자의 사진 서브컬렉션 전체를 읽어 {keyId: photos[]} 맵으로 반환
async function loadAllCloudPhotos(uid) {
  if (!db) return {};
  try {
    const snap = await db.collection('users').doc(uid).collection('photos').get();
    const map = {};
    snap.forEach(doc => { map[doc.id] = doc.data().photos || []; });
    return map;
  } catch (e) {
    console.error('Photo load failed:', e);
    return {};
  }
}

// 현재 로그인 UID 설정 (localStorage에 저장해 재실행 시 로그인 상태 유지)
function setCurrentUserId(uid) {
  currentUserId = uid;
  initCloud();
  if (uid) {
    localStorage.setItem('auth_uid', uid);
  } else {
    localStorage.removeItem('auth_uid');
  }
}

function getCurrentUserId() {
  return currentUserId;
}

// 앱 재시작 시 Firebase Auth(JS SDK)가 이전 로그인 세션을 복원할 시간을 기다린다.
// (복원 전에 Firestore를 호출하면 미인증 상태로 permission-denied가 날 수 있음)
function waitForFirebaseAuthReady(timeoutMs = 3000) {
  return new Promise((resolve) => {
    if (typeof firebase === 'undefined' || !firebase.auth) return resolve(null);
    let done = false;
    const timer = setTimeout(() => { if (!done) { done = true; resolve(firebase.auth().currentUser || null); } }, timeoutMs);
    const unsub = firebase.auth().onAuthStateChanged((user) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (typeof unsub === 'function') unsub();
      resolve(user);
    });
  });
}

// 클라우드에 데이터 업로드
async function uploadData(uid, visitsData, profileData) {
  if (!initCloud() || !uid) return false;

  try {
    // Firestore 메인 문서에는 메타데이터만 저장(용량 제한 회피), 사진은 서브컬렉션에 기록 단위로 별도 저장
    const visitsForCloud = {};
    for (const [id, data] of Object.entries(visitsData || {})) {
      if (data.status === 'visited') {
        const records = [];
        for (const r of (data.records || [])) {
          const photos = r.photos || [];
          if (photos.length) {
            await savePhotosToCloud(uid, r.id, id, photos);
          } else {
            await deleteCloudPhotos(uid, r.id);
          }
          records.push({
            id: r.id,
            startDate: r.startDate || '',
            endDate: r.endDate || r.startDate || '',
            tags: r.tags || '',
            memo: r.memo || '',
            photoCount: photos.length,
            shared: r.shared !== false
          });
        }
        visitsForCloud[id] = { status: 'visited', records, coverPhoto: data.coverPhoto || null };
      } else {
        const photosArr = data.photos || (data.photo ? [data.photo] : []);
        const wishKey = 'wish_' + id;
        if (photosArr.length) {
          await savePhotosToCloud(uid, wishKey, id, photosArr);
        } else {
          await deleteCloudPhotos(uid, wishKey);
        }
        visitsForCloud[id] = {
          status: data.status,
          date: data.date || '',
          memo: data.memo || '',
          tags: data.tags || '',
          photoCount: photosArr.length,
          shared: data.shared !== false
        };
      }
    }

    const docData = {
      visits: visitsForCloud,
      profile: {
        nickname: profileData?.nickname || '여정객',
        avatar: profileData?.avatar || null
      },
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    await db.collection('users').doc(uid).set(docData, { merge: true });
    console.log('Cloud sync success:', uid);
    return true;
  } catch (e) {
    console.error('Cloud upload failed:', e);
    return false;
  }
}

// 클라우드에서 데이터 다운로드
async function downloadData(uid) {
  if (!initCloud() || !uid) return null;
  
  try {
    const doc = await db.collection('users').doc(uid).get();
    if (!doc.exists) {
      console.log('No cloud data for:', uid);
      return null;
    }

    const data = doc.data();
    console.log('Cloud data loaded:', uid);
    
    return {
      visits: data.visits || {},
      profile: data.profile || null,
      updatedAt: data.updatedAt?.toDate?.() || null
    };
  } catch (e) {
    console.error('Cloud download failed:', e);
    return null;
  }
}

// 클라우드 데이터를 로컬에 병합
async function syncFromCloud(uid) {
  const cloudData = await downloadData(uid);
  if (!cloudData) return false;

  // 프로필 복원
  if (cloudData.profile) {
    profile = { ...profile, ...cloudData.profile };
    saveProfile();
    updateProfileUI();
  }

  // 기록 단위로 백업된 사진들을 함께 조회 (Firestore 서브컬렉션)
  const photoMap = await loadAllCloudPhotos(uid);

  // visits 병합 (순환 호출 방지: saveVisits 직접 호출 안 함)
  let hasChanges = false;
  Object.entries(cloudData.visits || {}).forEach(([id, cloudVisit]) => {
    const localVisit = visits[id];
    if (cloudVisit.status === 'visited') {
      // records[]는 id 기준 합집합 병합: 로컬에 없는 클라우드 record만 추가 (사진은 백업본으로 복원)
      if (!localVisit || localVisit.status !== 'visited') {
        const records = (cloudVisit.records || []).map(r => ({ ...r, photos: photoMap[r.id] || [] }));
        if (records.length) {
          visits[id] = { status: 'visited', records, coverPhoto: cloudVisit.coverPhoto || null };
          hasChanges = true;
        }
      } else {
        const localIds = new Set((localVisit.records || []).map(r => r.id));
        const missing = (cloudVisit.records || []).filter(r => r.id && !localIds.has(r.id));
        if (missing.length) {
          if (!localVisit.records) localVisit.records = [];
          missing.forEach(r => localVisit.records.push({ ...r, photos: photoMap[r.id] || [] }));
          hasChanges = true;
        }
        if (!localVisit.coverPhoto && cloudVisit.coverPhoto) {
          localVisit.coverPhoto = cloudVisit.coverPhoto;
          hasChanges = true;
        }
      }
    } else if (!localVisit || (cloudVisit.date && (!localVisit.date || cloudVisit.date > localVisit.date))) {
      visits[id] = {
        ...cloudVisit,
        photos: (localVisit?.photos?.length ? localVisit.photos : photoMap['wish_' + id]) || [],
        photo: localVisit?.photo || null
      };
      hasChanges = true;
    }
  });

  if (hasChanges) {
    // 순환 방지: localStorage만 직접 저장, autoSyncToCloud 호출하지 않음
    localStorage.setItem('travel_v2', JSON.stringify(visits));
    if (typeof renderTravel === 'function') renderTravel();
    if (typeof drawDonuts === 'function') drawDonuts();
    if (typeof renderCalendar === 'function') renderCalendar();
    showToast('이전 기록을 복원했습니다 ✓');
  }

  return true;
}

// 자동 동기화 (saveVisits에서 호출) - 순환 방지 플래그 포함
let _isSyncing = false;
function autoSyncToCloud() {
  if (_isSyncing) return;
  const uid = getCurrentUserId();
  if (!uid) return;
  _isSyncing = true;
  uploadData(uid, visits, profile)
    .catch(console.error)
    .finally(() => { _isSyncing = false; });
}

/* ── 공유 기능 ── */
function genShareId() {
  return Math.random().toString(36).slice(2, 10);
}

async function createShare(mapId, visitsData, profileData) {
  if (!initCloud()) throw new Error('Firebase 초기화 실패');
  const cfg = allMaps().find(m => m.id === mapId);
  const prefix = cfg ? cfg.prefix : '';
  const filtered = {};
  Object.entries(visitsData || {}).forEach(([id, data]) => {
    if (!id.startsWith(prefix)) return;
    filtered[id] = {
      status: data.status,
      date: data.date || '',
      memo: data.memo || '',
      tags: data.tags || ''
    };
  });
  const visitedCount = Object.values(filtered).filter(v => v.status === 'visited').length;
  const totalCount = cfg ? cfg.total : 0;
  const shareId = genShareId();
  await db.collection('shares').doc(shareId).set({
    mapId,
    mapName: cfg ? cfg.name : mapId,
    visits: filtered,
    profile: { nickname: profileData?.nickname || '여정객' },
    visitedCount,
    totalCount,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  return {
    shareId,
    url: 'https://gomin77.github.io/map-app/share.html?id=' + shareId
  };
}

async function loadShare(shareId) {
  if (!initCloud()) throw new Error('Firebase 초기화 실패');
  const doc = await db.collection('shares').doc(shareId).get();
  if (!doc.exists) return null;
  return doc.data();
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   커플(애인) 지도 연동
   - users 문서는 "자기 자신"만 write 가능해야 하므로(보안 규칙),
     커플 관계는 users 문서가 아니라 별도의 pairs/{uidA_uidB} 공유 문서로 표현한다.
   - pairs 문서는 둘 중 누구든 read/delete(연동 해제) 할 수 있어 비대칭(한쪽만 끊김) 문제가 없다.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function getPartnerUid() {
  return localStorage.getItem('partner_uid') || null;
}
function getPartnerNickname() {
  return localStorage.getItem('partner_nickname') || '애인';
}

// pairs 컬렉션에서 내 연동 정보를 조회해 로컬 캐시(localStorage)에 반영
async function getPairInfo(myUid) {
  if (!initCloud() || !myUid) return null;
  try {
    const [qa, qb] = await Promise.all([
      db.collection('pairs').where('uidA', '==', myUid).limit(1).get(),
      db.collection('pairs').where('uidB', '==', myUid).limit(1).get()
    ]);
    const doc = !qa.empty ? qa.docs[0] : (!qb.empty ? qb.docs[0] : null);
    if (!doc) {
      localStorage.removeItem('partner_uid');
      localStorage.removeItem('partner_nickname');
      return null;
    }
    const d = doc.data();
    const partnerUid = d.uidA === myUid ? d.uidB : d.uidA;
    const partnerNickname = (d.uidA === myUid ? d.nicknameB : d.nicknameA) || '애인';
    localStorage.setItem('partner_uid', partnerUid);
    localStorage.setItem('partner_nickname', partnerNickname);
    return { partnerUid, partnerNickname, pairDocId: doc.id };
  } catch (e) {
    console.error('getPairInfo failed:', e);
    return null;
  }
}

// 로그인/설정 화면 진입 시 호출해 연동 상태를 최신화 (반환값: partnerUid 또는 null)
async function refreshPartnerUid(uid) {
  const info = await getPairInfo(uid);
  return info ? info.partnerUid : null;
}

function genPairCode() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

// A: 초대 코드 생성
async function createPairInvite(uid, nickname) {
  if (!initCloud() || !uid) throw new Error('Firebase 초기화 실패');
  const code = genPairCode();
  await db.collection('invites').doc(code).set({
    fromUid: uid,
    fromNickname: nickname || '여정객',
    status: 'pending',
    acceptedBy: null,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  return code;
}

// B: 코드 입력하여 수락 → 둘 다 읽고 지울 수 있는 공유 pairs 문서를 B가 생성
async function acceptPairInvite(code, myUid, myNickname) {
  if (!initCloud() || !myUid) throw new Error('Firebase 초기화 실패');
  const normCode = (code || '').trim().toUpperCase();
  if (!normCode) throw new Error('코드를 입력해주세요');
  const ref = db.collection('invites').doc(normCode);
  const snap = await ref.get();
  if (!snap.exists) throw new Error('유효하지 않은 코드예요');
  const inv = snap.data();
  if (inv.status !== 'pending') throw new Error('이미 사용되었거나 만료된 코드예요');
  if (inv.fromUid === myUid) throw new Error('자기 자신의 코드는 사용할 수 없어요');
  const pairId = inv.fromUid + '_' + myUid;
  await db.collection('pairs').doc(pairId).set({
    uidA: inv.fromUid,
    uidB: myUid,
    nicknameA: inv.fromNickname || '여정객',
    nicknameB: myNickname || '여정객',
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  await ref.update({ status: 'accepted', acceptedBy: myUid });
  localStorage.setItem('partner_uid', inv.fromUid);
  localStorage.setItem('partner_nickname', inv.fromNickname || '애인');
  return inv.fromNickname || '애인';
}

// A: 코드 생성 후 상대방의 수락을 실시간으로 감지 (같은 자리에서 바로 연동되는 UX용)
let _pairListenUnsub = null;
function listenForPairAccept(code, myUid, onAccepted) {
  if (!initCloud()) return;
  stopListenForPairAccept();
  _pairListenUnsub = db.collection('invites').doc(code).onSnapshot((snap) => {
    if (!snap.exists) return;
    const inv = snap.data();
    if (inv.status === 'accepted' && inv.acceptedBy) {
      stopListenForPairAccept();
      getPairInfo(myUid).then(() => {
        if (typeof onAccepted === 'function') onAccepted(inv.acceptedBy);
      });
    }
  });
}
function stopListenForPairAccept() {
  if (_pairListenUnsub) { _pairListenUnsub(); _pairListenUnsub = null; }
}

// 연동 해제: 공유 pairs 문서를 삭제 (둘 중 누구든 삭제 가능 → 양쪽 모두 즉시 접근 차단됨)
async function unpairPartner(myUid) {
  if (!initCloud() || !myUid) return;
  const info = await getPairInfo(myUid);
  if (info && info.pairDocId) {
    await db.collection('pairs').doc(info.pairDocId).delete();
  }
  localStorage.removeItem('partner_uid');
  localStorage.removeItem('partner_nickname');
}

// 애인의 visits/프로필을 읽기 전용으로 다운로드 (사진 서브컬렉션 포함)
async function downloadPartnerData(partnerUid) {
  if (!initCloud() || !partnerUid) return null;
  try {
    const doc = await db.collection('users').doc(partnerUid).get();
    if (!doc.exists) return { visits: {}, profile: null };
    const data = doc.data();
    const photoMap = await loadAllCloudPhotos(partnerUid);
    const result = {};
    Object.entries(data.visits || {}).forEach(([id, v]) => {
      if (v.status === 'visited') {
        // 공유 설정된 기록만 애인에게 노출 (원하는 기록만 동기화)
        const sharedRecords = (v.records || []).filter(r => r.shared !== false);
        if (!sharedRecords.length) return;
        const records = sharedRecords.map(r => ({ ...r, photos: photoMap[r.id] || [] }));
        result[id] = { status: 'visited', records, coverPhoto: v.coverPhoto || null };
      } else {
        if (v.shared === false) return;
        result[id] = { ...v, photos: photoMap['wish_' + id] || [] };
      }
    });
    return { visits: result, profile: data.profile || null };
  } catch (e) {
    console.error('downloadPartnerData failed:', e);
    return null;
  }
}
