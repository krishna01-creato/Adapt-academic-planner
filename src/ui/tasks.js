import { state, DEFAULT_CATEGORIES } from '../state/store.js';
import { formatDuration, formatTime12, getTodayISO, formatDateDisplay, addDays } from '../utils/time.js';
import { getOverdueTasksCount } from '../domain/tasks.js';
import { getRecommendation } from '../scheduler/recommendation.js';
import { PRIORITY_WEIGHTS } from '../scheduler/rankTasks.js';

export function renderTasksHtml() {
    const today = getTodayISO();

    const filtered = state.tasks.filter(t => {
      if (taskFilter.query) {
        const q = taskFilter.query.toLowerCase();
        if (!t.title.toLowerCase().includes(q) && !(t.notes || '').toLowerCase().includes(q)) return false;
      }
      if (taskFilter.status === 'pending' && t.status === 'completed') return false;
      if (taskFilter.status === 'completed' && t.status !== 'completed') return false;
      if (taskFilter.status === 'today' && (t.deadline !== today || t.status === 'completed')) return false;
      if (taskFilter.status === 'overdue' && (t.status === 'completed' || !t.deadline || diffDays(t.deadline, today) >= 0)) return false;
      if (taskFilter.category !== 'all' && t.category !== taskFilter.category) return false;
      return true;
    }).sort((a, b) => {
      if (taskFilter.sort === 'deadline') return (a.deadline || '').localeCompare(b.deadline || '');
      if (taskFilter.sort === 'priority') return (PRIORITY_WEIGHTS[b.priority] || 1) - (PRIORITY_WEIGHTS[a.priority] || 1);
      if (taskFilter.sort === 'duration') return (b.remaining || b.duration) - (a.remaining || a.duration);
      return 0;
    });

    const total = state.tasks.length;
    const pending = state.tasks.filter(t => t.status !== 'completed').length;
    const completed = state.tasks.filter(t => t.status === 'completed').length;
    const remMin = state.tasks.filter(t => t.status !== 'completed').reduce((acc, t) => acc + (t.remaining || t.duration || 0), 0);

    return `
      <div class="tasks-page animate-fade-in">
        <div class="card mb-4">
          <div class="tasks-header-row">
            <div>
              <h1 class="font-bold text-xl">Study Tasks & Commitments</h1>
              <p class="text-xs text-secondary">Manage tasks, track subtasks, and launch focus sessions.</p>
            </div>
            <button class="btn btn-primary" data-action="open-modal-task">+ Create Task</button>
          </div>

          <div class="tasks-metrics-grid mt-3">
            <div class="metric-box"><span class="metric-label">Total</span><span class="metric-value font-mono">${total}</span></div>
            <div class="metric-box"><span class="metric-label">Pending</span><span class="metric-value font-mono text-amber">${pending}</span></div>
            <div class="metric-box"><span class="metric-label">Completed</span><span class="metric-value font-mono text-low">${completed}</span></div>
            <div class="metric-box"><span class="metric-label">Remaining</span><span class="metric-value font-mono">${Math.floor(remMin / 60)}h ${remMin % 60}m</span></div>
          </div>
        </div>

        <div class="card mb-4">
          <div class="toolbar-top-row">
            <div class="search-box">
              <span class="search-icon">🔍</span>
              <input type="text" class="input-text search-input" id="task-search-input" placeholder="Search tasks..." value="${taskFilter.query}" />
            </div>
            <div class="sort-box">
              <span class="text-xs text-secondary mr-2">Sort:</span>
              <select class="select-input sort-select" id="task-sort-select">
                <option value="deadline" ${taskFilter.sort === 'deadline' ? 'selected' : ''}>Deadline</option>
                <option value="priority" ${taskFilter.sort === 'priority' ? 'selected' : ''}>Priority</option>
                <option value="duration" ${taskFilter.sort === 'duration' ? 'selected' : ''}>Duration</option>
              </select>
            </div>
          </div>

          <div class="toolbar-filters-row mt-3">
            <div class="pills-container" id="task-status-pills">
              ${['all', 'pending', 'completed', 'today', 'overdue'].map(s => `
                <button class="pill-btn ${taskFilter.status === s ? 'pill-selected' : ''}" data-filter-status="${s}">
                  ${s.toUpperCase()}
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="tasks-list-container">
          ${filtered.length === 0 ? `
            <div class="card text-center py-8">
              <div style="font-size:32px;margin-bottom:8px;">📋</div>
              <h3 class="font-bold text-base mb-1">${state.tasks.length === 0 ? 'No Study Tasks Added Yet' : 'No Tasks Match Your Filters'}</h3>
              <p class="text-xs text-secondary mb-4">${state.tasks.length === 0 ? 'Start planning your daily goals, assignments, and exam prep!' : 'Try resetting your search query or selecting a different status pill.'}</p>
              <button class="btn btn-primary btn-sm" data-action="open-modal-task">+ Create Study Task</button>
            </div>
          ` : filtered.map(t => {
            const col = getCategoryColor(state.categories, t.category);
            const lab = getCategoryLabel(state.categories, t.category);
            const isDone = t.status === 'completed';
            const isOverdue = !isDone && t.deadline && diffDays(t.deadline, today) < 0;

            return `
              <div class="task-card card card-hover ${isDone ? 'task-completed-card' : ''}">
                <div class="task-card-main">
                  <div class="task-check-col">
                    <input type="checkbox" class="task-checkbox" data-task-complete="${t.id}" ${isDone ? 'checked' : ''} />
                  </div>
                  <div class="task-info-col">
                    <div class="task-meta-top">
                      <span class="badge" style="background:${col}18;color:${col};">${lab}</span>
                      <span class="badge badge-${(t.priority || 'Medium').toLowerCase()}">${t.priority || 'Medium'}</span>
                      <span class="task-date-pill font-mono text-xs ${isOverdue ? 'date-overdue' : ''}">
                        📅 ${relativeDateLabel(t.deadline, today)}
                      </span>
                    </div>
                    <h3 class="task-title ${isDone ? 'line-through text-muted' : ''}">${t.title}</h3>
                    ${t.notes ? `<p class="text-xs text-secondary">${t.notes}</p>` : ''}
                    ${t.subtasks && t.subtasks.length > 0 ? `
                      <div class="mt-2 text-xs text-muted">
                        ${t.subtasks.filter(s => s.done).length}/${t.subtasks.length} subtasks completed
                      </div>
                    ` : ''}
                  </div>
                  <div class="task-actions-col">
                    ${!isDone ? `<button class="btn btn-sm btn-primary" data-start-focus="${t.id}">⚡ Focus</button>` : ''}
                    <button class="btn btn-sm btn-ghost" data-action="edit-task" data-id="${t.id}">✏️</button>
                    <button class="btn btn-sm btn-ghost text-danger" data-action="delete-task" data-id="${t.id}">🗑️</button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // -------------------------------------------------------------------------
  // -------------------------------------------------------------------------
  let selectedWeeklyDate = getTodayISO();



  // -------------------------------------------------------------------------
  // TAB 6: ANALYTICS
  // -------------------------------------------------------------------------


  // -------------------------------------------------------------------------
  // TAB 7: SETTINGS
  // -------------------------------------------------------------------------






  function renderCalendarMatrixHtml() {
    const today = getTodayISO();
    const viewDate = state.viewDate || today;
    const viewD = new Date(viewDate + 'T00:00:00');
    const year = viewD.getFullYear();
    const month = viewD.getMonth();
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    
    // First day of month and total days
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Build task map for this month
    const tasksByDate = {};
    state.tasks.forEach(t => {
      if (t.deadline) {
        if (!tasksByDate[t.deadline]) tasksByDate[t.deadline] = [];
        tasksByDate[t.deadline].push(t);
      }
    });
    
    // Calendar navigation
    const prevMonth = new Date(year, month - 1, 1);
    const nextMonth = new Date(year, month + 1, 1);
    const prevMonthISO = formatDateISO(prevMonth);
    const nextMonthISO = formatDateISO(nextMonth);
    
    // Build cells
    let cells = '';
    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      cells += `<div class="cal-cell cal-cell-empty"></div>`;
    }
