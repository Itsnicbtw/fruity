(() => {
"use strict";

const app = document.getElementById("app");
const state = { site:{}, products:[] };

const CATEGORY_ART = {
  "hoodies":"https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=700&q=88",
  "t-shirts":"https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=700&q=88",
  "caps":"https://images.unsplash.com/photo-1588850561407-ed78c282e89b?auto=format&fit=crop&w=700&q=88",
  "accessories":"https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=700&q=88",
  "all":"https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=700&q=88"
};
const CATS = [
  ["hoodies","HOODIES"],["t-shirts","T-SHIRTS"],["caps","CAPS"],
  ["accessories","ACCESSORIES"],["all","ALL MERCH"]
];

const icons = {
  account:`<svg viewBox="0 0 24 24"><circle cx="12" cy="7" r="4"/><path d="M4.5 21a7.5 7.5 0 0 1 15 0"/></svg>`,
  cart:`<svg viewBox="0 0 24 24"><path d="M2.8 4h2.7l2.2 10.2a2 2 0 0 0 2 1.6h8a2 2 0 0 0 2-1.6L21 7H6.1"/><circle cx="10" cy="20" r="1.3"/><circle cx="18" cy="20" r="1.3"/></svg>`
};

function esc(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
function safe(v){const s=String(v||"").trim();if(s.startsWith("/uploads/"))return s;try{const u=new URL(s,location.origin);return ["http:","https:"].includes(u.protocol)?u.href:""}catch{return""}}
function count(cat){return cat==="all"?state.products.length:state.products.filter(p=>p.category===cat).length}
function money(p){return `${{USD:"$",GBP:"£",EUR:"€"}[p.currency]||""}${Number(p.price||0).toFixed(2)} ${esc(p.currency||"USD")}`}
function logo(){
  const u=safe(state.site.brand?.logoUrl);
  return u?`<img class="logo-img" src="${esc(u)}" alt="Fruity">`:`<span class="logo-text">${esc(state.site.brand?.name||"frt.")}</span>`;
}

function header(active=""){
  return `<header class="header">
    <div class="header-top">
      <nav class="header-left"><a href="/" data-link>HOME</a><a href="/about" data-link>ABOUT</a></nav>
      <a class="logo-link" href="/" data-link>${logo()}</a>
      <div class="header-actions">
        <a class="icon" href="/account" data-link aria-label="Account">${icons.account}</a>
        <a class="icon" href="/merch" data-link aria-label="Cart">${icons.cart}<span class="cart-badge">0</span></a>
      </div>
    </div>
    <nav class="header-tabs">
      ${CATS.map(([k,l])=>`<a href="${k==="all"?"/merch":"/merch/"+k}" data-link class="${active===k?"active":""}">${l}</a>`).join("")}
    </nav>
  </header>`;
}

function hero(rounded=false){
  const bg=safe(state.site.home?.heroImage)||"https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1800&q=88";
  return `<section class="hero ${rounded?"rounded":""}" style="background-image:url('${esc(bg)}')">
    <div class="hero-left"><div class="hero-small">DROP ALL</div><div class="hero-word">frt.</div><div class="hero-tag">FRUITFUL POWER.</div></div>
    <div class="hero-center">frt.</div>
    <div class="hero-bottom"><span>⌁</span><span>0:05 / 0:12&nbsp;&nbsp;&nbsp;❚❚</span></div>
    <span class="hero-down"></span>
  </section>`;
}

function footer(){
  return `<footer class="fruit-footer">
    <span class="leaf"></span><span class="fruit lemon"></span><span class="fruit lime"></span><span class="fruit grapefruit"></span><span class="fruit berry"></span>
    <div class="footer-grid">
      <div><div class="footer-logo">${logo()}</div><div class="footer-tag">DROP ALL. frt.</div><div class="socials"><span>◎</span><span>𝕏</span><span>♪</span><span>▶</span></div><div class="copyright">${esc(state.site.footer?.copyright||"© 2026 Fruity Team")}</div></div>
      <div class="footer-col"><h4>DISCOVER</h4><a href="/about" data-link>FAQ</a><a href="/" data-link>Blog</a><a href="/about" data-link>About</a></div>
      <div class="footer-col"><h4>SUPPORT</h4><a href="/about" data-link>Contact</a><a href="/about" data-link>Shipping Info</a><a href="/about" data-link>Terms of Service</a></div>
      <div class="footer-col"><h4>LEGAL</h4><a href="/about" data-link>FAQ</a><a href="/about" data-link>Refund Policy</a><a href="/about" data-link>Privacy Policy</a></div>
      <div class="payments"><span class="payment">VISA</span><span class="payment">MC</span><span class="payment">PayPal</span><span class="payment">Pay</span><span class="payment">G Pay</span></div>
    </div>
  </footer>`;
}

function categoryCards(){
  return CATS.map(([k,l])=>`<a class="category-card" href="${k==="all"?"/merch":"/merch/"+k}" data-link>
    <img src="${CATEGORY_ART[k]}" alt="">
    <div class="category-name">${l}</div><div class="category-count">${count(k)} ${count(k)===1?"ITEM":"ITEMS"}</div><div class="category-arrow">→</div>
  </a>`).join("");
}

function sectionHead(kicker,title,extra=""){
  return `<div class="section-head"><div><div class="kicker">${kicker}</div><h2 class="script-title">${title}</h2></div>${extra}</div>`;
}

function emptyProducts(){
  return `<div class="empty-products"><div><h3>NOTHING HAS DROPPED YET.</h3><p>The product catalogue is intentionally empty until real Fruity products are added through admin.</p></div></div>`;
}

function productCard(p){
  const image=safe(p.image);
  return `<a class="product-card" href="/merch/${encodeURIComponent(p.category)}/${encodeURIComponent(p.slug)}" data-link>
    <div class="product-image">${image?`<img src="${esc(image)}" alt="${esc(p.name)}">`:`<div class="product-placeholder">frt.</div>`}</div>
    <div class="product-body"><span class="product-badge">${esc(p.badge||"FRUITFUL ESSENTIALS")}</span><div class="product-name">${esc(p.name)}</div>
      <div class="product-footer"><div><div class="product-price">${money(p)}</div>${(p.colors||[]).length?`<div class="swatches">${p.colors.slice(0,7).map(c=>`<span class="swatch" style="background:${esc(c)}"></span>`).join("")}</div>`:""}</div><span class="mini-cart">${icons.cart}</span></div>
    </div>
  </a>`;
}

function categoryCarousel(){
  return `<section class="directory-categories">
    ${sectionHead("BROWSE CATEGORIES","FIND YOUR FRUITY.",`<div class="carousel-buttons"><button class="round-btn" data-prev>←</button><button class="round-btn" data-next>→</button></div>`)}
    <div class="category-window"><div class="category-track" data-track>${categoryCards()}</div></div>
  </section>`;
}

function renderDirectory(){
  // /merch is deliberately only the merch directory. Product listings live under /merch/{type}.
  return `${header("all")}${hero(true)}<main class="directory-main">${categoryCarousel()}</main>${footer()}`;
}

function renderHome(){
  const a=state.site.about||{};
  return `${header("")}${hero(false)}<main class="home-main">
    <section class="home-story">
      <article class="home-panel"><div class="kicker">${esc(a.eyebrow||"ABOUT FRUITY")}</div><h1>${esc(a.title||"FRUITFUL, NOT FORMAL.")}</h1><p>${esc(a.intro||"")}</p><a class="view-all" href="/about" data-link>ABOUT FRUITY →</a></article>
      <article class="home-panel yellow"><div class="kicker">FRUITFUL POWER.</div><h1>DROP ALL. frt.</h1><p>${esc(a.secondary||"")}</p><a class="view-all" href="/merch" data-link>SHOP MERCH →</a></article>
    </section>
  </main>${footer()}`;
}

function renderAbout(){
  const a=state.site.about||{};
  return `${header("")}<main>
    <section class="about-hero"><div class="about-hero-copy"><div class="kicker">${esc(a.eyebrow||"ABOUT FRUITY")}</div><h1>${esc(a.title||"FRUITFUL, NOT FORMAL.")}</h1><p>${esc(a.intro||"")}</p></div><div class="about-art"></div></section>
    <div class="about-main"><div class="about-grid"><article class="about-panel"><div class="kicker">THE STORY</div><h1>WHY FRUITY?</h1><p>${esc(a.body||"")}</p></article><article class="about-panel dark"><div class="kicker">NEXT</div><h1>STILL GROWING.</h1><p>${esc(a.secondary||"")}</p></article></div></div>
  </main>${footer()}`;
}

function renderAccount(){
  return `${header("")}<main class="account-coming"><section class="account-card"><div><div class="kicker">ACCOUNT</div><h1>STILL RIPENING.</h1><p>Fruity accounts are coming soon.</p><br><a class="view-all" href="/merch" data-link>BACK TO MERCH →</a></div></section></main>${footer()}`;
}

function renderCategory(cat){
  if(cat==="all")return renderDirectory();
  const label=CATS.find(c=>c[0]===cat)?.[1]; if(!label)return notFound();
  const items=state.products.filter(p=>p.category===cat);
  return `${header(cat)}${hero(true)}<main><section class="category-heading"><div class="kicker">MERCH</div><h1>${label}</h1><p>${items.length} ${items.length===1?"product":"products"} available.</p></section><section class="category-products">${items.length?`<div class="product-grid">${items.map(productCard).join("")}</div>`:emptyProducts()}</section></main>${footer()}`;
}

function renderProduct(p){
  const gallery=[p.image,...(p.gallery||[])].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i).slice(0,5);
  while(gallery.length<5)gallery.push("");
  const colors=(p.colors||[]).length?p.colors:["#050505"];
  const sizes=(p.sizes||[]).length?p.sizes:["ONE SIZE"];
  const image=safe(p.image);
  return `${header(p.category)}${hero(false)}<main class="product-main">
    <section class="purchase">
      <div>
        <div class="media-main">${image?`<img id="main-image" src="${esc(image)}" alt="${esc(p.name)}">`:`<div class="media-placeholder" id="main-image">frt.</div>`}<div class="media-status">AUTOPLAYING</div><div class="media-time">0:04 / 0:15</div><div class="media-progress"><span></span></div></div>
        <div class="thumbs">${gallery.map((u,i)=>u?`<button class="thumb ${i===0?"active":""}" data-thumb="${esc(safe(u))}"><img src="${esc(safe(u))}" alt=""></button>`:`<button class="thumb" disabled><div class="thumb-placeholder">frt.</div></button>`).join("")}</div>
      </div>
      <aside class="product-info"><span class="product-badge">${esc(p.badge||"FRUITFUL ESSENTIALS")}</span><h1 class="product-title">${esc(p.name)}</h1><div class="big-price">${money(p)}</div><div class="tax">Taxes included. <u>Shipping</u> calculated at checkout.</div>
        <div class="option"><div class="option-label">COLOR</div><div class="colors">${colors.map((c,i)=>`<button class="color ${i===0?"active":""}" style="background:${esc(c)}"></button>`).join("")}</div></div>
        <div class="option"><div class="option-label">SIZE</div><div class="sizes">${sizes.map((s,i)=>`<button class="size ${i===0?"active":""}">${esc(s)}</button>`).join("")}</div></div>
        <div class="size-guide">⌕ &nbsp; Size guide</div>
        <div class="option"><div class="option-label">QUANTITY</div><div class="quantity"><button data-minus>−</button><span data-qty>1</span><button data-plus>+</button></div></div>
        <div class="actions"><button class="action dark">CUSTOMISE &nbsp; ✦</button><button class="action">ADD TO CART &nbsp; 🛒</button><button class="action buy">BUY NOW &nbsp; ⚡</button></div>
      </aside>
    </section>
    <section class="description"><article class="description-copy"><h2>DESCRIPTION</h2><p>${esc(p.description||"Product description coming soon.")}</p><p>Please check the size guide before purchasing.</p></article><div class="description-image">${image?`<img src="${esc(image)}" alt="${esc(p.name)}">`:`<div class="media-placeholder">frt.</div>`}</div></section>
  </main>${footer()}`;
}

function notFound(){return `${header("")}<main class="account-coming"><section class="account-card"><div><div class="kicker">404</div><h1>THAT FRUIT FELL OFF.</h1><p>This page does not exist.</p></div></section></main>${footer()}`}

function bind(){
  document.querySelectorAll("[data-link]").forEach(a=>a.addEventListener("click",e=>{if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;const u=new URL(a.href,location.origin);if(u.origin!==location.origin)return;e.preventDefault();history.pushState({},"",u.pathname);route();scrollTo(0,0)}));
  const t=document.querySelector("[data-track]");document.querySelector("[data-prev]")?.addEventListener("click",()=>t?.scrollBy({left:-192,behavior:"smooth"}));document.querySelector("[data-next]")?.addEventListener("click",()=>t?.scrollBy({left:192,behavior:"smooth"}));
  document.querySelectorAll("[data-thumb]").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll("[data-thumb]").forEach(x=>x.classList.remove("active"));b.classList.add("active");const m=document.getElementById("main-image");if(m?.tagName==="IMG")m.src=b.dataset.thumb}));
  document.querySelectorAll(".color").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".color").forEach(x=>x.classList.remove("active"));b.classList.add("active")}));
  document.querySelectorAll(".size").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".size").forEach(x=>x.classList.remove("active"));b.classList.add("active")}));
  let q=1;const qe=document.querySelector("[data-qty]");document.querySelector("[data-minus]")?.addEventListener("click",()=>{q=Math.max(1,q-1);qe.textContent=q});document.querySelector("[data-plus]")?.addEventListener("click",()=>{q++;qe.textContent=q});
}

function route(){
  const p=location.pathname.replace(/\/+$/ ,"")||"/"; let html;
  if(p==="/")html=renderHome();
  else if(p==="/about")html=renderAbout();
  else if(p==="/account")html=renderAccount();
  else if(p==="/merch")html=renderDirectory();
  else if(p.startsWith("/merch/")){
    const parts=p.split("/").filter(Boolean);
    const category=decodeURIComponent(parts[1]||"");
    if(parts.length>=3){
      const slug=decodeURIComponent(parts.slice(2).join("/"));
      const prod=state.products.find(x=>x.category===category&&x.slug===slug);
      html=prod?renderProduct(prod):notFound();
    }else{
      html=renderCategory(category);
    }
  }
  // Legacy product URLs still render, but generated URLs now live under /merch/{type}/{slug}.
  else if(p.startsWith("/product/")){const slug=decodeURIComponent(p.split("/")[2]||"");const prod=state.products.find(x=>x.slug===slug);html=prod?renderProduct(prod):notFound()}
  else html=notFound();
  app.innerHTML=html;bind();
}

async function init(){
  try{
    const [s,p]=await Promise.all([fetch("/api/site",{cache:"no-store"}),fetch("/api/products",{cache:"no-store"})]);
    state.site=await s.json();state.products=p.ok?await p.json():[];route();
  }catch(e){console.error(e);app.innerHTML="<div class='boot'>frt.</div>"}
}
addEventListener("popstate",route);init();
})();