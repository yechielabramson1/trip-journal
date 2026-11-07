/* Service Worker — NETWORK-FIRST for the app shell.
 * תמיד מנסה רשת קודם (כדי שעדכונים יופיעו מיד), ונופל ל-cache רק כשאין רשת
 * (כך האפליקציה עדיין נפתחת אופליין בהרים). POSTים לשרת לא עוברים דרך ה-SW.
 */
const CACHE = 'fieldcapture-v111';
const NET_TIMEOUT_MS = 4000, NET_HARD_TIMEOUT_MS = 30000;
const SHELL = ['./','./index.html','./app.js?v=111','./manifest.json','./icons/icon-192.png','./icons/icon-512.png'];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e=>{
  const url=new URL(e.request.url);
  if(e.request.method!=='GET' || url.origin!==location.origin) return;   // לשרת (POST) — לא נוגעים
  // One fallback for every "no usable network answer" path (immediate offline, hard timeout): the cached copy;
  // else, for a page navigation, the cached shell; else a clean network error — never undefined, never HTML as JS.
  const fallback = ()=> caches.match(e.request).then(hit=> hit || (e.request.mode==='navigate'
      ? caches.match('./index.html').then(h=> h || Response.error()) : Response.error()));
  // Cache ONLY successful responses. A host outage (e.g. a Pages 404) must never
  // overwrite the offline shell; on a non-OK answer serve the cached copy if we have one.
  const net = fetch(e.request).then(resp=>{
    if(resp.ok){ const copy=resp.clone(); caches.open(CACHE).then(c=>c.put(e.request, copy)).catch(()=>{}); return resp; }
    return caches.match(e.request).then(hit=> hit || resp);
  }).catch(fallback);
  // R6/R7: a hung network ("zombie" Wi-Fi) must not block the app: cached copy after NET_TIMEOUT_MS; clean fallback
  // after NET_HARD_TIMEOUT_MS. The first settled branch wins; both timers are cleared then. A late network answer can
  // only refresh the cache (OK responses, best effort), never replace what was already served.
  let t1=null, t2=null;
  const slow = new Promise(res=>{
    t1 = setTimeout(()=> caches.match(e.request).then(hit=>{ if(hit) res(hit); }), NET_TIMEOUT_MS);
    t2 = setTimeout(()=> res(fallback()), NET_HARD_TIMEOUT_MS);
  });
  e.respondWith(Promise.race([net, slow]).then(r=>{ clearTimeout(t1); clearTimeout(t2); return r; }));
});
