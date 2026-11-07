const SESSION_KEY = 'sriyas_visitor_session_id';
const VIEW_CACHE_KEY = 'sriyas_recent_product_views';

export function getVisitorSessionId() {
  try {
    let sessionId = sessionStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      const randomPart = Math.random().toString(36).substring(2, 11);
      const timePart = Date.now().toString(36);
      sessionId = `vis_${timePart}_${randomPart}`;
      sessionStorage.setItem(SESSION_KEY, sessionId);
    }
    return sessionId;
  } catch (_) {
    return 'vis_anonymous_fallback';
  }
}

export function shouldRecordProductView(productKey) {
  if (!productKey) return false;
  try {
    const raw = sessionStorage.getItem(VIEW_CACHE_KEY);
    const map = raw ? JSON.parse(raw) : {};
    const now = Date.now();
    const lastTime = map[productKey] || 0;

    // Prevent React StrictMode double-mount or re-renders within 30 seconds from double-firing
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

