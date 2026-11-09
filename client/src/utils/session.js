const VISITOR_KEY = 'sriyas_anonymous_visitor_id';
const SESSION_KEY = 'sriyas_visitor_session_id';
const SESSION_INIT_FLAG = 'sriyas_session_init_done';
const VIEW_CACHE_KEY = 'sriyas_recent_product_views';

function generateRandomId(prefix = 'id') {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${time}_${rand}`;
}

// 1. First-Party Pseudonymous Visitor Identifier (localStorage, non-PII)
export function getVisitorId() {
  try {
    let visitorId = localStorage.getItem(VISITOR_KEY);
    if (!visitorId) {
      visitorId = generateRandomId('vis');
      localStorage.setItem(VISITOR_KEY, visitorId);
    }
    return visitorId;
  } catch (_) {
    return 'vis_anon_fallback';
  }
}

// 2. Per-Session Identifier (sessionStorage)
export function getVisitorSessionId() {
  try {
    let sessionId = sessionStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      sessionId = generateRandomId('ses');
      sessionStorage.setItem(SESSION_KEY, sessionId);
    }
    return sessionId;
  } catch (_) {
    return 'ses_anon_fallback';
  }
}

// 3. Lightweight Client Environment Detection
export function getClientEnvironment() {
  if (typeof window === 'undefined') {
    return { deviceCategory: 'desktop', browser: 'Unknown', os: 'Unknown' };
  }

  const ua = navigator.userAgent || '';
  let deviceCategory = 'desktop';
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    deviceCategory = 'tablet';
  } else if (/mobile|iphone|ipod|android|blackberry|iemobile|kindle/i.test(ua)) {
    deviceCategory = 'mobile';
  }

  let browser = 'Unknown';
  if (/chrome|crios/i.test(ua) && !/edg/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/edg/i.test(ua)) browser = 'Edge';

  let os = 'Unknown';
  if (/win/i.test(ua)) os = 'Windows';
  else if (/mac/i.test(ua) && !/iphone|ipad/i.test(ua)) os = 'macOS';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  return { deviceCategory, browser, os };
}

// 4. UTM and Referrer Extraction
export function getTrafficContext() {
  if (typeof window === 'undefined') return { referrer: 'direct' };
  const params = new URLSearchParams(window.location.search);
  const referrer = document.referrer ? new URL(document.referrer).hostname : 'direct';

  return {
    referrer,
    landingPage: window.location.pathname,
    utmSource: params.get('utm_source') || '',
    utmMedium: params.get('utm_medium') || '',
    utmCampaign: params.get('utm_campaign') || '',
    utmTerm: params.get('utm_term') || '',
    utmContent: params.get('utm_content') || ''
  };
}

// 5. Initialize Visitor Session with Backend (once per session)
export async function initializeAnalyticsSession() {
  if (typeof window === 'undefined') return;
  if (window.location.pathname.startsWith('/admin')) return; // Never track admin portal

  try {
    if (sessionStorage.getItem(SESSION_INIT_FLAG)) return;

    const visitorId = getVisitorId();
    const sessionId = getVisitorSessionId();
    const env = getClientEnvironment();
    const traffic = getTrafficContext();

    const apiUrl = import.meta.env.VITE_API_URL || '/api';
    const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;

    fetch(`${baseUrl}/analytics/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId,
        sessionId,
        ...env,
        ...traffic
      }),
      keepalive: true
    }).catch(() => {});

    sessionStorage.setItem(SESSION_INIT_FLAG, 'true');
  } catch (_) {}
}

// 6. Record Page View or Custom Event
export async function trackAnalyticsEvent(eventType, metadata = {}) {
  if (typeof window === 'undefined') return;
  if (window.location.pathname.startsWith('/admin')) return;

  try {
    const visitorId = getVisitorId();
    const sessionId = getVisitorSessionId();
    const apiUrl = import.meta.env.VITE_API_URL || '/api';
    const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;

    fetch(`${baseUrl}/analytics/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId,
        sessionId,
        eventType,
        pagePath: window.location.pathname,
        pageTitle: document.title,
        ...metadata
      }),
      keepalive: true
    }).catch(() => {});
  } catch (_) {}
}

// 7. Duplicate Guard for Product Views (30-second window)
export function shouldRecordProductView(productKey) {
  if (!productKey) return false;
  try {
    const raw = sessionStorage.getItem(VIEW_CACHE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    const now = Date.now();
    const lastTime = map[productKey] || 0;

    if (now - lastTime < 30 * 1000) {
      return false;
    }

    map[productKey] = now;
    sessionStorage.setItem(VIEW_CACHE_KEY, JSON.stringify(map));
    return true;
  } catch (_) {
    return true;
  }
}

// 8. Resolve Asset URLs (Local or Cloudinary)
export function resolveAssetUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  if (apiUrl.startsWith('http') && url.startsWith('/assets/uploads/')) {
    const origin = apiUrl.replace(/\/api\/?$/, '');
    return `${origin}${url}`;
  }
  return url.startsWith('/') ? url : `/${url}`;
}
