

export function renderCircularProgressHtml(pct, color, label, size = 80) {
    const radius = (size / 2) - 8;
    const circumference = 2 * Math.PI * radius;
    const clampedPct = Math.min(100, Math.max(0, Math.round(pct)));
    const offset = circumference - (clampedPct / 100) * circumference;
    const center = size / 2;
    const gradId = `cpGrad-${Math.random().toString(36).slice(2, 7)}`;
    
    return `
      <div class="circular-progress-container" style="width:${size}px;">
        <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" class="circular-progress-svg">
          <defs>
            <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="${color}"/>
              <stop offset="100%" stop-color="${color}aa"/>
            </linearGradient>
          </defs>
          <circle cx="${center}" cy="${center}" r="${radius}" fill="none" stroke="var(--border-subtle)" stroke-width="6" opacity="0.4"/>
          <circle cx="${center}" cy="${center}" r="${radius}" fill="none" 
            stroke="url(#${gradId})" stroke-width="6" 
            stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" 
            stroke-linecap="round" transform="rotate(-90 ${center} ${center})"
            style="transition:stroke-dashoffset 0.8s ease;"/>
          <text x="${center}" y="${center}" text-anchor="middle" dominant-baseline="central" 
            fill="var(--text-primary)" font-size="${size < 70 ? 12 : 16}" font-weight="700" 
            font-family="var(--font-mono)">${clampedPct}%</text>
        </svg>
        <div class="circular-progress-label">${label}</div>
      </div>
    `;
  }