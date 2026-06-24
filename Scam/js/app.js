/**
 * QR-Shield App Controller
 */

const AppController = (() => {
  let qrScanner = null;
  let isScanning = false;

  // ─── Scanner ─────────────────────────────────────────────────────────────

  function openScanner() {
    document.getElementById('scannerModal').classList.add('active');
    document.body.style.overflow = 'hidden';
    if (typeof Html5Qrcode !== 'undefined') {
      initCamera();
    } else {
      document.getElementById('scannerViewport').style.display = 'none';
    }
  }

  function closeScanner() {
    stopCamera();
    document.getElementById('scannerModal').classList.remove('active');
    document.body.style.overflow = '';
    document.getElementById('manualUrlInput').value = '';
  }

  function initCamera() {
    const viewport = document.getElementById('scannerViewport');
    viewport.style.display = 'block';
    qrScanner = new Html5Qrcode('qr-reader');
    isScanning = true;
    qrScanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 220, height: 220 } },
      (text) => {
        if (!isScanning) return;
        isScanning = false;
        stopCamera();
        closeScanner();
        showResults(text);
      },
      () => {}
    ).catch(() => {
      viewport.innerHTML = `
        <div class="camera-error">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/><line x1="1" y1="1" x2="23" y2="23"/>
          </svg>
          <p>Камера недоступна.<br>Используйте загрузку файла или ручной ввод.</p>
        </div>`;
    });
  }

  function stopCamera() {
    if (qrScanner) {
      qrScanner.stop().catch(() => {});
      qrScanner = null;
    }
    isScanning = false;
  }

  function openManualInput() {
    openScanner();
    setTimeout(() => document.getElementById('manualUrlInput').focus(), 300);
  }

  function analyzeManualUrl() {
    const val = document.getElementById('manualUrlInput').value.trim();
    if (!val) return;
    closeScanner();
    showResults(val);
  }

  // File upload
  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (typeof Html5Qrcode === 'undefined') return;
    const reader = new Html5Qrcode('qr-reader-file');
    reader.scanFile(file, false)
      .then((text) => {
        closeScanner();
        showResults(text);
      })
      .catch(() => {
        alert('Не удалось распознать QR-код в файле. Попробуйте другое изображение.');
      });
  }

  // ─── Demo ─────────────────────────────────────────────────────────────────

  function runDemo(url) {
    showResults(url);
  }

  // ─── Results ──────────────────────────────────────────────────────────────

  function showResults(urlStr) {
    const result = QRShieldAnalyzer.analyze(urlStr);
    renderResults(result);
    document.getElementById('resultsModal').classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeResults() {
    document.getElementById('resultsModal').classList.remove('active');
    document.body.style.overflow = '';
  }

  function renderResults(result) {
    const card = document.getElementById('resultsCard');
    const content = document.getElementById('resultsContent');

    // Set card theme
    card.dataset.verdict = result.verdict;

    const verdictLabels = {
      SAFE: 'БЕЗОПАСНО',
      SUSPICIOUS: 'ПОДОЗРИТЕЛЬНО',
      DANGEROUS: 'ОПАСНО',
    };
    const verdictIcons = {
      SAFE: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
               <path d="M12 2L3 7v10l9 5 9-5V7L12 2z"/><polyline points="9 12 11 14 15 10"/>
             </svg>`,
      SUSPICIOUS: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>`,
      DANGEROUS: `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                   <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                   <line x1="12" y1="16" x2="12.01" y2="16"/>
                 </svg>`,
    };

    const levelLabels = { high: 'ВЫСОКИЙ', medium: 'СРЕДНИЙ', low: 'НИЗКИЙ', info: 'ИНФО' };

    const flagsHtml = result.flags.map(f => `
      <div class="flag-item flag-${f.level}">
        <span class="flag-badge">${levelLabels[f.level]}</span>
        <span class="flag-text">${f.text}</span>
      </div>`).join('');

    const featuresHtml = result.features ? renderFeatureTable(result.features) : '';

    const actionBtn = result.verdict === 'SAFE'
      ? `<a href="${encodeURI(result.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-safe">
           Открыть ссылку
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
             <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
           </svg>
         </a>`
      : `<button class="btn btn-blocked" disabled>
           <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
             <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
           </svg>
           Переход заблокирован
         </button>`;

    content.innerHTML = `
      <div class="verdict-banner">
        <div class="verdict-icon">${verdictIcons[result.verdict]}</div>
        <div class="verdict-label">${verdictLabels[result.verdict]}</div>
      </div>

      <div class="results-body">
        <div class="url-display">
          <span class="url-label">Проверенный URL</span>
          <span class="url-value">${escapeHtml(result.url)}</span>
        </div>

        <div class="gauge-section">
          ${renderGauge(result.score)}
          <div class="gauge-meta">
            <div class="gauge-title">Индекс риска</div>
            <div class="gauge-desc">Чем выше значение, тем опаснее ссылка</div>
          </div>
        </div>

        <div class="flags-section">
          <h4 class="section-label">Обнаруженные признаки</h4>
          <div class="flags-list">${flagsHtml}</div>
        </div>

        ${featuresHtml}

        <div class="results-actions">
          ${actionBtn}
          <button class="btn btn-secondary" onclick="AppController.closeResults()">Закрыть</button>
        </div>
      </div>`;

    // Animate gauge
    requestAnimationFrame(() => {
      const arc = content.querySelector('.gauge-progress');
      if (arc) {
        const target = parseFloat(arc.dataset.target);
        arc.style.strokeDashoffset = target;
      }
    });
  }

  function renderGauge(score) {
    const R = 72;
    const circum = Math.PI * R; // semicircle
    const offset = circum * (1 - score / 100);
    const css = getComputedStyle(document.documentElement);
    const color = score >= 55
      ? css.getPropertyValue('--danger').trim()
      : score >= 25
        ? css.getPropertyValue('--warning').trim()
        : css.getPropertyValue('--safe').trim();
    const trackColor = css.getPropertyValue('--line-strong').trim();
    const unitColor = css.getPropertyValue('--muted').trim();

    return `
      <div class="gauge-wrapper">
        <svg viewBox="0 0 180 100" class="gauge-svg">
          <defs>
            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="${color}" stop-opacity="0.7"/>
              <stop offset="100%" stop-color="${color}"/>
            </linearGradient>
          </defs>
          <path d="M 18 90 A ${R} ${R} 0 0 1 162 90"
                stroke="${trackColor}" stroke-width="14" fill="none" stroke-linecap="round"/>
          <path class="gauge-progress" d="M 18 90 A ${R} ${R} 0 0 1 162 90"
                stroke="url(#gaugeGrad)" stroke-width="14" fill="none" stroke-linecap="round"
                stroke-dasharray="${circum}" stroke-dashoffset="${circum}"
                style="transition: stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)"
                data-target="${offset}"/>
          <text x="90" y="78" text-anchor="middle" class="gauge-number" fill="${color}">${score}</text>
          <text x="90" y="94" text-anchor="middle" class="gauge-unit" fill="${unitColor}">/ 100</text>
        </svg>
      </div>`;
  }

  function renderFeatureTable(f) {
    const rows = [
      ['Домен', f.domain],
      ['Протокол', f.isHTTPS ? 'HTTPS ✓' : 'HTTP — небезопасно'],
      ['TLD', f.tld],
      ['Поддомены', f.subdomainCount],
      ['Длина URL', f.urlLength + ' символов'],
      ['Редирект-параметр', f.hasRedirect ? 'Да' : 'Нет'],
      ['IP-адрес вместо домена', f.isIPAddress ? 'Да' : 'Нет'],
      ['Сокращатель ссылок', f.isShortener ? 'Да' : 'Нет'],
      ['Homograph / не-ASCII', f.hasHomograph ? 'Да' : 'Нет'],
      ['Возраст домена', f.domainAge !== null ? f.domainAge + ' дн. (симуляция)' : 'Неизвестно'],
      ['Ближайший доверенный домен', f.closestTrustedDomain],
      ['Расстояние редактирования', f.editDistanceTrusted],
      ['Энтропия домена', f.domainEntropy],
      ['Цифр в домене', f.digitCount],
      ['Спецсимволов в домене', f.specialCharCount],
      ['Бренд в домене', f.brand || 'Нет'],
    ];

    return `
      <details class="features-details">
        <summary class="section-label">Технический разбор признаков</summary>
        <table class="features-table">
          <tbody>
            ${rows.map(([k, v]) => `<tr><td class="feat-key">${k}</td><td class="feat-val">${v}</td></tr>`).join('')}
          </tbody>
        </table>
      </details>`;
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ─── Init ─────────────────────────────────────────────────────────────────

  function init() {
    // Close modals on backdrop click
    document.getElementById('scannerModal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeScanner();
    });
    document.getElementById('resultsModal').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeResults();
    });

    // Keyboard close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeScanner();
        closeResults();
      }
    });

    // Manual URL input: Enter key
    document.getElementById('manualUrlInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') analyzeManualUrl();
    });

    // File upload
    const fileInput = document.getElementById('qrFileInput');
    if (fileInput) fileInput.addEventListener('change', handleFileUpload);

    // Sticky header on scroll
    window.addEventListener('scroll', () => {
      document.getElementById('header').classList.toggle('scrolled', window.scrollY > 20);
    });

    // Animate stats on scroll
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.stat-card, .step-card, .demo-card, .ai-card, .security-card, .scale-card').forEach(el => observer.observe(el));
  }

  document.addEventListener('DOMContentLoaded', init);

  return { openScanner, closeScanner, openManualInput, analyzeManualUrl, closeResults, runDemo };
})();
