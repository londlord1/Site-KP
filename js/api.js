/* ===== Бэкенд через DummyJSON API (товары грузятся с сервера) ===== */
(function(){
  const LOCAL = (typeof PRODUCTS !== "undefined") ? PRODUCTS : [];

  const ICON = {
    smartphones:"📱", laptops:"💻", fragrances:"🧴", skincare:"🧴", groceries:"🛒",
    "home-decoration":"🏠", furniture:"🛋️", tops:"👕", "womens-dresses":"👗",
    "womens-shoes":"👠", "mens-shirts":"👔", "mens-shoes":"👞", "mens-watches":"⌚",
    "womens-watches":"⌚", "womens-bags":"👜", "womens-jewellery":"💍", sunglasses:"🕶️",
    automotive:"🚗", motorcycle:"🏍️", lighting:"💡"
  };
  const iconFor = c => ICON[(c||"").toLowerCase()] || "📦";

  function mapItem(it){
    const price = it.price || 0;
    const disc = it.discountPercentage || 0;
    const original = disc>0 ? Math.round(price/(1 - disc/100)) : price;
    return {
      id: it.id, name: it.title, cat: it.category || "Разное",
      price: Math.round(price), oldPrice: disc>0 ? original : null,
      icon: iconFor(it.category), badge: null,
      img: it.thumbnail || (it.images && it.images[0]) || null,
      desc: it.description || "", stock: it.stock || 0, rating: it.rating || 0,
    };
  }

  async function fetchFromApi(){
    const ctrl = new AbortController();
    const timer = setTimeout(()=>ctrl.abort(), 6000);   // таймаут: не даём каталогу висеть
    try{
      const r = await fetch("https://dummyjson.com/products?limit=0", {signal: ctrl.signal});
      if(!r.ok) throw new Error("API " + r.status);
      const j = await r.json();
      return (j.products || []).map(mapItem);
    } finally { clearTimeout(timer); }
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
        try { base = await fetchFromApi(); }
        catch(e){ base = LOCAL; }               // резерв: локальные товары
        window.BASE_PRODUCTS = base.slice();
        return window.applyCatalog(base);
      })();
    }
    return cache.then((res)=>{ document.dispatchEvent(new Event("products-ready")); return res; });
  };
})();