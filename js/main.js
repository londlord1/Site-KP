/* ============ SoundCraft — общая логика: шапка, корзина, авторизация ============ */

/* ----- Шапка и подвал (вставляются на все страницы) ----- */
const NAV_LINKS = [
  ["index.html","Главная"],
  ["catalog.html","Каталог"],
  ["contacts.html","Контакты"],
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
    <div class="header__right">
      <a class="cart-btn" href="cart.html">🛒 Корзина <span class="cart-count" id="cartCount"></span></a>
      <span class="user-chip" id="userChip"></span>
    </div>
  </div></header>`;
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
        <li><a href="contacts.html">Контакты</a></li>
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

/* ----- Пользователь (localStorage) ----- */
function getUsers(){ try{ return JSON.parse(localStorage.getItem("sc_users")||"[]"); }catch(e){ return []; } }
function setUsers(u){ localStorage.setItem("sc_users", JSON.stringify(u)); }
function getCurrentUser(){ try{ return JSON.parse(localStorage.getItem("sc_user")||"null"); }catch(e){ return null; } }
function setCurrentUser(u){ u ? localStorage.setItem("sc_user", JSON.stringify(u)) : localStorage.removeItem("sc_user"); renderUserChip(); }

function renderUserChip(){
  const chip = document.getElementById("userChip");
  if(!chip) return;
  const u = getCurrentUser();
  if(u){
    chip.innerHTML = `👤 <span class="user-name">${escapeHtml(u.name||u.email)}</span>
      <button class="btn-logout" onclick="logout()">Выход</button>`;
  } else {
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
}