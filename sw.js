/* Service Worker — app-shell precache (cache-first).
 * מאפשר לאפליקציה להיפתח גם בלי קליטה (קריטי בדולומיטים).
 * שים לב: בכל שינוי קוד — העלה את CACHE (v1→v2) כדי לדחוף עדכון.
 * הערה ל-iOS: אין Background Sync; ה-flush של התור נעשה ב-app.js בפתיחה/online.
 */
const CACHE = 'fieldcapture-v3';
const SHELL = ['./','./index.html','./app.js','./manifest.json','./icons/icon-192.png','./icons/icon-512.png'];

self.addEventListener('install', e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', e=>{
  const url=new URL(e.request.url);
  if(e.request.method!=='GET' || url.origin!==location.origin) return; // POSTים לשרת לא נכנסים ל-SW
  e.respondWith(caches.match(e.request).then(hit=> hit || fetch(e.request)));
});
