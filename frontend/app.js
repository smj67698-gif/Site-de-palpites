
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
  
