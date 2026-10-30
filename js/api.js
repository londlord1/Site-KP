/* ===== Данные сайта: локальный JSON (без внешнего API) ===== */
(function(){
  const LOCAL = (typeof PRODUCTS !== "undefined") ? PRODUCTS : [];

  /* Загрузка каталога из локального JSON-файла */
  async function loadLocalJson(){
    const r = await fetch("data/products.json", {cache:"no-store"});
    if(!r.ok) throw new Error("HTTP " + r.status);
    const arr = await r.json();
    if(!Array.isArray(arr)) throw new Error("not an array");
    return arr;
  }

  let cache = null;
  const LS_EXTRA = "sc_extra", LS_DEL = "sc_deleted";
  function readJson(k){ try{ return JSON.parse(localStorage.getItem(k)||"[]"); }catch(e){ return []; } }

  /* Применить локальные изменения каталога (добавленные/удалённые товары) к базовому списку */
  window.applyCatalog = function(base){
    const extra = readJson(LS_EXTRA);
    const del = readJson(LS_DEL);
    PRODUCTS = base.concat(extra).filter(p => !del.includes(p.id));
    CATEGORIES = ["Все", ...new Set(PRODUCTS.map(p=>p.cat))];
    document.dispatchEvent(new Event("products-ready"));
    return PRODUCTS;
  };
  window.addProduct = function(p){
    const extra = readJson(LS_EXTRA);
    extra.push(Object.assign({id: Date.now()}, p));
    localStorage.setItem(LS_EXTRA, JSON.stringify(extra));
    window.applyCatalog(window.BASE_PRODUCTS);
  };
  window.deleteProduct = function(id){
    const del = readJson(LS_DEL);
    if(!del.includes(id)) del.push(id);
    localStorage.setItem(LS_DEL, JSON.stringify(del));
    window.applyCatalog(window.BASE_PRODUCTS);
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