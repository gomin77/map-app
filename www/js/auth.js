/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   소셜 로그인 (Firebase Google & Kakao)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
async function doGoogleLogin() {
  try {
    showToast('구글 로그인 시도 중...');
    const auth = window.Capacitor.Plugins.FirebaseAuthentication;
    if (!auth) throw new Error('Firebase 플러그인이 로드되지 않았습니다.');

    const result = await auth.signInWithGoogle();
    const user = result.user;
    const idToken = result.credential?.idToken || '';

    profile.nickname = user.displayName || '여정객';
    profile.avatar = user.photoURL || user.photoUrl || null;
    saveProfile();
    updateProfileUI();

    await sendTokenToServer(idToken, 'google');
    
    showToast(`${profile.nickname}님, 환영합니다!`);
    goToMain();
  } catch (e) {
    console.error('Google Login Error:', e);
    showToast('구글 로그인에 실패했습니다.');
  }
}

async function doKakaoLogin() {
  try {
    showToast('카카오 로그인 시도 중...');
    const KakaoLogin = window.Capacitor.Plugins.KakaoLogin;
    if (!KakaoLogin) throw new Error('카카오 플러그인이 로드되지 않았습니다.');

    const result = await KakaoLogin.login();
    const accessToken = result.accessToken;

    const user = await KakaoLogin.getUserInfo();
    profile.nickname = user.nickname || '여정객';
    profile.avatar = user.profileImageUrl || null;
    saveProfile();
    updateProfileUI();

    await sendTokenToServer(accessToken, 'kakao');

    showToast(`${profile.nickname}님, 환영합니다!`);
    goToMain();
  } catch (e) {
    console.error('Kakao Login Error:', e);
    showToast('카카오 로그인에 실패했습니다.');
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
    const auth = window.Capacitor.Plugins.FirebaseAuthentication;
    if (auth) await auth.signOut();
    
    const KakaoLogin = window.Capacitor.Plugins.KakaoLogin;
    if (KakaoLogin) await KakaoLogin.logout();

    showToast('로그아웃 되었습니다.');
    location.reload();
  } catch (e) {
    showToast('로그아웃 중 오류가 발생했습니다.');
  }
}
