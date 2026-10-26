/* ============ SoundCraft — общая логика: шапка, корзина, авторизация ============ */

/* ----- Шапка и подвал (вставляются на все страницы) ----- */
const NAV_LINKS = [
  ["index.html","Главная"],
  ["catalog.html","Каталог"],
];

function navHtml(active){
  return NAV_LINKS.map(([href,label]) =>
    `<a href="${href}" class="${active===href?"active":""}">${label}</a>`).join("");
}

function headerHtml(active){
  return `
  <header class="header"><div class="container header__row">
    <a class="logo" href="index.html">Sound<b>Craft</b></a>
    <nav class="nav">${navHtml(active)}</nav>
    <div class="search" id="globalSearch">
      <div class="search__row">
        <input type="text" id="gsInput" placeholder="Поиск: гитара, микрофон..." autocomplete="off">
        <select id="gsCat"><option value="Все">Категория</option>${CATEGORIES.map(c=>`<option value="${c}">${c}</option>`).join("")}</select>
      </div>
      <div class="search-results" id="gsResults"></div>
    </div>
    <div class="header__right">
      <a class="cart-btn" href="cart.html">🛒 Корзина <span class="cart-count" id="cartCount"></span></a>
      <span class="user-chip" id="userChip"></span>
    </div>
  </div></header>`;
}

/* ----- Глобальный поиск: 5 самых подходящих товаров (показывается, когда строка поиска в фокусе) ----- */
function initSearch(){
  const input = document.getElementById("gsInput");
  const catSel = document.getElementById("gsCat");
  const box = document.getElementById("gsResults");
  if(!input || !box) return;
  let focused = false;

  function run(){
    if(!focused){ box.classList.remove("open"); return; }
    const q = input.value.trim().toLowerCase();
    const cat = catSel.value;
    const list = (Array.isArray(window.PRODUCTS)?window.PRODUCTS:PRODUCTS).filter(p=>{
      const okCat = cat==="Все" || p.cat===cat;
      const okQ = !q || p.name.toLowerCase().includes(q) || p.cat.toLowerCase().includes(q);
      return okCat && okQ;
    }).slice(0,5);

    if(!q && cat==="Все"){ box.classList.remove("open"); box.innerHTML=""; return; }

    box.innerHTML = `<div class="sr-head">Подходящие товары</div>` +
      (list.length ? list.map(p=>`<a class="sr-item" href="product.html?id=${p.id}">
        <div class="sr-item__ic">${p.icon}</div>
        <span class="sr-item__name">${escapeHtml(p.name)}</span>
        <span class="sr-item__price">${fmtPrice(p.price)}</span>
      </a>`).join("")
      : `<div class="sr-empty">Ничего не найдено по запросу</div>`);
    box.classList.add("open");
  }

  input.addEventListener("focus", ()=>{ focused=true; run(); });
  input.addEventListener("input", run);
  catSel.addEventListener("focus", ()=>{ focused=true; run(); });
  catSel.addEventListener("change", run);
  input.addEventListener("blur", ()=>{ setTimeout(()=>{ focused=false; box.classList.remove("open"); }, 150); });
  catSel.addEventListener("blur", ()=>{ setTimeout(()=>{ focused=false; box.classList.remove("open"); }, 150); });
  document.addEventListener("click", e=>{
    if(!document.getElementById("globalSearch").contains(e.target)) box.classList.remove("open");
  });
}

function footerHtml(){
  return `
  <footer class="footer">
    <div class="container footer__row">
      <div>
        <a class="logo" href="index.html" style="color:#fff">Sound<b>Craft</b></a>
        <p style="font-size:14px;line-height:1.6;max-width:280px">Магазин музыкальных инструментов и звукового оборудования. Поможем выбрать технику для сцены и студии.</p>
      </div>
      <div>
        <h4>Магазин</h4>
        <ul><li><a href="catalog.html">Каталог</a></li>
        <li><a href="cart.html">Корзина</a></li>
        <li><a href="checkout.html">Оформление заказа</a></li></ul>
      </div>
      <div>
        <h4>Покупателям</h4>
        <ul><li><a href="auth.html">Вход и регистрация</a></li>
        <li><a href="contacts.html#feedback">Обратная связь</a></li></ul>
      </div>
      <div>
        <h4>Связь с нами</h4>
        <ul><li>8-800-123-45-67</li><li>shop@soundcraft.ru</li>
        <li>г. Юрга, ул. Ленина, 12</li></ul>
      </div>
    </div>
    <div class="footer__bottom">© 2026 SoundCraft. Курсовой проект: разработка клиентской части интернет-магазина</div>
  </footer>`;
}

/* ----- Корзина (localStorage) ----- */
function getCart(){ try{ return JSON.parse(localStorage.getItem("sc_cart")||"[]"); }catch(e){ return []; } }
function setCart(c){ localStorage.setItem("sc_cart", JSON.stringify(c)); renderCartCount(); }
function renderCartCount(){
  const el = document.getElementById("cartCount");
  if(!el) return;
  const total = getCart().reduce((s,i)=>s+i.qty,0);
  el.textContent = total ? String(total) : "";
}
function addToCart(id, qty){
  const n = qty||1, cart = getCart(), f = cart.find(i=>i.id===id);
  if(f) f.qty += n; else cart.push({id, qty:n});
  setCart(cart);
  toast("Товар добавлен в корзину");
}

/* Кнопка «В корзину» -> «В корзине ✓» со ссылкой на корзину */
window.buyToggle = function(btn){
  addToCart(parseInt(btn.dataset.id), 1);
  btn.classList.add("btn--bought");
  btn.textContent = "";
  btn.title = "Перейти в корзину";
  btn.onclick = () => { location.href = "cart.html"; };
};
function discountOf(p){ return p.oldPrice ? Math.max(1, Math.round((1 - p.price/p.oldPrice) * 100)) : 0; }

/* Бейджи на карточке: скидка всегда зелёная, «Хит» остаётся красным, без дублей процента */
function badgesHtml(p){
  const disc = discountOf(p);
  const isPercentBadge = p.badge && /^-\s?\d+\s?%$/.test(String(p.badge).trim());
  let h = '<span class="badges">';
  if(p.badge){
    const green = isPercentBadge ? ' style="background:var(--ok)"' : "";
    h += `<span class="card__badge"${green}>${escapeHtml(p.badge)}</span>`;
  }
  if(disc && !isPercentBadge) h += `<span class="card__badge" style="background:var(--ok)">−${disc}%</span>`;
  h += '</span>';
  return h;
}

/* Кнопка покупа: отражает фактическое состояние корзины (не сбрасывается при перезагрузке/сбросе) */
function isInCart(id){ return getCart().some(i=>i.id===id); }
function buyButton(id){
  return isInCart(id)
    ? `<button class="btn--buy btn--bought" data-id="${id}" onclick="location.href='cart.html'" title="Перейти в корзину"></button>`
    : `<button class="btn--buy" data-id="${id}" onclick="buyToggle(this)">В корзину</button>`;
}

/* ----- Пользователь (localStorage) ----- */
function getUsers(){ try{ return JSON.parse(localStorage.getItem("sc_users")||"[]"); }catch(e){ return []; } }
function setUsers(u){ localStorage.setItem("sc_users", JSON.stringify(u)); }
function getCurrentUser(){ try{ return JSON.parse(localStorage.getItem("sc_user")||"null"); }catch(e){ return null; } }
function setCurrentUser(u){ u ? localStorage.setItem("sc_user", JSON.stringify(u)) : localStorage.removeItem("sc_user"); renderUserChip(); }

function renderUserChip(){
  const chip = document.getElementById("userChip");
  if(!chip) return;
  const u = getCurrentUser();
  if(u && (u.name || u.email)){
    chip.innerHTML = `👤 <span class="user-name">${escapeHtml(u.name||u.email)}</span>
      <button class="btn-logout" onclick="logout()">Выход</button>`;
  } else {
    if(u) setCurrentUser(null); // некорректная запись — сбрасываем
    chip.innerHTML = `<a href="auth.html" style="color:#fff;">🔑 Войти</a>`;
  }
}
window.logout = function(){ setCurrentUser(null); toast("Вы вышли из аккаунта"); };

/* ----- Утилиты ----- */
function escapeHtml(s){
  return String(s||"").replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
}
function fmtPrice(p){ return String(p).replace(/\B(?=(\d{3})+(?!\d))/g," ") + " ₽"; }
function moneyToNum(s){ return parseFloat(String(s).replace(/[^\d.]/g,""))||0; }

function toast(msg){
  let t = document.getElementById("toast");
  if(!t){ t=document.createElement("div"); t.id="toast"; document.body.appendChild(t);
    t.style.cssText="position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1a1d29;color:#fff;padding:13px 20px;border-radius:12px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.3);z-index:999;opacity:0;transition:.25s;";
  }
  t.textContent = msg; t.style.opacity="1";
  clearTimeout(t._h);
  t._h = setTimeout(()=>{ t.style.opacity="0"; }, 2200);
}

/* ----- Рендер страницы ----- */
function renderPage(active){
  const bdy = document.body;
  const header = document.createElement("div");
  header.innerHTML = headerHtml(active);
  bdy.insertBefore(header.firstElementChild, bdy.firstElementChild);
  bdy.insertAdjacentHTML("beforeend", footerHtml());
  renderCartCount();
  renderUserChip();
  initSearch();
}