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
    const r = await fetch("https://dummyjson.com/products?limit=0");
    if(!r.ok) throw new Error("API " + r.status);
    const j = await r.json();
    return (j.products || []).map(mapItem);
  }

  let cache = null;
  window.loadProducts = function(){
    if(!cache){
      cache = (async()=>{
        try { PRODUCTS = await fetchFromApi(); }
        catch(e){ PRODUCTS = LOCAL; }              // резерв: локальные товары
        CATEGORIES = ["Все", ...new Set(PRODUCTS.map(p=>p.cat))];
        return PRODUCTS;
      })();
    }
    return cache.then((res)=>{ document.dispatchEvent(new Event("products-ready")); return res; });
  };
})();