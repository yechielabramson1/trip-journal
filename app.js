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
const APP_VER='v89';
const I18N = {
  he:{ synced:'הכל מסונכרן ✓', pending:n=>'מסנכרן · '+n+' ממתינות', off:n=>'לא מקוון · '+n+' ממתינות',
       needcfg:'נדרשת הגדרה — פתח קישור ה-token', saved:'📝 נשמר', compressing:'🗜️ מעבד…', queued:'⬆️ בתור', toobig:'⚠️ הקובץ גדול מדי', switched:'➡️ עברת ל', thinking:'🤖 חושב…', neednet:'🤖 צריך חיבור לאינטרנט',
       ph_journal:'דבר אל המקלדת או הקלד מה קורה עכשיו…', btn_save:'💾 שמור ליומן', btn_itin:'🗓️ תכנית הטיול', btn_photos:'📷 תמונות', btn_docs:'📁 מסמכים', btn_receipts:'🧾 קבלות', btn_expense:'💶 הוצאה', btn_ask:"🤖 שאל את הקונסיירז'",
       my_trips:'🏔️ המסעות שלי', new_trip:'➕ טיול חדש', open_drive:'📂 פתח את הטיול בדרייב', hint_day:'הקש על *יום* לתצוגת שעות',
       btn_make_book:'📖 פתח ספר מסע', btn_rebuild_book:'🔄 עדכן / בנה ספר', book_building:'📖 בונה ספר…', book_done:'📖 הספר נוצר',
       ph_itin_ai:'ספר ל-AI מה לשנות… העבר ליום 3, הוסף ארוחת ערב…', item_new:'פריט חדש', item_edit:'עריכת פריט',
       ph_item_what:'מה? (למשל: אגם ברייס)', ph_place:'מקום / שם', ph_addr:'כתובת (יוצר לינק למפות + וייז)', ph_notes:'הערות / לינק הזמנה',
       save:'💾 שמור', del:'🗑️ מחק', close:'סגור', upload_new:'➕ העלה / צלם חדש', ai_concierge:"🤖 קונסיירז' AI",
       ph_ask:'שאל על המסע… מקום, תאריך, מה עשינו', open_story:'📂 פתח את הסיפור המלא', ask:'שאל', tell_story:'📖 ספר את הסיפור',
       new_expense:'💶 הוצאה חדשה', ph_amount:'סכום', ph_desc:'תיאור (לא חובה)', attach_receipt:'📷 צרף קבלה / צילום מסך',
       paste_clipboard:'📋 הדבק צילום מהלוח (Copy & Delete)', keep_receipt:'שמור גם את צילום הקבלה (לקבלות אמיתיות)', save_expense:'💾 שמור הוצאה',
       del_expense:'🗑️ מחק הוצאה', edit_expense:'📋 ערוך הוצאה קיימת', peek_sheet:'📊 הצצה לגיליון ההוצאות',
       btn_brain:'🧠 המוח — ידע לכל הטיולים', brain_hub:'🧠 המוח — לקחים וידע לכל הטיולים', lv_search:'שאל/בקש מהמוח… (הקלדה מסננת)', lv_add:'הוסף פריט…', kv_search:'שאל את המוח: למשל מה למדתי על השכרת רכב?', kv_add:'הוסף לקח / הוראה… ה-AI יארגן',
       paste_hdr:'📋 הדבק רשימה — ה-AI יפצל לפריטים', paste_ph:'הדבק כאן טקסט חופשי / רשימה…', paste_split:'✨ פצל והוסף', paste_cancel:'ביטול', open_sheet:'📊 פתח את הגיליון',
       btn_meal_photo:'📸 צלם ארוחה (זיהוי פריטים)', btn_food_photo:'📷 נתח תפריט / שלט (כשר+טבעוני)',
       btn_analyze_doc:'🔎 נתח מסמך נסיעה (AI)', doc_hdr:'🔎 ניתוח מסמך נסיעה', doc_to_itin:'➕ הוסף לתכנית', doc_to_expense:'💶 הוסף הוצאה', doc_to_note:'📝 שמור כהערת יומן',
       btn_food:'🍽️ יומן אוכל', food_hdr:'🍽️ יומן אוכל', food_ph:'מה אכלתם / מה קניתם לאכול היום?', food_save:'💾 שמור', food_saved:'🍽️ נשמר', food_sheet:'📊 פתח את גיליון האוכל',
       btn_lesson:'💡 לקח מהטיול', lesson_hdr:'💡 לקח מהטיול — תובנה מהשטח', lesson_ph:'מה הלקח / התובנה?', lesson_note:'תובנה חיה מהטיול הזה. נשמרת בנפרד מהיומן (לא בספר-המסע), מופיעה ב-📚 "כל מה שנשמר", נכללת בהפקת-הלקחים של "🏁 סיום מסע", ובסוף זורמת ל-🧠 המוח הגלובלי לטיולים הבאים.', lesson_saved:'💡 הלקח נשמר', send_to_brain:'📤 שלח למוח הגלובלי',
       food_kinds:{'מסעדה':'🍴 מסעדה','קפה':'☕ קפה','סופרמרקט':'🛒 סופרמרקט','בישול':'🍳 בישלנו','אחר':'אחר'},
       group_country:'קבץ לפי מדינה', no_country:'— ללא מדינה —', organize_confirm:'לארגן מחדש את כל המסמך? (ממזג כפילויות ומסדר לפי נושאים)', organizing_all:'🤖 מסדר…', restore_confirm:'לשחזר את המסמך מהגיבוי שלפני הסידור האחרון?', restored_ok:'↩️ שוחזר מהגיבוי',
       btn_wrap:'🏁 סיום מסע — סיכום ולקחים', wrap_title:'🏁 סיכום המסע', wrap_gen:'✨ הפק סיכום ולקחים', wrap_chat_ph:'מה היה טוב? מה לשפר לפעם הבאה?', wrap_save_lessons:'📥 שמור את הלקחים למוח',
       wrap_gathering:'🗂️ אוסף את נתוני המסע…', wrap_summarizing:'🤖 מסכם ומפיק לקחים…', wrap_thinking:'🤖 חושב…', wrap_retry:'⏳ ארך מעט — הקש/שלח שוב', wrap_saved_lessons:'✅ הלקחים נשמרו במוח (לקחים)', wrap_nolessons:'אין עדיין לקחים לשמור — הפק סיכום או שוחח קודם', wrap_hint:'הפק סיכום, ואז שוחחו כדי לחלץ לקחים לטיולים הבאים 🛫',
       btn_dash:'📚 כל מה שנשמר', btn_nb:'📓 מוח מחקר (NotebookLM)', dash_title:'📚 כל מה שנשמר',
       dtabs:{photos:'📷 תמונות',expenses:'💶 הוצאות',docs:'📁 מסמכים',lessons:'💡 לקחים'},
       bk_hdr:'📖 צור ספר מסע', bk_build:'בנה ספר',
       bk_voice:{authentic:'✍️ אותנטי — המילים שלך + תמונות',literary:'📜 ספרותי — נרטיב AI + תמונות',combined:'📖 משולב — נרטיב + הרשומות'},
       bk_scope:{all:'📕 כל הטיול — ספר אחד',chapters:'📚 לפי פרקים (יום-יום)',range:'📅 טווח ימים'},
       nb_hdr:'📓 מוח מחקר — NotebookLM', nb_save:'💾 שמור קישור', nb_open:'📓 פתח מוח מחקר', nb_packet:'📦 עדכן חבילת מחקר',
       app_title:'יומן מסע',
       types:{activity:'🥾 פעילות',sight:'📸 אתר',meal:'🍽️ אוכל',hotel:'🏨 מלון',travel:'🚗 נסיעה'},
       cats:{'טיסות':'טיסות','השכרת רכב':'השכרת רכב','לינה':'לינה','אוכל ומסעדות':'אוכל ומסעדות','דלק/תחבורה':'דלק/תחבורה','אטרקציות':'אטרקציות','קניות':'קניות','אחר':'אחר'},
       methods:{'Apple Pay':'Apple Pay','מזומן':'מזומן','כרטיס אשראי':'כרטיס אשראי','אחר':'אחר'} },
  en:{ synced:'All synced ✓', pending:n=>'Syncing · '+n+' pending', off:n=>'Offline · '+n+' pending',
       needcfg:'Setup needed — open the token link', saved:'📝 Saved', compressing:'🗜️ Processing…', queued:'⬆️ Queued', toobig:'⚠️ File too large', switched:'➡️ Switched to ', thinking:'🤖 Thinking…', neednet:'🤖 Internet connection needed',
       ph_journal:'Speak or type what’s happening now…', btn_save:'💾 Save to journal', btn_itin:'🗓️ Trip plan', btn_photos:'📷 Photos', btn_docs:'📁 Documents', btn_receipts:'🧾 Receipts', btn_expense:'💶 Expense', btn_ask:'🤖 Ask the concierge',
       my_trips:'🏔️ My trips', new_trip:'➕ New trip', open_drive:'📂 Open trip in Drive', hint_day:'tap a *day* for the hour view',
       btn_make_book:'📖 Open trip book', btn_rebuild_book:'🔄 Update / build book', book_building:'📖 Building book…', book_done:'📖 Book created',
       ph_itin_ai:'Tell the AI what to change… move to day 3, add dinner…', item_new:'New item', item_edit:'Edit item',
       ph_item_what:'What? (e.g. Lake Braies)', ph_place:'Place / name', ph_addr:'Address (creates Maps + Waze link)', ph_notes:'Notes / booking link',
       save:'💾 Save', del:'🗑️ Delete', close:'Close', upload_new:'➕ Upload / take new', ai_concierge:'🤖 AI concierge',
       ph_ask:'Ask about the trip… place, date, what we did', open_story:'📂 Open full story', ask:'Ask', tell_story:'📖 Tell the story',
       new_expense:'💶 New expense', ph_amount:'Amount', ph_desc:'Description (optional)', attach_receipt:'📷 Attach receipt / screenshot',
       paste_clipboard:'📋 Paste screenshot (Copy & Delete)', keep_receipt:'Also keep the receipt image (for real receipts)', save_expense:'💾 Save expense',
       del_expense:'🗑️ Delete expense', edit_expense:'📋 Edit an existing expense', peek_sheet:'📊 Open the expenses sheet',
       btn_brain:'🧠 The Brain — all-trips knowledge', brain_hub:'🧠 The Brain — lessons & knowledge for every trip', lv_search:'Ask the Brain… (typing filters)', lv_add:'Add an item…', kv_search:'Ask the Brain: e.g. what did I learn about car rentals?', kv_add:'Add a lesson / how-to… the AI will organize it',
       paste_hdr:'📋 Paste a list — the AI will split it into items', paste_ph:'Paste free text / a list here…', paste_split:'✨ Split & add', paste_cancel:'Cancel', open_sheet:'📊 Open the sheet',
       btn_meal_photo:'📸 Snap your meal (identify items)', btn_food_photo:'📷 Analyze menu / sign (kosher+vegan)',
       btn_analyze_doc:'🔎 Analyze travel doc (AI)', doc_hdr:'🔎 Travel document analysis', doc_to_itin:'➕ Add to itinerary', doc_to_expense:'💶 Add expense', doc_to_note:'📝 Save as journal note',
       btn_food:'🍽️ Food log', food_hdr:'🍽️ Food log', food_ph:'What did you eat / buy to eat today?', food_save:'💾 Save', food_saved:'🍽️ Saved', food_sheet:'📊 Open the food sheet',
       btn_lesson:'💡 Trip lesson', lesson_hdr:'💡 Trip lesson — a field insight', lesson_ph:"What's the lesson / insight?", lesson_note:'A live insight from this trip. Saved separately from the journal (not in the Story Book), appears in 📚, included in the "🏁 Wrap-up" lessons, and flows to the 🧠 global Brain for future trips.', lesson_saved:'💡 Lesson saved', send_to_brain:'📤 Send to global Brain',
       food_kinds:{'מסעדה':'🍴 Restaurant','קפה':'☕ Café','סופרמרקט':'🛒 Supermarket','בישול':'🍳 Cooked','אחר':'Other'},
       group_country:'Group by country', no_country:'— no country —', organize_confirm:'Reorganize the whole document? (merges duplicates, sorts by topic)', organizing_all:'🤖 Organizing…', restore_confirm:'Restore the document from the backup before the last reorganize?', restored_ok:'↩️ Restored from backup',
       btn_wrap:'🏁 Wrap up trip — summary & lessons', wrap_title:'🏁 Trip wrap-up', wrap_gen:'✨ Generate summary & lessons', wrap_chat_ph:'What went well? What to improve next time?', wrap_save_lessons:'📥 Save the lessons to the Brain',
       wrap_gathering:'🗂️ Gathering the trip data…', wrap_summarizing:'🤖 Summarizing & extracting lessons…', wrap_thinking:'🤖 Thinking…', wrap_retry:'⏳ Took a moment — tap/send again', wrap_saved_lessons:'✅ Lessons saved to the Brain (Lessons)', wrap_nolessons:'No lessons to save yet — generate a summary or chat first', wrap_hint:'Generate a summary, then chat to extract lessons for future trips 🛫',
       btn_dash:'📚 Everything saved', btn_nb:'📓 Research brain (NotebookLM)', dash_title:'📚 Everything saved',
       dtabs:{photos:'📷 Photos',expenses:'💶 Expenses',docs:'📁 Documents',lessons:'💡 Lessons'},
       bk_hdr:'📖 Create a Story Book', bk_build:'Build the book',
       bk_voice:{authentic:'✍️ Authentic — your words + photos',literary:'📜 Literary — AI narrative + photos',combined:'📖 Combined — narrative + entries'},
       bk_scope:{all:'📕 Whole trip — one book',chapters:'📚 By chapters (day by day)',range:'📅 Date range'},
       nb_hdr:'📓 Research brain — NotebookLM', nb_save:'💾 Save link', nb_open:'📓 Open research brain', nb_packet:'📦 Update research packet',
       app_title:'Trip Journal',
       types:{activity:'🥾 Activity',sight:'📸 Sight',meal:'🍽️ Food',hotel:'🏨 Hotel',travel:'🚗 Travel'},
       cats:{'טיסות':'Flights','השכרת רכב':'Car rental','לינה':'Lodging','אוכל ומסעדות':'Food & dining','דלק/תחבורה':'Fuel / Transport','אטרקציות':'Attractions','קניות':'Shopping','אחר':'Other'},
       methods:{'Apple Pay':'Apple Pay','מזומן':'Cash','כרטיס אשראי':'Credit card','אחר':'Other'} }
};
const uiLang = () => getAuthor()==='Sky' ? 'en' : 'he';
/* 🌐 Viewer Language Layer — תרגום-לתצוגה בלבד; המקור ב-Drive/Sheets לא משתנה לעולם */
// he-viewer: טקסט שיש בו עברית → תרגם רק אם יש ריצת-לטינית ארוכה (שם-מותג קצר כמו Ofran נשאר); אבל
// טקסט שכולו אנגלי (בלי עברית כלל) — כמו "coffee" שנוצר ע"י Sky — תרגם תמיד, כדי שג'ק יראה עברית.
const needsViewTx = s => { s = String(s||'').replace(/https?:\/\/\S+/g,'');
  if(uiLang()==='en') return /[֐-׿]/.test(s);
  return /[֐-׿]/.test(s) ? /[A-Za-z][A-Za-z' -]{14,}/.test(s) : /[A-Za-z]{2,}/.test(s); };
const __vtCache = new Map();   // cache בצד-לקוח לסשן (בנוסף ל-cache בשרת)
async function viewTexts(texts){   // מחזיר מערך display באותו אורך/סדר; fallback = המקור
  const out=texts.slice(); const miss=[], missIx=[];
  texts.forEach((t,i)=>{ if(!needsViewTx(t)) return;
    const k=uiLang()+'|'+t; if(__vtCache.has(k)) out[i]=__vtCache.get(k); else { miss.push(t); missIx.push(i); } });
  if(miss.length){
    try{ const r=await api({ action:'translate_for_view', viewerLang:uiLang(), texts:miss });
      if(r.ok && r.texts) r.texts.forEach((x,j)=>{ out[missIx[j]]=x.display; __vtCache.set(uiLang()+'|'+miss[j], x.display); });
    }catch(e){}
  }
  return out;
}
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
  set('newtrip',t.new_trip); set('drivelink',t.open_drive); set('makebook',t.btn_make_book); set('rebuildbook',t.btn_rebuild_book);
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
  // 🧳 Trip Brain scope labels (גם כשהמסך סגור — שלא תישאר עברית סטטית אצל Sky); אם פתוח, רענן גם placeholder/מצב
  try{ lvApplyScopeLabels(); if(!$('listview').hidden) lvSetScopeUI(); }catch(e){}
  set('pasteHdr',t.paste_hdr); ph('pasteText',t.paste_ph); set('pasteSplit',t.paste_split); set('pasteCancel',t.paste_cancel);
  set('lvSheet',t.open_sheet);
  // food log
  set('foodbtn',t.btn_food); set('foodHdr',t.food_hdr); ph('foodText',t.food_ph); set('foodSave',t.food_save); set('foodSheet',t.food_sheet); set('foodClose',t.close); set('foodPhotoBtn',t.btn_food_photo); set('mealPhotoBtn',t.btn_meal_photo);
  opts('foodKind',t.food_kinds);
  set('lessonbtn',t.btn_lesson); set('lessonHdr',t.lesson_hdr); ph('lessonText',t.lesson_ph); set('lessonSave',t.food_save); set('lessonClose',t.close); set('lessonNote',t.lesson_note);
  // travel-doc analyze
  set('docAnalyzeBtn',t.btn_analyze_doc); set('docHdr',t.doc_hdr); set('docToItin',t.doc_to_itin); set('docToExpense',t.doc_to_expense); set('docToNote',t.doc_to_note); set('docClose',t.close);
  // trip wrap-up
  set('wrapbtn',t.btn_wrap); set('wrapTitle',t.wrap_title); set('wrapGen',t.wrap_gen); ph('wrapChat',t.wrap_chat_ph); set('wrapSaveLessons',t.wrap_save_lessons);
  // 🌐 i18n מלא (סבב 06/11): דשבורד, ספר-מסע gate, NotebookLM, lesson→brain, כותרת-המסמך, aria
  document.title=t.app_title;
  set('dashbtn',t.btn_dash); set('nbbtn',t.btn_nb); set('dashTitle',t.dash_title);
  document.querySelectorAll('#dashtabs .dtab').forEach(b=>{ const k=b.dataset.tab; if(t.dtabs[k]) b.textContent=t.dtabs[k]; });
  set('bkHdr',t.bk_hdr); set('bkBuild',t.bk_build); set('bkCancel',t.close);
  opts('bkVoice',t.bk_voice); opts('bkScope',t.bk_scope);
  set('nbHdr',t.nb_hdr); set('nbSave',t.nb_save); set('nbOpen',t.nb_open); set('nbPacket',t.nb_packet); set('nbClose',t.close);
  set('dayeditClose',t.close); set('lessonToBrain',t.send_to_brain);
  // NL-UX sweep: שער טיול-חדש — בשפת-הצופה (היה דו-לשוני סטטי)
  const ntp=document.querySelector('#newtripgate p'); if(ntp) ntp.textContent=L('שם הטיול החדש','New trip name');
  ph('newtripname', L('לדוגמה: יוון 2027','e.g. Greece 2027'));
  set('newtripcreate', L('צור טיול','Create trip')); set('newtripcancel', L('ביטול','Cancel'));
  const ARIA={'סגור':'Close','תפריט':'Menu','כותב':'Writer','הוסף':'Add','נקה':'Clear','שאל':'Ask','שחזר':'Restore','מסמך':'Document','ארכיון':'Archive','סדר הכל':'Organize all','קבץ לפי מדינה':'Group by country','הדבק רבים':'Paste many','שלח':'Send','מתאריך':'From date','עד תאריך':'To date','שחזר תכנית':'Restore plan','עדכן או בנה מחדש':'Update / rebuild','ערוך את היום':'Edit this day','עוד תמונות מהיום':'More photos from this day'};
  const ARIA_BACK={}; Object.keys(ARIA).forEach(k=>ARIA_BACK[ARIA[k]]=k);
  document.querySelectorAll('[aria-label]').forEach(el=>{ const v=el.getAttribute('aria-label'); const m=en?ARIA[v]:ARIA_BACK[v]; if(m) el.setAttribute('aria-label',m); });
  const veil=document.getElementById('bootveil'); if(veil) veil.remove();   // 🌐 anti-flash: הטקסטים הוחלפו — מציגים
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
function escapeHtml(s){ return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
// חותמת-זמן קצרה אחידה: dd/MM HH:mm (או dd/MM אם אין שעה). מקבל ISO / dd/MM/yyyy[ HH:mm] / YYYY-MM-DD.
function shortTs(s){ s=String(s||'').trim(); if(!s) return ''; let m;
  if((m=s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/))) return m[3]+'/'+m[2]+' '+m[4]+':'+m[5];
  if((m=s.match(/^(\d{4})-(\d{2})-(\d{2})/)))               return m[3]+'/'+m[2];
  if((m=s.match(/^(\d{1,2})\/(\d{1,2})\/\d{2,4}\s+(\d{1,2}):(\d{2})/))) return m[1]+'/'+m[2]+' '+m[3]+':'+m[4];
  if((m=s.match(/^(\d{1,2})\/(\d{1,2})\/\d{2,4}/)))         return m[1]+'/'+m[2];
  return s; }

/* ---------- API (online actions) ---------- */
// fetch עם timeout (AbortController) — בקשה תקועה מחזירה שגיאה במקום ספינר-אינסופי. ברירת מחדל 120ש' (פעולות-AI איטיות).
async function postEndpoint(body, ms){
  const ctrl = (typeof AbortController!=='undefined') ? new AbortController() : null;
  const to = ctrl ? setTimeout(()=>{ try{ ctrl.abort(); }catch(e){} }, ms||120000) : null;
  try{ return await fetch(ENDPOINT, { method:'POST', redirect:'follow',
    headers:{'Content-Type':'text/plain;charset=utf-8'}, body:JSON.stringify(body), signal:ctrl?ctrl.signal:undefined }); }
  finally{ if(to) clearTimeout(to); }
}
async function api(payload){
  const r = await postEndpoint({ v:SCHEMA_V, token:token(), ...payload });
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
let _geoPrompted=false;   // לא לבקש מיקום יותר מפעם אחת לכל פתיחת-אפליקציה
function quickLocation(){ return new Promise(res=>{ if(!navigator.geolocation) return res(null);
  const get=()=>navigator.geolocation.getCurrentPosition(
    p=>res({lat:+p.coords.latitude.toFixed(5),lng:+p.coords.longitude.toFixed(5)}),
    ()=>res(null), {enableHighAccuracy:false,timeout:8000,maximumAge:600000});   // 8ש' (GPS קר צריך יותר מ-4); משתמש בקריאה מהעבר (עד 10 דק')
  const decide=(state)=>{ if(state==='granted') return get();          // הורשה — שקט, בלי שאלה
    if(state==='denied') return res(null);                              // נדחה — לא שואלים שוב
    if(_geoPrompted) return res(null);                                  // 'prompt' — שואלים לכל היותר פעם אחת לכל סשן
    _geoPrompted=true; get(); };
  try{ if(navigator.permissions && navigator.permissions.query)
      navigator.permissions.query({name:'geolocation'}).then(s=>decide(s.state)).catch(()=>decide('prompt'));
    else decide('prompt');
  }catch(e){ decide('prompt'); }
}); }

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
/* P1-2 (Fable review, Codex-verified): פריט-capture לעולם לא נמחק מהתור על כשל.
 * dbDel רק אחרי ok:true מהשרת. דחיית-שרת (ok:false — Lock timeout / auth / no trip / transient)
 * → התור נעצר עם באנר קבוע "סנכרון מושהה — שום דבר לא אבד" + retry בהשהיה. אין מחיקה שקטה. */
async function sendItem(item){
  const body={ ...item.payload, v:SCHEMA_V, token:token() };
  if(item.blob) body.dataB64=await blobToB64(item.blob);
  const r=await postEndpoint(body);
  if(!r.ok){ const e=new Error('HTTP '+r.status); e.retriable=true; throw e; }   // רשת/שרת-למטה → ננסה שוב
  const j=await r.json();
  if(!j.ok){ const e=new Error(j.error||'server rejected'); e.blocking=true; throw e; }   // השרת דחה → לא מוחקים; חוסמים-בגלוי ומנסים שוב
  return j;
}
let flushing=false, backoff=0, syncBlocked=null;   // syncBlocked={msg,ts} — דחיית-שרת גלויה; שום פריט לא נמחק
async function flush(){
  if(flushing||!token()) return; flushing=true;
  try{
    const items=(await dbAll()).sort((a,b)=>a.seq-b.seq);
    for(const it of items){
      try{ await sendItem(it); await dbDel(it.seq); backoff=0;   // מחיקה מהתור — אך ורק אחרי הצלחה מאושרת
        if(syncBlocked){ syncBlocked=null; logLine('✅ '+L('הסנכרון התחדש — הכל נשמר','Sync resumed — everything saved')); }
      }
      catch(err){
        if(err && err.blocking && !syncBlocked){
          syncBlocked={ msg:String(err.message||''), ts:Date.now() };
          logLine('⛔ '+L('סנכרון מושהה — שום רשומה לא אבדה. שגיאת שרת: ','Sync paused — nothing was lost. Server error: ')+syncBlocked.msg);
        }
        // הפריט נשאר בתור (FIFO נשמר) — retry בהשהיה גוברת; ייפתר לבד כשהשרת יחזור לענות ok:true
        backoff=Math.min((backoff||1000)*2,60000); setTimeout(()=>{flushing=false;flush();},backoff); await render(); return;
      }
    }
    if(syncBlocked) syncBlocked=null;   // התור התרוקן בהצלחה — אין עוד חסימה
  } finally { flushing=false; }
  await render();
}

/* ---------- UI ---------- */
async function render(){
  const n=await dbCount(); const s=$('status'); const t=T();
  if(!token()){ s.textContent=t.needcfg; s.className='off'; return; }
  // P1-2: באנר קבוע כשהשרת דוחה — המשתמש רואה שמשהו תקוע ושום דבר לא אבד
  if(syncBlocked && n>0){ s.textContent='⛔ '+L('סנכרון מושהה · '+n+' ממתינות — שום דבר לא אבד','Sync paused · '+n+' pending — nothing lost'); s.className='off'; return; }
  if(!navigator.onLine){ s.textContent=t.off(n); s.className='off'; }
  else if(n>0){ s.textContent=t.pending(n); s.className='pending'; }
  else { s.textContent=t.synced; s.className='ok'; }
}
function logLine(t){ const d=document.createElement('div'); d.textContent=t; $('log').prepend(d); }
// Toast קצר וזמני (לא חוסם) — נעלם לבד. שימוש: feedback אחרי פעולות AI/ייבוא.
let _toastTimer=null;
function toast(msg, ms){ let el=$('toast'); if(!el){ el=document.createElement('div'); el.id='toast'; document.body.appendChild(el); }
  el.textContent=msg; el.classList.add('show'); clearTimeout(_toastTimer); _toastTimer=setTimeout(()=>el.classList.remove('show'), ms||5000); }
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

// 📖 ספר המסע — בונה HTML פרטי ב-Drive ופותח אותו (ללא auto-share)
// 📖 ספר המסע v2.1 — שער (היקף + קול), ספר-יחיד או chaptered (לולאת ימים)
function b64ToUtf8(b64){ const bin=atob(b64); const bytes=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i); return new TextDecoder('utf-8').decode(bytes); }
let storyDaysCache=null, bookChapters=[], bookBuildId='', currentBookDay='', currentDayIndex='', currentChapterIdx=-1, currentBookFileId='';
function bkBusy(on, msg){ ['bkBuild','bkCancel','bkVoice','bkScope'].forEach(id=>{ $(id).disabled=on; }); const p=$('bkProgress'); if(on){ p.hidden=false; if(msg) p.textContent=msg; } else { p.hidden=true; } }
function bkProgress(msg){ const p=$('bkProgress'); p.hidden=false; p.textContent=msg; }
function logBookStats(s){ const ai = s.voiceFallback ? L(' · נכתב אותנטי (AI לא זמין)',' · authentic (AI unavailable)') : (s.aiUsed ? L(' · עם נרטיב AI',' · with AI narrative') : ''); logLine(T().book_done+' · '+(s.entries||0)+' '+L('רשומות','entries')+', '+(s.photos||0)+' '+L('תמונות','photos')+', '+Math.round((s.bytes||0)/1024)+'KB'+ai); }

// 📖 כפתור ראשי = פתיחה מהירה של הספר האחרון (בלי build). אין ספר → פותח את שער-הבנייה.
$('makebook').onclick=()=>openLatestBook();
// 🔄 עדכן/בנה ספר — פעולת-בנייה מפורשת (השער הקיים)
$('rebuildbook').onclick=()=>{ if(!ensureTrip()) return; openBuildGate(); };
async function openBuildGate(){
  if(!ensureTrip()) return;
  closeDrawer(); bkBusy(false); $('bkProgress').hidden=true;
  $('bookmeta').textContent=L('טוען…','Loading…'); $('bookgate').hidden=false;
  try{
    const r=await api({ action:'story_days', tripId:getTripId() });
    storyDaysCache = (r.ok && r.days) ? r.days : [];
    const nd=storyDaysCache.length, np=(r&&r.totalPhotos)||0, long = nd>5 || np>50;
    $('bookmeta').textContent = nd+' '+L('ימים עם תוכן','days')+' · '+np+' '+L('תמונות','photos')+(long?(' · '+L('מומלץ: לפי פרקים','recommended: chapters')):'');
    $('bkScope').value = long ? 'chapters' : 'all'; onScopeChange();
  }catch(e){ storyDaysCache=[]; $('bookmeta').textContent=''; }
}
function onScopeChange(){
  const sc=$('bkScope').value; $('bkRange').hidden = (sc!=='range');
  if(sc==='range' && storyDaysCache && storyDaysCache.length){
    if(!$('bkFrom').value) $('bkFrom').value=storyDaysCache[0].day;
    if(!$('bkTo').value)   $('bkTo').value=storyDaysCache[storyDaysCache.length-1].day;
  }
}
$('bkScope').onchange=onScopeChange;
$('bkCancel').onclick=()=>{ $('bookgate').hidden=true; };
$('bkBuild').onclick=async()=>{
  if(!navigator.onLine){ alert(L('צריך חיבור כדי לבנות ספר','A connection is needed to build the book')); return; }
  const voice=$('bkVoice').value, sc=$('bkScope').value;
  if(sc==='chapters') return buildChaptered(voice);
  if(sc==='range'){ const f=$('bkFrom').value, t=$('bkTo').value; if(!f||!t){ alert(L('בחר טווח תאריכים','Pick a date range')); return; } return buildSingle({voice, scope:'range', fromDay:f, toDay:t}); }
  return buildSingle({voice, scope:'all'});
};

// ----- ספר-יחיד (כל הטיול / טווח) -----
async function buildSingle(params){
  bkBusy(true, L('בונה ספר…','Building…'));
  try{
    const r=await api(Object.assign({ action:'build_story_book', tripId:getTripId(), viewerLang:uiLang() }, params));
    if(r.ok && r.htmlB64){ logBookStats(r.stats||{}); $('bookgate').hidden=true;
      const oneDay=(params.scope==='range' && params.fromDay===params.toDay)?params.fromDay:'';   // ספר של יום בודד → כפתור 📸 רלוונטי
      bookChapters=[]; bookBuildId='';
      saveBookManifest('single', params.voice, { fileId:r.fileId, bytes:(r.stats&&r.stats.bytes)||0, scope:params.scope, day:oneDay, dayIndex:'' });
      openBookView(b64ToUtf8(r.htmlB64), r.url, {day:oneDay, index:'', fileId:r.fileId||''}); }
    else if(r.ok && r.tooBig){ alert(L('📖 הספר גדול מדי לתצוגה — בחר "לפי פרקים". הקובץ נשמר בדרייב.','📖 Too large to display — choose "chapters". Saved to Drive.')); }
    else if(r && r.service){ alert(L('⏳ הבנייה ארכה — נסה "לפי פרקים"','⏳ Took too long — try "chapters"')); }
    else alert(L('שגיאה: ','Error: ')+(r.error||''));
  }catch(e){ alert(L('אין חיבור — נסה שוב','No connection — try again')); }
  finally{ bkBusy(false); }
}

// ----- chaptered: לולאת בקשות-יום ב-PWA (פרק=בקשה אחת, קריאת-AI אחת לכל היותר) -----
async function buildDayChapter_(d, voice){
  const r=await api({ action:'build_story_book', tripId:getTripId(), viewerLang:uiLang(), voice, scope:'chapter', day:d.day, dayIndex:d.index, buildId:bookBuildId, maxPhotos:8 });
  if(r.ok && r.htmlB64){ bookChapters.push({ index:d.index, label:L('יום ','Day ')+d.index, day:d.day, fileId:r.fileId||'', htmlB64:r.htmlB64, aiUsed:(r.stats&&r.stats.aiUsed) }); return true; }
  return false;
}
// 📚 שמירת מצביע ל-Drive של הבנייה האחרונה — כך "פתח ספר" קורא מיד בלי build
async function saveBookManifest(mode, voice, single){
  try{
    if(mode==='chaptered'){
      const chapters=bookChapters.map(c=>({ index:c.index, day:c.day, label:c.label, fileId:c.fileId, aiUsed:c.aiUsed }));
      if(!chapters.length || !chapters.every(c=>c.fileId)) return;   // לא שומרים manifest חלקי
      await api({ action:'save_story_manifest', tripId:getTripId(), manifest:{ mode:'chaptered', scope:'chapters', voice, lang:uiLang(), buildId:bookBuildId, chapters, stats:{ chapters:chapters.length, aiChapters:bookChapters.filter(c=>c.aiUsed).length } } });
    } else if(single && single.fileId){
      await api({ action:'save_story_manifest', tripId:getTripId(), manifest:{ mode:'single', scope:single.scope, voice, lang:uiLang(), fullBook:single } });
    }
  }catch(e){}
}
async function buildChaptered(voice){
  let days=(storyDaysCache||[]).slice();
  // 🛡️ תיקון "אין רשומות" כוזב: אם הטעינה הראשונית של story_days נכשלה (עומס/redirect) — מנסים שוב לפני שמתריעים
  if(!days.length){ try{ const r=await api({ action:'story_days', tripId:getTripId() }); storyDaysCache=(r.ok&&r.days)?r.days:[]; days=storyDaysCache.slice(); }catch(e){} }
  if(!days.length){ alert(L('אין עדיין רשומות לספר','No entries yet')); return; }
  bookBuildId=String(Date.now()); bookChapters=[]; const failed=[];
  bkBusy(true);
  for(let i=0;i<days.length;i++){
    bkProgress(L('בונה יום ','Building day ')+(i+1)+'/'+days.length+'…');
    try{ if(!await buildDayChapter_(days[i], voice)) failed.push(days[i]); }
    catch(e){ failed.push(days[i]); }   // כשל-יום לא מוחק פרקים קודמים
  }
  bkBusy(false);
  if(!bookChapters.length){ alert(L('הבנייה נכשלה — נסה שוב','Build failed — try again')); return; }
  bookChapters.sort((a,b)=>a.index-b.index);
  const aiN=bookChapters.filter(c=>c.aiUsed).length;
  logLine('📚 '+bookChapters.length+' '+L('פרקים','chapters')+(aiN?(' · '+aiN+' '+L('עם נרטיב','with narrative')):'')+(failed.length?(' · '+failed.length+' '+L('נכשלו','failed')):''));
  if(!failed.length) saveBookManifest('chaptered', voice);   // ספר שלם → שמור מצביע ל"מדף"
  $('bookgate').hidden=true; openChapteredView(failed, voice);
}
async function retryFailed(failed, voice){
  if(!navigator.onLine){ alert(L('צריך חיבור','Connection needed')); return; }
  const still=[];
  for(let i=0;i<failed.length;i++){ bkProgress(L('בונה מחדש ','Rebuilding ')+(i+1)+'/'+failed.length+'…');
    try{ if(!await buildDayChapter_(failed[i], voice)) still.push(failed[i]); }catch(e){ still.push(failed[i]); } }
  bookChapters.sort((a,b)=>a.index-b.index);
  if(!still.length) saveBookManifest('chaptered', voice);   // הושלם → רענן את ה"מדף"
  openChapteredView(still, voice);
}

// ----- viewer: פרק אחד בזיכרון בכל רגע (lazy) -----
function setBookDay(day, index){ currentBookDay=day||''; currentDayIndex=index||''; $('bookmore').hidden = !currentBookDay; }
function openBookView(html, driveUrl, dayInfo){
  $('booktitle').textContent='📖 '+L('ספר המסע','Story Book');   // 🌐 i18n: אחרי build הכותרת נשארה ברירת-המחדל העברית הסטטית
  const _n=$('bookLangNote'); if(_n) _n.hidden=true;             // 🌐 בנייה-טרייה = בשפת-הצופה; הבאנר נקבע מחדש רק בפתיחה-מהמדף
  $('bookchips').hidden=true; $('bookchips').innerHTML=''; currentChapterIdx=-1; $('bookedit').hidden=true;   // עריכה נעשית ישירות על הרשומה בתוך הספר
  setBookDay(dayInfo&&dayInfo.day, dayInfo&&dayInfo.index);
  currentBookFileId=(dayInfo&&dayInfo.fileId)||'';
  $('bookframe').srcdoc=html;
  scheduleBookInlineWire();
  const dl=$('bookdrive'); dl.href=driveUrl||'#'; dl.style.display=driveUrl?'inline':'none';
  $('bookview').hidden=false; document.body.style.overflow='hidden';
}
function openChapteredView(failed, voice){
  $('booktitle').textContent='📖 '+L('ספר המסע','Story Book');   // 🌐 i18n: כותרת בשפת-הצופה גם במצב-פרקים
  const _n2=$('bookLangNote'); if(_n2) _n2.hidden=true;          // 🌐 בנייה-טרייה = בשפת-הצופה
  const chips=$('bookchips'); chips.innerHTML=''; chips.hidden=false;
  bookChapters.forEach((c,idx)=>{ const b=document.createElement('button'); b.className='chip'; b.textContent=c.label; b.onclick=()=>showChapter(idx); chips.appendChild(b); });
  if(failed && failed.length){ const rb=document.createElement('button'); rb.className='chip fail'; rb.textContent='↻ '+failed.length+' '+L('נכשלו','failed'); rb.onclick=()=>retryFailed(failed, voice); chips.appendChild(rb); }
  $('bookdrive').style.display='none'; $('bookedit').hidden=true;
  $('bookview').hidden=false; document.body.style.overflow='hidden';
  showChapter(0);
}
async function showChapter(idx){
  const c=bookChapters[idx]; if(!c) return;
  currentChapterIdx=idx; currentBookFileId=c.fileId||''; setBookDay(c.day, c.index); $('bookedit').hidden=true;   // עריכה ישירה על הרשומה בלבד
  Array.prototype.forEach.call($('bookchips').querySelectorAll('.chip:not(.fail)'), (el,i)=>el.classList.toggle('on', i===idx));
  if(!c.htmlB64 && c.fileId){   // "מדף": פרק נטען עצלן מ-Drive בלחיצה (בלי build)
    $('bookframe').srcdoc='<!doctype html><meta charset=utf-8><body style="font-family:system-ui;padding:24px;color:#64748b;direction:rtl">'+L('טוען פרק…','Loading chapter…')+'</body>';
    try{ const r=await api({ action:'get_story_book_chapter', tripId:getTripId(), fileId:c.fileId });
      if(r.ok && r.htmlB64) c.htmlB64=r.htmlB64; }catch(e){}
  }
  if(currentChapterIdx!==idx) return;   // המשתמש עבר פרק בזמן הטעינה
  $('bookframe').srcdoc = c.htmlB64 ? b64ToUtf8(c.htmlB64)
    : '<!doctype html><meta charset=utf-8><body style="font-family:system-ui;padding:24px;direction:rtl">'+L('הפרק לא נטען — נסה 🔄 לבנות מחדש','Chapter failed — try 🔄 rebuild')+'</body>';
  scheduleBookInlineWire();
}
// 📚 פתיחה מהירה: קורא את הספר האחרון מ-Drive (manifest) בלי לבנות. אין ספר → שער-בנייה.
async function openLatestBook(){
  if(!ensureTrip()) return;
  closeDrawer();
  let r; try{ r=await api({ action:'get_story_book_latest', tripId:getTripId() }); }
  catch(e){ alert(L('אין חיבור — נסה שוב','No connection — try again')); return; }
  if(r && r.empty) return openBuildGate();                                   // אין ספר עדיין → צור ראשון
  if(r && r.stale){ alert(L('הספר השמור חסר — בונים מחדש','Saved book missing — rebuilding')); return openBuildGate(); }
  if(!r || !r.ok){ alert(L('שגיאה: ','Error: ')+((r&&r.error)||'')); return openBuildGate(); }
  if(r.mode==='chaptered'){
    bookBuildId=String(Date.now());   // עריכות/rebuild מ"מדף" יקובצו לתת-תיקייה חדשה
    bookChapters=(r.chapters||[]).map(c=>({ index:c.index, label:c.label||(L('יום ','Day ')+c.index), day:c.day, fileId:c.fileId, aiUsed:c.aiUsed, htmlB64:null }));
    if(r.firstHtmlB64 && bookChapters[0]) bookChapters[0].htmlB64=r.firstHtmlB64;
    if(!bookChapters.length) return openBuildGate();
    openChapteredView([], r.voice||'authentic');
  } else {
    if(r.tooBig){ if(r.url) window.open(r.url,'_blank'); alert(L('📖 הספר גדול לתצוגה — נפתח בדרייב','📖 Too large — opened in Drive')); return; }
    if(!r.htmlB64) return openBuildGate();
    bookChapters=[]; bookBuildId='';
    openBookView(b64ToUtf8(r.htmlB64), r.url, {day:r.day||'', index:r.dayIndex||'', fileId:r.fileId||''});
  }
  setBookTitleMeta(r);
}
function setBookTitleMeta(r){   // כותרת: "📖 ספר המסע · עודכן <מתי>" + סימון אם יש תוכן חדש מאז
  let s='📖 '+L('ספר המסע','Story Book');
  if(r&&r.createdLabel) s+=' · '+L('עודכן ','updated ')+r.createdLabel;
  $('booktitle').textContent=s;
  $('bookrebuild').classList.toggle('hasnew', !!(r&&r.hasUpdates));
  $('bookrebuild').title = (r&&r.hasUpdates) ? L('יש תוכן חדש מאז הבנייה — עדכן','New content since build — update') : L('עדכן/בנה מחדש','Update / rebuild');
  bookLangNote(r);
}
// 🌐 הספר-השמור נבנה בשפה אחרת מזו של הצופה → באנר ברור + כפתור בנייה-מחדש (בלי ערבוב ובלי בלבול)
function bookLangNote(r, htmlSample){
  const note=$('bookLangNote'); if(!note) return;
  let bl=(r&&r.lang)||'';
  if(!bl && r && (r.htmlB64||r.firstHtmlB64)){ try{ const head=atob(String(r.htmlB64||r.firstHtmlB64).slice(0,200)); const m=head.match(/lang="(\w+)"/); if(m) bl=(m[1]==='en')?'en':'he'; }catch(e){} }   // manifests ישנים — זיהוי מראש-ה-HTML
  if(bl && bl!==uiLang()){
    note.innerHTML='<span style="flex:1">'+(uiLang()==='en'
      ? '🌐 This book was built in Hebrew — rebuild it in English to read it.'
      : '🌐 הספר הזה נבנה באנגלית — בנה מחדש בעברית כדי לקרוא.')+'</span>';
    const b=document.createElement('button'); b.textContent=uiLang()==='en'?'🔄 Rebuild in English':'🔄 בנה מחדש בעברית';
    b.onclick=()=>openBuildGate(); note.appendChild(b); note.hidden=false;
  } else note.hidden=true;
}
$('bookclose').onclick=()=>{ $('bookview').hidden=true; $('bookframe').srcdoc=''; $('bookchips').hidden=true; $('bookchips').innerHTML=''; $('dayeditgate').hidden=true; bookChapters=[]; currentChapterIdx=-1; currentBookFileId=''; $('bookedit').hidden=true; setBookDay('',''); $('booktitle').textContent='📖 '+L('ספר המסע','Story Book'); $('bookrebuild').classList.remove('hasnew'); document.body.style.overflow=''; };
// 🔄 עדכן/בנה מחדש — מתוך ה-viewer (פותח את שער-הבנייה)
$('bookrebuild').onclick=()=>openBuildGate();

// ✏️ עריכת/מחיקת רשומות-יומן — המסלול הישן של "בחר יום" נשאר רק כגיבוי פנימי.
// ב-UX הרגיל אין כפתור-יום: לוחצים על ✏️/🗑️ שעל הרשומה עצמה.
let editingDay='';
$('bookedit').onclick=()=>{ if(currentBookDay) openDayEditor(currentBookDay); else openDayPickerForJournalEdit(); };
$('dayeditClose').onclick=()=>{ $('dayeditgate').hidden=true; };
// תווית-יום קריאה: "יום N · רביעי 01/07" (יום-בשבוע + תאריך → המשתמש תופס יום שגוי מיד)
const HEB_WD=['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
function journalDayLabel(day, index){ if(!day) return '';
  if(!/^\d{4}-\d{2}-\d{2}$/.test(day)) return (index?(L('יום ','Day ')+index+' · '):'')+day;   // יום לא-תקני (נתון ישן/מלוכלך) — הצג כמו שהוא
  const dt=new Date(day+'T12:00:00');
  const wd = uiLang()==='en' ? dt.toLocaleDateString('en-US',{weekday:'long'}) : ('יום '+HEB_WD[dt.getDay()]);
  const dd=String(dt.getDate()).padStart(2,'0')+'/'+String(dt.getMonth()+1).padStart(2,'0');
  return (index?(L('יום ','Day ')+index+' · '):'')+wd+' '+dd; }
// תווית-יום לפריט-תכנית: מספר-יום מחושב מ-startDate (עמיד לנתון מלוכלך) + יום-בשבוע + תאריך
function itinDayLabel(day){ if(!day||!/^\d{4}-\d{2}-\d{2}$/.test(day)) return journalDayLabel(day);
  let idx=''; try{ const t=cachedTrips().find(x=>x.tripId===getTripId());
    if(t&&t.startDate){ const d0=new Date(t.startDate+'T12:00:00'), d1=new Date(day+'T12:00:00');
      const n=Math.round((d1-d0)/86400000)+1; if(n>=1) idx=n; } }catch(e){}
  return journalDayLabel(day, idx); }
// ספר מלא/ללא-יום → בורר-יום פשוט לפני העריכה
async function openDayPickerForJournalEdit(){
  $('dayeditHdr').textContent=L('בחר יום לעריכת רשומות','Pick a day to edit entries');
  $('dayeditBody').innerHTML='<div class="empty">'+L('טוען…','Loading…')+'</div>'; $('dayeditgate').hidden=false;
  if(!navigator.onLine){ $('dayeditBody').innerHTML='<div class="empty">'+L('צריך חיבור','Connection needed')+'</div>'; return; }
  let days=[];
  if(bookChapters.length) days=bookChapters.map(c=>({day:c.day,index:c.index}));
  else { try{ const r=await api({action:'story_days', tripId:getTripId()}); days=(r.days||[]).map(d=>({day:d.day,index:d.index})); }catch(e){} }
  const body=$('dayeditBody'); body.innerHTML='';
  if(!days.length){ body.innerHTML='<div class="empty">'+L('אין ימים עם תוכן','No days with content')+'</div>'; return; }
  const wrap=document.createElement('div'); wrap.className='daypick';
  days.forEach(d=>{ const b=document.createElement('button'); b.className='dpick'; b.textContent=journalDayLabel(d.day,d.index); b.onclick=()=>openDayEditor(d.day, d.index); wrap.appendChild(b); });
  body.appendChild(wrap);
}
async function openDayEditor(day, index){
  editingDay = day || currentBookDay || '';
  if(!editingDay) return openDayPickerForJournalEdit();
  if(index==null){ const ch=bookChapters.find(c=>c.day===editingDay); index=ch?ch.index:(editingDay===currentBookDay?currentDayIndex:''); }
  $('dayeditHdr').textContent='✏️ '+(journalDayLabel(editingDay,index)||L('עריכת רשומות היום','Edit this day\'s entries'));
  $('dayeditBody').innerHTML='<div class="empty">'+L('טוען…','Loading…')+'</div>'; $('dayeditgate').hidden=false;
  if(!navigator.onLine){ $('dayeditBody').innerHTML='<div class="empty">'+L('צריך חיבור','Connection needed')+'</div>'; return; }
  try{ const r=await api({action:'list_journal_day', tripId:getTripId(), day:editingDay});
    const ents=(r.entries||[]); const body=$('dayeditBody'); body.innerHTML='';
    if(!ents.length){ body.innerHTML='<div class="empty">'+L('אין רשומות-יומן ביום זה','No journal entries for this day')+'</div>'; return; }
    ents.forEach(e=>{ const d=document.createElement('div'); d.className='jent';
      const ta=document.createElement('textarea'); ta.rows=3; ta.value=e.text||'';
      const row=document.createElement('div'); row.className='row';
      const meta=document.createElement('div'); meta.className='meta'; meta.textContent=[e.author,e.time].filter(Boolean).join(' · ');
      const sv=document.createElement('button'); sv.className='sv'; sv.textContent='💾 '+L('שמור','Save'); sv.onclick=()=>saveJournalEntry(e.id, ta.value, sv);
      const del=document.createElement('button'); del.className='del'; del.textContent='🗑️ '+L('מחק','Delete'); del.onclick=()=>deleteJournalEntry(e.id);
      row.appendChild(meta); row.appendChild(sv); row.appendChild(del);
      d.appendChild(ta); d.appendChild(row); body.appendChild(d); });
  }catch(e){ $('dayeditBody').innerHTML='<div class="empty">'+L('אין חיבור — נסה שוב','No connection — try again')+'</div>'; }
}
async function saveJournalEntry(id, text, btn){ text=(text||'').trim(); if(!text){ alert(L('טקסט ריק','Empty text')); return; }
  const o=btn.textContent; btn.disabled=true; btn.textContent='…';
  try{ const r=await api({action:'update_journal', tripId:getTripId(), entryId:id, text});
    if(r.ok){ updateInlineEntryDom(id, text); $('dayeditgate').hidden=true; logLine(L('✏️ רשומה עודכנה','✏️ Entry updated')); afterJournalChange(editingDay); }
    else alert(L('שגיאה: ','Error: ')+(r.error||'')); }
  catch(e){ alert(L('אין חיבור — נסה שוב','No connection — try again')); }
  finally{ btn.disabled=false; btn.textContent=o; } }
async function deleteJournalEntry(id){ if(!confirm(L('למחוק לחלוטין את רשומת-היומן הזו?','Permanently delete this journal entry?'))) return;
  try{ const r=await api({action:'delete_journal', tripId:getTripId(), entryId:id});
    if(r.ok){ removeInlineEntryDom(id); $('dayeditgate').hidden=true; logLine(L('🗑️ רשומה נמחקה','🗑️ Entry deleted')); afterJournalChange(editingDay); }
    else alert(L('שגיאה: ','Error: ')+(r.error||'')); }
  catch(e){ alert(L('אין חיבור — נסה שוב','No connection — try again')); } }
// אחרי עריכה/מחיקה: לא בונים מחדש אוטומטית. העמוד הנוכחי מתעדכן מיד, והארכיון יסומן לעדכון.
async function afterJournalChange(day){
  // השינוי נשמר ל-archive (patch_story_book_html) — אין צורך לסמן "רענון" אלא אם ה-patch נכשל (מטופל ב-patchCurrentStoryArchive)
  toast(L('היומן עודכן','Journal updated'));
}
async function rebuildChapterForDay(day){   // בונה מחדש פרק-יום מסוים (אם קיים), מרענן iframe אם זה הפרק המוצג
  const idx=bookChapters.findIndex(c=>c.day===day); if(idx<0) return false;
  const ch=bookChapters[idx]; const voice=(ch.aiUsed?'combined':'authentic');
  if(!bookBuildId) bookBuildId=String(Date.now());
  const r=await api({action:'build_story_book', tripId:getTripId(), viewerLang:uiLang(), scope:'chapter', day:ch.day, dayIndex:ch.index, buildId:bookBuildId, maxPhotos:8, voice});
  if(r.ok && r.htmlB64){ ch.htmlB64=r.htmlB64; if(r.fileId) ch.fileId=r.fileId;
    if(idx===currentChapterIdx){ if($('dayeditgate').hidden) showChapter(idx); else $('bookframe').srcdoc=b64ToUtf8(r.htmlB64); }
    saveBookManifest('chaptered', voice); return true; }
  return false;
}
// ✏️🗑️ inline בתוך הספר: כל רשומת-יומן (data-eid) מקבלת כפתורי עריכה/מחיקה ישירות על-גבי הטקסט.
// ה-iframe הוא srcdoc (same-origin) → ניגשים ל-contentDocument ומוסיפים כפתורים אחרי כל טעינה.
let _bookWired=false;
function initBookInlineEdit(){ if(_bookWired) return; const fr=$('bookframe'); if(!fr) return; _bookWired=true;
  fr.addEventListener('load', ()=>{ try{ wireBookInline(); }catch(e){} }); }
function scheduleBookInlineWire(){ setTimeout(()=>{ try{ wireBookInline(); }catch(e){} }, 250); setTimeout(()=>{ try{ wireBookInline(); }catch(e){} }, 1200); }
function wireBookInline(){
  const fr=$('bookframe'); let doc; try{ doc=fr.contentDocument; }catch(e){ return; }
  if(!doc || !doc.body) return;
  if(!doc.querySelector('.entry[data-eid]') && currentBookDay && !doc.body.dataset.hydratingIds){
    doc.body.dataset.hydratingIds='1';
    hydrateLegacyEntryIds(doc, currentBookDay).then(()=>{ try{ wireBookInline(); }catch(e){} });
    return;
  }
  if(!doc.getElementById('jeditStyle')){ const st=doc.createElement('style'); st.id='jeditStyle';
    st.textContent='.entry{position:relative!important;padding-inline-start:56px!important;transition:background .3s} .jedit{position:absolute;top:8px;inset-inline-start:8px;display:flex;gap:7px;z-index:9999;pointer-events:auto} .jedit button{min-width:38px;min-height:38px;font-size:17px;line-height:1;border:0;border-radius:999px;padding:8px 10px;background:rgba(14,116,144,.96);color:#fff;box-shadow:0 2px 8px rgba(0,0,0,.25);cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation;transition:transform .07s,filter .07s} .jedit button:active{transform:scale(.85);filter:brightness(.82)} .jedit .del{background:rgba(220,38,38,.96)} .entry.jgone{opacity:.35;filter:grayscale(1);transform:scale(.97);transition:opacity .25s,transform .25s,filter .25s} .entry.jflash{background:#fef9c3;box-shadow:0 0 0 3px #fde68a}';
    (doc.head||doc.body).appendChild(st); }
  doc.querySelectorAll('.entry[data-eid]').forEach(el=>{
    const old=el.querySelector('.jedit'); if(old) old.remove();   // HTML שמור עלול להכיל כפתורים בלי listeners — תמיד מחווטים מחדש
    const eid=el.getAttribute('data-eid'), day=el.getAttribute('data-day')||currentBookDay;
    const w=doc.createElement('div'); w.className='jedit';
    const be=doc.createElement('button'); be.type='button'; be.textContent='✏️'; be.setAttribute('aria-label',L('ערוך רשומה','Edit entry')); be.addEventListener('click', ev=>{ ev.preventDefault(); ev.stopPropagation(); openEntryEditor(eid, day); });
    const bd=doc.createElement('button'); bd.type='button'; bd.className='del'; bd.textContent='🗑️'; bd.setAttribute('aria-label',L('מחק רשומה','Delete entry')); bd.addEventListener('click', ev=>{ ev.preventDefault(); ev.stopPropagation(); deleteEntryInline(eid, day); });
    w.appendChild(be); w.appendChild(bd); el.appendChild(w);
  });
}
async function hydrateLegacyEntryIds(doc, day){
  try{
    // כל רשומות-היומן (כל הימים) — מתאימים לפי טקסט (חובה) כדי לא לשייך id שגוי, וקובעים את היום האמיתי
    const r=await api({action:'list_journal_all', tripId:getTripId()});
    const entries=(r.entries||[]).slice(), used={};
    const norm=s=>String(s||'').replace(/\s+/g,' ').trim();
    Array.prototype.forEach.call(doc.querySelectorAll('.entry:not([data-eid])'), el=>{
      const time=((el.querySelector('.t')||{}).textContent||'').match(/\d{2}:\d{2}/);
      const txt=norm((el.querySelector('p')||{}).textContent||'');
      if(!txt) return;   // בלי טקסט אין התאמה אמינה — לא משייכים (עדיף בלי כפתור מאשר id שגוי)
      let idx=entries.findIndex((e,i)=>!used[i] && norm(e.text)===txt && (!time||e.time===time[0]));
      if(idx<0) idx=entries.findIndex((e,i)=>!used[i] && norm(e.text)===txt);   // התאמת-טקסט בלבד
      if(idx>=0){ used[idx]=1; el.setAttribute('data-eid', entries[idx].id); el.setAttribute('data-day', entries[idx].day); }
    });
  }catch(e){}
}
function inlineEntryEl(eid){ const fr=$('bookframe'); let doc; try{ doc=fr.contentDocument; }catch(e){ return null; } return doc ? doc.querySelector('.entry[data-eid="'+cssEscape(eid)+'"]') : null; }
function cssEscape(s){ return String(s).replace(/["\\]/g,'\\$&'); }
function updateInlineEntryDom(eid, text){
  const el=inlineEntryEl(eid); if(!el) return;
  const p=el.querySelector('p'); if(p) p.textContent=text;
  el.classList.add('jflash'); el.scrollIntoView({block:'center',behavior:'smooth'});   // הבזק-צהוב + גלילה אליו → רואים מיד מה השתנה
  setTimeout(()=>{ try{ el.classList.remove('jflash'); }catch(e){} }, 1100);
  syncCurrentChapterHtml();
}
function removeInlineEntryDom(eid){
  const el=inlineEntryEl(eid); if(!el) return;
  const doc=el.ownerDocument;
  el.classList.add('jgone');
  setTimeout(()=>{ try{ el.remove(); pruneEmptyDayHeaders(doc); syncCurrentChapterHtml(); }catch(e){} }, 80);
}
// מסיר כותרת-יום (h2.day) שאין אחריה רשומות/תמונות — כשמוחקים את כל תוכן היום, גם התאריך נעלם
function pruneEmptyDayHeaders(doc){
  if(!doc) return;
  Array.prototype.forEach.call(doc.querySelectorAll('h2.day'), h=>{
    let n=h.nextElementSibling, hasContent=false;
    while(n && !(n.tagName==='H2' && n.classList.contains('day'))){
      if(n.classList.contains('entry') || n.tagName==='FIGURE' || n.classList.contains('photo')){ hasContent=true; break; }
      n=n.nextElementSibling;
    }
    if(!hasContent) h.remove();
  });
}
function syncCurrentChapterHtml(){
  const fr=$('bookframe'); let doc; try{ doc=fr.contentDocument; }catch(e){ return; }
  if(!doc) return;
  const clean=doc.documentElement.cloneNode(true);
  clean.querySelectorAll('#jeditStyle,.jedit').forEach(n=>n.remove());   // הארכיון נשמר כספר נקי, לא עם כפתורי-מערכת
  const html='<!doctype html>\n'+clean.outerHTML;
  if(currentChapterIdx>=0 && bookChapters[currentChapterIdx]) bookChapters[currentChapterIdx].htmlB64=utf8ToB64(html);
  patchCurrentStoryArchive(html);
}
function utf8ToB64(s){ const bytes=new TextEncoder().encode(s); let bin=''; bytes.forEach(b=>bin+=String.fromCharCode(b)); return btoa(bin); }
async function patchCurrentStoryArchive(html){
  const fileId=(currentChapterIdx>=0 && bookChapters[currentChapterIdx]) ? bookChapters[currentChapterIdx].fileId : currentBookFileId;
  if(!fileId || !html || html.length>6*1024*1024) return;
  try{ await api({action:'patch_story_book_html', tripId:getTripId(), fileId, htmlB64:utf8ToB64(html)}); }
  catch(e){ $('bookrebuild').classList.add('hasnew'); }
}
// עורך-רשומה-בודדת (מתוך לחיצת ✏️ inline) — אותו gate, רשומה אחת בלבד
async function openEntryEditor(eid, day){
  editingDay = day || currentBookDay || '';
  const idx=(bookChapters.find(c=>c.day===editingDay)||{}).index;
  $('dayeditHdr').textContent='✏️ '+(journalDayLabel(editingDay, idx)||L('עריכת רשומה','Edit entry'));
  $('dayeditBody').innerHTML='<div class="empty">'+L('טוען…','Loading…')+'</div>'; $('dayeditgate').hidden=false;
  if(!navigator.onLine){ $('dayeditBody').innerHTML='<div class="empty">'+L('צריך חיבור','Connection needed')+'</div>'; return; }
  // אמין: מאתר את הרשומה לפי id בכל-הגיליון (לא מסונן-יום) — עובד גם בספר-מלא/ישן
  try{ const r=await api({action:'get_journal_entry', tripId:getTripId(), entryId:eid});
    const e=r.ok && r.entry; const body=$('dayeditBody'); body.innerHTML='';
    if(!e){   // הרשומה כבר לא קיימת (ספר לא-מעודכן) — נקה מהתצוגה, אל תבלבל
      removeInlineEntryDom(eid);
      body.innerHTML='<div class="empty">'+L('הרשומה כבר לא קיימת (הספר אינו מעודכן). לחץ 🔄 לרענון הספר.','This entry no longer exists (book is outdated). Tap 🔄 to refresh.')+'</div>'; return; }
    editingDay = e.day || editingDay;   // היום האמיתי של הרשומה
    const d=document.createElement('div'); d.className='jent';
    const ta=document.createElement('textarea'); ta.rows=4; ta.value=e.text||'';
    const row=document.createElement('div'); row.className='row';
    const meta=document.createElement('div'); meta.className='meta'; meta.textContent=[e.author,e.time].filter(Boolean).join(' · ');
    const sv=document.createElement('button'); sv.className='sv'; sv.textContent='💾 '+L('שמור','Save'); sv.onclick=()=>saveJournalEntry(e.id, ta.value, sv);
    const del=document.createElement('button'); del.className='del'; del.textContent='🗑️ '+L('מחק','Delete'); del.onclick=()=>{ deleteEntryInline(e.id, editingDay); $('dayeditgate').hidden=true; };
    row.appendChild(meta); row.appendChild(sv); row.appendChild(del);
    d.appendChild(ta); d.appendChild(row); body.appendChild(d); ta.focus();
  }catch(e){ $('dayeditBody').innerHTML='<div class="empty">'+L('אין חיבור — נסה שוב','No connection — try again')+'</div>'; }
}
async function deleteEntryInline(eid, day){ if(!confirm(L('למחוק את הרשומה הזו?','Delete this entry?'))) return;
  try{ const r=await api({action:'delete_journal', tripId:getTripId(), entryId:eid});
    if(r.ok){ removeInlineEntryDom(eid); $('dayeditgate').hidden=true; logLine(L('🗑️ רשומה נמחקה','🗑️ Entry deleted')); afterJournalChange(day||currentBookDay); }
    else if(r.error==='not found'){ removeInlineEntryDom(eid); $('dayeditgate').hidden=true; toast(L('הרשומה כבר נמחקה — ניקיתי אותה מהתצוגה','Entry was already deleted — removed from view')); }
    else alert(L('שגיאה: ','Error: ')+(r.error||'')); }
  catch(e){ alert(L('אין חיבור — נסה שוב','No connection — try again')); } }
initBookInlineEdit();

// 📸 POC — "עוד תמונות מהיום": גשר ל-Apple Photos דרך iOS Shortcut. שולח רק תאריך+שם-טיול.
// אין העלאה, אין scopes, אין גישה לספריית-התמונות. Apple Photos נשאר מקור-התמונות הכבד.
const PHOTO_SHORTCUT_NAME='Travel Day Photos';
function isIOS_(){ return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1); }
async function morePhotos(){
  if(!currentBookDay) return;
  const payload={ tripName:getTripName(), date:currentBookDay, day:currentDayIndex||'', locationHint:'' };
  const url='shortcuts://run-shortcut?name='+encodeURIComponent(PHOTO_SHORTCUT_NAME)+'&input=text&text='+encodeURIComponent(JSON.stringify(payload));
  if(!isIOS_()){
    try{ await navigator.clipboard.writeText(JSON.stringify(payload)); alert(L('זמין באייפון עם הקיצור "Travel Day Photos". נתוני-היום הועתקו ללוח.','Available on iPhone with the "Travel Day Photos" shortcut. Day data copied.')); }
    catch(e){ alert(L('זמין באייפון עם הקיצור "Travel Day Photos".','Available on iPhone with the "Travel Day Photos" shortcut.')); }
    return;
  }
  if(!localStorage.getItem('seenPhotoShortcutHint')){
    localStorage.setItem('seenPhotoShortcutHint','1');
    alert(L('כדי לראות את כל תמונות-היום, התקן פעם אחת את הקיצור "Travel Day Photos" (מדריך קצר אצל יחיאל). אם הוא כבר מותקן — נפתח עכשיו.','Install the "Travel Day Photos" shortcut once to see all of the day\'s photos. If already installed — opening now.'));
  }
  location.href=url;   // הקיצור לא מותקן → iOS יציג שגיאה; אי-אפשר לזהות מראש
}
$('bookmore').onclick=morePhotos;

// 📓 NotebookLM "research brain" bridge — open the right notebook + ready prompts.
// Frontend-only: notebookUrl in localStorage per trip; no backend, no scopes, no NotebookLM API/scraping.
const NB_HOME='https://notebooklm.google.com';
function nbKey(){ return 'nb:'+getTripId(); }
function nbValidUrl(v){ return /^https:\/\/notebooklm\.google\.com\//i.test(String(v||'').trim()); }
function nbPromptList(){ const name=getTripName()||L('הטיול','the trip');
  return [
    {label:L('🍽️ אוכל כשר/טבעוני','🍽️ Kosher/vegan food'), prompt:L('בהתבסס על המקורות, מצא אפשרויות אוכל כשרות/טבעוניות מומלצות לטיול "'+name+'". תן 5 המלצות עם נימוק קצר וכתובת.','Based on the sources, find recommended kosher/vegan food options for the trip "'+name+'". Give 5 picks with a short reason and an address.')},
    {label:L('🥾 מסלולים רגועים','🥾 Easy routes'), prompt:L('הצע מסלול יומי רגוע ויפה לזוג שאוהב טבע, לטיול "'+name+'", עם זמני הליכה ונקודות עצירה.','Suggest a relaxed, scenic day route for a nature-loving couple for "'+name+'", with walking times and stops.')},
    {label:L('🏨 השוואת לינה','🏨 Compare lodging'), prompt:L('השווה בין אפשרויות הלינה שבמקורות לטיול "'+name+'" — יחס מחיר/מיקום/נוף — והמלץ.','Compare the lodging options in the sources for "'+name+'" — price/location/view — and recommend.')},
    {label:L('🚆 תחבורה','🚆 Transport'), prompt:L('מה הדרך הנוחה ביותר לעבור בין הנקודות בטיול "'+name+'" לפי המקורות? רכבת מול רכב, עם זמנים משוערים.','What is the most convenient way to get between points in "'+name+'" per the sources? Train vs car, with rough times.')},
    {label:L('📝 סיכום יום','📝 Day recap'), prompt:L('כתוב סיכום קצר וחם של היום על בסיס המקורות ורשומות היומן של "'+name+'".','Write a short, warm recap of the day based on the sources and journal of "'+name+'".')},
    {label:L('🎙️ פודקאסט (Audio Overview)','🎙️ Podcast (Audio Overview)'), prompt:L('צור Audio Overview בעברית על הטיול "'+name+'" — שיחה חמה בין שני מנחים על הרגעים המיוחדים.','Create an Audio Overview about the trip "'+name+'" — a warm conversation between two hosts about the special moments.')}
  ];
}
async function nbCopy(text, btn){ try{ await navigator.clipboard.writeText(text); const o=btn.textContent; btn.textContent='✓'; setTimeout(()=>{btn.textContent=o;},1200); }catch(e){ window.prompt(L('העתק ידנית:','Copy manually:'), text); } }
function nbRenderPrompts(){ const wrap=$('nbPrompts'); wrap.innerHTML='';
  nbPromptList().forEach(p=>{ const d=document.createElement('div'); d.className='pcard';
    const s=document.createElement('span'); s.className='lbl'; s.textContent=p.label;
    const b=document.createElement('button'); b.textContent='📋 '+L('העתק','Copy'); b.onclick=()=>nbCopy(p.prompt,b);
    d.appendChild(s); d.appendChild(b); wrap.appendChild(d); }); }
$('nbbtn').onclick=async()=>{
  if(!ensureTrip()) return;
  const tid=getTripId(); const localUrl=localStorage.getItem(nbKey())||'';
  $('nbUrl').value=localUrl; nbRenderPrompts(); $('nbPacketLink').hidden=true; $('nbgate').hidden=false;
  $('nbHint').textContent=L('טוען…','Loading…');
  // Phase 2: notebookUrl הוא trip-metadata (cross-device). localStorage = cache/legacy בלבד.
  let backendUrl='', synced=false;
  try{ const r=await api({action:'list_trips'}); if(r.ok){ const t=(r.trips||[]).find(x=>x.tripId===tid);
    if(t){ backendUrl=t.notebookUrl||''; synced=true;
      if(backendUrl){ $('nbUrl').value=backendUrl; if(backendUrl!==localUrl) localStorage.setItem(nbKey(),backendUrl); } } } }catch(e){}
  const cur=($('nbUrl').value||'').trim();
  $('nbHint').textContent = cur
    ? L('קישור המחברת נשמר לטיול וזמין בכל מכשיר. פתח, או העתק שאלה והדבק ב-NotebookLM.','The notebook link is saved to the trip and available on every device. Open it, or copy a prompt and paste in NotebookLM.')
    : (!synced && localUrl
        ? L('יש קישור מקומי בלבד — לחץ "שמור קישור" כדי לסנכרן אותו לטיול (זמין בכל מכשיר).','Local-only link — tap "Save link" to sync it to the trip (available on every device).')
        : L('פעם אחת: צור מחברת ב-NotebookLM, הדבק כאן את הקישור ושמור. אז הוסף את חבילת-המחקר כמקור.','One-time: create a notebook in NotebookLM, paste its link here and save. Then add the Research Packet as a source.'));
};
$('nbSave').onclick=async()=>{ const v=($('nbUrl').value||'').trim();
  if(v && !nbValidUrl(v)){ alert(L('הדבק קישור נוטבוק תקין מ-notebooklm.google.com','Paste a valid notebooklm.google.com notebook link')); return; }
  if(!navigator.onLine){ alert(L('צריך חיבור כדי לשמור לטיול','A connection is needed to save to the trip')); return; }
  const b=$('nbSave'); const o=b.textContent; b.disabled=true; b.textContent=L('שומר…','Saving…');
  try{ const r=await api({action:'set_notebook_url', tripId:getTripId(), notebookUrl:v});
    if(r.ok){ if(v) localStorage.setItem(nbKey(),v); else localStorage.removeItem(nbKey());   // cache
      $('nbHint').textContent = v ? L('נשמר לטיול — זמין בכל מכשיר ✓','Saved to the trip — available on every device ✓') : L('הוסר ✓','Removed ✓'); }
    else alert(L('שגיאה: ','Error: ')+(r.error||'')); }
  catch(e){ alert(L('אין חיבור — נסה שוב','No connection — try again')); }
  finally{ b.disabled=false; b.textContent=o; } };
$('nbOpen').onclick=()=>{ const v=($('nbUrl').value||localStorage.getItem(nbKey())||'').trim(); window.open(nbValidUrl(v)?v:NB_HOME, '_blank', 'noopener'); };
$('nbClose').onclick=()=>{ $('nbgate').hidden=true; };
// 📦 Trip Research Packet — build/refresh a clean Doc (Drive "museum") to add as a NotebookLM source.
$('nbPacket').onclick=async()=>{
  if(!ensureTrip()) return;
  if(!navigator.onLine){ alert(L('צריך חיבור כדי לעדכן חבילת מחקר','A connection is needed to update the research packet')); return; }
  const b=$('nbPacket'); const o=b.textContent; b.disabled=true; b.textContent=L('בונה…','Building…');
  try{ const r=await api({action:'build_research_packet', tripId:getTripId()});
    if(r.ok && r.url){ const a=$('nbPacketLink'); a.href=r.url;
      a.textContent='📄 '+L('פתח חבילת מחקר (Doc) — הוסף כמקור ב-NotebookLM','Open Research Packet (Doc) — add as a NotebookLM source'); a.hidden=false;
      const s=r.stats||{}; $('nbHint').textContent=L('עודכן ✓ — '+(s.journal||0)+' רשומות, '+(s.itin||0)+' פריטי-תכנית. פתח, ואז ב-NotebookLM: Add source → Google Docs → בחר את המסמך.','Updated ✓ — open it, then in NotebookLM: Add source → Google Docs → pick it.'); }
    else alert(L('שגיאה: ','Error: ')+(r.error||'')); }
  catch(e){ alert(L('אין חיבור — נסה שוב','No connection — try again')); }
  finally{ b.disabled=false; b.textContent=o; }
};

// 📚 Private Trip Dashboard — read-only reader inside the PWA (Photos / Expenses / Docs). No capture/delete/permission changes.
$('dashbtn').onclick=()=>{ if(!ensureTrip()) return; closeDrawer(); $('dash').hidden=false; dashTab('photos'); };
$('dashClose').onclick=()=>{ $('dash').hidden=true; $('dashbody').innerHTML=''; };
document.querySelectorAll('#dashtabs .dtab').forEach(b=>{ b.onclick=()=>dashTab(b.dataset.tab); });
function dashEmpty(msg){ $('dashbody').innerHTML='<div class="empty">'+escapeHtml(msg)+'</div>'; }
async function dashTab(tab){
  document.querySelectorAll('#dashtabs .dtab').forEach(b=>b.classList.toggle('on', b.dataset.tab===tab));
  dashEmpty(L('טוען…','Loading…'));
  if(!navigator.onLine){ dashEmpty(L('צריך חיבור לאינטרנט','A connection is needed')); return; }
  try{
    if(tab==='photos'){ const r=await api({action:'list_gallery', tripId:getTripId(), limit:40}); dashRenderGallery(r); }
    else if(tab==='expenses'){ const r=await api({action:'list_expenses', tripId:getTripId()}); dashRenderExpenses(r); }
    else if(tab==='lessons'){ const r=await api({action:'list_lessons', tripId:getTripId()}); dashRenderLessons(r); }
    else { const r=await api({action:'list_files', tripId:getTripId(), category:'document'}); let srcs=[]; try{ const ri=await api({action:'list_itinerary', tripId:getTripId()}); srcs=(ri.items||[]).filter(x=>x.sourceUrl && isTrustedSource(x.sourceUrl)); }catch(e){} dashRenderDocs(r, srcs); }
  }catch(e){ dashEmpty(L('אין חיבור — נסה שוב','No connection — try again')); }
}
function dashRenderGallery(r){ const body=$('dashbody'); const ph=(r&&r.photos)||[];
  if(!ph.length){ dashEmpty(L('עדיין אין תמונות בטיול הזה','No photos in this trip yet')); return; }
  const g=document.createElement('div'); g.className='gal';
  ph.forEach(p=>{ const c=document.createElement('div'); c.className='gcard';
    if(p.thumb){ const im=document.createElement('img'); im.loading='lazy'; im.src=p.thumb; if(p.url){ im.style.cursor='pointer'; im.onclick=()=>window.open(p.url,'_blank','noopener'); } c.appendChild(im); }
    const cap=document.createElement('div'); cap.className='cap';
    const top=document.createElement('div'); top.textContent=[p.caption, p.place?('📍'+p.place):''].filter(Boolean).join(' · '); cap.appendChild(top);
    const ts=document.createElement('div'); ts.className='ts'; ts.textContent=shortTs(p.date); cap.appendChild(ts);
    c.appendChild(cap); g.appendChild(c); });
  body.innerHTML=''; body.appendChild(g);
  if(r.truncated) body.insertAdjacentHTML('beforeend','<div class="empty">'+L('מוצגות 40 התמונות האחרונות','Showing the latest 40 photos')+'</div>');
}
function dashRenderExpenses(r){ const body=$('dashbody'); const ex=(r&&r.expenses)||[];
  if(!ex.length){ dashEmpty(L('עדיין אין הוצאות','No expenses yet')); return; }
  body.innerHTML='';
  // סה"כ לפי מטבע — בלי לערבב מטבעות (אין total חוצה-מטבעות). מבוסס רק על ההוצאות הקיימות.
  const totals={}; ex.forEach(e=>{ const cur=((e.currency||'').trim())||'—'; totals[cur]=(totals[cur]||0)+(Number(e.amount)||0); });
  const curs=Object.keys(totals).sort((a,b)=>totals[b]-totals[a]);
  const sum=document.createElement('div'); sum.className='exsum';
  sum.innerHTML='<div class="exsum-h">'+L('סה"כ עד כה','Total so far')+'</div>'+
    curs.map(c=>'<div class="exsum-row"><span class="cur">'+escapeHtml(c)+'</span><span class="val">'+(Math.round(totals[c]*100)/100).toLocaleString()+'</span></div>').join('');
  body.appendChild(sum);
  ex.forEach(e=>{ const amt=(e.amount||e.amount===0)?(e.amount+' '+(e.currency||'')):'';
    const meta=[(T().cats[e.category]||e.category), (T().methods[e.method]||e.method), e.author].filter(Boolean).join(' · ');
    const d=document.createElement('div'); d.className='dcard';
    d.innerHTML='<div class="row1"><span>'+escapeHtml(e.description||e.category||'')+'</span><span class="amt">'+escapeHtml(amt)+'</span></div>'+
      (meta?('<div class="meta">'+escapeHtml(meta)+'</div>'):'')+
      (e.receipt?('<div style="margin-top:6px"><a href="'+escapeHtml(e.receipt)+'" target="_blank" rel="noopener">🧾 '+L('פתח קבלה','Open receipt')+'</a></div>'):'')+
      '<div class="ts">'+escapeHtml(shortTs(e.date))+'</div>';
    body.appendChild(d); });
}
function dashRenderLessons(r){ const body=$('dashbody'); const ls=(r&&r.lessons)||[];
  if(!ls.length){ dashEmpty(L('עדיין אין לקחים — הקש 💡 לקח מהטיול כדי להוסיף','No lessons yet — tap 💡 Trip lesson to add')); return; }
  body.innerHTML='';
  const note=document.createElement('div'); note.className='dashnote';
  note.textContent=L('לקחים אלה שייכים לטיול הזה. אפשר לשלוח אותם ל-🧠 המוח הגלובלי (דרך 💡) כדי לשרת טיולים הבאים.','These lessons belong to this trip. You can send them to the 🧠 global Brain (via 💡) to serve future trips.');
  body.appendChild(note);
  ls.forEach(l=>{ const d=document.createElement('div'); d.className='dcard';
    d.innerHTML='<div class="row1"><span>💡 '+escapeHtml(l.text)+'</span></div><div class="ts">'+escapeHtml([l.author,shortTs(l.date)].filter(Boolean).join(' · '))+'</div>';
    body.appendChild(d); });
}
function dashRenderDocs(r, srcs){ const body=$('dashbody'); const fs=(r&&r.files)||[]; srcs=srcs||[];
  if(!fs.length && !srcs.length){ dashEmpty(L('עדיין אין מסמכים','No documents yet')); return; }
  body.innerHTML='';
  fs.forEach(f=>{ const d=document.createElement('div'); d.className='dcard';
    d.innerHTML='<div class="row1"><span>📄 '+escapeHtml(f.name||'')+'</span></div>'+
      '<div style="margin-top:6px"><a href="'+escapeHtml(f.url||'#')+'" target="_blank" rel="noopener">'+L('פתח ב-Drive','Open in Drive')+'</a></div>'+
      '<div class="ts">'+escapeHtml(shortTs(f.date))+'</div>';
    body.appendChild(d); });
  srcs.forEach(it=>{ const d=document.createElement('div'); d.className='dcard';
    const isBk=/booking\.com/i.test(it.sourceUrl);
    d.innerHTML='<div class="row1"><span>🔗 '+escapeHtml(it.title||L('הזמנה','Booking'))+'</span></div>';
    const w=document.createElement('div'); w.style.marginTop='6px';
    const a=document.createElement('a'); a.href='#'; a.textContent=isBk?L('פתח בבוקינג','Open in Booking'):L('פתח מקור','Open source');
    a.onclick=(e)=>{ e.preventDefault(); openSource(it.sourceUrl); }; w.appendChild(a); d.appendChild(w);
    body.appendChild(d); });
}

// AI concierge
$('askbtn').onclick=()=>{ $('askreply').textContent=''; $('askq').value=''; $('storylink').style.display='none'; $('askgate').hidden=false; $('askq').focus(); };
$('askclose').onclick=()=>{ $('askgate').hidden=true; };
$('asksend').onclick=async()=>{
  const q=$('askq').value.trim(); if(!q) return;
  if(!navigator.onLine){ $('askreply').textContent=T().neednet; return; }
  $('storylink').style.display='none';
  $('asksend').disabled=true; $('askreply').textContent=T().thinking;
  try{ const r=await api({ action:'ask', tripId:getTripId(), text:q, viewerLang:uiLang() });
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
      if(d.paymentMethod){ const pm=[...$('exMethod').options].find(x=>x.value===d.paymentMethod||x.text===d.paymentMethod); if(pm) $('exMethod').value=pm.value; }
      const extra=[];  // שדות אופציונליים חדשים (P2#3) — נספחים לתיאור רק אם קיימים
      if(d.taxAmount!=null) extra.push(L('מע״מ','Tax')+' '+d.taxAmount);
      if(d.tipAmount!=null) extra.push(L('טיפ','Tip')+' '+d.tipAmount);
      if(Array.isArray(d.lineItems) && d.lineItems.length) extra.push(d.lineItems.map(li=>String(li.name||'')+(li.amount!=null?(' '+li.amount):'')).filter(Boolean).join(', '));
      if(extra.length){ const cur=$('exDesc').value; $('exDesc').value=(cur?cur+' · ':'')+extra.filter(Boolean).join(' · '); }
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
      d.innerHTML='<span>💶 '+escapeHtml((T().cats[e.category]||e.category)+' · '+e.amount+' '+e.currency+(e.description?(' · '+e.description):''))+'</span><span class="ts">'+escapeHtml(shortTs(e.date))+'</span>';
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
// קישור-מקור (Booking וכו') — דומיינים אמינים בלבד, אישור לפני פתיחה, ללא פתיחה אוטומטית
function isTrustedSource(u){ try{ const h=new URL(u).hostname.toLowerCase(); return /(^|\.)(booking\.com|airbnb\.com|agoda\.com|expedia\.com|hotels\.com)$/.test(h); }catch(e){ return false; } }
function openSource(url){ if(!isTrustedSource(url)){ alert(L('קישור-מקור לא מזוהה','Unrecognized source link')); return; }
  window.open(url,'_blank','noopener'); }   // דומיין אמין (Booking/Airbnb…) — פתיחה ישירה בלי אישור מיותר
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
    if(r.ok){ itinItems=r.items||[]; itinStart=r.startDate||itinStart; itinDays=Number(r.days)||itinDays; renderItin();
      // 🌐 תרגום-תצוגה: כותרות/הערות שלא בשפת-הצופה (שמות-מקומות/מלונות נשמרים; המקור בגיליון לא משתנה)
      const needs=itinItems.some(it=>needsViewTx(it.title)||needsViewTx(it.notes));
      if(needs){ const texts=[]; const slots=[];
        itinItems.forEach((it,i)=>{ if(needsViewTx(it.title)){ texts.push(it.title); slots.push({i,f:'displayTitle'}); }
                                    if(needsViewTx(it.notes)){ texts.push(it.notes); slots.push({i,f:'displayNotes'}); } });
        viewTexts(texts).then(disp=>{ slots.forEach((s,j)=>{ if(disp[j]!==texts[j]) itinItems[s.i][s.f]=disp[j]; }); renderItin(); }); } }
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
  const sub=[it.location, it.displayNotes||it.notes].filter(Boolean).map(escapeHtml).join(' · ');
  c.innerHTML='<div class="t">'+escapeHtml(tm||'—')+'</div><div class="bd"><div class="ttl">'+(TYPE_ICON[it.type]||'•')+' '+escapeHtml(it.displayTitle||it.title||'')+'</div>'+(sub?('<div class="sub">'+sub+'</div>'):'')+(links?('<div class="sub">'+links+'</div>'):'')+'</div>';
  if(it.sourceUrl && isTrustedSource(it.sourceUrl)){ const bd=c.querySelector('.bd'); const w=document.createElement('div'); w.className='sub';
    const a=document.createElement('a'); a.className='lnk'; a.href='#';
    a.textContent='🔗 '+(/booking\.com/i.test(it.sourceUrl)?L('פתח בבוקינג','Open in Booking'):L('פתח מקור','Open source'));
    a.onclick=(e)=>{ e.stopPropagation(); e.preventDefault(); openSource(it.sourceUrl); }; w.appendChild(a); bd.appendChild(w); }
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
    const items=itinItems.filter(i=>i.day===day).sort((a,b)=>{ const ta=String(a.time||''), tb=String(b.time||''); return ta!==tb ? (!ta?-1:(!tb?1:ta.localeCompare(tb))) : ((a.order||0)-(b.order||0)); });   // שעה ראשי, order שובר-שוויון
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
    const bh=Math.max(26,((em-sm)/60)*HH-2); b.style.top=(((sm/60)-H0)*HH)+'px'; b.style.height=bh+'px';
    // אינדיקטורים קטנים (לא לחיצים — לחיצה על הבלוק פותחת עריכה): 🔗 קישור-מקור אמין, 📄 קישור/מקור בהערות
    const hasSrc=it.sourceUrl && isTrustedSource(it.sourceUrl);
    const hasDoc=/\bhttps?:\/\//i.test(it.notes||'') || /מקור\s*:/.test(it.notes||'');
    const ics=(hasSrc?'🔗':'')+(hasDoc?'📄':'');
    const tmLbl=escapeHtml(it.time||'')+(it.endTime?('–'+escapeHtml(it.endTime)):'');
    // לפי גובה: קטן=כותרת בלבד · בינוני=+מיקום · גדול=+הערה קצרה (טקסט נחתך יפה ב-CSS)
    let inner='<div class="gt"><span>'+tmLbl+'</span>'+(ics?('<span class="gic">'+ics+'</span>'):'')+'</div>';
    inner+='<div class="gttl">'+(TYPE_ICON[it.type]||'')+' '+escapeHtml(it.displayTitle||it.title||'')+'</div>';
    if(bh>=46 && it.location) inner+='<div class="gloc">📍 '+escapeHtml(it.location)+'</div>';
    if(bh>=72 && (it.displayNotes||it.notes)){ const n=(it.displayNotes||it.notes).replace(/\s*\bhttps?:\/\/\S+/gi,'').trim(); if(n) inner+='<div class="gnotes">'+escapeHtml(n.length>70?n.slice(0,70)+'…':n)+'</div>'; }
    b.innerHTML=inner;
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
  if(editItem){ item.id=editItem.id; item.order=editItem.order; item.sourceUrl=editItem.sourceUrl||''; }
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
  const wantsEmail=/ייבא|מייל|אימייל|דוא|דואר|email|e-?mail|gmail|import/i.test(q);
  const wantsDocs=/מסמכ|document|\bdocs?\b|pdf|קבצ|מצורף|צרופ|attachment|תיק/i.test(q);
  if(wantsEmail){
    const isDeep=/סריקה עמוקה|כל ההזמנות|כל המיילים|חפש בכל|deep ?scan|all reservations|scan all/i.test(q);
    const msg = isDeep
      ? L('סריקה עמוקה: תקרא הרבה מיילי-הזמנה מ-Gmail ותעדכן את כל ההזמנות (תכנית+מסמכים+הוצאות). זה איטי יותר. להמשיך?','Deep scan: reads many booking emails and updates all reservations (plan+docs+expenses). Slower. Continue?')
      : L('הפעולה תקרא את ההזמנה האחרונה הרלוונטית מ-Gmail (כולל השכרת רכב) ותוסיף אותה לתכנית + מסמכים + הוצאה (ניתן למחוק). מהיר. להמשיך?','Reads the latest relevant booking from Gmail (incl. car rental) and adds it to the plan + documents + an expense (deletable). Fast. Continue?');
    if(!confirm(msg)) return;
  }
  // 📨 ייבוא-מייל. ברירת-מחדל = מהיר וממוקד (הזמנה אחרונה אחת). "סריקה עמוקה" = הנתיב הכבד (כל ההזמנות).
  if(wantsEmail){
    const deep=/סריקה עמוקה|כל ההזמנות|כל המיילים|חפש בכל|deep ?scan|all reservations|scan all/i.test(q);
    $('itinAskBtn').disabled=true; $('itinAskBtn').textContent='⏳';
    toast(deep?L('🔎 סריקה עמוקה — קורא הזמנות…','🔎 Deep scan — reading bookings…'):L('🔎 מחפש את ההזמנה האחרונה…','🔎 finding the latest booking…'), 25000);
    const slow=setTimeout(()=>toast(L('עדיין עובד… (חילוץ ושמירה)','Still working… (extract & save)'),20000), 22000);
    try{
      if(deep){
        const r=await api({action:'import_travel_reservation', tripId:getTripId(), text:q, author:getAuthor(), viewerLang:uiLang()});
        clearTimeout(slow); await reloadItin(); $('itinAsk').value='';
        const parts=[];
        if(r.plan){ if(r.plan.ok) parts.push(L('התכנית עודכנה','plan updated')); else if(r.plan.error) parts.push('⚠️ '+L('התכנית לא עודכנה','plan not updated')); }
        const nd=(r.docs&&r.docs.saved)?r.docs.saved.length:0; if(nd) parts.push(L(nd+' מסמכים נשמרו', nd+' documents saved'));
        if(r.expenses){ if(r.expenses.addedCount){ const list=(r.expenses.added||[]).map(a=>(a.category||'')+' · '+a.amount+' '+(a.currency||'')).slice(0,3);
            parts.push('💶 '+L(r.expenses.addedCount+' הוצאות: ',r.expenses.addedCount+' expenses: ')+list.join(' | ')); }
          else { const rs=r.expenses.skippedReasons||{}; if(rs.noAmount) parts.push('ℹ️ '+L('אין סכום ברור','no clear amount')); else if(rs.dup) parts.push(L('הוצאות כבר קיימות','expenses already present')); } }
        const summary='🔎 '+(parts.length?parts.join(' · '):L('לא נמצא מה לייבא','nothing to import'));
        toast(summary, 9000); logLine(summary);
      } else {
        const r=await api({action:'import_latest_reservation', tripId:getTripId(), text:q, author:getAuthor(), viewerLang:uiLang()});
        clearTimeout(slow); await reloadItin(); $('itinAsk').value='';
        if(r.ok===false){ toast('⚠️ '+(r.error||L('שגיאה','Error')), 8000); logLine('⚠️ '+(r.error||'')); }
        else if(r.found===false){ toast('ℹ️ '+(r.message||L('לא נמצאה הזמנה','no booking found')), 9000); logLine('ℹ️ '+(r.message||'')); }
        else {
          const kindHe={car:L('רכב','Car'),hotel:L('מלון','Hotel'),flight:L('טיסה','Flight'),transport:L('תחבורה','Transport'),other:L('הזמנה','Booking')}[r.kind]||L('הזמנה','Booking');
          const parts=[];
          if(r.plan){ if(r.plan.outOfRange) parts.push('⚠️ '+L('מחוץ לטווח הטיול — לא נוסף לתכנית','outside trip dates — not added to plan'));
            else if(r.plan.added) parts.push(L('נוסף לתכנית','added to plan')); else if(r.plan.updated) parts.push(L('עודכן בתכנית','updated in plan')); }
          if(r.doc){ if(r.doc.dup) parts.push(L('מסמך כבר קיים','document already saved')); else if(r.doc.name) parts.push(L('נשמר מסמך','document saved')); }
          if(r.expense){ if(r.expense.added) parts.push('💶 '+r.expense.amount+' '+r.expense.currency+' · '+r.expense.category);
            else if(r.expense.reason==='no-amount') parts.push('ℹ️ '+L('אין סכום ברור — לא נוספה הוצאה','no clear amount — no expense'));
            else if(r.expense.reason==='dup') parts.push(L('הוצאה כבר קיימת','expense already present'));
            else if(r.expense.reason==='cancelled') parts.push(L('הוזמנה בוטלה בעבר','previously cancelled')); }
          const ttl=(r.reservation&&r.reservation.title)?(' '+r.reservation.title):'';
          const secs=r.timings?(' · '+Math.round((r.timings.totalMs||0)/1000)+'s'):'';
          const summary='⚡ '+kindHe+ttl+(parts.length?(' — '+parts.join(' · ')):'')+secs;
          toast(summary, 9000); logLine(summary);
        }
      }
    }catch(e){ clearTimeout(slow); alert(L('אין חיבור — נסה שוב','No connection — try again')); }
    finally{ $('itinAskBtn').disabled=false; $('itinAskBtn').textContent='🤖'; }
    return;
  }
  // ⚡ נתיב מהיר: בקשת "הוסף..." פשוטה → quick_add_item דטרמיניסטי.
  // NL-UX: quick_add הוא אופטימיזציה בלבד — אם הוא לא בטוח, נופלים אוטומטית ובשקט ל-AI המלא.
  // המשתמש לעולם לא רואה שגיאת-regex ולא נדרש לנוסח/שעה/"יום שלישי".
  const addOnly = /הוסף|תוסיף|הוסיף|להוסיף|\badd\b|\bput\b/i.test(q) && !wantsEmail
    && !/סדר|מחדש|מחק|הסר|העבר|תזיז|reorder|delete|remove|\bmove\b|נקה|clear|rewrite|ארגן/i.test(q);
  $('itinAskBtn').disabled=true; $('itinAskBtn').textContent='⏳';
  if(addOnly){
    try{ const r=await api({action:'quick_add_item', tripId:getTripId(), text:q, viewerLang:uiLang()});
      if(r.ok){ await reloadItin(); $('itinAsk').value='';
        const it=r.item||{}; const resolved=(r.resolvedDay&&r.resolvedDay.label)?(' · 📅 '+r.resolvedDay.label):'';
        const summary='⚡ '+(r.duplicate?L('כבר קיים: ','Already there: '):L('נוסף: ','Added: '))+(it.title||'')+' · '+itinDayLabel(it.day)+(it.time?(' · '+it.time):'')+resolved;
        toast(summary, 6000); logLine(summary);
        $('itinAskBtn').disabled=false; $('itinAskBtn').textContent='🤖'; return; }
      // לא בטוח → ממשיכים ל-plan_ai המלא בלי להטריד את המשתמש
      toast(L('🤖 רגע, חושב על זה…','🤖 One moment, thinking it through…'), 20000);
    }catch(e){ $('itinAskBtn').disabled=false; $('itinAskBtn').textContent='🤖'; alert(L('אין חיבור — נסה שוב','No connection — try again')); return; }
  }
  const before=itinItems.slice();   // snapshot מלא — diff אמיתי לפי id
  try{ const r=await api({action:'plan_ai', tripId:getTripId(), text:q, viewerLang:uiLang()});
    // מסמכים+קישורים מוצגים גם אם ה-AI נכשל; פירוט-הפריטים רק כשהצליח (לא ממציאים)
    const extra=[];
    if(r.savedDocs && r.savedDocs.length) extra.push(L(r.savedDocs.length+' מסמכים נשמרו', r.savedDocs.length+' documents saved'));
    if(r.sourceLinks) extra.push(L(r.sourceLinks+' קישורי-מקור', r.sourceLinks+' source links'));
    if(r.deduped) extra.push(L(r.deduped+' כפילויות אוחדו', r.deduped+' duplicates merged'));
    if(!r.ok && r.needsInfo && r.question){
      // NL-UX: ה-AI צריך פרט אחד — שואלים שאלה אנושית קצרה בשפת-המשתמש; הטקסט נשאר בשדה לעידון
      toast('🤖 '+r.question, 12000); logLine('🤖 '+r.question);
      alert('🤖 '+r.question);
    }
    else if(r.ok){ // diff לפי חתימת-תוכן (השרת מקצה id חדש לכל פריט בכל קריאה, אז id לא אמין)
      const sig=it=>((it.title||'').trim()+'|'+(it.day||'')+'|'+(it.time||''));
      const beforeSigs=new Set(before.map(sig));
      itinItems=r.items||[]; $('itinAsk').value=''; renderItin();
      const added=itinItems.filter(x=>!beforeSigs.has(sig(x)));
      let head;
      if(added.length===1){ const it=added[0];
        head=L('נוסף: ','Added: ')+(it.title||'')+' · '+itinDayLabel(it.day)+(it.time?(' · '+it.time):'');
      } else if(added.length>1){
        const names=added.slice(0,2).map(it=>(it.title||'')+(it.day?(' ('+itinDayLabel(it.day)+')'):'')).filter(Boolean);
        head=L('נוספו '+added.length+': ','Added '+added.length+': ')+names.join(' | ')+(added.length>2?L(' +'+(added.length-2)+' נוספים',' +'+(added.length-2)+' more'):'');
      } else { const delta=itinItems.length-before.length;
        head = delta<0 ? L(Math.abs(delta)+' פריטים הוסרו', Math.abs(delta)+' items removed') : L('התכנית עודכנה','The plan was updated'); }
      const resolved = (r.resolvedDay && r.resolvedDay.label) ? ('📅 '+r.resolvedDay.label) : '';   // התאריך שנפתר דטרמיניסטית
      const summary='🤖 '+[head].concat(resolved?[resolved]:[]).concat(extra).join(' · ');
      toast(summary, 7000); logLine(summary);
    } else if(extra.length){
      toast('📁 '+extra.join(' · ')+' · '+L('התכנית לא עודכנה','plan not updated'), 7000);
      alert(L('שגיאה: ','Error: ')+(r.error||''));
    } else alert(L('שגיאה: ','Error: ')+(r.error||''));
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
// 🧳 Local-first: בתוך טיול ברירת-המחדל = מקומי ("הטיול הזה"); "גלובלי" = הרשימה החוצת-טיולים הקבועה.
let lvKey=null, lvArchived=false, lvItems=[], lvSearchTimer=null, lvGroupByTag=false, lvScope='local', lvOpenId=null;
function lvApplyScopeLabels(){ $('lvScopeLocal').textContent=L('הטיול הזה','This trip'); $('lvScopeGlobal').textContent=L('גלובלי','Global'); }
function lvSetScopeUI(){
  $('lvScopeLocal').classList.toggle('on', lvScope==='local');
  $('lvScopeGlobal').classList.toggle('on', lvScope==='global');
  // שורת-ההוספה והחיפוש מותאמות-הקשר (placeholder)
  $('lvAdd').placeholder = lvScope==='local' ? L('הוסף לטיול הזה…','Add to this trip…') : L('הוסף לגלובלי…','Add to global…');
  $('lvSearch').placeholder = lvScope==='local' ? L('✨ הצע מהמוח לטיול הזה…','✨ Suggest from the Brain for this trip…') : L('שאל/בקש מהמוח… (הקלדה מסננת)','Ask the Brain… (typing filters)');
}
async function openList(tile){
  lvKey=tile.key; lvArchived=false; lvGroupByTag=false; lvOpenId=null; $('lvSearch').value=''; $('lvAnswer').hidden=true; $('lvAnswer').innerHTML=''; $('lvArchiveToggle').textContent='🗄️';
  lvScope = getTripId() ? 'local' : 'global';                       // בתוך טיול → מקומי כברירת-מחדל
  $('lvScopeBar').hidden = !getTripId();                             // בלי טיול נבחר → רק גלובלי, בלי segmented
  lvApplyScopeLabels(); lvSetScopeUI();
  $('lvGroupToggle').style.display = (tile.key==='kosher') ? '' : 'none';   // מדינה = תגית משנית; קיבוץ אופציונלי לכשרות
  $('lvGroupToggle').style.opacity = '1';
  $('lvTitle').textContent=tile.emoji+' '+tileLabel(tile);
  $('listview').hidden=false; $('lvBody').innerHTML='<div class="emptyday">'+L('טוען…','Loading…')+'</div>';
  await reloadList();
}
function lvSwitchScope(s){ if(lvScope===s) return; lvScope=s; lvArchived=false; lvOpenId=null; $('lvArchiveToggle').textContent='🗄️';
  lvAskMode=false; $('lvSearch').value=''; $('lvAnswer').hidden=true; $('lvAnswer').innerHTML='';
  lvSetScopeUI(); $('lvBody').innerHTML='<div class="emptyday">'+L('טוען…','Loading…')+'</div>'; reloadList(); }
let lvAskMode=false;   // אחרי שאלת-AI: הטקסט בשדה הוא שאלה, לא פילטר — הרשימה מוצגת מלאה
async function reloadList(){
  try{
    const q=(lvAskMode?'':$('lvSearch').value.trim());
    const r = lvScope==='local'
      ? await api({ action:'list_trip_brain', tripId:getTripId(), area:lvKey, includeArchived:lvArchived, query:q })
      : await api({ action:'get_list', listKey:lvKey, includeArchived:lvArchived, query:q });
    if(r.ok){ lvItems=r.items||[]; if(r.url) $('lvSheet').href=r.url; renderList();
      // 🌐 תרגום-תצוגה: פריטים שלא בשפת-הצופה מוצגים מתורגמים (המקור בגיליון לא משתנה)
      if(lvItems.some(it=>needsViewTx(it.text))){ const myKey=lvKey;
        viewTexts(lvItems.map(it=>it.text)).then(disp=>{ if(lvKey!==myKey) return;
          lvItems.forEach((it,i)=>{ if(disp[i]!==it.text) it.displayText=disp[i]; }); renderList(); }); } }
    else $('lvBody').innerHTML='<div class="emptyday">'+L('שגיאה','Error')+'</div>';
  }catch(e){ $('lvBody').innerHTML='<div class="emptyday">'+L('אין חיבור','No connection')+'</div>'; }
}
function lvRow(it){
  const row=document.createElement('div'); row.className='litem'+(it.done?' done':'')+(lvArchived?' archived':'')+(lvOpenId===it.id?' expanded':'');
  const main=()=>{ const m=document.createElement('div'); m.className='lmain'; return m; };
  const actions=()=>{ const a=document.createElement('div'); a.className='lactions'; return a; };
  const edit=()=>{ const v=prompt(L('עריכת פריט:','Edit item:'), it.text); if(v!=null && v.trim()) itemUpdate(it.id,{text:v.trim()}); };
  const more=()=>{ const b=document.createElement('button'); b.className='lbtn morebtn'; b.textContent='⋯'; b.title=L('פעולות','Actions'); b.setAttribute('aria-label',L('פעולות','Actions')); b.onclick=()=>{ lvOpenId = lvOpenId===it.id ? null : it.id; renderList(); }; return b; };
  if(lvArchived){
    const body=main();
    const tx=document.createElement('span'); tx.className='ltext'; tx.textContent=it.displayText||it.text; body.appendChild(tx);
    if(it.tag){ const tg=document.createElement('span'); tg.className='ltag'; tg.textContent=it.tag; body.appendChild(tg); }
    row.appendChild(body);
    row.appendChild(more());
    const acts=actions();
    const editBtn=document.createElement('button'); editBtn.className='lbtn editp'; editBtn.textContent='✏️ '+L('ערוך','Edit'); editBtn.onclick=edit; acts.appendChild(editBtn);
    const rest=document.createElement('button'); rest.className='lbtn promo'; rest.textContent='♻️ '+L('שחזר','Restore'); rest.title=L('שחזר','Restore'); rest.setAttribute('aria-label',L('שחזר','Restore')); rest.onclick=()=>itemUpdate(it.id,{archived:false}); acts.appendChild(rest);
    const del=document.createElement('button'); del.className='lbtn delp'; del.textContent='🗑️ '+L('מחק','Delete'); del.title=L('מחק לצמיתות','Delete permanently'); del.setAttribute('aria-label',L('מחק לצמיתות','Delete permanently'));
    del.onclick=()=>{ if(confirm(L('למחוק לצמיתות?','Delete permanently?'))) itemDelete(it.id); }; acts.appendChild(del);
    row.appendChild(acts);
  } else {
    const cb=document.createElement('input'); cb.type='checkbox'; cb.className='lcheck'; cb.checked=it.done;
    cb.onchange=()=>itemUpdate(it.id,{done:cb.checked}); row.appendChild(cb);
    const body=main();
    const tx=document.createElement('span'); tx.className='ltext'; tx.textContent=it.displayText||it.text;
    tx.onclick=edit; body.appendChild(tx);   // עריכה תמיד על המקור
    if(it.tag && !lvGroupByTag){ const tg=document.createElement('span'); tg.className='ltag'; tg.textContent=it.tag; body.appendChild(tg); }
    row.appendChild(body);
    row.appendChild(more());
    const acts=actions();
    const editBtn=document.createElement('button'); editBtn.className='lbtn editp'; editBtn.textContent='✏️ '+L('ערוך','Edit'); editBtn.onclick=edit; acts.appendChild(editBtn);
    const arch=document.createElement('button'); arch.className='lbtn editp'; arch.textContent='🗄️ '+L('ארכב','Archive'); arch.title=L('ארכב (הסתר, ניתן לשחזר)','Archive (hide, restorable)'); arch.setAttribute('aria-label',L('ארכב','Archive')); arch.onclick=()=>itemUpdate(it.id,{archived:true}); acts.appendChild(arch);
    if(lvScope==='local'){   // 🌐 פעולה גלויה ומתויגת: שמור גם למוח הגלובלי (המקומי נשאר) — פעולה מפורשת בלבד
      const pr=document.createElement('button'); pr.className='lbtn promo'; pr.textContent='🌐 Global';
      pr.title=L('שמור גם למוח הגלובלי (הפריט נשאר גם כאן)','Save also to the global Brain (stays here too)');
      pr.setAttribute('aria-label', L('שמור גם לגלובלי','Save to global')); pr.onclick=()=>promoteItem(it.id); acts.appendChild(pr); }
    // 🗑️ מחיקה מלאה גלויה (נפרד מ-🗄️ ארכוב) — מבקש אישור, מוחק ממקור-האמת של ה-scope הנוכחי
    const del=document.createElement('button'); del.className='lbtn delp'; del.textContent='🗑️ '+L('מחק','Delete');
    del.title=L('מחק','Delete'); del.setAttribute('aria-label',L('מחק','Delete'));
    del.onclick=()=>{ if(confirm(L('למחוק את הפריט הזה?','Delete this item?'))) itemDelete(it.id); }; acts.appendChild(del);
    row.appendChild(acts);
  }
  return row;
}
async function promoteItem(id){
  if(!navigator.onLine){ alert(L('צריך חיבור','A connection is needed')); return; }
  try{ const r=await api({ action:'promote_trip_brain_item_to_global', tripId:getTripId(), area:lvKey, id:id });
    if(r.ok){ toast(r.duplicate?L('כבר קיים במוח הגלובלי','Already in the global Brain'):L('🌐 נשמר גם למוח הגלובלי','🌐 Saved to the global Brain'),3500); }
    else alert(L('שגיאה: ','Error: ')+(r.error||'')); }
  catch(e){ alert(L('אין חיבור — נסה שוב','No connection — try again')); }
}
function renderList(){
  const body=$('lvBody'); body.innerHTML='';
  // 🔍 אינדיקטור-פילטר פעיל: אם יש טקסט-חיפוש (לא ask, לא ארכיון) — פריטים שלא תואמים מוסתרים. שלא ייראה כאילו "נעלמו".
  const filterQ = (!lvAskMode && !lvArchived) ? $('lvSearch').value.trim() : '';
  if(filterQ){ const fb=document.createElement('div'); fb.className='lvfilter';
    const sp=document.createElement('span'); sp.textContent='🔍 '+L('מסונן לפי: ','Filtered by: ')+'"'+filterQ+'"';
    const cl=document.createElement('button'); cl.textContent=L('הצג הכל','Show all'); cl.onclick=()=>{ $('lvSearchClear').onclick(); };
    fb.appendChild(sp); fb.appendChild(cl); body.appendChild(fb); }
  const items = lvArchived ? lvItems.filter(x=>x.archived) : lvItems;
  if(!items.length){ const emptyMsg = filterQ ? L('— אין פריטים שתואמים לסינון —','— no items match the filter —')
      : (lvArchived ? L('— הארכיון ריק —','— archive is empty —')
      : (lvScope==='local' ? L('— ריק. הוסף לטיול הזה, או ✨ הצע מהמוח —','— empty. Add to this trip, or ✨ Suggest from the Brain —') : L('— ריק. הוסף פריט —','— empty. Add an item —')));
    body.insertAdjacentHTML('beforeend','<div class="emptyday">'+emptyMsg+'</div>'); return; }
  if(lvGroupByTag && !lvArchived){
    const groups={}; items.forEach(it=>{ const k=(it.tag||'').trim()||L('— ללא מדינה —','— no country —'); (groups[k]=groups[k]||[]).push(it); });
    Object.keys(groups).sort().forEach(g=>{ const h=document.createElement('div'); h.className='dayhdr'; h.textContent='🌍 '+g; body.appendChild(h);
      groups[g].forEach(it=> body.appendChild(lvRow(it))); });
  } else { items.forEach(it=> body.appendChild(lvRow(it))); }
}
async function itemUpdate(id, patch){
  if(!navigator.onLine){ alert(L('צריך חיבור','A connection is needed')); return; }
  const req = lvScope==='local' ? Object.assign({ action:'update_trip_brain_item', tripId:getTripId(), area:lvKey, id:id }, patch)
                                : Object.assign({ action:'update_list_item', listKey:lvKey, id:id }, patch);
  try{ const r=await api(req); if(r.ok) await reloadList(); }catch(e){ alert(L('אין חיבור','No connection')); }
}
async function itemDelete(id){
  if(!navigator.onLine){ alert(L('צריך חיבור','A connection is needed')); return; }
  const req = lvScope==='local' ? { action:'delete_trip_brain_item', tripId:getTripId(), area:lvKey, id:id }
                                : { action:'delete_list_item', listKey:lvKey, id:id };
  try{ const r=await api(req);
    if(r.ok){ toast(L('נמחק ✓','Deleted ✓'),2000); await reloadList(); }
    else alert(L('שגיאה: ','Error: ')+(r.error||''));   // כשל → לא מעלימים מה-UI, מציגים שגיאה בשפת-הצופה
  }catch(e){ alert(L('אין חיבור — נסה שוב','No connection — try again')); }
}
// הוספה מודעת-scope (משמש את שורת-ההוספה ואת צ'יפי-ההצעות) — מקומי כברירת-מחדל בתוך טיול
async function addItemForScope(text){
  const req = lvScope==='local' ? { action:'add_trip_brain_item', tripId:getTripId(), area:lvKey, text:text }
                                : { action:'add_list_item', listKey:lvKey, text:text };
  return api(req);
}
async function listAddOne(){
  const v=$('lvAdd').value.trim(); if(!v) return;
  if(!navigator.onLine){ alert(L('צריך חיבור','A connection is needed')); return; }
  const btn=$('lvAddBtn'); btn.disabled=true; const old=btn.textContent; btn.textContent='⏳';
  toast(lvScope==='local'?L('מוסיף לטיול הזה…','Adding to this trip…'):L('מוסיף לגלובלי…','Adding to global…'),1800);
  try{
    const r=await addItemForScope(v);
    if(r.ok){ $('lvAdd').value=''; toast(lvScope==='local'?L('נוסף לטיול הזה ✓','Added to this trip ✓'):L('נוסף לגלובלי ✓','Added to global ✓'),2200); await reloadList(); }
    else alert(L('שגיאה: ','Error: ')+(r.error||''));
  }catch(e){ alert(L('אין חיבור','No connection')); }
  finally{ btn.disabled=false; btn.textContent=old; }
}
$('lvClose').onclick=()=>{ $('listview').hidden=true; };
$('lvAddBtn').onclick=listAddOne;
$('lvAdd').addEventListener('keydown', e=>{ if(e.key==='Enter') listAddOne(); });
$('lvArchiveToggle').onclick=()=>{ lvArchived=!lvArchived; $('lvArchiveToggle').textContent=lvArchived?'📋':'🗄️'; reloadList(); };
$('lvSearch').addEventListener('input', ()=>{ lvAskMode=false; clearTimeout(lvSearchTimer); lvSearchTimer=setTimeout(reloadList, 350); });   // הקלדה = סינון מקומי
$('lvSearch').addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); lvAsk(); } });                       // Enter = שאל את המוח
$('lvAskBtn').onclick=()=>lvAsk();
$('lvSearchClear').onclick=()=>{ $('lvSearch').value=''; lvAskMode=false; $('lvAnswer').hidden=true; $('lvAnswer').innerHTML=''; reloadList(); };
$('lvScopeLocal').onclick=()=>lvSwitchScope('local');
$('lvScopeGlobal').onclick=()=>lvSwitchScope('global');
// 🤖/✨ שורת-ה-AI ברשימות: מקומי=הצעות מודעות-הקשר (suggest_from_global_for_trip) · גלובלי=brain_ai (תשובה+הצעות).
// ההוספה תמיד בלחיצת-המשתמש (➕ / הוסף הכל), ל-scope הנוכחי — שקוף, בלי כתיבה אוטומטית.
async function lvAsk(){
  const prompt=$('lvSearch').value.trim(); if(!prompt){ $('lvSearch').focus(); return; }
  if(!navigator.onLine){ alert(L('צריך חיבור ל-AI','An AI connection is required')); return; }
  const card=$('lvAnswer'); card.hidden=false; card.classList.remove('notfound');
  card.innerHTML='<div class="kvahdr">'+(lvScope==='local'?'✨ '+L('המוח חושב על הטיול הזה…','The Brain is thinking about this trip…'):'🤖 '+L('המוח חושב על הרשימה שלך…','The Brain is thinking about your list…'))+'</div>';
  $('lvAskBtn').disabled=true;
  try{
    const r = lvScope==='local'
      ? await api({ action:'suggest_from_global_for_trip', tripId:getTripId(), area:lvKey, prompt:prompt, viewerLang:uiLang() })
      : await api({ action:'brain_ai', area:lvKey, prompt:prompt, viewerLang:uiLang() });
    if(!r.ok){ card.classList.add('notfound'); card.innerHTML='<div class="kvahdr">⚠️ '+escapeHtml(r.error||L('שגיאה','Error'))+'</div>'; return; }
    lvAskMode=true; reloadList();   // הטקסט בשדה = שאלה, לא פילטר — הרשימה למטה נשארת מלאה
    const sugg = lvScope==='local' ? (r.suggestions||[]) : (r.suggestedItems||[]);   // איחוד צורת-התשובה
    let h='';
    if(lvScope==='global') h+='<div class="kvahdr">🧠 '+L('תשובת המוח','Brain answer')+'</div><div>'+escapeHtml(r.answer||'')+'</div>';
    else h+='<div class="kvahdr">✨ '+L('הצעות מהמוח לטיול הזה','Suggestions from the Brain for this trip')+'</div>';
    if(sugg.length){
      h+='<div class="kvasrc">'+(lvScope==='local'?L('לחץ ➕ כדי להוסיף לטיול הזה:','Tap ➕ to add to this trip:'):L('הצעות — לחץ ➕ כדי להוסיף לרשימה:','Suggestions — tap ➕ to add to the list:'))+'</div><div class="lvsugg">'+
        sugg.map((s,i)=>'<span class="sg" data-i="'+i+'">'+escapeHtml(s)+'<button data-add="'+i+'" aria-label="'+L('הוסף','Add')+'">➕</button></span>').join('')+
        '</div><button class="lvsuggall" id="lvSuggAll">➕ '+L('הוסף הכל','Add all')+' ('+sugg.length+')</button>';
    } else if(lvScope==='local'){ h+='<div>'+L('אין הצעות חדשות — הרשימה שלך מכסה את זה 👍','No new suggestions — your list already covers it 👍')+'</div>'; }
    card.innerHTML=h;
    // חיווט ההצעות — כל הוספה דרך ה-scope הנוכחי (שקוף + מסוכם)
    let addedCount=0;
    async function addOne(i){
      const el=card.querySelector('.sg[data-i="'+i+'"]'); if(!el || el.classList.contains('added')) return false;
      try{ const rr=await addItemForScope(sugg[i]);
        if(rr.ok){ el.classList.add('added'); addedCount++; return true; } }catch(e){}
      return false;
    }
    card.querySelectorAll('button[data-add]').forEach(b=>{ b.onclick=async()=>{ b.disabled=true;
      if(await addOne(Number(b.dataset.add))){ toast(L('נוסף ✓','Added ✓'),2000); await reloadList(); } else b.disabled=false; }; });
    const all=card.querySelector('#lvSuggAll');
    if(all) all.onclick=async()=>{ all.disabled=true; all.textContent='⏳';
      for(let i=0;i<sugg.length;i++) await addOne(i);
      all.textContent='✓ '+L('נוספו '+addedCount+' פריטים','added '+addedCount+' items');
      toast(L('נוספו '+addedCount+' פריטים לרשימה','Added '+addedCount+' items to the list'),5000); logLine('🧠 '+L('נוספו '+addedCount+' פריטים','added '+addedCount+' items')); await reloadList(); };
  }catch(e){ card.classList.add('notfound'); card.innerHTML='<div class="kvahdr">'+L('אין חיבור — נסה שוב','No connection — try again')+'</div>'; }
  finally{ $('lvAskBtn').disabled=false; }
}
$('lvGroupToggle').onclick=()=>{ lvGroupByTag=!lvGroupByTag; $('lvGroupToggle').style.opacity=lvGroupByTag?'.5':'1'; renderList(); };
$('lvAddManyBtn').onclick=()=>{ $('pasteText').value=''; $('pastegate').hidden=false; $('pasteText').focus(); };
$('pasteCancel').onclick=()=>{ $('pastegate').hidden=true; };
$('pasteSplit').onclick=async()=>{
  const v=$('pasteText').value.trim(); if(!v) return;
  if(!navigator.onLine){ alert(L('צריך חיבור ל-AI','An AI connection is required')); return; }
  $('pasteSplit').disabled=true; const old=$('pasteSplit').textContent; $('pasteSplit').textContent=L('✨ מפצל…','✨ Splitting…');
  toast(lvScope==='local'?L('מפצל ומוסיף לטיול הזה…','Splitting and adding to this trip…'):L('מפצל ומוסיף לגלובלי…','Splitting and adding to global…'),2500);
  try{
    const req = lvScope==='local'
      ? { action:'add_trip_brain_items', tripId:getTripId(), area:lvKey, text:v, viewerLang:uiLang() }
      : { action:'add_list_items', listKey:lvKey, text:v, viewerLang:uiLang() };
    const r=await api(req);
    if(r.ok){
      $('pastegate').hidden=true;
      const msg=(lvScope==='local'
        ? L('➕ נוספו '+(r.count||0)+' פריטים לטיול הזה','➕ Added '+(r.count||0)+' items to this trip')
        : L('➕ נוספו '+(r.count||0)+' פריטים לגלובלי','➕ Added '+(r.count||0)+' items to global'));
      toast(msg,4500); logLine(msg); await reloadList();
    } else alert(L('שגיאה: ','Error: ')+(r.error||'')); }
  catch(e){ alert(L('אין חיבור — נסה שוב','No connection — try again')); }
  finally{ $('pasteSplit').disabled=false; $('pasteSplit').textContent=old; }
};

/* --- knowledge (lessons / how-to), AI-organized doc --- */
let kvKey=null, kvText='', kvDisplay='', kvUrl='#', kvSearchTimer=null;
async function openKnow(tile){
  kvKey=tile.key; $('kvSearch').value=''; $('kvAnswer').hidden=true; $('kvAnswer').innerHTML='';
  kvDisplay='';
  $('kvTitle').textContent=tile.emoji+' '+tileLabel(tile);
  $('knowview').hidden=false; $('kvBody').innerHTML='<div class="emptyday">'+L('טוען…','Loading…')+'</div>';
  try{ const r=await api({ action:'get_knowledge', docKey:kvKey });
    if(r.ok){ kvText=r.text||''; kvUrl=r.url||'#'; renderKnow();
      // 🌐 תרגום-תצוגה: מציגים מיד את המקור, ומחליפים לתרגום כשמוכן (ה-Doc לא משתנה)
      if(needsViewTx(kvText)){ const myKey=kvKey;
        viewTexts([kvText]).then(d=>{ if(kvKey!==myKey) return; if(d[0]!==kvText){ kvDisplay=d[0]; renderKnow(); } }); }
    } else $('kvBody').innerHTML='<div class="emptyday">'+L('שגיאה','Error')+'</div>';
  }catch(e){ $('kvBody').innerHTML='<div class="emptyday">'+L('אין חיבור','No connection')+'</div>'; }
}
function renderKnow(){
  const body=$('kvBody'); const q=$('kvSearch').value.trim();
  const src=kvDisplay||kvText;   // 🌐 תצוגה מתורגמת אם קיימת; המקור נשאר ב-kvText (ול-Doc)
  // הסר את כותרת המסמך (שורה ראשונה) שכבר מופיעה בכותרת המסך
  let txt=String(src||'').replace(/^.*\n/, m=> (m.trim()===($('kvTitle').textContent||'').trim()? '' : m)).trim();
  if(!txt) txt=String(src||'').trim();
  if(!txt){ body.innerHTML='<div class="emptyday">'+L('— עדיין ריק. הוסף לקח/הוראה —','— still empty. Add a lesson / how-to —')+'</div>'; return; }
  // הדגשת מילות-חיפוש (אחרי escape, על כל שורה בנפרד)
  const hi=s=>{ let h=escapeHtml(s);
    if(q){ const re=new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi'); h=h.replace(re,'<mark>$1</mark>'); }
    return h; };
  // מבנה: שורה ללא bullet וקצרה = כותרת-נושא; שורות "-"/"•" = רשימה; השאר = פסקה
  const out=[]; let ul=[];
  const flush=()=>{ if(ul.length){ out.push('<ul class="kvul">'+ul.map(li=>'<li>'+hi(li)+'</li>').join('')+'</ul>'); ul=[]; } };
  txt.split('\n').forEach(line=>{
    const t=line.trim();
    if(!t){ flush(); return; }
    const m=t.match(/^[-•]\s*(.*)$/);
    if(m){ ul.push(m[1]); return; }
    flush();
    if(t.length<70 && !/[.?!]$/.test(t)) out.push('<div class="kvsec">'+hi(t)+'</div>');
    else out.push('<div class="kvp">'+hi(t)+'</div>');
  });
  flush();
  body.innerHTML='<div class="kvtext">'+out.join('')+'</div>';
}
// 🤖 "שאל את המוח" — תשובת AI מתוך מסמך-הידע בלבד (לא ידע כללי)
async function kvAsk(){
  const question=$('kvSearch').value.trim(); if(!question){ $('kvSearch').focus(); return; }
  if(!navigator.onLine){ alert(L('צריך חיבור ל-AI','An AI connection is required')); return; }
  const card=$('kvAnswer'); card.hidden=false; card.classList.remove('notfound');
  card.innerHTML='<div class="kvahdr">🤖 '+L('מחפש בידע שלך…','Searching your knowledge…')+'</div>';
  $('kvAskBtn').disabled=true;
  try{ const r=await api({ action:'brain_ai', area:kvKey, prompt:question, viewerLang:uiLang() });
    if(!r.ok){
      card.classList.add('notfound');
      card.innerHTML='<div class="kvahdr">⚠️ '+escapeHtml(r.error||L('שגיאה','Error'))+'</div>'+
        (r.aiUnavailable?('<div class="kvasrc">'+L('בינתיים: ההקלדה מדגישה מילים במסמך למטה.','Meanwhile: typing highlights words in the doc below.')+'</div>'):'');
      renderKnow(); return;
    }
    const personal=String(r.personal||'').trim(), general=String(r.general||'').trim();
    let h='';
    if(personal){
      h+='<div class="kvahdr">🧠 '+L('מתוך הידע שלך','From your knowledge')+'</div><div>'+escapeHtml(personal)+'</div>';
      if(r.sections && r.sections.length) h+='<div class="kvasrc">'+L('מבוסס על: ','Based on: ')+escapeHtml(r.sections.join(' · '))+'</div>';
      if(r.quotes && r.quotes.length) r.quotes.forEach(qt=>{ h+='<div class="kvaq">'+escapeHtml(qt)+'</div>'; });
    } else {
      h+='<div class="kvahdr">ℹ️ '+L('אין עדיין לקח אישי בנושא','No personal lesson on this yet')+'</div>';
      card.classList.add('notfound');
    }
    if(general){
      h+='<div class="kvgen"><div class="kvghdr">🌍 '+L('ידע כללי להשלמה (לא מהמוח שלך)','General knowledge supplement (not from your brain)')+'</div><div>'+escapeHtml(general)+'</div></div>';
    } else if(!personal){
      h+='<div>'+L('לא מצאתי עדיין לקח בנושא הזה.','I have no saved lesson on this yet.')+'</div>';
    }
    card.innerHTML=h;
    renderKnow();   // השאלה גם מדגישה מילים במסמך למטה
  }catch(e){ card.classList.add('notfound'); card.innerHTML='<div class="kvahdr">'+L('אין חיבור — נסה שוב','No connection — try again')+'</div>'; }
  finally{ $('kvAskBtn').disabled=false; }
}
async function knowAdd(){
  const v=$('kvAdd').value.trim(); if(!v) return;
  if(!navigator.onLine){ alert(L('צריך חיבור ל-AI','An AI connection is required')); return; }
  $('kvAddBtn').disabled=true; const old=$('kvAddBtn').textContent; $('kvAddBtn').textContent='⏳';
  $('kvBody').innerHTML='<div class="emptyday">'+L('🤖 מארגן…','🤖 Organizing…')+'</div>';
  try{ const r=await api({ action:'add_knowledge', docKey:kvKey, text:v });
    if(r.ok){ kvText=r.text||kvText; kvDisplay=''; kvUrl=r.url||kvUrl; $('kvAdd').value=''; renderKnow(); } else { alert(L('שגיאה','Error')); renderKnow(); } }
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
    if(r.ok){ kvText=r.text||kvText; kvDisplay=''; kvUrl=r.url||kvUrl; $('kvSearch').value=''; renderKnow(); logLine(T().restored_ok); }
    else alert(L('שגיאה: ','Error: ')+(r.error||'')); }
  catch(e){ alert(L('אין חיבור — נסה שוב','No connection — try again')); }
  finally{ $('kvRestore').textContent=old; }
};
$('kvAddBtn').onclick=knowAdd;
$('kvAdd').addEventListener('keydown', e=>{ if(e.key==='Enter') knowAdd(); });
$('kvSearch').addEventListener('input', ()=>{ clearTimeout(kvSearchTimer); kvSearchTimer=setTimeout(renderKnow, 200); });   // הקלדה = הדגשה מקומית בלבד
$('kvSearch').addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); kvAsk(); } });                       // Enter = שאל את המוח
$('kvAskBtn').onclick=kvAsk;
$('kvSearchClear').onclick=()=>{ $('kvSearch').value=''; $('kvAnswer').hidden=true; $('kvAnswer').innerHTML=''; renderKnow(); };  // ✕ מנקה שדה+תשובה בלבד
$('kvOrganize').onclick=async()=>{   // סדר כולל (מדי פעם) — AI מארגן מחדש את כל המסמך
  if(!navigator.onLine){ alert(L('צריך חיבור ל-AI','An AI connection is required')); return; }
  if(!confirm(T().organize_confirm)) return;
  const old=$('kvOrganize').textContent; $('kvOrganize').textContent='⏳';
  $('kvBody').innerHTML='<div class="emptyday">'+T().organizing_all+'</div>';
  try{ const r=await api({ action:'organize_knowledge', docKey:kvKey });
    if(r.ok){ kvText=r.text||kvText; kvDisplay=''; kvUrl=r.url||kvUrl; renderKnow(); } else { alert(L('שגיאה','Error')); renderKnow(); } }
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
  $('foodgate').hidden=false; $('foodText').value=''; $('foodAnalysis').style.display='none'; $('foodAnalysis').innerHTML=''; $('foodText').focus(); refreshFood();
  if(navigator.onLine){ try{ const r=await api({ action:'food_url', tripId:getTripId() }); if(r.ok&&r.url){ $('foodSheet').href=r.url; $('foodSheet').style.display='block'; } }catch(e){} }
}
async function refreshFood(){
  if(!navigator.onLine) return;
  try{ const r=await api({ action:'list_food', tripId:getTripId() }); const el=$('foodList'); el.innerHTML='';
    (r.food||[]).slice(0,25).forEach(f=>{ const d=document.createElement('div'); d.className='litem'; d.style.display='block';
      d.innerHTML=escapeHtml(f.text)+'<div class="ts">'+[f.kind,f.author,shortTs(f.date)].filter(Boolean).map(escapeHtml).join(' · ')+'</div>'; el.appendChild(d); });
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
/* --- 💡 יומן-לקחים per-trip (offline-queued) — נפרד מהיומן, נכלל בהפקת-הלקחים, לא בספר --- */
async function enqueueLesson(text){ await dbAdd({ kind:'json', payload:{ action:'add_lesson', clientId:clientId(), author:getAuthor(), tripId:getTripId(), lessonId:uuid(), ts:new Date().toISOString(), text } }); }
function openLessons(){ if(!ensureTrip()) return; $('lessonToBrain').textContent=T().send_to_brain; $('lessongate').hidden=false; $('lessonText').value=''; $('lessonText').focus(); refreshLessons(); }
$('lessonToBrain').onclick=async()=>{ if(!ensureTrip()) return; if(!navigator.onLine){ alert(L('צריך חיבור','Connection needed')); return; }
  const b=$('lessonToBrain'); const o=b.textContent; b.disabled=true; b.textContent=L('שומר…','Saving…');
  try{ const r=await api({action:'export_lessons_to_brain', tripId:getTripId()});
    if(r.ok) logLine(L('🧠 '+(r.added||0)+' לקחים נוספו למוח','🧠 '+(r.added||0)+' lessons added to the Brain'));
    else alert(L('שגיאה: ','Error: ')+(r.error||'')); }
  catch(e){ alert(L('אין חיבור — נסה שוב','No connection — try again')); } finally{ b.disabled=false; b.textContent=o; } };
async function refreshLessons(){ if(!navigator.onLine) return;
  try{ const r=await api({ action:'list_lessons', tripId:getTripId() }); const el=$('lessonList'); el.innerHTML='';
    (r.lessons||[]).slice(0,40).forEach(l=>{ const d=document.createElement('div'); d.className='litem'; d.style.display='block';
      d.innerHTML=escapeHtml(l.text)+'<div class="ts">'+[l.author,shortTs(l.date)].filter(Boolean).map(escapeHtml).join(' · ')+'</div>'; el.appendChild(d); });
  }catch(e){} }
$('lessonbtn').onclick=openLessons;
$('lessonClose').onclick=()=>{ $('lessongate').hidden=true; };
$('lessonSave').onclick=async()=>{ const text=$('lessonText').value.trim(); if(!text) return; if(!ensureTrip()) return;
  $('lessonSave').disabled=true;
  await enqueueLesson(text);
  $('lessonText').value=''; logLine(T().lesson_saved); await render(); flush();
  setTimeout(refreshLessons, 1800); $('lessonSave').disabled=false;
};
/* --- P2: ניתוח צילום תפריט/שלט (כשר+טבעוני) → הצעה ליומן-אוכל (אישור ידני) --- */
function renderFoodAnalysis(d){
  const el=$('foodAnalysis'); el.style.display='block';
  const ul=(arr)=> (Array.isArray(arr)&&arr.length)?('<ul>'+arr.map(s=>'<li>'+escapeHtml(String(s))+'</li>').join('')+'</ul>'):'';
  let h='<div class="fa-veg">'+(d.veganFriendly?('✅ '+L('ידידותי לטבעונים','Vegan-friendly')):('⚠️ '+L('לא בהכרח טבעוני','Not necessarily vegan')))+'</div>';
  if(d.dishes&&d.dishes.length) h+='<div>'+L('מנות אפשריות','Possible dishes')+':'+ul(d.dishes)+'</div>';
  if(d.kosherSignals&&d.kosherSignals.length) h+='<div>'+L('כשרות','Kashrut')+':'+ul(d.kosherSignals)+'</div>';
  if(d.warnings&&d.warnings.length) h+='<div class="fa-warn">'+L('אזהרות','Warnings')+':'+ul(d.warnings)+'</div>';
  h+='<button id="foodSuggestBtn" class="ghost" style="margin-top:8px">📥 '+L('הכנס הצעה ליומן','Put suggestion in log')+'</button>';
  el.innerHTML=h;
  const sb=$('foodSuggestBtn'); if(sb) sb.onclick=()=>{ if(d.suggestedFoodLogText){ $('foodText').value=d.suggestedFoodLogText; $('foodText').focus(); } };
}
async function analyzeFoodPhoto(file){
  if(!file) return; if(!ensureTrip()) return;
  if(!navigator.onLine){ alert(L('צריך חיבור ל-AI','An AI connection is required')); return; }
  $('foodAnalysis').style.display='block'; $('foodAnalysis').innerHTML='<div class="emptyday">'+L('🔎 מנתח…','🔎 Analyzing…')+'</div>';
  try{
    let blob=file, mime=file.type||'image/jpeg';
    if(/^image\//.test(mime)){ blob=await compressImage(file); mime='image/jpeg'; }
    if(blob.size>MAX_BYTES){ $('foodAnalysis').innerHTML='<div class="emptyday">'+L('⚠️ הקובץ גדול מדי','⚠️ File too large')+'</div>'; return; }
    const r=await api({ action:'parse_food_photo', mime:mime, dataB64:(await blobToB64(blob)) });
    if(r.ok && r.data) renderFoodAnalysis(r.data);
    else if(r && r.service) $('foodAnalysis').innerHTML='<div class="emptyday">'+L('⏳ ארך מעט — נסה שוב','⏳ Took a moment — try again')+'</div>';
    else $('foodAnalysis').innerHTML='<div class="emptyday">⚠️ '+escapeHtml(r.error||'error')+'</div>';
  }catch(e){ $('foodAnalysis').innerHTML='<div class="emptyday">'+L('אין חיבור — נסה שוב','No connection — try again')+'</div>'; }
}
$('foodPhotoBtn').onclick=()=>{ if(ensureTrip()) $('foodPhotoFile').click(); };
$('foodPhotoFile').onchange=()=>{ const f=$('foodPhotoFile').files[0]; $('foodPhotoFile').value=''; if(f) analyzeFoodPhoto(f); };
/* --- P2b: צילום הצלחת → זיהוי פריטים ליומן (בלי שיפוט כשר/טבעוני) --- */
function renderMealAnalysis(d){
  const el=$('foodAnalysis'); el.style.display='block';
  const items=Array.isArray(d.items)?d.items:[];
  let h='<div class="fa-veg">🍽️ '+L('פריטי הארוחה','Meal items')+'</div>';
  h+= items.length ? ('<ul>'+items.map(s=>'<li>'+escapeHtml(String(s))+'</li>').join('')+'</ul>') : ('<div class="emptyday">'+L('— לא זוהו פריטים —','— no items detected —')+'</div>');
  h+='<button id="mealAddBtn" class="ghost" style="margin-top:8px">📥 '+L('הכנס ליומן','Put in log')+'</button>';
  el.innerHTML=h;
  const b=$('mealAddBtn'); if(b) b.onclick=()=>{ const txt=d.mealSummary || items.join(', '); if(txt){ $('foodText').value=txt; $('foodText').focus(); } };
}
async function analyzeMealPhoto(file){
  if(!file) return; if(!ensureTrip()) return;
  if(!navigator.onLine){ alert(L('צריך חיבור ל-AI','An AI connection is required')); return; }
  $('foodAnalysis').style.display='block'; $('foodAnalysis').innerHTML='<div class="emptyday">'+L('🔎 מזהה פריטים…','🔎 Identifying items…')+'</div>';
  try{
    let blob=file, mime=file.type||'image/jpeg';
    if(/^image\//.test(mime)){ blob=await compressImage(file); mime='image/jpeg'; }
    if(blob.size>MAX_BYTES){ $('foodAnalysis').innerHTML='<div class="emptyday">'+L('⚠️ הקובץ גדול מדי','⚠️ File too large')+'</div>'; return; }
    const r=await api({ action:'parse_meal_photo', mime:mime, dataB64:(await blobToB64(blob)) });
    if(r.ok && r.data) renderMealAnalysis(r.data);
    else if(r && r.service) $('foodAnalysis').innerHTML='<div class="emptyday">'+L('⏳ ארך מעט — נסה שוב','⏳ Took a moment — try again')+'</div>';
    else $('foodAnalysis').innerHTML='<div class="emptyday">⚠️ '+escapeHtml(r.error||'error')+'</div>';
  }catch(e){ $('foodAnalysis').innerHTML='<div class="emptyday">'+L('אין חיבור — נסה שוב','No connection — try again')+'</div>'; }
}
$('mealPhotoBtn').onclick=()=>{ if(ensureTrip()) $('mealPhotoFile').click(); };
$('mealPhotoFile').onchange=()=>{ const f=$('mealPhotoFile').files[0]; $('mealPhotoFile').value=''; if(f) analyzeMealPhoto(f); };

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
    if(r.ok && r.text){ wrapUrl=r.url||'#'; wrapLastLessons=r.text||''; wrapMsg('ai', r.text);
      if(r.brainLessonsAdded) wrapMsg('ai', L('🧠 '+r.brainLessonsAdded+' לקחים נוספו למוח הגלובלי לטיולים הבאים.','🧠 '+r.brainLessonsAdded+' lessons added to the global Brain for future trips.')); }
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
