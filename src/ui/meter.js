

export function renderMeterHtml(val, max, label, detail, color = 'var(--accent)', size = 'md') {
    const pct = max > 0 ? Math.min(100, Math.max(0, Math.round((val / max) * 100))) : 0;
    return `
      <div class="meter-component meter-${size}">
        <div class="meter-header">
          <span class="meter-label">${label}</span>
          <span class="meter-value font-mono">${detail || `${pct}%`}</span>
        </div>
        <div class="meter-track">
          <div class="meter-fill" style="width:${pct}%;background-color:${color};"></div>
        </div>
      </div>
    `;
  }