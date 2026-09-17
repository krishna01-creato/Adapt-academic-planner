import { state, DEFAULT_CATEGORIES } from '../state/store.js';
import { formatDuration, formatTime12, getTodayISO, formatDateDisplay, addDays } from '../utils/time.js';
import { getOverdueTasksCount } from '../domain/tasks.js';
import { getRecommendation } from '../scheduler/recommendation.js';

export function renderDashboardHtml() {
    const today = getTodayISO();
    const tomorrow = addDays(today, 1);
    const viewDate = state.viewDate || today;
    const isTomorrowView = viewDate !== today;
    const curMin = getCurrentTimeMinutes(state.currentTime);

    const activeBlock = state.timeline.find(b => b.status === 'active' || b.status === 'fixed-active');
    const nextBlock = state.timeline.find(b => b.startMin > curMin && (b.type === 'task' || b.type === 'fixed'));

    let curStatus = 'Free Time / Buffer';
    let nextStatus = 'No further events scheduled today';

    if (isTomorrowView) {
      curStatus = `Planning Tomorrow (${formatDateDisplay(viewDate)})`;
      const tomorrowTasksCount = state.timeline.filter(b => b.type === 'task').length;
      nextStatus = `${tomorrowTasksCount} study task(s) currently slotted for tomorrow`;
    } else {
      if (activeBlock) curStatus = `${activeBlock.title} (${activeBlock.startTimeStr} – ${activeBlock.endTimeStr})`;
      if (nextBlock) nextStatus = `Next up at ${nextBlock.startTimeStr}: ${nextBlock.title}`;
    }
