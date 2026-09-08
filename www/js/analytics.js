/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Firebase Analytics 래퍼
   - 네이티브(@capacitor-firebase/analytics) 플러그인이 없는 환경(웹 미리보기 등)에서도
     에러 없이 조용히 무시되도록 방어적으로 작성
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
function getAnalyticsPlugin() {
  return window.Capacitor?.Plugins?.FirebaseAnalytics || null;
}

// 이벤트 로깅 (예: trackEvent('login', {method:'google'}))
function trackEvent(name, params) {
  try {
    const plugin = getAnalyticsPlugin();
    if (!plugin) return;
    plugin.logEvent({ name, params: params || {} }).catch(e => console.error('trackEvent 실패:', name, e));
  } catch (e) { console.error('trackEvent 예외:', name, e); }
}

// 화면 전환 추적 (예: trackScreen('travel'))
function trackScreen(screenName) {
  try {
    const plugin = getAnalyticsPlugin();
    if (!plugin) return;
    plugin.setCurrentScreen({ screenName }).catch(e => console.error('trackScreen 실패:', screenName, e));
  } catch (e) { console.error('trackScreen 예외:', screenName, e); }
}

// 로그인/로그아웃 시 사용자 식별자 갱신
function setAnalyticsUser(uid) {
  try {
    const plugin = getAnalyticsPlugin();
    if (!plugin) return;
    plugin.setUserId({ userId: uid || null }).catch(e => console.error('setAnalyticsUser 실패:', e));
  } catch (e) { console.error('setAnalyticsUser 예외:', e); }
}
