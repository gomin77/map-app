/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   소셜 로그인 (Firebase Google & Kakao) + 클라우드 동기화
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
async function doGoogleLogin() {
  try {
    showToast('구글 로그인 시도 중...');
    const auth = window.Capacitor.Plugins.FirebaseAuthentication;
    if (!auth) throw new Error('Firebase 플러그인이 로드되지 않았습니다.');

    const result = await auth.signInWithGoogle();
    const user = result.user;
    const idToken = result.credential?.idToken || '';

    // UID 설정 및 클라우드 동기화
    const uid = user.uid;
    setCurrentUserId(uid);
    if (typeof setAnalyticsUser === 'function') setAnalyticsUser(uid);
    if (typeof trackEvent === 'function') trackEvent('login', { method: 'google' });

    // Firestore JS SDK도 실제로 인증되어야 보안 규칙을 통과함 (네이티브 로그인과 별개 세션)
    await signInToFirestoreAuth(idToken);

    profile.nickname = user.displayName || '여정객';
    profile.avatar = user.photoURL || user.photoUrl || null;
    saveProfile();
    if (typeof updateProfileUI === 'function') updateProfileUI();

    // 클라우드에서 데이터 복원
    await syncFromCloud(uid);
    if (typeof refreshPartnerUid === 'function') await refreshPartnerUid(uid).catch(()=>{});

    await sendTokenToServer(idToken, 'google');
    
    showToast(`${profile.nickname}님, 환영합니다!`);
    if (typeof goToMain === 'function') goToMain();
    if (typeof updateCoupleToggleVisibility === 'function') updateCoupleToggleVisibility();
  } catch (e) {
    console.error('Google Login Error:', e);
    showToast('구글 로그인에 실패했습니다: ' + (e.message || ''));
  }
}

async function doKakaoLogin() {
  try {
    showToast('카카오 로그인 시도 중...');
    const KakaoLogin = window.Capacitor?.Plugins?.KakaoLogin;
    if (!KakaoLogin) throw new Error('카카오 플러그인이 로드되지 않았습니다.');

    // login()이 내부적으로 getUserInfo()까지 자동 호출하여 반환
    const result = await KakaoLogin.login();
    console.log('Kakao login result:', JSON.stringify(result));

    // 플러그인이 login() 결과에 사용자 정보를 포함해서 반환
    const kakaoId   = result.id?.toString() || ('kakao_' + Date.now());
    const nickname  = result.nickname || '여정객';
    const avatar    = result.profileImageUrl || null;

    // 카카오는 Firebase 정식 로그인 수단이 아니므로, 익명 인증으로 Firestore 접근 권한을 확보.
    // 보안 규칙(request.auth.uid 일치 검사) 통과를 위해, 이후 모든 클라우드 작업은
    // kakaoId가 아니라 이 익명 인증 uid를 "앱의 uid"로 그대로 사용한다.
    const fbUid = await signInToFirestoreAuth(null, kakaoId);
    const uid = fbUid || kakaoId; // firebase.auth 로드 실패 시에만 kakaoId로 폴백 (클라우드 동기화는 안 될 수 있음)

    setCurrentUserId(uid);
    if (typeof setAnalyticsUser === 'function') setAnalyticsUser(uid);
    if (typeof trackEvent === 'function') trackEvent('login', { method: 'kakao' });
    profile.nickname = nickname;
    profile.avatar   = avatar;
    saveProfile();
    if (typeof updateProfileUI === 'function') updateProfileUI();

    await syncFromCloud(uid);
    if (typeof refreshPartnerUid === 'function') await refreshPartnerUid(uid).catch(()=>{});
    showToast(`${profile.nickname}님, 환영합니다!`);
    if (typeof goToMain === 'function') goToMain();
    if (typeof updateCoupleToggleVisibility === 'function') updateCoupleToggleVisibility();
  } catch (e) {
    console.error('Kakao Login Error:', JSON.stringify(e));
    showToast('카카오 오류: ' + (e.message || e.code || JSON.stringify(e)));
  }
}

// Firestore 보안 규칙 통과를 위해 JS SDK(firebase.auth())에도 실제 인증 세션을 만든다.
// - Google: 네이티브 로그인에서 받은 idToken으로 동일한 Firebase 계정에 로그인 → uid가 그대로 일치
// - Kakao(idToken 없음): Firebase 정식 제공자가 아니므로 익명 로그인으로 세션만 확보.
//   단, 익명 로그인 uid는 매번 랜덤이라 앱이 쓰는 kakaoId와 다르면 보안 규칙(uid 일치 검사)을 통과 못 함.
//   → 반환값(firebase 인증 uid)을 앱의 실제 uid로 그대로 사용해야 함 (아래 doKakaoLogin 참고)
//   → 같은 카카오 계정이 재로그인할 때는 기존 익명 세션을 재사용해 클라우드 데이터 연속성을 유지하고,
//     다른 카카오 계정으로 바뀌면 새 익명 세션을 만들어 계정 간 데이터가 섞이지 않게 한다.
async function signInToFirestoreAuth(idToken, kakaoAccountId) {
  try {
    if (typeof firebase === 'undefined' || !firebase.auth) {
      console.warn('firebase.auth 미로드 - Firestore 인증 스킵');
      return null;
    }
    if (idToken) {
      const credential = firebase.auth.GoogleAuthProvider.credential(idToken);
      const cred = await firebase.auth().signInWithCredential(credential);
      return cred.user.uid;
    }
    if (kakaoAccountId) {
      const lastKakaoId = localStorage.getItem('last_kakao_id');
      const cur = firebase.auth().currentUser;
      if (cur && cur.isAnonymous && lastKakaoId === kakaoAccountId) {
        // 같은 카카오 계정 재로그인 → 기존 익명 세션(=클라우드 데이터) 재사용
        return cur.uid;
      }
      // 다른 카카오 계정이거나 최초 로그인 → 새 익명 세션 생성 (계정 간 데이터 혼선 방지)
      if (cur) { try { await firebase.auth().signOut(); } catch (e) {} }
      const cred = await firebase.auth().signInAnonymously();
      localStorage.setItem('last_kakao_id', kakaoAccountId);
      return cred.user.uid;
    }
    return firebase.auth().currentUser?.uid || null;
  } catch (e) {
    console.error('Firestore 인증 실패 (클라우드 동기화가 동작하지 않을 수 있음):', e.code || e.message);
    return null;
  }
}

async function sendTokenToServer(token, provider) {
  if (BACKEND_URL.includes('yourserver.com')) {
    console.log(`[Mock] ${provider} 토큰 서버 전송:`, token.substring(0, 20) + '...');
    return;
  }
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/social`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, provider })
    });
    if (!response.ok) throw new Error('서버 인증 실패');
    const data = await response.json();
  } catch (e) {
    console.error('Server Auth Error:', e);
    throw e;
  }
}

async function doLogout() {
  if (!confirm('로그아웃 하시겠습니까?')) return;

  try {
    // 로그아웃 전 마지막 동기화
    const uid = getCurrentUserId();
    if (uid) {
      try { await uploadData(uid, visits, profile); }
      catch (e) { console.error('Logout - uploadData 실패:', e); }
    }

    try {
      const auth = window.Capacitor.Plugins.FirebaseAuthentication;
      if (auth) await auth.signOut();
    } catch (e) { console.error('Logout - FirebaseAuthentication.signOut 실패:', e); }

    try {
      // 익명 세션(카카오)은 로그아웃해도 유지해야 같은 카카오 계정 재로그인 시
      // 클라우드 데이터 연속성이 보존된다 (signInToFirestoreAuth의 재사용 로직 참고).
      // Google 등 실제 계정으로 로그인된 세션만 명시적으로 로그아웃한다.
      if (typeof firebase !== 'undefined' && firebase.auth && firebase.auth().currentUser && !firebase.auth().currentUser.isAnonymous) {
        await firebase.auth().signOut();
      }
    } catch (e) { console.error('Logout - firebase.auth().signOut 실패:', e); }

    try {
      const KakaoLogin = window.Capacitor.Plugins.KakaoLogin;
      if (KakaoLogin) await KakaoLogin.logout();
    } catch (e) { console.error('Logout - KakaoLogin.logout 실패:', e); }

    // UID 초기화
    setCurrentUserId(null);
    if (typeof setAnalyticsUser === 'function') setAnalyticsUser(null);
    // 커플 연동 상태 초기화 (다음 로그인 사용자와 섞이지 않도록)
    localStorage.removeItem('partner_uid');
    localStorage.removeItem('partner_nickname');
    togetherMode = false; partnerVisits = null; partnerProfile = null;
    if (typeof stopListenForPairAccept === 'function') stopListenForPairAccept();

    showToast('로그아웃 되었습니다.');
    // reload 대신 로그인 화면으로만 전환 (네이티브 광고 배너 중복 생성 방지)
    if (typeof goToLogin === 'function') goToLogin();
    else location.reload();
  } catch (e) {
    console.error('Logout Error:', e, e?.message, e?.code);
    showToast('로그아웃 중 오류가 발생했습니다.');
  }
}
