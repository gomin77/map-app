/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   재방문 유도 로컬 알림
   - 앱을 백그라운드로 보낼 때마다 N일 후 알림을 예약
   - 앱을 다시 열면 예약된 알림을 취소 (이미 재방문했으므로 불필요)
   - 서버/비용 없이 기기 로컬 알람만 사용 (정확한 시각이 필요 없어 inexact 알람 사용)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const REENGAGE_NOTI_ID = 9001;
const REENGAGE_DELAY_MS = 3 * 24 * 60 * 60 * 1000; // 3일

function getLocalNotificationsPlugin() {
  return window.Capacitor?.Plugins?.LocalNotifications || null;
}

async function initReengagementNotifications() {
  const LN = getLocalNotificationsPlugin();
  const AppPlugin = window.Capacitor?.Plugins?.App;
  if (!LN || !AppPlugin) return;

  try {
    const perm = await LN.checkPermissions();
    if (perm.display !== 'granted') await LN.requestPermissions();
  } catch (e) { console.error('알림 권한 요청 실패:', e); }

  scheduleHolidayNotifications();

  AppPlugin.addListener('appStateChange', ({ isActive }) => {
    if (isActive) cancelReengagementNotification();
    else scheduleReengagementNotification();
  });

  try {
    LN.addListener('localNotificationActionPerformed', () => {
      if (typeof trackEvent === 'function') trackEvent('reengagement_notification_open');
    });
  } catch (e) {}
}

async function scheduleReengagementNotification() {
  const LN = getLocalNotificationsPlugin();
  if (!LN) return;
  try {
    const perm = await LN.checkPermissions();
    if (perm.display !== 'granted') return;
    await LN.schedule({
      notifications: [{
        id: REENGAGE_NOTI_ID,
        title: '여정',
        body: '오랜만이에요! 새로운 여행지를 기록해볼까요? 🗺️',
        schedule: { at: new Date(Date.now() + REENGAGE_DELAY_MS), allowWhileIdle: true },
        isExactNotification: false
      }]
    });
  } catch (e) { console.error('재방문 알림 예약 실패:', e); }
}

async function cancelReengagementNotification() {
  const LN = getLocalNotificationsPlugin();
  if (!LN) return;
  try {
    await LN.cancel({ notifications: [{ id: REENGAGE_NOTI_ID }] });
  } catch (e) { console.error('재방문 알림 취소 실패:', e); }
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   명절/연휴 전 여행 추천 알림
   - 연휴 시작일 3일 전 오전 10시에 "아직 안 가본 지역" 추천 알림
   - 날짜가 고정돼 있어 매 실행마다 다시 예약해도 안전 (같은 id로 갱신)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
const HOLIDAYS = [
  { id: 9201, name: '설날', start: '2026-02-16' },
  { id: 9202, name: '추석', start: '2026-09-24' },
  { id: 9203, name: '설날', start: '2027-02-06' },
  { id: 9204, name: '추석', start: '2027-09-14' },
];
const HOLIDAY_NOTICE_DAYS_BEFORE = 3;

function pickUnvisitedRegionName() {
  const unvisited = REGIONS_KR.filter(r => !visits[r.id] || !visits[r.id].status);
  if (!unvisited.length) return null;
  return unvisited[Math.floor(Math.random() * unvisited.length)].name;
}

async function scheduleHolidayNotifications() {
  const LN = getLocalNotificationsPlugin();
  if (!LN) return;
  try {
    const perm = await LN.checkPermissions();
    if (perm.display !== 'granted') return;

    const notifications = [];
    for (const h of HOLIDAYS) {
      const start = new Date(h.start + 'T10:00:00');
      const notifyAt = new Date(start.getTime() - HOLIDAY_NOTICE_DAYS_BEFORE * 24 * 60 * 60 * 1000);
      if (notifyAt.getTime() <= Date.now()) continue; // 이미 지난 알림은 예약하지 않음
      const suggestion = pickUnvisitedRegionName();
      const body = suggestion
        ? `다가오는 ${h.name} 연휴엔 어디로 여행갈까요? 아직 안 가본 ${suggestion}은 어때요? 🧳`
        : `다가오는 ${h.name} 연휴엔 어디로 여행갈까요? 🧳`;
      notifications.push({
        id: h.id,
        title: '여정',
        body,
        schedule: { at: notifyAt, allowWhileIdle: true },
        isExactNotification: false
      });
    }
    if (notifications.length) await LN.schedule({ notifications });
  } catch (e) { console.error('연휴 알림 예약 실패:', e); }
}
