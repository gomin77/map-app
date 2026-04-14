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

    profile.nickname = user.displayName || '여정객';
    profile.avatar = user.photoURL || user.photoUrl || null;
    saveProfile();
    if (typeof updateProfileUI === 'function') updateProfileUI();

    // 클라우드에서 데이터 복원
    await syncFromCloud(uid);

    await sendTokenToServer(idToken, 'google');
    
    showToast(`${profile.nickname}님, 환영합니다!`);
    if (typeof goToMain === 'function') goToMain();
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

    setCurrentUserId(kakaoId);
    profile.nickname = nickname;
    profile.avatar   = avatar;
    saveProfile();
    if (typeof updateProfileUI === 'function') updateProfileUI();

    await syncFromCloud(kakaoId);
    showToast(`${profile.nickname}님, 환영합니다!`);
    if (typeof goToMain === 'function') goToMain();
  } catch (e) {
    console.error('Kakao Login Error:', JSON.stringify(e));
    showToast('카카오 오류: ' + (e.message || e.code || JSON.stringify(e)));
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
      await uploadData(uid, visits, profile);
    }

    const auth = window.Capacitor.Plugins.FirebaseAuthentication;
    if (auth) await auth.signOut();
    
    const KakaoLogin = window.Capacitor.Plugins.KakaoLogin;
    if (KakaoLogin) await KakaoLogin.logout();

    // UID 초기화
    setCurrentUserId(null);

    showToast('로그아웃 되었습니다.');
    location.reload();
  } catch (e) {
    showToast('로그아웃 중 오류가 발생했습니다.');
  }
}
