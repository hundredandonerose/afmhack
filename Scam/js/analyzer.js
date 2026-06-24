/**
 * aldanba URL Analysis Engine
 * On-device classifier — no data leaves the browser.
 */

const AldanbaAnalyzer = (() => {
  const TRUSTED_DOMAINS = [
    'kaspi.kz', 'halykbank.kz', 'homebank.kz', 'forte.kz',
    'jusan.kz', 'jysanbank.kz', 'bcc.kz', 'freedom.kz',
    'berekebank.kz', 'atfbank.kz', 'egov.kz', 'gov.kz',
    'kcell.kz', 'beeline.kz', 'tele2.kz', 'activ.kz',
    'kaspi.pay', 'kaspi.kz', 'kaspi.com',
  ];

  const BRAND_NAMES = [
    'kaspi', 'halyk', 'halykbank', 'homebank', 'forte',
    'jusan', 'jysan', 'forte', 'bereke', 'freedom', 'bcc',
  ];

  const SUSPICIOUS_TLDS = [
    '.top', '.xyz', '.tk', '.ml', '.ga', '.cf', '.gq',
    '.buzz', '.click', '.info', '.biz', '.online', '.site',
    '.live', '.space', '.icu', '.digital', '.business',
    '.contractors', '.ceo', '.company',
  ];

  const SUSPICIOUS_KEYWORDS = [
    'login', 'signin', 'verify', 'secure', 'account', 'update',
    'confirm', 'validation', 'auth', 'restore', 'recover',
    'payment', 'pay', 'bank', 'card', 'credit',
  ];

  const SHORTENERS = [
    'bit.ly', 't.ly', 'tinyurl.com', 't.co', 'ow.ly',
    'short.link', 'rebrand.ly', 'cutt.ly', 'clck.ru',
    'goo.gl', 'shorturl.at', 'is.gd',
  ];

  // Simulated domain ages for demo scenarios
  const DEMO_AGES = {
    'kaspi-pay.top': 3,
    'kaspi-kz.net': 14,
    'halyk-bank.xyz': 7,
    'homebank-kz.info': 21,
    'kaspi-online.top': 5,
    'kaspipay.xyz': 2,
    'halyk-payment.net': 4,
  };

  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, (_, i) =>
      Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
    );
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
    return dp[m][n];
  }

  function getSLD(hostname) {
    const parts = hostname.replace(/^www\./, '').split('.');
    return parts.length >= 2 ? parts[parts.length - 2] : parts[0];
  }

  function getMinDistanceToTrusted(hostname) {
    let min = Infinity, closest = null;
    for (const d of TRUSTED_DOMAINS) {
      const dist = levenshtein(hostname.toLowerCase(), d.toLowerCase());
      if (dist < min) { min = dist; closest = d; }
    }
    return { dist: min, closest };
  }

  function containsBrand(hostname) {
    const h = hostname.toLowerCase();
    return BRAND_NAMES.find(b => h.includes(b)) || null;
  }

  function entropy(str) {
    const freq = {};
    for (const ch of str) freq[ch] = (freq[ch] || 0) + 1;
    const len = str.length;
    return Object.values(freq).reduce((sum, count) => {
      const p = count / len;
      return sum - p * Math.log2(p);
    }, 0).toFixed(2);
  }

  function countDigits(str) {
    return (str.match(/\d/g) || []).length;
  }

  function countSpecial(str) {
    return (str.match(/[^a-zA-Z0-9.]/g) || []).length;
  }

  function hasHomograph(hostname) {
    // Detect non-ASCII characters that may be homograph attacks
    return /[^\x00-\x7F]/.test(hostname);
  }

  function isShortener(hostname) {
    return SHORTENERS.some(s => hostname === s || hostname.endsWith('.' + s));
  }

  function analyze(urlStr) {
    // Normalize: add protocol if missing
    let normalized = urlStr.trim();
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = 'https://' + normalized;
    }

    let url;
    try {
      url = new URL(normalized);
    } catch {
      return {
        verdict: 'DANGEROUS',
        score: 90,
        flags: [{ level: 'high', text: 'Некорректный URL — невозможно разобрать структуру' }],
        features: null,
        url: urlStr,
      };
    }

    const hostname = url.hostname.toLowerCase();
    const fullUrl = normalized.toLowerCase();
    const sld = getSLD(hostname);
    const tld = '.' + hostname.split('.').pop();
    const subdomainCount = hostname.split('.').length - 2;

    const isKnownTrusted = TRUSTED_DOMAINS.some(
      d => hostname === d || hostname.endsWith('.' + d)
    );

    // Immediate safe verdict for whitelisted domains
    if (isKnownTrusted) {
      return {
        verdict: 'SAFE',
        score: 5,
        flags: [{
          level: 'info',
          text: `Домен ${hostname} входит в список доверенных финансовых сервисов Казахстана`,
        }],
        features: buildFeatures(url, hostname, sld, tld, subdomainCount, fullUrl),
        url: normalized,
      };
    }

    let risk = 0;
    const flags = [];
    const features = buildFeatures(url, hostname, sld, tld, subdomainCount, fullUrl);

    // 1. IP address used as domain
    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
      risk += 56;
      flags.push({ level: 'high', text: 'Использует IP-адрес вместо доменного имени' });
    }

    // 2. URL shortener
    if (isShortener(hostname)) {
      risk += 30;
      flags.push({ level: 'high', text: 'Используется сервис сокращения ссылок — реальный адрес скрыт' });
    }

    // 3. Homograph / non-ASCII
    if (hasHomograph(hostname)) {
      risk += 40;
      flags.push({ level: 'high', text: 'Домен содержит не-ASCII символы — возможная homograph-атака' });
    }

    // 4. Suspicious TLD
    if (SUSPICIOUS_TLDS.includes(tld)) {
      risk += 28;
      flags.push({ level: 'high', text: `Подозрительный домен верхнего уровня: ${tld}` });
    }

    // 5. Domain spoofing: Levenshtein distance
    const { dist, closest } = getMinDistanceToTrusted(hostname);
    if (dist > 0 && dist <= 2) {
      risk += 35;
      flags.push({
        level: 'high',
        text: `Домен имитирует «${closest}» — расстояние редактирования: ${dist} (визуальная подделка)`,
      });
    } else if (dist > 0 && dist <= 4) {
      const sldDist = levenshtein(sld, getSLD(closest));
      if (sldDist <= 2) {
        risk += 22;
        flags.push({
          level: 'high',
          text: `Имя домена похоже на «${closest}» (расстояние: ${sldDist})`,
        });
      }
    }

    // 6. Brand keyword in non-official domain
    const foundBrand = containsBrand(hostname);
    if (foundBrand) {
      risk += 30;
      flags.push({
        level: 'high',
        text: `Домен содержит бренд «${foundBrand}», но не является официальным сайтом`,
      });
    }

    // 7. Domain age (simulated for demo domains)
    const domainAge = DEMO_AGES[hostname];
    if (domainAge !== undefined) {
      risk += domainAge <= 7 ? 30 : 20;
      flags.push({
        level: 'high',
        text: `Домен зарегистрирован ${domainAge} ${declineDays(domainAge)} назад`,
      });
    }

    // 8. @ symbol
    if (normalized.includes('@')) {
      risk += 25;
      flags.push({ level: 'high', text: 'URL содержит символ @, используемый для маскировки адреса' });
    }

    // 9. Redirect parameter
    if (/[?&](redirect|url|link|next|return|goto)=/i.test(normalized)) {
      risk += 18;
      flags.push({ level: 'medium', text: 'URL содержит параметр перенаправления' });
    }

    // 10. No HTTPS
    if (url.protocol !== 'https:') {
      risk += 15;
      flags.push({ level: 'medium', text: 'Соединение не зашифровано (HTTP вместо HTTPS)' });
    }

    // 11. Suspicious path/query keywords
    const suspiciousKW = SUSPICIOUS_KEYWORDS.filter(k => fullUrl.includes(k));
    if (suspiciousKW.length > 0) {
      risk += 12;
      flags.push({
        level: 'medium',
        text: `Фишинговые ключевые слова в URL: ${suspiciousKW.slice(0, 3).join(', ')}`,
      });
    }

    // 12. Many subdomains
    if (subdomainCount > 2) {
      risk += 12;
      flags.push({ level: 'medium', text: `Подозрительное количество поддоменов: ${subdomainCount}` });
    }

    // 13. Long URL
    if (urlStr.length > 100) {
      risk += 8;
      flags.push({ level: 'low', text: `Аномально длинный URL (${urlStr.length} символов)` });
    }

    // 14. Hyphens in domain
    const hyphens = (hostname.match(/-/g) || []).length;
    if (hyphens >= 3) {
      risk += 8;
      flags.push({ level: 'low', text: `Много дефисов в доменном имени (${hyphens})` });
    }

    // 15. Double slash in path
    if (url.pathname.includes('//')) {
      risk += 8;
      flags.push({ level: 'low', text: 'Двойной слэш в пути URL (обход фильтров)' });
    }

    // 16. Excessive digits in domain
    const digits = countDigits(hostname);
    if (digits >= 4) {
      risk += 8;
      flags.push({ level: 'low', text: `Много цифр в домене (${digits}) — типично для автоматически сгенерированных фишинговых доменов` });
    }

    // 17. High entropy domain
    if (features.domainEntropy > 4) {
      risk += 8;
      flags.push({ level: 'low', text: `Высокая энтропия домена (${features.domainEntropy}) — возможный автоматически сгенерированный домен` });
    }

    risk = Math.min(risk, 100);

    if (flags.length === 0) {
      flags.push({ level: 'info', text: 'Подозрительных признаков не обнаружено' });
    }

    let verdict;
    if (risk >= 55) verdict = 'DANGEROUS';
    else if (risk >= 25) verdict = 'SUSPICIOUS';
    else verdict = 'SAFE';

    return { verdict, score: risk, flags, features, url: normalized };
  }

  function declineDays(n) {
    if (n % 10 === 1 && n % 100 !== 11) return 'день';
    if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'дня';
    return 'дней';
  }

  function buildFeatures(url, hostname, sld, tld, subdomainCount, fullUrl) {
    const { dist, closest } = getMinDistanceToTrusted(hostname);
    return {
      domain: hostname,
      protocol: url.protocol,
      isHTTPS: url.protocol === 'https:',
      tld,
      sld,
      subdomainCount,
      domainAge: DEMO_AGES[hostname] ?? null,
      editDistanceTrusted: dist,
      closestTrustedDomain: closest,
      urlLength: fullUrl.length,
      hasRedirect: /[?&](redirect|url|link|next|return|goto)=/i.test(fullUrl),
      hasSuspiciousKeywords: SUSPICIOUS_KEYWORDS.some(k => fullUrl.includes(k)),
      hasAtSymbol: fullUrl.includes('@'),
      isIPAddress: /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname),
      isShortener: isShortener(hostname),
      hasHomograph: hasHomograph(hostname),
      brand: containsBrand(hostname),
      domainEntropy: parseFloat(entropy(hostname)),
      digitCount: countDigits(hostname),
      specialCharCount: countSpecial(hostname),
    };
  }

  return { analyze };
})();
