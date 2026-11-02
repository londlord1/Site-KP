/* ===== Данные сайта: локальный JSON (без внешнего API) ===== */
(function(){
  const LOCAL = (typeof PRODUCTS !== "undefined") ? PRODUCTS : [];

  /* Загрузка каталога из локального JSON-файла */
  async function loadLocalJson(){
    if(location.protocol === "file:") throw new Error("file:");  // file:// не грузит fetch
    const r = await fetch("data/products.json", {cache:"no-store"});
    if(!r.ok) throw new Error("HTTP " + r.status);
    const arr = await r.json();
    if(!Array.isArray(arr)) throw new Error("not an array");
    return arr;
  }

  let cache = null;
  const LS_EXTRA = "sc_extra", LS_DEL = "sc_deleted", LS_EDITS = "sc_edits";
  function readJson(k){ try{ return JSON.parse(localStorage.getItem(k)||"[]"); }catch(e){ return []; } }

  /* Применить правки товара (хранятся в sc_edits) — в т.ч. изменённые/добавленные изображения */
  function applyEdits(list){
    const map = {};
    readJson(LS_EDITS).forEach(e=>{ if(e && e.id!=null) map[e.id] = e; });
    return list.map(p=>{
      const e = map[p.id]; if(!e) return p;
      const np = Object.assign({}, p);
      ["name","cat","price","oldPrice","icon","badge","desc"].forEach(k=>{ if(k in e) np[k] = e[k]; });
      if(Array.isArray(e.images)){ np.images = e.images.slice(); np.img = e.images[0] || np.img; }
      else if(e.img) np.img = e.img;
      return np;
    });
  }

  /* Применить локальные изменения каталога (добавленные/удалённые/отредактированные товары) */
  window.applyCatalog = function(base){
    const extra = readJson(LS_EXTRA);
    const del = readJson(LS_DEL);
    PRODUCTS = applyEdits( base.concat(extra).filter(p => !del.includes(p.id)) )
      .map(p => Object.assign({ stock: 5+(p.id%15), rating: +(3.2+((p.id%5)*0.4)).toFixed(1) }, p));
    CATEGORIES = ["Все", ...new Set(PRODUCTS.map(p=>p.cat))];
    document.dispatchEvent(new Event("products-ready"));
    return PRODUCTS;
  };
  function saveJson(k, v){
    try{ localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch(e){ try{ toast("Ошибка сохранения: слишком большой объём данных (изображения)"); }catch(_){} return false; }
  }
  window.addProduct = function(p){
    const extra = readJson(LS_EXTRA);
    extra.push(Object.assign({id: Date.now()}, p));
    if(saveJson(LS_EXTRA, extra)) window.applyCatalog(window.BASE_PRODUCTS);
  };
  window.deleteProduct = function(id){
    const del = readJson(LS_DEL);
    if(!del.includes(id)) del.push(id);
    if(saveJson(LS_DEL, del)) window.applyCatalog(window.BASE_PRODUCTS);
  };
  window.addEdit = function(id, data){
    const edits = readJson(LS_EDITS).filter(e=>e.id!==id);
    edits.push(Object.assign({ id }, data));
    if(saveJson(LS_EDITS, edits)) window.applyCatalog(window.BASE_PRODUCTS);
  };

  window.loadProducts = function(){
    if(!cache){
      cache = (async()=>{
        let base;
        try { base = await loadLocalJson(); }      // из data/products.json
        catch(e){ base = LOCAL; }                  // резерв: встроенные данные в js/data.js
        window.BASE_PRODUCTS = base.slice();
        return window.applyCatalog(base);
      })();
    }
    return cache.then((res)=>{ document.dispatchEvent(new Event("products-ready")); return res; });
  };
})();