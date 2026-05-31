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
function ensureTrip(){ if(!getTripId()){ alert('בחר טיול קודם דרך התפריט ☰'); openDrawer(); return false; } return true; }
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

async function enqueueExpense(data, file){
  const p={ action:'add_expense', clientId:clientId(), author:getAuthor(), tripId:getTripId(), expenseId:uuid(), ts:new Date().toISOString(), ...data };
  if(file){ let blob=file, mime=file.type||'image/jpeg', name=file.name||'';
    if(/^image\//.test(mime)){ blob=await compressImage(file); mime='image/jpeg'; name=(name||'receipt')+'.jpg'; }
    if(blob.size>MAX_BYTES){ logLine(T().toobig); return false; }
    p.mime=mime; p.name=name; await dbAdd({ kind:'file', payload:p, blob });
  } else { await dbAdd({ kind:'json', payload:p }); }
  return true;
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
$('save').onclick=async()=>{ const t=$('txt').value.trim(); if(!t) return; if(!ensureTrip()) return;
  $('save').disabled=true; await enqueueJournal(t); $('txt').value=''; logLine(T().saved+': '+t.slice(0,40)); await render(); flush(); $('save').disabled=false; };
async function handleFile(input, category){ const f=input.files[0]; if(!f) return; input.value=''; if(!ensureTrip()) return;
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
$('askbtn').onclick=()=>{ $('askreply').textContent=''; $('askq').value=''; $('storylink').style.display='none'; $('askgate').hidden=false; $('askq').focus(); };
$('askclose').onclick=()=>{ $('askgate').hidden=true; };
$('asksend').onclick=async()=>{
  const q=$('askq').value.trim(); if(!q) return;
  if(!navigator.onLine){ $('askreply').textContent=T().neednet; return; }
  $('storylink').style.display='none';
  $('asksend').disabled=true; $('askreply').textContent=T().thinking;
  try{ const r=await api({ action:'ask', tripId:getTripId(), text:q });
    $('askreply').textContent = r.ok ? r.reply : ('⚠️ '+(r.error||'error'));
  }catch(e){ $('askreply').textContent=T().neednet; }
  finally{ $('asksend').disabled=false; }
};
$('storybtn').onclick=async()=>{
  if(!navigator.onLine){ $('askreply').textContent=T().neednet; return; }
  $('storylink').style.display='none';
  $('storybtn').disabled=true; $('askreply').textContent='📖 כותב את הסיפור…';
  try{ const r=await api({ action:'story', tripId:getTripId(), scope:'all' });
    if(r.ok){ $('askreply').textContent=r.text; if(r.storyUrl){ $('storylink').href=r.storyUrl; $('storylink').style.display='block'; } }
    else { $('askreply').textContent='⚠️ '+(r.error||'error'); }
  }catch(e){ $('askreply').textContent=T().neednet; }
  finally{ $('storybtn').disabled=false; }
};

// expenses
let exFile=null, editingId=null;
function resetExpenseForm(){
  editingId=null; exFile=null; $('exAmount').value=''; $('exDesc').value='';
  $('exReceiptLabel').textContent='📷 צרף קבלה / צילום מסך'; $('exSave').textContent='💾 שמור הוצאה';
  $('exKeepImg').checked=false; $('exDelete').style.display='none';
  $('exList').style.display='none'; $('exList').innerHTML='';
}
$('expensebtn').onclick=async()=>{
  resetExpenseForm(); $('exSheetLink').style.display='none';
  $('expensegate').hidden=false; $('exAmount').focus();
  if(navigator.onLine){ try{ const r=await api({ action:'expense_url', tripId:getTripId() }); if(r.ok && r.url){ $('exSheetLink').href=r.url; $('exSheetLink').style.display='block'; } }catch(e){} }
};
// צירוף/הדבקת צילום → קריאה אוטומטית (Vision) והשלמת השדות
async function useReceiptImage(file){
  exFile=file; if(!file) return;
  if(!navigator.onLine){ $('exReceiptLabel').textContent='📷 צורף (אין רשת לקריאה אוטומטית)'; return; }
  $('exReceiptLabel').textContent='🔍 קורא את הקבלה…';
  try{
    const blob=await compressImage(file); const b64=await blobToB64(blob);
    const r=await api({ action:'parse_receipt', mime:'image/jpeg', dataB64:b64 });
    if(r.ok && r.data){ const d=r.data;
      if(d.amount) $('exAmount').value=d.amount;
      if(d.currency && [...$('exCurrency').options].some(o=>o.value===d.currency)) $('exCurrency').value=d.currency;
      if(d.merchant) $('exDesc').value=d.merchant;
      if(d.category){ const o=[...$('exCategory').options].find(x=>x.value===d.category||x.text===d.category); if(o) $('exCategory').value=o.value; }
      $('exReceiptLabel').textContent='✅ '+(d.merchant||'נקרא')+' · '+(d.amount||'')+' '+(d.currency||'');
    } else $('exReceiptLabel').textContent='📷 צורף (מלא ידנית)';
  }catch(e){ $('exReceiptLabel').textContent='📷 צורף'; }
}
$('exReceipt').onchange=()=>{ const f=$('exReceipt').files[0]; if(f) useReceiptImage(f); };
$('exPaste').onclick=async()=>{
  if(!navigator.clipboard || !navigator.clipboard.read){ alert('הדפדפן לא תומך בהדבקה מהלוח — השתמש ב"צרף קבלה".'); return; }
  try{
    const items=await navigator.clipboard.read();
    for(const it of items){
      const type=it.types.find(t=>t.startsWith('image/'));
      if(type){ const blob=await it.getType(type); useReceiptImage(new File([blob],'screenshot.'+(type.split('/')[1]||'png'),{type})); return; }
    }
    alert('לא נמצאה תמונה בלוח. עשה "Copy and Delete" על צילום המסך באייפון ואז נסה שוב.');
  }catch(e){ alert('לא ניתן לקרוא מהלוח. ודא שהענקת הרשאה, או השתמש ב"צרף קבלה".'); }
};
$('exEditBtn').onclick=async()=>{
  if(!navigator.onLine){ alert('צריך חיבור כדי לטעון הוצאות לעריכה'); return; }
  const r=await api({ action:'list_expenses', tripId:getTripId() }); const list=$('exList'); list.innerHTML='';
  if(r.ok && r.expenses && r.expenses.length){
    r.expenses.forEach(e=>{ const d=document.createElement('div'); d.className='trip';
      d.textContent='💶 '+e.date+' · '+e.category+' · '+e.amount+' '+e.currency+(e.description?(' · '+e.description):'');
      d.onclick=()=>{ editingId=e.id; $('exAmount').value=e.amount; $('exDesc').value=e.description||'';
        if([...$('exCurrency').options].some(o=>o.value===e.currency)) $('exCurrency').value=e.currency;
        const o=[...$('exCategory').options].find(x=>x.value===e.category); if(o) $('exCategory').value=e.category;
        $('exMethod').value=e.method||'Apple Pay'; $('exSave').textContent='💾 עדכן הוצאה'; $('exDelete').style.display='block'; list.style.display='none'; $('exAmount').focus(); };
      list.appendChild(d); });
    list.style.display='block';
  } else { list.innerHTML='<div style="padding:8px;color:#64748b">אין הוצאות עדיין</div>'; list.style.display='block'; }
};
$('exClose').onclick=()=>{ $('expensegate').hidden=true; };
$('exDelete').onclick=async()=>{
  if(!editingId) return;
  if(!navigator.onLine){ alert('מחיקה דורשת חיבור'); return; }
  if(!confirm('למחוק את ההוצאה הזו?')) return;
  $('exDelete').disabled=true;
  try{ const r=await api({ action:'delete_expense', tripId:getTripId(), expenseId:editingId });
    if(r.ok){ logLine('🗑️ הוצאה נמחקה'); resetExpenseForm(); $('expensegate').hidden=true; } else alert('שגיאה: '+(r.error||''));
  }catch(e){ alert('אין חיבור — נסה שוב'); }
  finally{ $('exDelete').disabled=false; }
};
$('exSave').onclick=async()=>{
  const amount=parseFloat($('exAmount').value); if(!(amount>0)){ $('exAmount').focus(); return; }
  if(!ensureTrip()) return;
  $('exSave').disabled=true;
  const fields={ amount:amount, currency:$('exCurrency').value, category:$('exCategory').value, description:$('exDesc').value.trim(), method:$('exMethod').value };
  let ok=true;
  const keepImg = $('exKeepImg').checked;       // התמונה נשמרת רק אם סומן (אחרת רק הנתונים)
  if(editingId){            // עריכה — דורש חיבור (update ישיר)
    if(!navigator.onLine){ alert('עריכת הוצאה דורשת חיבור'); $('exSave').disabled=false; return; }
    try{ const payload={ action:'update_expense', tripId:getTripId(), expenseId:editingId, ...fields };
      if(exFile && keepImg){ const blob=/^image\//.test(exFile.type)?await compressImage(exFile):exFile; payload.mime='image/jpeg'; payload.name='receipt.jpg'; payload.dataB64=await blobToB64(blob); }
      const r=await api(payload); ok=r.ok; if(ok) logLine('✏️ עודכן: '+fields.category+' · '+amount);
    }catch(e){ ok=false; }
  } else {                  // חדש — דרך התור (עובד offline)
    ok=await enqueueExpense(fields, keepImg ? exFile : null);
    if(ok) logLine('💶 '+fields.category+' · '+amount+' '+fields.currency);
  }
  if(ok){ resetExpenseForm(); $('expensegate').hidden=true; }
  await render(); flush(); $('exSave').disabled=false;
};

/* ---------- Itinerary (תכנית יומית) ---------- */
let itinItems=[], itinStart='', itinDays=0, editItem=null, itinDayView=null;
function toMin(t){ if(!t) return null; const p=String(t).split(':'); if(p.length<2) return null; return (+p[0])*60+(+p[1]); }
const TYPE_ICON={activity:'🥾',sight:'📸',meal:'🍽️',hotel:'🏨',travel:'🚗'};
function ymd(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function parseYmd(s){ const p=String(s).split('-'); return new Date(+p[0], (+p[1]||1)-1, (+p[2]||1)); }
function dayLabel(s){ try{ return parseYmd(s).toLocaleDateString('he-IL',{weekday:'long',day:'2-digit',month:'2-digit'}); }catch(e){ return s; } }
function dayList(){
  let days=[];
  if(itinStart && itinDays){ const st=parseYmd(itinStart); for(let i=0;i<itinDays;i++){ const d=new Date(st); d.setDate(st.getDate()+i); days.push(ymd(d)); } }
  itinItems.forEach(i=>{ if(i.day && days.indexOf(i.day)<0) days.push(i.day); });
  if(!days.length) days=[ymd(new Date())];
  return days;
}
async function openItin(){
  if(!ensureTrip()) return;
  itinDayView=null;
  $('itin').hidden=false; $('itinTitle').textContent='🗓️ '+(getTripName()||'תכנית');
  $('itinBody').innerHTML='<div class="emptyday">טוען…</div>';
  await reloadItin();
}
async function reloadItin(){
  try{ const r=await api({action:'list_itinerary', tripId:getTripId()});
    if(r.ok){ itinItems=r.items||[]; itinStart=r.startDate||itinStart; itinDays=Number(r.days)||itinDays; renderItin(); }
    else $('itinBody').innerHTML='<div class="emptyday">שגיאה: '+escapeHtml(r.error||'')+'</div>';
  }catch(e){ $('itinBody').innerHTML='<div class="emptyday">אין חיבור</div>'; }
}
function renderItin(){ if(itinDayView) renderDayGrid(itinDayView); else renderOverview(); }
function itemCard(it, withLinks){
  const c=document.createElement('div'); c.className='icard'; c.onclick=()=>openItem(it, it.day);
  const tm=(it.time||'')+(it.endTime?('–'+it.endTime):'');
  let links='';
  const q=(it.address||it.location||'').trim();
  if(withLinks && q){ const eq=encodeURIComponent(q);
    links+='<a class="lnk" href="https://www.google.com/maps/search/?api=1&query='+eq+'" target="_blank" rel="noopener" onclick="event.stopPropagation()">🗺️ מפות</a>';
    links+='<a class="lnk" href="waze://?q='+eq+'&navigate=yes" onclick="event.stopPropagation()">🚗 Waze</a>'; }
  const sub=[it.location, it.notes].filter(Boolean).map(escapeHtml).join(' · ');
  c.innerHTML='<div class="t">'+escapeHtml(tm||'—')+'</div><div class="bd"><div class="ttl">'+(TYPE_ICON[it.type]||'•')+' '+escapeHtml(it.title||'')+'</div>'+(sub?('<div class="sub">'+sub+'</div>'):'')+(links?('<div class="sub">'+links+'</div>'):'')+'</div>';
  return c;
}
function renderOverview(){
  const body=$('itinBody'); body.innerHTML='';
  dayList().forEach((day,idx)=>{
    const hdr=document.createElement('div'); hdr.className='dayhdr tap';
    const lbl=document.createElement('span'); lbl.style.flex='1'; lbl.textContent='יום '+(idx+1)+' · '+dayLabel(day);
    hdr.appendChild(lbl);
    const add=document.createElement('button'); add.textContent='＋'; add.onclick=(e)=>{ e.stopPropagation(); openItem(null, day); }; hdr.appendChild(add);
    hdr.onclick=()=>{ itinDayView=day; renderItin(); $('itinBody').scrollTop=0; };
    body.appendChild(hdr);
    const items=itinItems.filter(i=>i.day===day).sort((a,b)=>(a.order-b.order)||String(a.time).localeCompare(String(b.time)));
    if(!items.length){ const e=document.createElement('div'); e.className='emptyday'; e.textContent='— ריק (הקש על היום לתצוגת שעות) —'; body.appendChild(e); return; }
    items.forEach(it=> body.appendChild(itemCard(it, true)));
  });
}
function renderDayGrid(day){
  const body=$('itinBody'); body.innerHTML='';
  const back=document.createElement('button'); back.className='iback'; back.textContent='← כל הימים'; back.onclick=()=>{ itinDayView=null; renderItin(); }; body.appendChild(back);
  const idx=dayList().indexOf(day);
  const ttl=document.createElement('div'); ttl.className='dayhdr'; ttl.innerHTML='<span>יום '+(idx+1)+' · '+escapeHtml(dayLabel(day))+'</span>'; body.appendChild(ttl);
  // פריטים ללא שעה — למעלה
  const dayItems=itinItems.filter(i=>i.day===day);
  dayItems.filter(i=>toMin(i.time)==null).forEach(it=> body.appendChild(itemCard(it, true)));
  // רשת שעות
  const H0=0,H1=24,HH=54;
  const grid=document.createElement('div'); grid.className='grid'; grid.style.height=((H1-H0)*HH)+'px';
  for(let h=H0;h<H1;h++){ const row=document.createElement('div'); row.className='hour'; row.style.top=((h-H0)*HH)+'px';
    const hl=document.createElement('span'); hl.className='hl'; hl.textContent=String(h).padStart(2,'0')+':00'; row.appendChild(hl);
    row.onclick=()=>openItem(null, day, String(h).padStart(2,'0')+':00'); grid.appendChild(row); }
  dayItems.filter(i=>toMin(i.time)!=null).forEach(it=>{
    const sm=toMin(it.time); let em=toMin(it.endTime); if(em==null||em<=sm) em=sm+60;
    const b=document.createElement('div'); b.className='gblock '+(it.type||'');
    b.style.top=(((sm/60)-H0)*HH)+'px'; b.style.height=Math.max(26,((em-sm)/60)*HH-2)+'px';
    b.innerHTML='<div class="gt">'+escapeHtml(it.time||'')+(it.endTime?('–'+escapeHtml(it.endTime)):'')+'</div>'+(TYPE_ICON[it.type]||'')+' '+escapeHtml(it.title||'');
    makeBlockInteractive(b, it, HH); grid.appendChild(b);
  });
  body.appendChild(grid);
  $('itinBody').scrollTop = 8*HH;   // התחל ממוקד על 08:00 (בוקר), גלילה ידנית לפני/אחרי
}
function fmtMin(m){ m=((Math.round(m)%1440)+1440)%1440; return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0'); }
async function saveItemQuick(it){ try{ const r=await api({action:'save_item', tripId:getTripId(), item:it}); if(r.ok) await reloadItin(); else alert('שגיאה'); }catch(e){ alert('אין חיבור — נסה שוב'); } }
// גרירה (הזזת שעה) + מתיחת הקצה (משך) על רשת השעות, באצבע
function makeBlockInteractive(b, it, HH){
  const handle=document.createElement('div'); handle.className='ghandle'; b.appendChild(handle);
  let mode=null, startY=0, origTop=0, origH=0, moved=false;
  const sm=toMin(it.time); let em=toMin(it.endTime); if(em==null||em<=sm) em=sm+60; const dur=em-sm;
  const snap=(min)=>Math.round(min/15)*15;
  function down(e, m){ mode=m; moved=false; startY=e.clientY; origTop=parseFloat(b.style.top)||0; origH=parseFloat(b.style.height)||HH;
    b.classList.add('drag'); try{ b.setPointerCapture(e.pointerId); }catch(_){}
    window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); e.preventDefault(); e.stopPropagation(); }
  function move(e){ const d=e.clientY-startY; if(Math.abs(d)>8) moved=true;
    if(mode==='move') b.style.top=Math.max(0, origTop+d)+'px';
    else b.style.height=Math.max(20, origH+d)+'px'; }
  function up(){ window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); b.classList.remove('drag');
    if(!moved){ openItem(it, it.day); return; }
    // אחרי גרירה — בלע את ה"קליק" המדומה שה-iOS יורה, כדי שלא ייפתח עריכה/הוספה בטעות
    const swallow=(ev)=>{ ev.stopPropagation(); ev.preventDefault(); };
    window.addEventListener('click', swallow, true);
    setTimeout(()=>window.removeEventListener('click', swallow, true), 450);
    if(mode==='move'){ let ns=snap(parseFloat(b.style.top)/HH*60); ns=Math.max(0, Math.min(1440-dur, ns)); it.time=fmtMin(ns); it.endTime=fmtMin(ns+dur); }
    else { let ne=snap(sm + parseFloat(b.style.height)/HH*60); ne=Math.max(sm+15, Math.min(1440, ne)); it.endTime=fmtMin(ne); }
    saveItemQuick(it);
  }
  handle.addEventListener('pointerdown', e=>down(e,'resize'));
  b.addEventListener('pointerdown', e=>{ if(e.target===handle) return; down(e,'move'); });
}
function fillDaySelect(){
  const sel=$('itDay'); sel.innerHTML='';
  dayList().forEach((day,idx)=>{ const o=document.createElement('option'); o.value=day; o.textContent='יום '+(idx+1)+' · '+dayLabel(day); sel.appendChild(o); });
}
function openItem(it, day, presetTime){
  editItem=it; fillDaySelect();
  $('itDay').value=(it?it.day:day)||dayList()[0];
  $('itTime').value=it?(it.time||''):(presetTime||''); $('itEnd').value=it?(it.endTime||''):'';
  $('itTitleInp').value=it?(it.title||''):''; $('itType').value=it?(it.type||'activity'):'activity';
  $('itLoc').value=it?(it.location||''):''; $('itAddr').value=it?(it.address||''):''; $('itNotes').value=it?(it.notes||''):'';
  $('itDelete').style.display=it?'block':'none'; $('itemHdr').textContent=it?'עריכת פריט':'פריט חדש';
  $('itemgate').hidden=false;   // בלי focus אוטומטי (מנע את קפיצת ה-autofill של iOS)
}
$('itinbtn').onclick=openItin;
$('itinClose').onclick=()=>{ $('itin').hidden=true; };
$('itinAddTop').onclick=()=>{ if(ensureTrip()) openItem(null, dayList()[0]); };
$('itCancel').onclick=()=>{ $('itemgate').hidden=true; };
$('itSave').onclick=async()=>{
  const title=$('itTitleInp').value.trim(); if(!title){ $('itTitleInp').focus(); return; }
  if(!navigator.onLine){ alert('עריכת תכנית דורשת חיבור'); return; }
  $('itSave').disabled=true;
  const item={ day:$('itDay').value, time:$('itTime').value, endTime:$('itEnd').value, title, type:$('itType').value, location:$('itLoc').value.trim(), address:$('itAddr').value.trim(), notes:$('itNotes').value.trim() };
  if(editItem){ item.id=editItem.id; item.order=editItem.order; }
  try{ const r=await api({action:'save_item', tripId:getTripId(), item}); if(r.ok){ $('itemgate').hidden=true; await reloadItin(); } else alert('שגיאה: '+(r.error||'')); }
  catch(e){ alert('אין חיבור'); } finally{ $('itSave').disabled=false; }
};
$('itDelete').onclick=async()=>{
  if(!editItem || !confirm('למחוק את הפריט הזה?')) return;
  try{ const r=await api({action:'delete_item', tripId:getTripId(), itemId:editItem.id}); if(r.ok){ $('itemgate').hidden=true; await reloadItin(); } }
  catch(e){ alert('אין חיבור'); }
};
$('itinUndo').onclick=async()=>{
  if(!navigator.onLine){ alert('שחזור דורש חיבור'); return; }
  if(!confirm('לשחזר את התכנית מהגיבוי האחרון (לפני שינוי ה-AI האחרון)?')) return;
  try{ const r=await api({ action:'restore_itinerary', tripId:getTripId() }); if(r.ok){ itinItems=r.items||[]; renderItin(); } else alert(r.error||'אין גיבוי'); }catch(e){ alert('אין חיבור'); }
};
$('itinAskBtn').onclick=async()=>{
  const q=$('itinAsk').value.trim(); if(!q) return;
  if(!navigator.onLine){ alert('צריך חיבור ל-AI'); return; }
  if(/ייבא|מהמייל|מהאימייל|gmail|import/i.test(q) && !confirm('הפעולה תקרא עד 6 מיילי הזמנה אחרונים מ-Gmail ותשלח תקציר ל-AI. להמשיך?')) return;
  $('itinAskBtn').disabled=true; $('itinAskBtn').textContent='⏳';
  try{ const r=await api({action:'plan_ai', tripId:getTripId(), text:q});
    if(r.ok){ itinItems=r.items||[]; $('itinAsk').value=''; renderItin(); } else alert('שגיאה: '+(r.error||''));
  }catch(e){ alert('אין חיבור — נסה שוב'); } finally{ $('itinAskBtn').disabled=false; $('itinAskBtn').textContent='🤖'; }
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
