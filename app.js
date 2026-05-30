/* =============================================================================
 * Field Capture System — PWA client (Stage 1)
 * מקור-אמת: Travel/codex/field-capture-spec.md
 *
 * הרעיון המרכזי — OFFLINE FIRST:
 *   כל לכידה נכנסת קודם לתור מקומי ב-IndexedDB, ורק אחר כך מנסה לעלות לשרת.
 *   אם אין רשת — היא פשוט מחכה בתור. כשחוזרת רשת (או כשפותחים את האפליקציה)
 *   מרוקנים את התור אחד-אחד לפי הסדר. ככה לעולם לא מאבדים רשומה בדולומיטים.
 *
 *   על iPhone אין Background Sync — אז ה-flush קורה בשני רגעים בלבד:
 *   (1) כשהאפליקציה נפתחת/חוזרת לפורגראונד, (2) על אירוע 'online'.
 * ========================================================================== */

// ⚙️ הגדרות
const ENDPOINT = 'https://script.google.com/macros/s/AKfycbynUyrLc_CHpMDhZar4eeE1GhMM0UIFi3Yk3hH7vpIy1noid6n8U4sJm18BIqG4Ep8QsQ/exec';
const SCHEMA_V = 1;
// ה-token *לא* נשמר ב-repo (הקוד פומבי ב-GitHub Pages). הוא נטען פעם אחת לכל מכשיר:
//   פתח באייפון פעם אחת את:  <כתובת ה-PWA>?t=<FIELD_TOKEN>
//   הקוד שומר אותו ב-localStorage ומנקה אותו מה-URL מיד. כך הסוד נשאר על המכשיר בלבד.
(function(){ const u=new URL(location.href); const t=u.searchParams.get('t');
  if(t){ localStorage.setItem('token', t); u.searchParams.delete('t'); history.replaceState({},'',u.pathname+(u.search||'')); } })();
function token(){ return localStorage.getItem('token') || ''; }

/* דו-לשוני: יחיאל → עברית (RTL), Sky → English (LTR). נקבע לפי הכותב שנבחר במכשיר.
 * (הטקסט עצמו ביומן יכול להיות בכל שפה — זה רק שפת הממשק.) */
const I18N = {
  he:{ ph:'דבר אל המקלדת או הקלד מה קורה עכשיו…', save:'💾 שמור ליומן', photo:'📷 תמונה',
       synced:'הכל מסונכרן ✓', pending:n=>'מסנכרן · '+n+' ממתינות', off:n=>'לא מקוון · '+n+' ממתינות',
       needcfg:'נדרשת הגדרה — פתח קישור ה-token', saved:'📝 נשמר', compressing:'📷 דוחס תמונה…', queued:'📷 בתור' },
  en:{ ph:'Speak or type what’s happening now…', save:'💾 Save to journal', photo:'📷 Photo',
       synced:'All synced ✓', pending:n=>'Syncing · '+n+' pending', off:n=>'Offline · '+n+' pending',
       needcfg:'Setup needed — open the token link', saved:'📝 Saved', compressing:'📷 Compressing…', queued:'📷 Queued' }
};
function uiLang(){ return getAuthor()==='Sky' ? 'en' : 'he'; }
function T(){ return I18N[uiLang()]; }
function applyLang(){
  const t=T(), en=uiLang()==='en';
  document.documentElement.lang = en ? 'en' : 'he';
  document.documentElement.dir  = en ? 'ltr' : 'rtl';
  $('txt').placeholder = t.ph;
  $('save').textContent = t.save;
  const cam=document.querySelector('.cam'); if(cam) cam.textContent = t.photo;
}

// ---- כלים קטנים ----
const $ = (id) => document.getElementById(id);
const uuid = () => (crypto.randomUUID ? crypto.randomUUID()
  : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random()*16|0; return (c==='x'?r:(r&0x3|0x8)).toString(16); }));
function clientId(){ let c=localStorage.getItem('cid'); if(!c){c=uuid();localStorage.setItem('cid',c);} return c; }

/* זיהוי כותב — המערכת רב-משתמשים (יחיאל + רות, כל אחד בטלפון שלו).
 * נשמר פעם אחת ל-localStorage של המכשיר; מופיע ביומן ליד כל רשומה.
 * לחיצה על השם בכותרת מאפשרת החלפה. */
function getAuthor(){ return localStorage.getItem('author') || ''; }
function setAuthor(n){ localStorage.setItem('author', n); $('who').textContent = n ? ('· '+n) : '?'; applyLang(); render(); }
function showGate(){ $('gate').hidden = false; }
function showTokenGate(){ $('tokengate').hidden = false; const i=$('tokin'); if(i){ i.value=token(); i.focus(); } }

/* ----------------------------------------------------------------------------
 * IndexedDB — תור מתמשך. בחרנו IndexedDB (ולא localStorage) כי הוא:
 *   (א) שומר Blobים גולמיים של תמונות (לא base64 שמנפח 33%),
 *   (ב) אסינכרוני ולא חוסם את ה-UI, (ג) הרבה יותר גדול.
 * המפתח 'seq' עולה אוטומטית → שומר סדר FIFO אמיתי.
 * -------------------------------------------------------------------------- */
const DB_NAME='fieldCapture', STORE='queue';
function openDB(){
  return new Promise((res,rej)=>{
    const r=indexedDB.open(DB_NAME,1);
    r.onupgradeneeded=()=>{ r.result.createObjectStore(STORE,{keyPath:'seq',autoIncrement:true}); };
    r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error);
  });
}
async function dbAdd(item){ const db=await openDB(); return new Promise((res,rej)=>{ const tx=db.transaction(STORE,'readwrite'); tx.objectStore(STORE).add(item); tx.oncomplete=res; tx.onerror=()=>rej(tx.error); }); }
async function dbAll(){ const db=await openDB(); return new Promise((res,rej)=>{ const tx=db.transaction(STORE,'readonly'); const rq=tx.objectStore(STORE).getAll(); rq.onsuccess=()=>res(rq.result); rq.onerror=()=>rej(rq.error); }); }
async function dbDel(seq){ const db=await openDB(); return new Promise((res,rej)=>{ const tx=db.transaction(STORE,'readwrite'); tx.objectStore(STORE).delete(seq); tx.oncomplete=res; tx.onerror=()=>rej(tx.error); }); }
async function dbCount(){ return (await dbAll()).length; }

/* ----------------------------------------------------------------------------
 * דחיסת תמונה בצד-לקוח: מקטינים ל-1600px ו-JPEG 70% לפני שליחה.
 * חשוב כי גוף הבקשה של Apps Script מוגבל, ותמונה גולמית מהאייפון היא ~3-5MB.
 * -------------------------------------------------------------------------- */
function compressImage(file, maxDim=1600, quality=0.7){
  return new Promise((res,rej)=>{
    const img=new Image(), url=URL.createObjectURL(file);
    img.onload=()=>{
      URL.revokeObjectURL(url);
      let {width:w,height:h}=img;
      if(Math.max(w,h)>maxDim){ const s=maxDim/Math.max(w,h); w=Math.round(w*s); h=Math.round(h*s); }
      const cv=document.createElement('canvas'); cv.width=w; cv.height=h;
      cv.getContext('2d').drawImage(img,0,0,w,h);
      cv.toBlob(b=> b?res(b):rej(new Error('compress failed')), 'image/jpeg', quality);
    };
    img.onerror=rej; img.src=url;
  });
}
function blobToB64(blob){
  return new Promise((res,rej)=>{ const r=new FileReader();
    r.onload=()=>res(String(r.result).split(',')[1]);   // מסיר את "data:…;base64,"
    r.onerror=rej; r.readAsDataURL(blob); });
}

/* ----------------------------------------------------------------------------
 * GPS — מנסים לתפוס מיקום מהיר ולא-חוסם. אם נכשל/אין הרשאה → ממשיכים בלי.
 * -------------------------------------------------------------------------- */
function quickLocation(){
  return new Promise(res=>{
    if(!navigator.geolocation) return res(null);
    navigator.geolocation.getCurrentPosition(
      p=>res({lat:+p.coords.latitude.toFixed(5), lng:+p.coords.longitude.toFixed(5)}),
      ()=>res(null), {enableHighAccuracy:false, timeout:4000, maximumAge:60000});
  });
}

/* ----------------------------------------------------------------------------
 * Enqueue — כל לכידה. ה-ts נתפס *כאן*, ברגע הלכידה, ולעולם לא משתנה בריטריי.
 * זה מה ששומר על אמת כרונולוגית ביומן.
 * -------------------------------------------------------------------------- */
async function enqueueJournal(text){
  const loc = await quickLocation();
  const payload = { v:SCHEMA_V, action:'append_journal', clientId:clientId(), author:getAuthor(),
    entryId:uuid(), ts:new Date().toISOString(), text };
  if(loc) payload.location = loc;
  await dbAdd({ kind:'json', payload });
}
async function enqueuePhoto(file){
  const blob = await compressImage(file);
  const payload = { v:SCHEMA_V, action:'upload_photo', clientId:clientId(), author:getAuthor(),
    photoId:uuid(), ts:new Date().toISOString(), mime:'image/jpeg', caption:'' };
  await dbAdd({ kind:'photo', payload, blob });   // ה-Blob נשמר גולמי; נקודד ל-b64 רק בשליחה
}

/* ----------------------------------------------------------------------------
 * Send — POST יחיד ב-text/plain (אפס CORS preflight, בדיוק כמו במערכת WhatsApp).
 * -------------------------------------------------------------------------- */
async function sendItem(item){
  const body = {...item.payload, token:token()};
  if(item.kind==='photo') body.dataB64 = await blobToB64(item.blob);
  const r = await fetch(ENDPOINT, { method:'POST', redirect:'follow',
    headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify(body) });
  if(!r.ok) throw new Error('HTTP '+r.status);
  const j = await r.json();
  if(!j.ok) throw new Error(j.error||'server error');
  return j;   // {ok:true, wrote:true|false}  — wrote:false = כבר נכתב (idempotent), בטוח למחוק מהתור
}

/* ----------------------------------------------------------------------------
 * Flush — מרוקן את התור FIFO, סדרתי (אחד-אחד), עם backoff.
 *   - serial: כדי לשמור על סדר ולא להציף את Apps Script.
 *   - כישלון על פריט = עוצרים את הסבב (כנראה offline) ומנסים שוב בפעם הבאה.
 *   - אנו לא סומכים על navigator.onLine בלבד — captive portals "משקרים".
 * -------------------------------------------------------------------------- */
let flushing=false, backoff=0;
async function flush(){
  if(flushing) return; flushing=true;
  try{
    const items=(await dbAll()).sort((a,b)=>a.seq-b.seq);
    for(const it of items){
      try{
        await sendItem(it);
        await dbDel(it.seq);     // הצליח (או idempotent) → הסר מהתור
        backoff=0;
      }catch(err){
        backoff=Math.min((backoff||1000)*2, 60000);   // 1s→2s→…→60s תקרה
        setTimeout(()=>{ flushing=false; flush(); }, backoff);
        await render(); return;  // עצור את הסבב — נמשיך כשהרשת תחזור
      }
    }
  } finally { flushing=false; }
  await render();
}

/* ---- UI / status ---- */
async function render(){
  const n=await dbCount(); const s=$('status'); const t=T();
  if(!token()){ s.textContent=t.needcfg; s.className='off'; return; }
  if(!navigator.onLine){ s.textContent=t.off(n); s.className='off'; }
  else if(n>0){ s.textContent=t.pending(n); s.className='pending'; }
  else { s.textContent=t.synced; s.className='ok'; }
}
function logLine(t){ const d=document.createElement('div'); d.textContent=t; $('log').prepend(d); }

/* ---- אירועים ---- */
$('save').onclick=async()=>{
  const t=$('txt').value.trim(); if(!t) return;
  $('save').disabled=true;
  await enqueueJournal(t); $('txt').value=''; logLine(T().saved+': '+t.slice(0,40));
  await render(); flush(); $('save').disabled=false;
};
$('cam').onchange=async(e)=>{
  const f=e.target.files[0]; if(!f) return;
  logLine(T().compressing); await enqueuePhoto(f); e.target.value='';
  logLine(T().queued); await render(); flush();
};

// בחירת כותב
$('who').onclick = showGate;
$('gate').querySelectorAll('button').forEach(b=> b.onclick = ()=>{ setAuthor(b.dataset.name); $('gate').hidden = true; });

// הזנת token ידנית (fallback לאייפון אם ?t= לא נשמר)
$('toksave').onclick = ()=>{
  const v=$('tokin').value.trim(); if(!v) return;
  localStorage.setItem('token', v); $('tokengate').hidden = true;
  if(!getAuthor()) showGate();        // אחרי token → בחר כותב
  render(); flush();
};

// iOS: אין background sync — מסנכרנים בכל חזרה לפורגראונד + על 'online'
addEventListener('online', flush);
addEventListener('offline', render);
document.addEventListener('visibilitychange', ()=>{ if(!document.hidden) flush(); });

// boot
(async ()=>{
  if(navigator.storage && navigator.storage.persist) await navigator.storage.persist(); // אל תפנה את התור!
  if('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(()=>{});
  setAuthor(getAuthor());            // מצייר את השם בכותרת + מחיל שפה
  applyLang();
  if(!token()) showTokenGate();      // אין token → בקש להדביק (חסין-תקלות לאייפון)
  else if(!getAuthor()) showGate();  // יש token, אין כותב → בחר מי אתה
  await render(); flush();
})();
