import { state, DEFAULT_CATEGORIES } from '../state/store.js';
import { formatDuration, formatTime12, getTodayISO, formatDateDisplay, addDays } from '../utils/time.js';
import { getOverdueTasksCount } from '../domain/tasks.js';
import { getRecommendation } from '../scheduler/recommendation.js';
import { DEFAULT_SCHEDULE_CONFIG } from '../state/store.js';

export function renderTimelineHtml() {
    const today = getTodayISO();
    const tomorrow = addDays(today, 1);
    const viewDate = state.viewDate || today;
    const isTomorrowView = viewDate !== today;
    const sc = state.scheduleConfig || DEFAULT_SCHEDULE_CONFIG;

    return `
      <div class="timeline-container card">
        <div class="timeline-header">
          <div class="timeline-title-row">
            <div>
              <h3 class="font-semibold text-base">${isTomorrowView ? "Tomorrow's Adaptive Schedule" : "Today's Adaptive Schedule"}</h3>
              <p class="text-xs text-secondary">${isTomorrowView ? "Previewing tomorrow's slotted routine, lectures, and study tasks." : "Dynamically slotted around your routine, commitments, and breaks."}</p>
            </div>
            <div class="flex items-center gap-2 flex-wrap">
              <div class="date-switch-group">
                <button class="date-switch-btn ${viewDate === today ? 'active' : ''}" data-switch-date="${today}" title="View Today">
                  <span>📅</span><span>Today</span>
                </button>
                <button class="date-switch-btn ${viewDate === tomorrow ? 'active' : ''}" data-switch-date="${tomorrow}" title="View Tomorrow">
                  <span>☀️</span><span>Tomorrow</span>
                </button>
              </div>
              
              <button class="btn btn-secondary btn-sm" id="btn-regen-plan" title="Recalculate schedule">🔄 Recalculate</button>
            </div>
          </div>

          <div class="schedule-routine-bar">
            <div class="flex items-center gap-2 flex-wrap text-xs">
              <span class="text-secondary font-medium">🌅 Day Starts:</span>
              <input type="time" class="input-text font-mono quick-day-start-input" id="quick-day-start" value="${sc.dayStart || '08:00'}" />
              <button class="btn btn-secondary btn-sm" id="btn-start-day-now" style="padding:3px 8px;font-size:11px;" title="Set schedule to start at current time">⚡ Start Now (${formatTime12(getCurrentTimeMinutes(state.currentTime))})</button>
            </div>
            <div class="flex items-center gap-2 text-xs flex-wrap">
              <button class="routine-chip-btn" data-action="open-modal-routine" data-focus-meal="breakfast" title="Click to customize breakfast time & duration">
                🍳 Breakfast: <strong>${sc.breakfastStart || '08:30'}</strong> <span class="font-mono">(${(parseTimeToMinutes(sc.breakfastEnd) - parseTimeToMinutes(sc.breakfastStart)) || sc.breakfastDuration || 30}m)</span>
              </button>
              <button class="routine-chip-btn" data-action="open-modal-routine" data-focus-meal="lunch" title="Click to customize lunch time & duration">
                🍱 Lunch: <strong>${sc.lunchStart || '13:00'}</strong> <span class="font-mono">(${(parseTimeToMinutes(sc.lunchEnd) - parseTimeToMinutes(sc.lunchStart)) || sc.lunchDuration || 45}m)</span>
              </button>
              <button class="routine-chip-btn" data-action="open-modal-routine" data-focus-meal="dinner" title="Click to customize dinner time & duration">
                🍽️ Dinner: <strong>${sc.dinnerStart || '20:00'}</strong> <span class="font-mono">(${(parseTimeToMinutes(sc.dinnerEnd) - parseTimeToMinutes(sc.dinnerStart)) || sc.dinnerDuration || 45}m)</span>
              </button>
              <button class="btn btn-secondary btn-sm" data-action="open-modal-routine" style="padding:3px 10px;font-size:11px;" title="Customize full daily routine and meal durations">⚙️ Edit Routine</button>
            </div>
          </div>

          
        </div>

        ${renderAgendaScheduleHtml()}
      </div>
    `;
  }

  function renderAgendaScheduleHtml() {
    const activeTasks = state.tasks.filter(t => t.status !== 'completed');
    if (activeTasks.length === 0 && state.fixedEvents.length === 0) {
      return `
        <div class="timeline-empty-card">
          <div class="empty-icon">📅</div>
          <h4 class="font-bold text-base mb-1">Your Schedule is Clean & Open</h4>
          <p class="text-xs text-secondary mb-3">Add study tasks or lectures to generate your automated daily schedule.</p>
          <button class="btn btn-primary" data-action="open-modal-task">+ Add Study Task</button>
        </div>
      `;
    }
