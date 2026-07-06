
/* ═══════════════════════════════════════
   STORAGE  — two keys so cover images
   (large base64) don't hit the 5 MB limit
   on a single JSON.stringify call.
   Meta = everything except cover.
   Covers stored individually by book id.
═══════════════════════════════════════ */
var PW  = '123qwe';
var KEY = 'bl_meta_v5';          // stores array without cover data
var COV = 'bl_cover_v5_';        // prefix: COV + book.id

function saveMeta(arr){
  // save books WITHOUT cover (cover saved separately)
  var slim = arr.map(function(b){
    return {id:b.id,title:b.title,description:b.description,price:b.price,url:b.url,published:b.published};
  });
  try{ localStorage.setItem(KEY, JSON.stringify(slim)); }catch(e){ console.warn('meta save failed',e); }
}
function saveCover(id, dataUrl){
  if(!dataUrl) return;
  try{ localStorage.setItem(COV+id, dataUrl); }catch(e){ console.warn('cover save failed',e); }
}
function loadCover(id){
  try{ return localStorage.getItem(COV+id) || null; }catch(e){ return null; }
}
function deleteCover(id){
  try{ localStorage.removeItem(COV+id); }catch(e){}
}
function loadAll(){
  try{
    var slim = JSON.parse(localStorage.getItem(KEY)) || [];
    return slim.map(function(b){
      return Object.assign({}, b, {cover: loadCover(b.id)});
    });
  }catch(e){ return []; }
}
function saveAll(){
  saveMeta(books);
  books.forEach(function(b){ if(b.cover) saveCover(b.id, b.cover); });
}
/* ═══════════════════════════════════════
   STATE
═══════════════════════════════════════ */
var books    = loadAll();
var editId   = null;
var draftCov = null;   // base64 string currently in the form

/* boot */
renderHome();

/* ═══════════════════════════════════════
   RENDER HOME
═══════════════════════════════════════ */
function renderHome(){
  var pub = books.filter(function(b){ return b.published; });
  var hasAny = pub.length > 0;

  document.getElementById('empty').style.display   = hasAny ? 'none'  : 'flex';
  document.getElementById('hero').style.display    = hasAny ? 'block' : 'none';
  document.getElementById('cat-hd').style.display  = hasAny ? 'flex'  : 'none';
  document.getElementById('cat-ct').textContent    = pub.length + (pub.length===1?' título':' títulos');

  document.getElementById('grid').innerHTML = pub.map(function(b,i){
    var img = b.cover
      ? '<img src="'+b.cover+'" alt="'+eh(b.title)+'">'
      : '<div class="card-ph"><svg width="36" height="36" viewBox="0 0 36 36" fill="none"><rect x="3" y="3" width="30" height="30" rx="4" stroke="#5c6ef8" stroke-width="1.5"/><path d="M10 14h16M10 20h10" stroke="#5c6ef8" stroke-width="1.5" stroke-linecap="round"/></svg><span>Sem capa</span></div>';
    return '<div class="card" style="animation-delay:'+(i*.07)+'s">'
      +'<div class="card-img">'+img+'<div class="card-badge">Ebook Digital</div></div>'
      +'<div class="card-body">'
      +'<div class="card-ttl">'+eh(b.title)+'</div>'
      +'<div class="card-desc">'+eh(b.description)+'</div>'
      +'</div>'
      +'<div class="card-ft">'
      +'<div><div class="card-plbl">Por apenas</div><div class="card-price">'+fmt(b.price)+'</div></div>'
      +'<a class="card-btn" href="'+eh(b.url||'#')+'" target="_blank" rel="noopener">'
      +'<svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1L10 5.5L5.5 10M1 5.5h9" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></svg>'
      +'Comprar na Hotmart</a>'
      +'</div></div>';
  }).join('');
}

/* ═══════════════════════════════════════
   RENDER ADMIN LIST
═══════════════════════════════════════ */
function renderAlist(){
  var el = document.getElementById('alist');
  if(!books.length){
    el.innerHTML='<p style="font-size:.78rem;color:var(--muted);padding:6px 0 10px">Nenhum ebook criado ainda.</p>';
    return;
  }
  el.innerHTML = books.map(function(b){
    var thumb = b.cover
      ? '<img class="ai-thumb" src="'+b.cover+'" alt="">'
      : '<div class="ai-ph">📖</div>';
    return '<div class="ai">'
      +thumb
      +'<div class="ai-info">'
      +'<div class="ai-name">'+eh(b.title||'Sem título')+'</div>'
      +'<div class="ai-price">'+fmt(b.price)+'</div>'
      +'<span class="bdg '+(b.published?'bdg-p':'bdg-d')+'">'+(b.published?'● Publicado':'○ Rascunho')+'</span>'
      +'</div>'
      +'<div class="ai-btns">'
      +'<button class="aib aib-e" onclick="editBook(\''+b.id+'\')">Editar</button>'
      +'<button class="aib aib-d" onclick="delBook(\''+b.id+'\')">Excluir</button>'
      +'</div></div>';
  }).join('');
}
/* ═══════════════════════════════════════
   HELPERS
═══════════════════════════════════════ */
function eh(s){ s=s||''; return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function fmt(p){ var n=parseFloat(p); return isNaN(n)?'R$ —':'R$ '+n.toFixed(2).replace('.',','); }
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,6); }

/* ═══════════════════════════════════════
   UPLOAD
═══════════════════════════════════════ */
function onFileChange(e){
  var f = e.target.files[0];
  if(!f || !f.type.startsWith('image/')) return;
  var reader = new FileReader();
  reader.onload = function(ev){
    draftCov = ev.target.result;
    showPreview(draftCov);
  };
  reader.readAsDataURL(f);
}
function showPreview(src){
  var img = document.getElementById('up-preview');
  var rem = document.getElementById('up-remove');
  img.src = src;
  img.style.display = 'block';
  rem.style.display = 'block';
}
function removeCover(e){
  e.preventDefault(); // stop label click from opening file picker
  draftCov = null;
  var img = document.getElementById('up-preview');
  var rem = document.getElementById('up-remove');
  img.src = ''; img.style.display = 'none';
  rem.style.display = 'none';
  document.getElementById('file-input').value = '';
}

/* drag & drop onto the label zone */
(function(){
  var zone = document.getElementById('upzone');
  zone.addEventListener('dragover',  function(e){ e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', function(){ zone.classList.remove('dragover'); });
  zone.addEventListener('drop', function(e){
    e.preventDefault(); zone.classList.remove('dragover');
    var f = e.dataTransfer.files[0];
    if(!f || !f.type.startsWith('image/')) return;
    var r = new FileReader();
    r.onload = function(ev){ draftCov = ev.target.result; showPreview(draftCov); };
    r.readAsDataURL(f);
  });
})();

/* ═══════════════════════════════════════
   FORM
═══════════════════════════════════════ */
function newForm(){
  editId = null; draftCov = null;
  document.getElementById('f-title').value = '';
  document.getElementById('f-desc').value  = '';
  document.getElementById('f-price').value = '';
  document.getElementById('f-url').value   = '';
  document.getElementById('asub').textContent = 'Novo ebook';
  document.getElementById('up-preview').style.display = 'none';
  document.getElementById('up-remove').style.display  = 'none';
  document.getElementById('up-preview').src = '';
  document.getElementById('file-input').value = '';
  document.querySelector('#ov-admin .modal').scrollTop = 0;
}
function cancelEdit(){
  if(!books.length){ closeAdmin(); return; }
  newForm();
}
function getForm(published){
  var title = document.getElementById('f-title').value.trim();
  if(!title){ toast('⚠ Adicione um título.'); return null; }
  return {
    id: editId || uid(),
    title: title,
    description: document.getElementById('f-desc').value.trim(),
    price: document.getElementById('f-price').value.trim(),
    url: document.getElementById('f-url').value.trim() || '#',
    cover: draftCov,          // may be null if no image
    published: published
  };
}
function upsert(b){
  var i = books.findIndex(function(x){ return x.id===b.id; });
  if(i>=0) books[i]=b; else books.unshift(b);
  editId = b.id;
}
function saveDraft(){
  var b = getForm(false); if(!b) return;
  upsert(b); saveAll(); renderHome(); renderAlist();
  document.getElementById('asub').textContent = 'Editando: '+b.title;
  toast('💾 Rascunho salvo!');
}
function publishNow(){
  var b = getForm(true); if(!b) return;
  upsert(b); saveAll(); renderHome(); renderAlist();
  document.getElementById('asub').textContent = 'Editando: '+b.title;
  toast('🚀 Publicado na home!', true);
}
function editBook(id){
  var b = books.find(function(x){ return x.id===id; }); if(!b) return;
  editId = id; draftCov = b.cover || null;
  document.getElementById('f-title').value = b.title||'';
  document.getElementById('f-desc').value  = b.description||'';
  document.getElementById('f-price').value = b.price||'';
  document.getElementById('f-url').value   = (b.url&&b.url!=='#')?b.url:'';
  document.getElementById('asub').textContent = 'Editando: '+(b.title||'ebook');
  if(b.cover) showPreview(b.cover);
  else { document.getElementById('up-preview').style.display='none'; document.getElementById('up-remove').style.display='none'; }
  document.querySelector('#ov-admin .modal').scrollTop = 0;
}
function delBook(id){
  if(!confirm('Excluir este ebook?')) return;
  books = books.filter(function(b){ return b.id!==id; });
  deleteCover(id);
  saveMeta(books);
  if(editId===id) newForm();
  renderHome(); renderAlist();
  toast('Ebook excluído.');
}

/* ═══════════════════════════════════════
   LOGIN
═══════════════════════════════════════ */
function openLogin(){
  document.getElementById('ov-login').classList.add('open');
  setTimeout(function(){ document.getElementById('lpw').focus(); },100);
}
function closeLogin(){
  document.getElementById('ov-login').classList.remove('open');
  document.getElementById('lpw').value='';
  document.getElementById('lerr').textContent='';
}
function doLogin(){
  if(document.getElementById('lpw').value===PW){ closeLogin(); openAdmin(); }
  else{ document.getElementById('lerr').textContent='Senha incorreta.'; document.getElementById('lpw').value=''; document.getElementById('lpw').focus(); }
}

/* ═══════════════════════════════════════
   ADMIN
═══════════════════════════════════════ */
function openAdmin(){ newForm(); renderAlist(); document.getElementById('ov-admin').classList.add('open'); }
function closeAdmin(){ document.getElementById('ov-admin').classList.remove('open'); }

/* ═══════════════════════════════════════
   TOAST
═══════════════════════════════════════ */
function toast(msg, green){
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast'+(green?' green':'');
  t.classList.add('show');
  setTimeout(function(){ t.classList.remove('show'); }, 3000);
}

/* close modals on backdrop click */
document.getElementById('ov-login').addEventListener('click', function(e){ if(e.target===this) closeLogin(); });
document.getElementById('ov-admin').addEventListener('click', function(e){ if(e.target===this) closeAdmin(); });
