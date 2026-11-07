/* Service Worker — NETWORK-FIRST for the app shell.
 * תמיד מנסה רשת קודם (כדי שעדכונים יופיעו מיד), ונופל ל-cache רק כשאין רשת
 * (כך האפליקציה עדיין נפתחת אופליין בהרים). POSTים לשרת לא עוברים דרך ה-SW.
 */
const CACHE = 'fieldcapture-v110';
const SHELL = ['./','./index.html','./app.js?v=110','./manifest.json','./icons/icon-192.png','./icons/icon-512.png'];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e=>{
  const url=new URL(e.request.url);
  if(e.request.method!=='GET' || url.origin!==location.origin) return;   // לשרת (POST) — לא נוגעים
  e.respondWith(
    fetch(e.request).then(resp=>{
      // Cache ONLY successful responses. A host outage (e.g. a Pages 404) must never
      // overwrite the offline shell; on a non-OK answer serve the cached copy if we have one.
      if(resp.ok){ const copy=resp.clone(); caches.open(CACHE).then(c=>c.put(e.request, copy)).catch(()=>{}); return resp; }
      return caches.match(e.request).then(hit=> hit || resp);
    // Offline + cache miss: only page navigations fall back to the shell; never serve HTML as JS/CSS/image.
    }).catch(()=> caches.match(e.request).then(hit=> hit || (e.request.mode==='navigate' ? caches.match('./index.html') : Response.error())))
  );
});
