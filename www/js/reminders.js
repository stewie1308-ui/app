// Daily reminder: a week of one-off notifications, rescheduled whenever the app opens or a card is answered,
// so a day you've already done never gets a nudge.
export const REMINDER_IDS = Array.from({ length: 7 }, (_, i) => 7001 + i);

export function planReminders(reminder, { now, doneToday, streak, cards = 5 }) {
  if (!reminder?.on) return [];
  const m = /^(\d{1,2}):(\d{2})$/.exec(reminder.time || '');
  if (!m) return [];
  const [hh, mm] = [Number(m[1]), Number(m[2])];
  const out = [];
  for (let offset = 0; out.length < 7 && offset < 8; offset++) {
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset, hh, mm, 0, 0);
    if (offset === 0 && (doneToday || at <= now)) continue;
    const first = out.length === 0;
    out.push({
      id: REMINDER_IDS[out.length],
      at,
      title: 'Inkling',
      body: first && streak > 0 ? `Keep your ${streak}-day streak going. Today's cards take about 3 minutes.` : `Your ${cards} cards are ready.`,
    });
  }
  return out;
}
