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
const APP_VER='v30';
const I18N = {
  he:{ synced:'הכל מסונכרן ✓', pending:n=>'מסנכרן · '+n+' ממתינות', off:n=>'לא מקוון · '+n+' ממתינות',
       needcfg:'נדרשת הגדרה — פתח קישור ה-token', saved:'📝 נשמר', compressing:'🗜️ מעבד…', queued:'⬆️ בתור', toobig:'⚠️ הקובץ גדול מדי', switched:'➡️ עברת ל', thinking:'🤖 חושב…', neednet:'🤖 צריך חיבור לאינטרנט',
       ph_journal:'דבר אל המקלדת או הקלד מה קורה עכשיו…', btn_save:'💾 שמור ליומן', btn_itin:'🗓️ תכנית הטיול', btn_photos:'📷 תמונות', btn_docs:'📁 מסמכים', btn_receipts:'🧾 קבלות', btn_expense:'💶 הוצאה', btn_ask:"🤖 שאל את הקונסיירז'",
       my_trips:'🏔️ המסעות שלי', new_trip:'➕ טיול חדש', open_drive:'📂 פתח את הטיול בדרייב', hint_day:'הקש על *יום* לתצוגת שעות',
       ph_itin_ai:'ספר ל-AI מה לשנות… העבר ליום 3, הוסף ארוחת ערב…', item_new:'פריט חדש', item_edit:'עריכת פריט',
       ph_item_what:'מה? (למשל: אגם ברייס)', ph_place:'מקום / שם', ph_addr:'כתובת (יוצר לינק למפות + וייז)', ph_notes:'הערות / לינק הזמנה',
       save:'💾 שמור', del:'🗑️ מחק', close:'סגור', upload_new:'➕ העלה / צלם חדש', ai_concierge:"🤖 קונסיירז' AI",
       ph_ask:'שאל על המסע… מקום, תאריך, מה עשינו', open_story:'📂 פתח את הסיפור המלא', ask:'שאל', tell_story:'📖 ספר את הסיפור',
       new_expense:'💶 הוצאה חדשה', ph_amount:'סכום', ph_desc:'תיאור (לא חובה)', attach_receipt:'📷 צרף קבלה / צילום מסך',
       paste_clipboard:'📋 הדבק צילום מהלוח (Copy & Delete)', keep_receipt:'שמור גם את צילום הקבלה (לקבלות אמיתיות)', save_expense:'💾 שמור הוצאה',
       del_expense:'🗑️ מחק הוצאה', edit_expense:'📋 ערוך הוצאה קיימת', peek_sheet:'📊 הצצה לגיליון ההוצאות',
       btn_brain:'🧠 המוח (רשימות וידע)', brain_hub:'🧠 המוח', lv_search:'חיפוש…', lv_add:'הוסף פריט…', kv_search:'חיפוש בידע…', kv_add:'הוסף לקח / הוראה… ה-AI יארגן',
       paste_hdr:'📋 הדבק רשימה — ה-AI יפצל לפריטים', paste_ph:'הדבק כאן טקסט חופשי / רשימה…', paste_split:'✨ פצל והוסף', paste_cancel:'ביטול', open_sheet:'📊 פתח את הגיליון',
       btn_analyze_doc:'🔎 נתח מסמך נסיעה (AI)', doc_hdr:'🔎 ניתוח מסמך נסיעה', doc_to_itin:'➕ הוסף לתכנית', doc_to_expense:'💶 הוסף הוצאה', doc_to_note:'📝 שמור כהערת יומן',
       btn_food:'🍽️ יומן אוכל', food_hdr:'🍽️ יומן אוכל', food_ph:'מה אכלתם / מה קניתם לאכול היום?', food_save:'💾 שמור', food_saved:'🍽️ נשמר', food_sheet:'📊 פתח את גיליון האוכל',
       food_kinds:{'מסעדה':'🍴 מסעדה','קפה':'☕ קפה','סופרמרקט':'🛒 סופרמרקט','בישול':'🍳 בישלנו','אחר':'אחר'},
       group_country:'קבץ לפי מדינה', no_country:'— ללא מדינה —', organize_confirm:'לארגן מחדש את כל המסמך? (ממזג כפילויות ומסדר לפי נושאים)', organizing_all:'🤖 מסדר…', restore_confirm:'לשחזר את המסמך מהגיבוי שלפני הסידור האחרון?', restored_ok:'↩️ שוחזר מהגיבוי',
       btn_wrap:'🏁 סיום מסע — סיכום ולקחים', wrap_title:'🏁 סיכום המסע', wrap_gen:'✨ הפק סיכום ולקחים', wrap_chat_ph:'מה היה טוב? מה לשפר לפעם הבאה?', wrap_save_lessons:'📥 שמור את הלקחים למוח',
       wrap_gathering:'🗂️ אוסף את נתוני המסע…', wrap_summarizing:'🤖 מסכם ומפיק לקחים…', wrap_thinking:'🤖 חושב…', wrap_retry:'⏳ ארך מעט — הקש/שלח שוב', wrap_saved_lessons:'✅ הלקחים נשמרו במוח (לקחים)', wrap_nolessons:'אין עדיין לקחים לשמור — הפק סיכום או שוחח קודם', wrap_hint:'הפק סיכום, ואז שוחחו כדי לחלץ לקחים לטיולים הבאים 🛫',
       types:{activity:'🥾 פעילות',sight:'📸 אתר',meal:'🍽️ אוכל',hotel:'🏨 מלון',travel:'🚗 נסיעה'},
       cats:{'טיסות':'טיסות','השכרת רכב':'השכרת רכב','לינה':'לינה','אוכל ומסעדות':'אוכל ומסעדות','דלק/תחבורה':'דלק/תחבורה','אטרקציות':'אטרקציות','קניות':'קניות','אחר':'אחר'},
       methods:{'Apple Pay':'Apple Pay','מזומן':'מזומן','כרטיס אשראי':'כרטיס אשראי','אחר':'אחר'} },
  en:{ synced:'All synced ✓', pending:n=>'Syncing · '+n+' pending', off:n=>'Offline · '+n+' pending',
       needcfg:'Setup needed — open the token link', saved:'📝 Saved', compressing:'🗜️ Processing…', queued:'⬆️ Queued', toobig:'⚠️ File too large', switched:'➡️ Switched to ', thinking:'🤖 Thinking…', neednet:'🤖 Internet connection needed',
       ph_journal:'Speak or type what’s happening now…', btn_save:'💾 Save to journal', btn_itin:'🗓️ Trip plan', btn_photos:'📷 Photos', btn_docs:'📁 Documents', btn_receipts:'🧾 Receipts', btn_expense:'💶 Expense', btn_ask:'🤖 Ask the concierge',
       my_trips:'🏔️ My trips', new_trip:'➕ New trip', open_drive:'📂 Open trip in Drive', hint_day:'tap a *day* for the hour view',
       ph_itin_ai:'Tell the AI what to change… move to day 3, add dinner…', item_new:'New item', item_edit:'Edit item',
       ph_item_what:'What? (e.g. Lake Braies)', ph_place:'Place / name', ph_addr:'Address (creates Maps + Waze link)', ph_notes:'Notes / booking link',
       save:'💾 Save', del:'🗑️ Delete', close:'Close', upload_new:'➕ Upload / take new', ai_concierge:'🤖 AI concierge',
       ph_ask:'Ask about the trip… place, date, what we did', open_story:'📂 Open full story', ask:'Ask', tell_story:'📖 Tell the story',
       new_expense:'💶 New expense', ph_amount:'Amount', ph_desc:'Description (optional)', attach_receipt:'📷 Attach receipt / screenshot',
       paste_clipboard:'📋 Paste screenshot (Copy & Delete)', keep_receipt:'Also keep the receipt image (for real receipts)', save_expense:'💾 Save expense',
       del_expense:'🗑️ Delete expense', edit_expense:'📋 Edit an existing expense', peek_sheet:'📊 Open the expenses sheet',
       btn_brain:'🧠 The Brain (lists & knowledge)', brain_hub:'🧠 The Brain', lv_search:'Search…', lv_add:'Add an item…', kv_search:'Search the knowledge…', kv_add:'Add a lesson / how-to… the AI will organize it',
       paste_hdr:'📋 Paste a list — the AI will split it into items', paste_ph:'Paste free text / a list here…', paste_split:'✨ Split & add', paste_cancel:'Cancel', open_sheet:'📊 Open the sheet',
       btn_analyze_doc:'🔎 Analyze travel doc (AI)', doc_hdr:'🔎 Travel document analysis', doc_to_itin:'➕ Add to itinerary', doc_to_expense:'💶 Add expense', doc_to_note:'📝 Save as journal note',
       btn_food:'🍽️ Food log', food_hdr:'🍽️ Food log', food_ph:'What did you eat / buy to eat today?', food_save:'💾 Save', food_saved:'🍽️ Saved', food_sheet:'📊 Open the food sheet',
       food_kinds:{'מסעדה':'🍴 Restaurant','קפה':'☕ Café','סופרמרקט':'🛒 Supermarket','בישול':'🍳 Cooked','אחר':'Other'},
       group_country:'Group by country', no_country:'— no country —', organize_confirm:'Reorganize the whole document? (merges duplicates, sorts by topic)', organizing_all:'🤖 Organizing…', restore_confirm:'Restore the document from the backup before the last reorganize?', restored_ok:'↩️ Restored from backup',
       btn_wrap:'🏁 Wrap up trip — summary & lessons', wrap_title:'🏁 Trip wrap-up', wrap_gen:'✨ Generate summary & lessons', wrap_chat_ph:'What went well? What to improve next time?', wrap_save_lessons:'📥 Save the lessons to the Brain',
       wrap_gathering:'🗂️ Gathering the trip data…', wrap_summarizing:'🤖 Summarizing & extracting lessons…', wrap_thinking:'🤖 Thinking…', wrap_retry:'⏳ Took a moment — tap/send again', wrap_saved_lessons:'✅ Lessons saved to the Brain (Lessons)', wrap_nolessons:'No lessons to save yet — generate a summary or chat first', wrap_hint:'Generate a summary, then chat to extract lessons for future trips 🛫',
       types:{activity:'🥾 Activity',sight:'📸 Sight',meal:'🍽️ Food',hotel:'🏨 Hotel',travel:'🚗 Travel'},
       cats:{'טיסות':'Flights','השכרת רכב':'Car rental','לינה':'Lodging','אוכל ומסעדות':'Food & dining','דלק/תחבורה':'Fuel / Transport','אטרקציות':'Attractions','קניות':'Shopping','אחר':'Other'},
       methods:{'Apple Pay':'Apple Pay','מזומן':'Cash','כרטיס אשראי':'Credit card','אחר':'Other'} }
};
const uiLang = () => getAuthor()==='Sky' ? 'en' : 'he';
const T = () => I18N[uiLang()];
const L = (he,en) => uiLang()==='en' ? en : he;
function applyLang(){
  const t=T(), en=uiLang()==='en';
  document.documentElement.lang = en?'en':'he'; document.documentElement.dir = en?'ltr':'rtl';
  const set=(id,v)=>{ const el=$(id); if(el) el.textContent=v; };
  const ph=(id,v)=>{ const el=$(id); if(el) el.placeholder=v; };
  ph('txt',t.ph_journal);
  set('save',t.btn_save); set('itinbtn',t.btn_itin); set('photobtn',t.btn_photos); set('docbtn',t.btn_docs); set('rcptbtn',t.btn_receipts); set('expensebtn',t.btn_expense); set('askbtn',t.btn_ask);
  const h2=document.querySelector('#drawer h2'); if(h2) h2.textContent=t.my_trips;
  set('newtrip',t.new_trip); set('drivelink',t.open_drive);
  const ver=$('ver'); if(ver) ver.textContent=APP_VER+' · '+t.hint_day;
  ph('itinAsk',t.ph_itin_ai);
  ph('itTitleInp',t.ph_item_what); ph('itLoc',t.ph_place); ph('itAddr',t.ph_addr); ph('itNotes',t.ph_notes);
  set('itSave',t.save); set('itDelete',t.del); set('itCancel',t.close);
  set('filesUpload',t.upload_new); set('filesClose',t.close);
  set('askHdr',t.ai_concierge); ph('askq',t.ph_ask); set('storylink',t.open_story); set('asksend',t.ask); set('storybtn',t.tell_story); set('askclose',t.close);
  set('exHdr',t.new_expense); ph('exAmount',t.ph_amount); ph('exDesc',t.ph_desc); set('exReceiptLabel',t.attach_receipt); set('exPaste',t.paste_clipboard); set('exKeepLbl',t.keep_receipt);
  set('exSave',t.save_expense); set('exDelete',t.del_expense); set('exEditBtn',t.edit_expense); set('exSheetLink',t.peek_sheet); set('exClose',t.close);
  const opts=(id,map)=>{ const s=$(id); if(s)[...s.options].forEach(o=>{ if(map[o.value]) o.textContent=map[o.value]; }); };
  opts('itType',t.types); opts('exCategory',t.cats); opts('exMethod',t.methods);
  // brain (lists + knowledge)
  set('brainbtn',t.btn_brain); set('brainTitle',t.brain_hub);
  ph('lvSearch',t.lv_search); ph('lvAdd',t.lv_add); ph('kvSearch',t.kv_search); ph('kvAdd',t.kv_add);
  set('pasteHdr',t.paste_hdr); ph('pasteText',t.paste_ph); set('pasteSplit',t.paste_split); set('pasteCancel',t.paste_cancel);
  set('lvSheet',t.open_sheet);
  // food log
  set('foodbtn',t.btn_food); set('foodHdr',t.food_hdr); ph('foodText',t.food_ph); set('foodSave',t.food_save); set('foodSheet',t.food_sheet); set('foodClose',t.close);
  opts('foodKind',t.food_kinds);
  // travel-doc analyze
  set('docAnalyzeBtn',t.btn_analyze_doc); set('docHdr',t.doc_hdr); set('docToItin',t.doc_to_itin); set('docToExpense',t.doc_to_expense); set('docToNote',t.doc_to_note); set('docClose',t.close);
  // trip wrap-up
  set('wrapbtn',t.btn_wrap); set('wrapTitle',t.wrap_title); set('wrapGen',t.wrap_gen); ph('wrapChat',t.wrap_chat_ph); set('wrapSaveLessons',t.wrap_save_lessons);
}
function setAuthor(n){ localStorage.setItem('author', n||''); $('who').textContent = n ? ('· '+n) : '?'; applyLang(); render(); }

/* ---------- trips ---------- */
const getTripId   = () => localStorage.getItem('tripId') || '';
const getTripName = () => localStorage.getItem('tripName') || '';
function setTrip(id, name){
  localStorage.setItem('tripId', id||''); localStorage.setItem('tripName', name||'');
  $('tripname').textContent = name || L('יומן מסע','Travel journal');
  $('drivelink').href = id ? ('https://drive.google.com/drive/folders/'+id) : '#';
}
function cachedTrips(){ try{ return JSON.parse(localStorage.getItem('trips')||'[]'); }catch(e){ return []; } }
function ensureTrip(){ if(!getTripId()){ alert(L('בחר טיול קודם דרך התפריט ☰','Choose a trip first via the menu ☰')); openDrawer(); return false; } return true; }
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
  logLine(T().compressing); const ok=await enqueueFile(f,category); if(ok) logLine(T().queued); await render(); flush();
  if(ok && !$('filesgate').hidden) setTimeout(refreshFiles, 2500);   // רענן את הגלריה אחרי שההעלאה נשלחה
}
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
    } else { alert(L('שגיאה: ','Error: ')+(r.error||'')); }
  }catch(e){ alert(L('אין חיבור — נסה שוב כשיש רשת','No connection — try again when online')); }
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
  $('storybtn').disabled=true; $('askreply').textContent=L('📖 כותב את הסיפור…','📖 Writing the story…');
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
  $('exReceiptLabel').textContent=L('📷 צרף קבלה / צילום מסך','📷 Attach receipt / screenshot'); $('exSave').textContent=L('💾 שמור הוצאה','💾 Save expense');
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
  if(!navigator.onLine){ $('exReceiptLabel').textContent=L('📷 צורף (אין רשת לקריאה אוטומטית)','📷 Attached (no network to auto-read)'); return; }
  $('exReceiptLabel').textContent=L('🔍 קורא את הקבלה…','🔍 Reading the receipt…');
  try{
    const blob=await compressImage(file); const b64=await blobToB64(blob);
    const r=await api({ action:'parse_receipt', mime:'image/jpeg', dataB64:b64 });
    if(r.ok && r.data){ const d=r.data;
      if(d.amount) $('exAmount').value=d.amount;
      if(d.currency && [...$('exCurrency').options].some(o=>o.value===d.currency)) $('exCurrency').value=d.currency;
      if(d.merchant) $('exDesc').value=d.merchant;
      if(d.category){ const o=[...$('exCategory').options].find(x=>x.value===d.category||x.text===d.category); if(o) $('exCategory').value=o.value; }
      $('exReceiptLabel').textContent='✅ '+(d.merchant||L('נקרא','read'))+' · '+(d.amount||'')+' '+(d.currency||'');
    } else $('exReceiptLabel').textContent=L('📷 צורף (מלא ידנית)','📷 Attached (fill manually)');
  }catch(e){ $('exReceiptLabel').textContent=L('📷 צורף','📷 Attached'); }
}
$('exReceipt').onchange=()=>{ const f=$('exReceipt').files[0]; if(f) useReceiptImage(f); };
$('exPaste').onclick=async()=>{
  if(!navigator.clipboard || !navigator.clipboard.read){ alert(L('הדפדפן לא תומך בהדבקה מהלוח — השתמש ב"צרף קבלה".','This browser can’t paste from clipboard — use “Attach receipt”.')); return; }
  try{
    const items=await navigator.clipboard.read();
    for(const it of items){
      const type=it.types.find(t=>t.startsWith('image/'));
      if(type){ const blob=await it.getType(type); useReceiptImage(new File([blob],'screenshot.'+(type.split('/')[1]||'png'),{type})); return; }
    }
    alert(L('לא נמצאה תמונה בלוח. עשה "Copy and Delete" על צילום המסך באייפון ואז נסה שוב.','No image found on the clipboard. Do “Copy and Delete” on the iPhone screenshot, then try again.'));
  }catch(e){ alert(L('לא ניתן לקרוא מהלוח. ודא שהענקת הרשאה, או השתמש ב"צרף קבלה".','Can’t read the clipboard. Make sure you granted permission, or use “Attach receipt”.')); }
};
$('exEditBtn').onclick=async()=>{
  if(!navigator.onLine){ alert(L('צריך חיבור כדי לטעון הוצאות לעריכה','A connection is needed to load expenses for editing')); return; }
  const r=await api({ action:'list_expenses', tripId:getTripId() }); const list=$('exList'); list.innerHTML='';
  if(r.ok && r.expenses && r.expenses.length){
    r.expenses.forEach(e=>{ const d=document.createElement('div'); d.className='trip';
      d.textContent='💶 '+e.date+' · '+e.category+' · '+e.amount+' '+e.currency+(e.description?(' · '+e.description):'');
      d.onclick=()=>{ editingId=e.id; $('exAmount').value=e.amount; $('exDesc').value=e.description||'';
        if([...$('exCurrency').options].some(o=>o.value===e.currency)) $('exCurrency').value=e.currency;
        const o=[...$('exCategory').options].find(x=>x.value===e.category); if(o) $('exCategory').value=e.category;
        $('exMethod').value=e.method||'Apple Pay'; $('exSave').textContent=L('💾 עדכן הוצאה','💾 Update expense'); $('exDelete').style.display='block'; list.style.display='none'; $('exAmount').focus(); };
      list.appendChild(d); });
    list.style.display='block';
  } else { list.innerHTML='<div style="padding:8px;color:#64748b">'+L('אין הוצאות עדיין','No expenses yet')+'</div>'; list.style.display='block'; }
};
$('exClose').onclick=()=>{ $('expensegate').hidden=true; };
$('exDelete').onclick=async()=>{
  if(!editingId) return;
  if(!navigator.onLine){ alert(L('מחיקה דורשת חיבור','Deleting requires a connection')); return; }
  if(!confirm(L('למחוק את ההוצאה הזו?','Delete this expense?'))) return;
  $('exDelete').disabled=true;
  try{ const r=await api({ action:'delete_expense', tripId:getTripId(), expenseId:editingId });
    if(r.ok){ logLine(L('🗑️ הוצאה נמחקה','🗑️ Expense deleted')); resetExpenseForm(); $('expensegate').hidden=true; } else alert(L('שגיאה: ','Error: ')+(r.error||''));
  }catch(e){ alert(L('אין חיבור — נסה שוב','No connection — try again')); }
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
    if(!navigator.onLine){ alert(L('עריכת הוצאה דורשת חיבור','Editing an expense requires a connection')); $('exSave').disabled=false; return; }
    try{ const payload={ action:'update_expense', tripId:getTripId(), expenseId:editingId, ...fields };
      if(exFile && keepImg){ const blob=/^image\//.test(exFile.type)?await compressImage(exFile):exFile; payload.mime='image/jpeg'; payload.name='receipt.jpg'; payload.dataB64=await blobToB64(blob); }
      const r=await api(payload); ok=r.ok; if(ok) logLine(L('✏️ עודכן: ','✏️ Updated: ')+fields.category+' · '+amount);
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
function dayLabel(s){ try{ return parseYmd(s).toLocaleDateString(uiLang()==='en'?'en-GB':'he-IL',{weekday:'long',day:'2-digit',month:'2-digit'}); }catch(e){ return s; } }
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
  $('itin').hidden=false; $('itinTitle').textContent='🗓️ '+(getTripName()||L('תכנית','Plan'));
  $('itinBody').innerHTML='<div class="emptyday">'+L('טוען…','Loading…')+'</div>';
  await reloadItin();
}
async function reloadItin(){
  try{ const r=await api({action:'list_itinerary', tripId:getTripId()});
    if(r.ok){ itinItems=r.items||[]; itinStart=r.startDate||itinStart; itinDays=Number(r.days)||itinDays; renderItin(); }
    else $('itinBody').innerHTML='<div class="emptyday">'+L('שגיאה: ','Error: ')+escapeHtml(r.error||'')+'</div>';
  }catch(e){ $('itinBody').innerHTML='<div class="emptyday">'+L('אין חיבור','No connection')+'</div>'; }
}
function renderItin(){ if(itinDayView) renderDayGrid(itinDayView); else renderOverview(); }
function itemCard(it, withLinks){
  const c=document.createElement('div'); c.className='icard'; c.onclick=()=>openItem(it, it.day);
  const tm=(it.time||'')+(it.endTime?('–'+it.endTime):'');
  let links='';
  const q=(it.address||it.location||'').trim();
  if(withLinks && q){ const eq=encodeURIComponent(q);
    links+='<a class="lnk" href="https://www.google.com/maps/search/?api=1&query='+eq+'" target="_blank" rel="noopener" onclick="event.stopPropagation()">🗺️ '+L('מפות','Maps')+'</a>';
    links+='<a class="lnk" href="waze://?q='+eq+'&navigate=yes" onclick="event.stopPropagation()">🚗 Waze</a>'; }
  const sub=[it.location, it.notes].filter(Boolean).map(escapeHtml).join(' · ');
  c.innerHTML='<div class="t">'+escapeHtml(tm||'—')+'</div><div class="bd"><div class="ttl">'+(TYPE_ICON[it.type]||'•')+' '+escapeHtml(it.title||'')+'</div>'+(sub?('<div class="sub">'+sub+'</div>'):'')+(links?('<div class="sub">'+links+'</div>'):'')+'</div>';
  return c;
}
function renderOverview(){
  const body=$('itinBody'); body.innerHTML='';
  dayList().forEach((day,idx)=>{
    const hdr=document.createElement('div'); hdr.className='dayhdr tap';
    const lbl=document.createElement('span'); lbl.style.flex='1'; lbl.textContent=L('יום ','Day ')+(idx+1)+' · '+dayLabel(day);
    hdr.appendChild(lbl);
    const add=document.createElement('button'); add.textContent='＋'; add.onclick=(e)=>{ e.stopPropagation(); openItem(null, day); }; hdr.appendChild(add);
    hdr.onclick=()=>{ itinDayView=day; renderItin(); $('itinBody').scrollTop=0; };
    body.appendChild(hdr);
    const items=itinItems.filter(i=>i.day===day).sort((a,b)=>(a.order-b.order)||String(a.time).localeCompare(String(b.time)));
    if(!items.length){ const e=document.createElement('div'); e.className='emptyday'; e.textContent=L('— ריק (הקש על היום לתצוגת שעות) —','— empty (tap the day for the hour view) —'); body.appendChild(e); return; }
    items.forEach(it=> body.appendChild(itemCard(it, true)));
  });
}
function renderDayGrid(day){
  const body=$('itinBody'); body.innerHTML='';
  const back=document.createElement('button'); back.className='iback'; back.textContent=L('← כל הימים','← All days'); back.onclick=()=>{ itinDayView=null; renderItin(); }; body.appendChild(back);
  const idx=dayList().indexOf(day);
  const ttl=document.createElement('div'); ttl.className='dayhdr'; ttl.innerHTML='<span>'+L('יום ','Day ')+(idx+1)+' · '+escapeHtml(dayLabel(day))+'</span>'; body.appendChild(ttl);
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
async function saveItemQuick(it){ try{ const r=await api({action:'save_item', tripId:getTripId(), item:it}); if(r.ok) await reloadItin(); else alert(L('שגיאה','Error')); }catch(e){ alert(L('אין חיבור — נסה שוב','No connection — try again')); } }
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
  dayList().forEach((day,idx)=>{ const o=document.createElement('option'); o.value=day; o.textContent=L('יום ','Day ')+(idx+1)+' · '+dayLabel(day); sel.appendChild(o); });
}
function openItem(it, day, presetTime){
  editItem=it; fillDaySelect();
  $('itDay').value=(it?it.day:day)||dayList()[0];
  $('itTime').value=it?(it.time||''):(presetTime||''); $('itEnd').value=it?(it.endTime||''):'';
  $('itTitleInp').value=it?(it.title||''):''; $('itType').value=it?(it.type||'activity'):'activity';
  $('itLoc').value=it?(it.location||''):''; $('itAddr').value=it?(it.address||''):''; $('itNotes').value=it?(it.notes||''):'';
  $('itDelete').style.display=it?'block':'none'; $('itemHdr').textContent=it?T().item_edit:T().item_new;
  $('itemgate').hidden=false;   // בלי focus אוטומטי (מנע את קפיצת ה-autofill של iOS)
}
$('itinbtn').onclick=openItin;
$('itinClose').onclick=()=>{ $('itin').hidden=true; };
$('itinAddTop').onclick=()=>{ if(ensureTrip()) openItem(null, dayList()[0]); };
$('itCancel').onclick=()=>{ $('itemgate').hidden=true; };
$('itSave').onclick=async()=>{
  const title=$('itTitleInp').value.trim(); if(!title){ $('itTitleInp').focus(); return; }
  if(!navigator.onLine){ alert(L('עריכת תכנית דורשת חיבור','Editing the plan requires a connection')); return; }
  $('itSave').disabled=true;
  const item={ day:$('itDay').value, time:$('itTime').value, endTime:$('itEnd').value, title, type:$('itType').value, location:$('itLoc').value.trim(), address:$('itAddr').value.trim(), notes:$('itNotes').value.trim() };
  if(editItem){ item.id=editItem.id; item.order=editItem.order; }
  try{ const r=await api({action:'save_item', tripId:getTripId(), item}); if(r.ok){ $('itemgate').hidden=true; await reloadItin(); } else alert(L('שגיאה: ','Error: ')+(r.error||'')); }
  catch(e){ alert(L('אין חיבור','No connection')); } finally{ $('itSave').disabled=false; }
};
$('itDelete').onclick=async()=>{
  if(!editItem || !confirm(L('למחוק את הפריט הזה?','Delete this item?'))) return;
  try{ const r=await api({action:'delete_item', tripId:getTripId(), itemId:editItem.id}); if(r.ok){ $('itemgate').hidden=true; await reloadItin(); } }
  catch(e){ alert(L('אין חיבור','No connection')); }
};
$('itinUndo').onclick=async()=>{
  if(!navigator.onLine){ alert(L('שחזור דורש חיבור','Restore requires a connection')); return; }
  if(!confirm(L('לשחזר את התכנית מהגיבוי האחרון (לפני שינוי ה-AI האחרון)?','Restore the plan from the last backup (before the most recent AI change)?'))) return;
  try{ const r=await api({ action:'restore_itinerary', tripId:getTripId() }); if(r.ok){ itinItems=r.items||[]; renderItin(); } else alert(r.error||L('אין גיבוי','No backup')); }catch(e){ alert(L('אין חיבור','No connection')); }
};
$('itinAskBtn').onclick=async()=>{
  const q=$('itinAsk').value.trim(); if(!q) return;
  if(!navigator.onLine){ alert(L('צריך חיבור ל-AI','An AI connection is required')); return; }
  if(/ייבא|מה?מייל|מה?אימייל|מה?דוא|from .*e-?mail|import|gmail/i.test(q) && !confirm(L('הפעולה תקרא עד 6 מיילי הזמנה אחרונים מ-Gmail ותשלח תקציר ל-AI. להמשיך?','This will read up to 6 recent booking emails from Gmail and send a summary to the AI. Continue?'))) return;
  $('itinAskBtn').disabled=true; $('itinAskBtn').textContent='⏳';
  try{ const r=await api({action:'plan_ai', tripId:getTripId(), text:q});
    if(r.ok){ itinItems=r.items||[]; $('itinAsk').value=''; renderItin(); } else alert(L('שגיאה: ','Error: ')+(r.error||''));
  }catch(e){ alert(L('אין חיבור — נסה שוב','No connection — try again')); } finally{ $('itinAskBtn').disabled=false; $('itinAskBtn').textContent='🤖'; }
};

/* ---------- files gallery (photos / documents / receipts) ---------- */
let filesCategory='document';
const filesTitle=(cat)=>({ photo:T().btn_photos, document:T().btn_docs, receipt:T().btn_receipts }[cat]);
const FILES_INPUT={ photo:'cam', document:'docfile', receipt:'rcptfile' };
async function refreshFiles(){
  try{ const r=await api({ action:'list_files', tripId:getTripId(), category:filesCategory });
    const el=$('filesList'); el.innerHTML=''; const files=(r.ok&&r.files)||[];
    if(!files.length){ el.innerHTML='<div class="emptyday">'+L('— ריק. הקש "העלה / צלם חדש" —','— empty. Tap “Upload / take new” —')+'</div>'; return; }
    files.forEach(f=>{ const a=document.createElement('a'); a.className='fitem'; a.href=f.url; a.target='_blank'; a.rel='noopener';
      if(/^image\//.test(f.mime)) a.innerHTML='<img loading="lazy" src="https://drive.google.com/thumbnail?id='+f.id+'&sz=w400">';
      else a.innerHTML='<div class="fdoc">'+(/pdf/i.test(f.mime)?'📄':'📎')+'</div>';
      a.innerHTML+='<div class="fn">'+escapeHtml(f.name)+'</div>'; el.appendChild(a); });
  }catch(e){ $('filesList').innerHTML='<div class="emptyday">'+L('אין חיבור','No connection')+'</div>'; }
}
async function openFiles(cat){ if(!ensureTrip()) return; filesCategory=cat; $('filesHdr').textContent=filesTitle(cat); $('filesList').innerHTML='<div class="emptyday">'+L('טוען…','Loading…')+'</div>'; $('filesgate').hidden=false; await refreshFiles(); }
$('photobtn').onclick=()=>openFiles('photo');
$('docbtn').onclick=()=>openFiles('document');
$('rcptbtn').onclick=()=>openFiles('receipt');
$('filesUpload').onclick=()=>$(FILES_INPUT[filesCategory]).click();
$('filesClose').onclick=()=>{ $('filesgate').hidden=true; };

/* ---------- 🔎 ניתוח מסמך-נסיעה (P1) → PREVIEW + פעולות באישור ידני (אין auto-apply) ---------- */
let lastDoc=null;
const DOC_TYPE_EMOJI={ flight:'✈️', hotel:'🏨', car:'🚗', insurance:'🛡️', ticket:'🎫', restaurant:'🍽️', other:'📄' };
function renderDocPreview(d){
  const row=(lbl,val)=> val ? ('<div class="drow"><span class="dl">'+escapeHtml(lbl)+'</span><span class="dv">'+escapeHtml(String(val))+'</span></div>') : '';
  const dates=[d.dateStart,d.timeStart].filter(Boolean).join(' ') + (d.dateEnd?(' → '+[d.dateEnd,d.timeEnd].filter(Boolean).join(' ')):'');
  let h='<div class="dtitle">'+(DOC_TYPE_EMOJI[d.type]||'📄')+' '+escapeHtml(d.title||d.type||'')+'</div>';
  h+=row(L('ספק','Provider'), d.provider);
  h+=row(L('תאריך','Date'), dates);
  h+=row(L('מקום','Location'), d.location);
  h+=row(L('כתובת','Address'), d.address);
  h+=row(L('אישור','Confirmation'), d.confirmationCode);
  h+=row(L('מחיר','Price'), d.priceAmount!=null ? (d.priceAmount+' '+(d.priceCurrency||'')) : '');
  h+=row(L('הערות','Notes'), d.notes);
  if(d.confidence!=null) h+='<div class="dconf">'+L('ביטחון','Confidence')+': '+Math.round(d.confidence*100)+'%</div>';
  $('docResult').innerHTML=h;
}
async function analyzeDoc(file){
  if(!file) return;
  if(!navigator.onLine){ alert(L('צריך חיבור ל-AI','An AI connection is required')); return; }
  lastDoc=null; $('docActions').style.display='none';
  $('docgate').hidden=false; $('docResult').innerHTML='<div class="emptyday">'+L('🔎 קורא את המסמך…','🔎 Reading the document…')+'</div>';
  try{
    let blob=file, mime=file.type||'image/jpeg';
    if(/^image\//.test(mime)){ blob=await compressImage(file); mime='image/jpeg'; }
    if(blob.size>MAX_BYTES){ $('docResult').innerHTML='<div class="emptyday">'+L('⚠️ הקובץ גדול מדי','⚠️ File too large')+'</div>'; return; }
    const b64=await blobToB64(blob);
    const r=await api({ action:'parse_travel_doc', mime:mime, dataB64:b64 });
    if(r.ok && r.data){ lastDoc=r.data; renderDocPreview(r.data); $('docActions').style.display='block'; }
    else if(r && r.service){ $('docResult').innerHTML='<div class="emptyday">'+L('⏳ ארך מעט — נסה שוב','⏳ Took a moment — try again')+'</div>'; }
    else $('docResult').innerHTML='<div class="emptyday">⚠️ '+escapeHtml(r.error||'error')+'</div>';
  }catch(e){ $('docResult').innerHTML='<div class="emptyday">'+L('אין חיבור — נסה שוב','No connection — try again')+'</div>'; }
}
$('docAnalyzeBtn').onclick=()=>{ if(ensureTrip()) $('docAnalyzeFile').click(); };
$('docAnalyzeFile').onchange=()=>{ const f=$('docAnalyzeFile').files[0]; $('docAnalyzeFile').value=''; if(f) analyzeDoc(f); };
$('docClose').onclick=()=>{ $('docgate').hidden=true; };
// פעולות — כל אחת פותחת טופס קיים מלא-מראש; הכתיבה בפועל רק כשהמשתמש לוחץ "שמור" (אין auto-apply)
$('docToItin').onclick=()=>{ const d=lastDoc; if(!d) return; $('docgate').hidden=true; if(!ensureTrip()) return;
  const typeMap={ flight:'travel', car:'travel', hotel:'hotel', restaurant:'meal', ticket:'activity', insurance:'activity', other:'activity' };
  const day=(d.dateStart && dayList().indexOf(d.dateStart)>=0) ? d.dateStart : dayList()[0];
  openItem(null, day, d.timeStart||'');   // editItem=null → פריט חדש
  $('itEnd').value=d.timeEnd||''; $('itTitleInp').value=d.title||d.provider||''; $('itType').value=typeMap[d.type]||'activity';
  $('itLoc').value=d.location||d.provider||''; $('itAddr').value=d.address||'';
  $('itNotes').value=[d.confirmationCode?(L('אישור','Conf')+': '+d.confirmationCode):'', d.notes||''].filter(Boolean).join(' · ');
};
$('docToExpense').onclick=()=>{ const d=lastDoc; if(!d) return; $('docgate').hidden=true; if(!ensureTrip()) return;
  resetExpenseForm(); $('expensegate').hidden=false;
  if(d.priceAmount!=null) $('exAmount').value=d.priceAmount;
  if(d.priceCurrency && [...$('exCurrency').options].some(o=>o.value===d.priceCurrency)) $('exCurrency').value=d.priceCurrency;
  const catMap={ flight:'טיסות', car:'השכרת רכב', hotel:'לינה', restaurant:'אוכל ומסעדות', ticket:'אטרקציות', insurance:'אחר', other:'אחר' };
  const c=catMap[d.type]||'אחר'; if([...$('exCategory').options].some(o=>o.value===c)) $('exCategory').value=c;
  $('exDesc').value=d.title||d.provider||'';
};
$('docToNote').onclick=()=>{ const d=lastDoc; if(!d) return; $('docgate').hidden=true;
  const lines=['📄 '+(d.title||d.type||'')+(d.provider?(' · '+d.provider):'')];
  const dates=[d.dateStart,d.timeStart].filter(Boolean).join(' ')+(d.dateEnd?(' → '+[d.dateEnd,d.timeEnd].filter(Boolean).join(' ')):'');
  if(dates.trim()) lines.push(L('תאריך','Date')+': '+dates);
  if(d.location||d.address) lines.push(L('מקום','Location')+': '+[d.location,d.address].filter(Boolean).join(', '));
  if(d.confirmationCode) lines.push(L('אישור','Conf')+': '+d.confirmationCode);
  if(d.priceAmount!=null) lines.push(L('מחיר','Price')+': '+d.priceAmount+' '+(d.priceCurrency||''));
  if(d.notes) lines.push(d.notes);
  $('txt').value=lines.join('\n');
  logLine(L('📄 מולא ביומן — לחץ "שמור ליומן"','📄 Filled the journal — tap "Save to journal"'));
};

/* ---------- "מוח" (Brain) — רשימות + ידע גלובליים (חוצי-טיולים) ---------- */
const BRAIN_TILES = [
  { key:'packing',      kind:'list', emoji:'🎒', he:'אריזה',          en:'Packing' },
  { key:'predeparture', kind:'list', emoji:'✅', he:'לפני יציאה',     en:'Pre-departure' },
  { key:'kosher',       kind:'list', emoji:'🥗', he:'כשרות / טבעוני', en:'Kosher / Vegan' },
  { key:'favorites',    kind:'list', emoji:'⭐', he:'מועדפים של Sky', en:"Sky's favorites" },
  { key:'lessons',      kind:'know', emoji:'💡', he:'לקחים והעדפות',  en:'Lessons & prefs' },
  { key:'howto',        kind:'know', emoji:'🛠️', he:'הוראות פעולה',   en:'How-to' }
];
const tileLabel = (t) => uiLang()==='en' ? t.en : t.he;
function renderBrainTiles(){
  const wrap=$('brainTiles'); wrap.innerHTML='';
  BRAIN_TILES.forEach(t=>{ const d=document.createElement('div'); d.className='btile';
    d.innerHTML='<div class="bemoji">'+t.emoji+'</div><div>'+escapeHtml(tileLabel(t))+'</div>';
    d.onclick=()=> (t.kind==='list' ? openList(t) : openKnow(t));
    wrap.appendChild(d); });
}
$('brainbtn').onclick=()=>{ renderBrainTiles(); $('brain').hidden=false; };
$('brainClose').onclick=()=>{ $('brain').hidden=true; };

/* --- generic list (packing / pre-departure / kosher / favorites) --- */
let lvKey=null, lvArchived=false, lvItems=[], lvSearchTimer=null, lvGroupByTag=false;
async function openList(tile){
  lvKey=tile.key; lvArchived=false; lvGroupByTag=false; $('lvSearch').value=''; $('lvArchiveToggle').textContent='🗄️';
  $('lvGroupToggle').style.display = (tile.key==='kosher') ? '' : 'none';   // מדינה = תגית משנית; קיבוץ אופציונלי לכשרות
  $('lvGroupToggle').style.opacity = '1';
  $('lvTitle').textContent=tile.emoji+' '+tileLabel(tile);
  $('listview').hidden=false; $('lvBody').innerHTML='<div class="emptyday">'+L('טוען…','Loading…')+'</div>';
  await reloadList();
}
async function reloadList(){
  try{ const r=await api({ action:'get_list', listKey:lvKey, includeArchived:lvArchived, query:$('lvSearch').value.trim() });
    if(r.ok){ lvItems=r.items||[]; if(r.url) $('lvSheet').href=r.url; renderList(); }
    else $('lvBody').innerHTML='<div class="emptyday">'+L('שגיאה','Error')+'</div>';
  }catch(e){ $('lvBody').innerHTML='<div class="emptyday">'+L('אין חיבור','No connection')+'</div>'; }
}
function lvRow(it){
  const row=document.createElement('div'); row.className='litem'+(it.done?' done':'');
  if(lvArchived){
    const tx=document.createElement('span'); tx.className='ltext'; tx.textContent=it.text; row.appendChild(tx);
    if(it.tag){ const tg=document.createElement('span'); tg.className='ltag'; tg.textContent=it.tag; row.appendChild(tg); }
    const rest=document.createElement('button'); rest.className='lbtn'; rest.textContent='♻️'; rest.onclick=()=>itemUpdate(it.id,{archived:false}); row.appendChild(rest);
    const del=document.createElement('button'); del.className='lbtn'; del.style.color='#b91c1c'; del.textContent='🗑️';
    del.onclick=()=>{ if(confirm(L('למחוק לצמיתות?','Delete permanently?'))) itemDelete(it.id); }; row.appendChild(del);
  } else {
    const cb=document.createElement('input'); cb.type='checkbox'; cb.className='lcheck'; cb.checked=it.done;
    cb.onchange=()=>itemUpdate(it.id,{done:cb.checked}); row.appendChild(cb);
    const tx=document.createElement('span'); tx.className='ltext'; tx.textContent=it.text;
    tx.onclick=()=>{ const v=prompt(L('עריכת פריט:','Edit item:'), it.text); if(v!=null && v.trim()) itemUpdate(it.id,{text:v.trim()}); }; row.appendChild(tx);
    if(it.tag && !lvGroupByTag){ const tg=document.createElement('span'); tg.className='ltag'; tg.textContent=it.tag; row.appendChild(tg); }
    const arch=document.createElement('button'); arch.className='lbtn'; arch.textContent='🗄️'; arch.onclick=()=>itemUpdate(it.id,{archived:true}); row.appendChild(arch);
  }
  return row;
}
function renderList(){
  const body=$('lvBody'); body.innerHTML='';
  const items = lvArchived ? lvItems.filter(x=>x.archived) : lvItems;
  if(!items.length){ body.innerHTML='<div class="emptyday">'+(lvArchived?L('— הארכיון ריק —','— archive is empty —'):L('— ריק. הוסף פריט —','— empty. Add an item —'))+'</div>'; return; }
  if(lvGroupByTag && !lvArchived){
    const groups={}; items.forEach(it=>{ const k=(it.tag||'').trim()||L('— ללא מדינה —','— no country —'); (groups[k]=groups[k]||[]).push(it); });
    Object.keys(groups).sort().forEach(g=>{ const h=document.createElement('div'); h.className='dayhdr'; h.textContent='🌍 '+g; body.appendChild(h);
      groups[g].forEach(it=> body.appendChild(lvRow(it))); });
  } else { items.forEach(it=> body.appendChild(lvRow(it))); }
}
async function itemUpdate(id, patch){
  if(!navigator.onLine){ alert(L('צריך חיבור','A connection is needed')); return; }
  try{ const r=await api(Object.assign({ action:'update_list_item', listKey:lvKey, id:id }, patch)); if(r.ok) await reloadList(); }catch(e){ alert(L('אין חיבור','No connection')); }
}
async function itemDelete(id){
  try{ const r=await api({ action:'delete_list_item', listKey:lvKey, id:id }); if(r.ok) await reloadList(); }catch(e){ alert(L('אין חיבור','No connection')); }
}
async function listAddOne(){
  const v=$('lvAdd').value.trim(); if(!v) return;
  if(!navigator.onLine){ alert(L('צריך חיבור','A connection is needed')); return; }
  $('lvAdd').value=''; try{ const r=await api({ action:'add_list_item', listKey:lvKey, text:v }); if(r.ok) await reloadList(); }catch(e){ alert(L('אין חיבור','No connection')); }
}
$('lvClose').onclick=()=>{ $('listview').hidden=true; };
$('lvAddBtn').onclick=listAddOne;
$('lvAdd').addEventListener('keydown', e=>{ if(e.key==='Enter') listAddOne(); });
$('lvArchiveToggle').onclick=()=>{ lvArchived=!lvArchived; $('lvArchiveToggle').textContent=lvArchived?'📋':'🗄️'; reloadList(); };
$('lvSearch').addEventListener('input', ()=>{ clearTimeout(lvSearchTimer); lvSearchTimer=setTimeout(reloadList, 350); });
$('lvSearchClear').onclick=()=>{ $('lvSearch').value=''; reloadList(); };
$('lvGroupToggle').onclick=()=>{ lvGroupByTag=!lvGroupByTag; $('lvGroupToggle').style.opacity=lvGroupByTag?'.5':'1'; renderList(); };
$('lvAddManyBtn').onclick=()=>{ $('pasteText').value=''; $('pastegate').hidden=false; $('pasteText').focus(); };
$('pasteCancel').onclick=()=>{ $('pastegate').hidden=true; };
$('pasteSplit').onclick=async()=>{
  const v=$('pasteText').value.trim(); if(!v) return;
  if(!navigator.onLine){ alert(L('צריך חיבור ל-AI','An AI connection is required')); return; }
  $('pasteSplit').disabled=true; const old=$('pasteSplit').textContent; $('pasteSplit').textContent=L('✨ מפצל…','✨ Splitting…');
  try{ const r=await api({ action:'add_list_items', listKey:lvKey, text:v });
    if(r.ok){ $('pastegate').hidden=true; logLine(L('➕ נוספו ','➕ Added ')+(r.count||0)); await reloadList(); } else alert(L('שגיאה','Error')); }
  catch(e){ alert(L('אין חיבור — נסה שוב','No connection — try again')); }
  finally{ $('pasteSplit').disabled=false; $('pasteSplit').textContent=old; }
};

/* --- knowledge (lessons / how-to), AI-organized doc --- */
let kvKey=null, kvText='', kvUrl='#', kvSearchTimer=null;
async function openKnow(tile){
  kvKey=tile.key; $('kvSearch').value='';
  $('kvTitle').textContent=tile.emoji+' '+tileLabel(tile);
  $('knowview').hidden=false; $('kvBody').innerHTML='<div class="emptyday">'+L('טוען…','Loading…')+'</div>';
  try{ const r=await api({ action:'get_knowledge', docKey:kvKey });
    if(r.ok){ kvText=r.text||''; kvUrl=r.url||'#'; renderKnow(); } else $('kvBody').innerHTML='<div class="emptyday">'+L('שגיאה','Error')+'</div>';
  }catch(e){ $('kvBody').innerHTML='<div class="emptyday">'+L('אין חיבור','No connection')+'</div>'; }
}
function renderKnow(){
  const body=$('kvBody'); const q=$('kvSearch').value.trim();
  // הסר את כותרת המסמך (שורה ראשונה) שכבר מופיעה בכותרת המסך
  let txt=String(kvText||'').replace(/^.*\n/, m=> (m.trim()===($('kvTitle').textContent||'').trim()? '' : m)).trim();
  if(!txt) txt=String(kvText||'').trim();
  if(!txt){ body.innerHTML='<div class="emptyday">'+L('— עדיין ריק. הוסף לקח/הוראה —','— still empty. Add a lesson / how-to —')+'</div>'; return; }
  let html=escapeHtml(txt);
  if(q){ const re=new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi'); html=html.replace(re,'<mark>$1</mark>'); }
  body.innerHTML='<div class="kvtext">'+html+'</div>';
}
async function knowAdd(){
  const v=$('kvAdd').value.trim(); if(!v) return;
  if(!navigator.onLine){ alert(L('צריך חיבור ל-AI','An AI connection is required')); return; }
  $('kvAddBtn').disabled=true; const old=$('kvAddBtn').textContent; $('kvAddBtn').textContent='⏳';
  $('kvBody').innerHTML='<div class="emptyday">'+L('🤖 מארגן…','🤖 Organizing…')+'</div>';
  try{ const r=await api({ action:'add_knowledge', docKey:kvKey, text:v });
    if(r.ok){ kvText=r.text||kvText; kvUrl=r.url||kvUrl; $('kvAdd').value=''; renderKnow(); } else { alert(L('שגיאה','Error')); renderKnow(); } }
  catch(e){ alert(L('אין חיבור — נסה שוב','No connection — try again')); renderKnow(); }
  finally{ $('kvAddBtn').disabled=false; $('kvAddBtn').textContent=old; }
}
$('kvClose').onclick=()=>{ $('knowview').hidden=true; };
$('kvDoc').onclick=()=>{ if(kvUrl && kvUrl!=='#') window.open(kvUrl,'_blank','noopener'); };
$('kvRestore').onclick=async()=>{   // שחזור מסמך-ידע מהגיבוי שלפני הסידור האחרון
  if(!navigator.onLine){ alert(L('צריך חיבור','A connection is needed')); return; }
  if(!confirm(T().restore_confirm)) return;
  const old=$('kvRestore').textContent; $('kvRestore').textContent='⏳';
  try{ const r=await api({ action:'restore_knowledge', docKey:kvKey });
    if(r.ok){ kvText=r.text||kvText; kvUrl=r.url||kvUrl; $('kvSearch').value=''; renderKnow(); logLine(T().restored_ok); }
    else alert(L('שגיאה: ','Error: ')+(r.error||'')); }
  catch(e){ alert(L('אין חיבור — נסה שוב','No connection — try again')); }
  finally{ $('kvRestore').textContent=old; }
};
$('kvAddBtn').onclick=knowAdd;
$('kvAdd').addEventListener('keydown', e=>{ if(e.key==='Enter') knowAdd(); });
$('kvSearch').addEventListener('input', ()=>{ clearTimeout(kvSearchTimer); kvSearchTimer=setTimeout(renderKnow, 200); });
$('kvSearchClear').onclick=()=>{ $('kvSearch').value=''; renderKnow(); };
$('kvOrganize').onclick=async()=>{   // סדר כולל (מדי פעם) — AI מארגן מחדש את כל המסמך
  if(!navigator.onLine){ alert(L('צריך חיבור ל-AI','An AI connection is required')); return; }
  if(!confirm(T().organize_confirm)) return;
  const old=$('kvOrganize').textContent; $('kvOrganize').textContent='⏳';
  $('kvBody').innerHTML='<div class="emptyday">'+T().organizing_all+'</div>';
  try{ const r=await api({ action:'organize_knowledge', docKey:kvKey });
    if(r.ok){ kvText=r.text||kvText; kvUrl=r.url||kvUrl; renderKnow(); } else { alert(L('שגיאה','Error')); renderKnow(); } }
  catch(e){ alert(L('אין חיבור — נסה שוב','No connection — try again')); renderKnow(); }
  finally{ $('kvOrganize').textContent=old; }
};

/* --- 🍽️ יומן אוכל לכל טיול (offline-queued) --- */
async function enqueueFood(data){
  const p={ action:'add_food', clientId:clientId(), author:getAuthor(), tripId:getTripId(), foodId:uuid(), ts:new Date().toISOString(), ...data };
  await dbAdd({ kind:'json', payload:p });
}
async function openFood(){
  if(!ensureTrip()) return;
  $('foodgate').hidden=false; $('foodText').value=''; $('foodText').focus(); refreshFood();
  if(navigator.onLine){ try{ const r=await api({ action:'food_url', tripId:getTripId() }); if(r.ok&&r.url){ $('foodSheet').href=r.url; $('foodSheet').style.display='block'; } }catch(e){} }
}
async function refreshFood(){
  if(!navigator.onLine) return;
  try{ const r=await api({ action:'list_food', tripId:getTripId() }); const el=$('foodList'); el.innerHTML='';
    (r.food||[]).slice(0,25).forEach(f=>{ const d=document.createElement('div'); d.className='litem'; d.style.display='block';
      d.innerHTML='<b>'+escapeHtml(f.date)+(f.kind?(' · '+escapeHtml(f.kind)):'')+(f.author?(' · '+escapeHtml(f.author)):'')+'</b><br>'+escapeHtml(f.text); el.appendChild(d); });
  }catch(e){}
}
$('foodbtn').onclick=openFood;
$('foodClose').onclick=()=>{ $('foodgate').hidden=true; };
$('foodSave').onclick=async()=>{
  const text=$('foodText').value.trim(); if(!text) return; if(!ensureTrip()) return;
  $('foodSave').disabled=true;
  await enqueueFood({ kind:$('foodKind').value, text });
  $('foodText').value=''; logLine(T().food_saved); await render(); flush();
  setTimeout(refreshFood, 1800);
  $('foodSave').disabled=false;
};

/* --- 🏁 סיום מסע — סיכום + שיחת הפקת-לקחים --- */
let wrapUrl='#', wrapLastLessons='', wrapCtxReady=false;
function wrapMsg(role, text){ const d=document.createElement('div'); d.className='wmsg '+(role==='me'?'me':'ai'); d.textContent=text; $('wrapBody').appendChild(d); $('wrapBody').scrollTop=$('wrapBody').scrollHeight; return d; }
function openWrap(){ if(!ensureTrip()) return; $('wrap').hidden=false; $('wrapBody').innerHTML=''; wrapLastLessons=''; wrapUrl='#'; wrapCtxReady=false; wrapMsg('ai', T().wrap_hint); }
$('wrapbtn').onclick=openWrap;
$('wrapClose').onclick=()=>{ $('wrap').hidden=true; };
$('wrapDoc').onclick=()=>{ if(wrapUrl && wrapUrl!=='#') window.open(wrapUrl,'_blank','noopener'); };
// שלב 1 (פעם אחת לכל פתיחה): בונה+שומר את הקשר-המסע בקאש בשרת, כך ששלב הסיכום/הצ'אט מהירים (<60ש')
async function ensureWrapCtx(pend){
  if(wrapCtxReady) return true;
  if(pend) pend.textContent=T().wrap_gathering;
  const c=await api({ action:'wrapup_context', tripId:getTripId() });
  if(c && c.ok){ wrapCtxReady=true; return true; }
  return c;   // מחזיר את התשובה הכושלת לטיפול
}
$('wrapGen').onclick=async()=>{
  if(!navigator.onLine){ alert(L('צריך חיבור ל-AI','An AI connection is required')); return; }
  $('wrapGen').disabled=true; const pend=wrapMsg('ai', T().wrap_gathering);
  try{
    const c=await ensureWrapCtx(pend);
    if(c!==true){ pend.remove(); wrapMsg('ai', (c&&c.service)?T().wrap_retry:('⚠️ '+((c&&c.error)||'error'))); return; }
    pend.textContent=T().wrap_summarizing;
    const r=await api({ action:'trip_wrapup', tripId:getTripId() });
    pend.remove();
    if(r.ok && r.text){ wrapUrl=r.url||'#'; wrapLastLessons=r.text||''; wrapMsg('ai', r.text); }
    else if(r && r.service){ wrapMsg('ai', T().wrap_retry); }
    else wrapMsg('ai','⚠️ '+(r.error||'error'));
  }catch(e){ pend.remove(); wrapMsg('ai', L('אין חיבור — נסה שוב','No connection — try again')); }
  finally{ $('wrapGen').disabled=false; }
};
async function wrapSendChat(){
  const q=$('wrapChat').value.trim(); if(!q) return;
  if(!navigator.onLine){ alert(L('צריך חיבור ל-AI','An AI connection is required')); return; }
  $('wrapChat').value=''; wrapMsg('me', q);
  $('wrapSend').disabled=true; const pend=wrapMsg('ai', T().wrap_thinking);
  try{
    const c=await ensureWrapCtx(pend);
    if(c!==true){ pend.remove(); wrapMsg('ai', (c&&c.service)?T().wrap_retry:('⚠️ '+((c&&c.error)||'error'))); return; }
    pend.textContent=T().wrap_thinking;
    const r=await api({ action:'wrapup_chat', tripId:getTripId(), text:q });
    pend.remove();
    if(r.ok && r.reply){ wrapLastLessons=r.reply||wrapLastLessons; wrapMsg('ai', r.reply); }
    else if(r && r.service){ wrapMsg('ai', T().wrap_retry); }
    else wrapMsg('ai','⚠️ '+(r.error||'error'));
  }catch(e){ pend.remove(); wrapMsg('ai', L('אין חיבור — נסה שוב','No connection — try again')); }
  finally{ $('wrapSend').disabled=false; }
}
$('wrapSend').onclick=wrapSendChat;
$('wrapChat').addEventListener('keydown', e=>{ if(e.key==='Enter') wrapSendChat(); });
$('wrapSaveLessons').onclick=async()=>{
  if(!wrapLastLessons.trim()){ alert(T().wrap_nolessons); return; }
  if(!navigator.onLine){ alert(L('צריך חיבור','A connection is needed')); return; }
  $('wrapSaveLessons').disabled=true;
  try{ const r=await api({ action:'add_knowledge', docKey:'lessons', text:wrapLastLessons });
    if(r.ok){ logLine(T().wrap_saved_lessons); wrapMsg('ai', T().wrap_saved_lessons); } else alert(L('שגיאה','Error')); }
  catch(e){ alert(L('אין חיבור — נסה שוב','No connection — try again')); }
  finally{ $('wrapSaveLessons').disabled=false; }
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
