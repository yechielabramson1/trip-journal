/* =============================================================================
 * Field Capture System — PWA client (multi-trip, offline-first)
 * מקור-אמת: Travel/codex/field-capture-spec.md
 * ========================================================================== */

const ENDPOINT = 'https://script.google.com/macros/s/AKfycbynUyrLc_CHpMDhZar4eeE1GhMM0UIFi3Yk3hH7vpIy1noid6n8U4sJm18BIqG4Ep8QsQ/exec';
const SCHEMA_V = 2;
const MAX_BYTES = 9 * 1024 * 1024;   // הגבלת גודל קובץ (גוף Apps Script)

// ה-token נטען פעם אחת למכשיר דרך ?t= ונשמר ב-localStorage (לא ב-repo)
(function(){ const u=new URL(location.href); const t=u.searchParams.get('t');
  if(t){ localStorage.setItem('token', t); u.searchParams.delete('t'); history.replaceState({},'',u.pathname+(u.search||'')); } })();

const $ = (id) => document.getElementById(id);
const uuid = () => (crypto.randomUUID ? crypto.randomUUID()
  : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=Math.random()*16|0;return (c==='x'?r:(r&0x3|0x8)).toString(16);}));
const token = () => localStorage.getItem('token') || '';
const clientId = () => { let c=localStorage.getItem('cid'); if(!c){c=uuid();localStorage.setItem('cid',c);} return c; };
const getAuthor = () => localStorage.getItem('author') || '';

/* ---------- i18n (he/en by author) ---------- */
const I18N = {
  he:{ ph:'דבר אל המקלדת או הקלד מה קורה עכשיו…', save:'💾 שמור ליומן', photo:'📷 תמונה', doc:'📁 מסמך', receipt:'🧾 קבלה',
       synced:'הכל מסונכרן ✓', pending:n=>'מסנכרן · '+n+' ממתינות', off:n=>'לא מקוון · '+n+' ממתינות', needcfg:'נדרשת הגדרה — פתח קישור ה-token',
       saved:'📝 נשמר', compressing:'🗜️ מעבד…', queued:'⬆️ בתור', toobig:'⚠️ הקובץ גדול מדי', mytrips:'🏔️ המסעות שלי', newtrip:'➕ טיול חדש', drive:'📂 פתח בדרייב', switched:'➡️ עברת ל', ask:"🤖 שאל את הקונסיירז'", thinking:'🤖 חושב…', neednet:'🤖 צריך חיבור לאינטרנט' },
  en:{ ph:'Speak or type what’s happening now…', save:'💾 Save to journal', photo:'📷 Photo', doc:'📁 Document', receipt:'🧾 Receipt',
       synced:'All synced ✓', pending:n=>'Syncing · '+n+' pending', off:n=>'Offline · '+n+' pending', needcfg:'Setup needed — open the token link',
       saved:'📝 Saved', compressing:'🗜️ Processing…', queued:'⬆️ Queued', toobig:'⚠️ File too large', mytrips:'🏔️ My Trips', newtrip:'➕ New trip', drive:'📂 Open in Drive', switched:'➡️ Switched to ', ask:'🤖 Ask the concierge', thinking:'🤖 Thinking…', neednet:'🤖 Internet connection needed' }
};
const uiLang = () => getAuthor()==='Sky' ? 'en' : 'he';
const T = () => I18N[uiLang()];
function applyLang(){
  const t=T(), en=uiLang()==='en';
  document.documentElement.lang = en?'en':'he';
  document.documentElement.dir  = en?'ltr':'rtl';
  $('txt').placeholder=t.ph; $('save').textContent=t.save;
  document.querySelector('.act.photo').textContent=t.photo;
  document.querySelector('.act.doc').textContent=t.doc;
  document.querySelector('.act.receipt').textContent=t.receipt;
  $('drawer').querySelector('h2').textContent=t.mytrips;
  $('newtrip').textContent=t.newtrip; $('drivelink').textContent=t.drive;
  $('askbtn').textContent=t.ask;
}
function setAuthor(n){ localStorage.setItem('author', n||''); $('who').textContent = n ? ('· '+n) : '?'; applyLang(); render(); }

/* ---------- trips ---------- */
const getTripId   = () => localStorage.getItem('tripId') || '';
const getTripName = () => localStorage.getItem('tripName') || '';
function setTrip(id, name){
  localStorage.setItem('tripId', id||''); localStorage.setItem('tripName', name||'');
  $('tripname').textContent = name || 'יומן מסע';
  $('drivelink').href = id ? ('https://drive.google.com/drive/folders/'+id) : '#';
}
function cachedTrips(){ try{ return JSON.parse(localStorage.getItem('trips')||'[]'); }catch(e){ return []; } }
async function initTrips(){
  try{
    const r = await api({ action:'list_trips' });
    if(r.ok && Array.isArray(r.trips)){
      localStorage.setItem('trips', JSON.stringify(r.trips));
      const cur = r.trips.find(t=>t.tripId===getTripId());
      if(!cur && r.trips.length){ const last=r.trips[r.trips.length-1]; setTrip(last.tripId,last.name); }
      else if(cur){ setTrip(cur.tripId,cur.name); }
    }
  }catch(e){ /* offline — נשתמש ב-cache */ }
  renderDrawer();
}
function renderDrawer(){
  const list=$('triplist'); list.innerHTML='';
  cachedTrips().forEach(t=>{
    const d=document.createElement('div');
    d.className='trip'+(t.tripId===getTripId()?' active':'');
    d.innerHTML='<span class="dot"></span><span>'+escapeHtml(t.name)+'</span>';
    d.onclick=()=>{ setTrip(t.tripId,t.name); closeDrawer(); renderDrawer(); logLine((T().switched||'➡️ ')+t.name); };
    list.appendChild(d);
  });
}
function escapeHtml(s){ return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

/* ---------- API (online actions) ---------- */
async function api(payload){
  const r = await fetch(ENDPOINT, { method:'POST', redirect:'follow',
    headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify({ v:SCHEMA_V, token:token(), ...payload }) });
  if(!r.ok) throw new Error('HTTP '+r.status);
  return r.json();
}

/* ---------- IndexedDB queue ---------- */
const DB_NAME='fieldCapture', STORE='queue';
function openDB(){ return new Promise((res,rej)=>{ const r=indexedDB.open(DB_NAME,1);
  r.onupgradeneeded=()=>{ r.result.createObjectStore(STORE,{keyPath:'seq',autoIncrement:true}); };
  r.onsuccess=()=>res(r.result); r.onerror=()=>rej(r.error); }); }
async function dbAdd(i){ const db=await openDB(); return new Promise((res,rej)=>{ const tx=db.transaction(STORE,'readwrite'); tx.objectStore(STORE).add(i); tx.oncomplete=res; tx.onerror=()=>rej(tx.error); }); }
async function dbAll(){ const db=await openDB(); return new Promise((res,rej)=>{ const tx=db.transaction(STORE,'readonly'); const q=tx.objectStore(STORE).getAll(); q.onsuccess=()=>res(q.result); q.onerror=()=>rej(q.error); }); }
async function dbDel(seq){ const db=await openDB(); return new Promise((res,rej)=>{ const tx=db.transaction(STORE,'readwrite'); tx.objectStore(STORE).delete(seq); tx.oncomplete=res; tx.onerror=()=>rej(tx.error); }); }
async function dbCount(){ return (await dbAll()).length; }

/* ---------- media helpers ---------- */
function compressImage(file, maxDim=1600, quality=0.7){
  return new Promise((res,rej)=>{ const img=new Image(), url=URL.createObjectURL(file);
    img.onload=()=>{ URL.revokeObjectURL(url); let{width:w,height:h}=img;
      if(Math.max(w,h)>maxDim){ const s=maxDim/Math.max(w,h); w=Math.round(w*s); h=Math.round(h*s); }
      const cv=document.createElement('canvas'); cv.width=w; cv.height=h; cv.getContext('2d').drawImage(img,0,0,w,h);
      cv.toBlob(b=> b?res(b):rej(new Error('compress')), 'image/jpeg', quality); };
    img.onerror=rej; img.src=url; }); }
function blobToB64(blob){ return new Promise((res,rej)=>{ const r=new FileReader();
  r.onload=()=>res(String(r.result).split(',')[1]); r.onerror=rej; r.readAsDataURL(blob); }); }
function quickLocation(){ return new Promise(res=>{ if(!navigator.geolocation) return res(null);
  navigator.geolocation.getCurrentPosition(p=>res({lat:+p.coords.latitude.toFixed(5),lng:+p.coords.longitude.toFixed(5)}),()=>res(null),{enableHighAccuracy:false,timeout:4000,maximumAge:60000}); }); }

/* ---------- enqueue (ts + tripId captured NOW) ---------- */
async function enqueueJournal(text){
  const loc=await quickLocation();
  const p={ action:'append_journal', clientId:clientId(), author:getAuthor(), tripId:getTripId(), entryId:uuid(), ts:new Date().toISOString(), text };
  if(loc) p.location=loc;
  await dbAdd({ kind:'json', payload:p });
}
async function enqueueFile(file, category){
  let blob=file, mime=file.type||'application/octet-stream', name=file.name||'';
  const isImg=/^image\//.test(mime);
  if(isImg){ blob=await compressImage(file); mime='image/jpeg'; if(!/\.jpe?g$/i.test(name)) name=(name||'photo')+'.jpg'; }
  if(blob.size>MAX_BYTES){ logLine(T().toobig+' ('+Math.round(blob.size/1048576)+'MB)'); return false; }
  const action = category==='photo' ? 'upload_photo' : 'upload_doc';
  const p={ action, category, clientId:clientId(), author:getAuthor(), tripId:getTripId(), fileId:uuid(), ts:new Date().toISOString(), mime, name, caption:'' };
  await dbAdd({ kind:'file', payload:p, blob }); return true;
}

/* ---------- send + flush ---------- */
async function sendItem(item){
  const body={ ...item.payload, v:SCHEMA_V, token:token() };
  if(item.blob) body.dataB64=await blobToB64(item.blob);
  const r=await fetch(ENDPOINT,{ method:'POST', redirect:'follow', headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify(body) });
  if(!r.ok) throw new Error('HTTP '+r.status);
  const j=await r.json(); if(!j.ok) throw new Error(j.error||'server'); return j;
}
let flushing=false, backoff=0;
async function flush(){
  if(flushing||!token()) return; flushing=true;
  try{
    const items=(await dbAll()).sort((a,b)=>a.seq-b.seq);
    for(const it of items){
      try{ await sendItem(it); await dbDel(it.seq); backoff=0; }
      catch(err){ backoff=Math.min((backoff||1000)*2,60000); setTimeout(()=>{flushing=false;flush();},backoff); await render(); return; }
    }
  } finally { flushing=false; }
  await render();
}

/* ---------- UI ---------- */
async function render(){
  const n=await dbCount(); const s=$('status'); const t=T();
  if(!token()){ s.textContent=t.needcfg; s.className='off'; return; }
  if(!navigator.onLine){ s.textContent=t.off(n); s.className='off'; }
  else if(n>0){ s.textContent=t.pending(n); s.className='pending'; }
  else { s.textContent=t.synced; s.className='ok'; }
}
function logLine(t){ const d=document.createElement('div'); d.textContent=t; $('log').prepend(d); }
function openDrawer(){ $('drawer').classList.add('open'); $('scrim').classList.add('open'); }
function closeDrawer(){ $('drawer').classList.remove('open'); $('scrim').classList.remove('open'); }
function showTokenGate(){ $('tokengate').hidden=false; const i=$('tokin'); if(i){ i.value=token(); i.focus(); } }
function showGate(){ $('gate').hidden=false; }

/* ---------- events ---------- */
$('save').onclick=async()=>{ const t=$('txt').value.trim(); if(!t) return;
  $('save').disabled=true; await enqueueJournal(t); $('txt').value=''; logLine(T().saved+': '+t.slice(0,40)); await render(); flush(); $('save').disabled=false; };
async function handleFile(input, category){ const f=input.files[0]; if(!f) return; input.value='';
  logLine(T().compressing); const ok=await enqueueFile(f,category); if(ok) logLine(T().queued); await render(); flush(); }
$('cam').onchange     =()=>handleFile($('cam'),'photo');
$('docfile').onchange =()=>handleFile($('docfile'),'document');
$('rcptfile').onchange=()=>handleFile($('rcptfile'),'receipt');

$('menu').onclick=openDrawer; $('scrim').onclick=closeDrawer;
$('tripname').onclick=openDrawer;
$('who').onclick=showGate;
$('gate').querySelectorAll('button').forEach(b=> b.onclick=()=>{ setAuthor(b.dataset.name); $('gate').hidden=true; });
$('toksave').onclick=async()=>{ const v=$('tokin').value.trim(); if(!v) return;
  localStorage.setItem('token',v); $('tokengate').hidden=true; await initTrips(); if(!getAuthor()) showGate(); render(); flush(); };

// new trip
$('newtrip').onclick=()=>{ closeDrawer(); $('newtripname').value=''; $('newtripgate').hidden=false; $('newtripname').focus(); };
$('newtripcancel').onclick=()=>{ $('newtripgate').hidden=true; };
$('newtripcreate').onclick=async()=>{
  const name=$('newtripname').value.trim(); if(!name) return;
  $('newtripcreate').disabled=true;
  try{
    const r=await api({ action:'create_trip', name });
    if(r.ok && r.trip){
      const trips=cachedTrips(); trips.push(r.trip); localStorage.setItem('trips',JSON.stringify(trips));
      setTrip(r.trip.tripId,r.trip.name); renderDrawer(); $('newtripgate').hidden=true; logLine('🏔️ '+name);
    } else { alert('שגיאה: '+(r.error||'')); }
  }catch(e){ alert('אין חיבור — נסה שוב כשיש רשת'); }
  finally{ $('newtripcreate').disabled=false; await render(); }
};

// AI concierge
$('askbtn').onclick=()=>{ $('askreply').textContent=''; $('askq').value=''; $('askgate').hidden=false; $('askq').focus(); };
$('askclose').onclick=()=>{ $('askgate').hidden=true; };
$('asksend').onclick=async()=>{
  const q=$('askq').value.trim(); if(!q) return;
  if(!navigator.onLine){ $('askreply').textContent=T().neednet; return; }
  $('asksend').disabled=true; $('askreply').textContent=T().thinking;
  try{ const r=await api({ action:'ask', tripId:getTripId(), text:q });
    $('askreply').textContent = r.ok ? r.reply : ('⚠️ '+(r.error||'error'));
  }catch(e){ $('askreply').textContent=T().neednet; }
  finally{ $('asksend').disabled=false; }
};

addEventListener('online', flush); addEventListener('offline', render);
document.addEventListener('visibilitychange', ()=>{ if(!document.hidden){ flush(); initTrips();
  if('serviceWorker' in navigator) navigator.serviceWorker.getRegistration().then(r=>{ if(r) r.update(); }).catch(()=>{}); } });

/* ---------- boot ---------- */
(async()=>{
  if(navigator.storage && navigator.storage.persist) await navigator.storage.persist();
  // עדכון עצמי חלק: בכל פתיחה בודק גרסה חדשה; כשמגיעה — מתחלף ומרענן אוטומטית פעם אחת.
  if('serviceWorker' in navigator){
    const hadController = !!navigator.serviceWorker.controller;
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', ()=>{ if(refreshing || !hadController) return; refreshing=true; location.reload(); });
    navigator.serviceWorker.register('sw.js').then(function(reg){ reg.update(); }).catch(()=>{});
  }
  setAuthor(getAuthor());
  setTrip(getTripId(), getTripName());
  renderDrawer();
  if(!token()) showTokenGate();
  else { await initTrips(); if(!getAuthor()) showGate(); }
  await render(); flush();
})();
