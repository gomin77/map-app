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

// 현재 로그인 UID 설정
function setCurrentUserId(uid) {
  currentUserId = uid;
  initCloud();
}

function getCurrentUserId() {
  return currentUserId;
}

// 클라우드에 데이터 업로드
async function uploadData(uid, visitsData, profileData) {
  if (!initCloud() || !uid) return false;
  
  try {
    // 사진은 용량 문제로 제외하고 메타데이터만 저장
    const visitsForCloud = {};
    Object.entries(visitsData || {}).forEach(([id, data]) => {
      visitsForCloud[id] = {
        status: data.status,
        date: data.date,
        memo: data.memo || '',
        tags: data.tags || '',
        photoCount: (data.photos || (data.photo ? [data.photo] : [])).length,
        // 사진 자체는 저장하지 않음 (로컬에만 유지)
      };
    });

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

  // visits 병합 (순환 호출 방지: saveVisits 직접 호출 안 함)
  let hasChanges = false;
  Object.entries(cloudData.visits || {}).forEach(([id, cloudVisit]) => {
    const localVisit = visits[id];
    if (!localVisit || (cloudVisit.date && (!localVisit.date || cloudVisit.date > localVisit.date))) {
      visits[id] = {
        ...cloudVisit,
        photos: localVisit?.photos || [],
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
