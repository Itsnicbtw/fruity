(() => {
"use strict";

const root=document.getElementById("admin-root");
let site={},products=[];

function esc(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}

function loginView(error=""){
  root.innerHTML=`<main class="admin-login-wrap"><section class="admin-login"><div class="logo-text">frt.</div><h1>ADMIN LOGIN</h1><p>This login is backed by <code>ADMIN_USERNAME</code>, <code>ADMIN_PASSWORD</code> and <code>SESSION_SECRET</code> from the server's <code>.env</code>. Nothing is hard-coded in the browser.</p><form id="login"><input id="username" autocomplete="username" placeholder="Username" required><input id="password" type="password" autocomplete="current-password" placeholder="Password" required><button>LOGIN</button><div class="admin-login-error">${esc(error)}</div></form></section></main>`;
  document.getElementById("login").addEventListener("submit",async e=>{e.preventDefault();const r=await fetch("/api/admin/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({username:document.getElementById("username").value,password:document.getElementById("password").value})});const b=await r.json().catch(()=>({}));if(!r.ok)return loginView(b.error||"Login failed.");await loadAdmin()});
}

function productRows(){
  if(!products.length)return `<div class="admin-product"><div><strong>No products yet</strong><small>The storefront is intentionally empty.</small></div></div>`;
  return products.map(p=>`<div class="admin-product"><div><strong>${esc(p.name)}</strong><small>${esc(p.category)} · ${esc(p.currency)} ${Number(p.price).toFixed(2)}</small></div><button class="delete" data-delete="${esc(p.slug)}">DELETE</button></div>`).join("");
}

function adminView(){
  const a=site.about||{};const logo=site.brand?.logoUrl;
  root.innerHTML=`<main class="admin-shell">
    <header class="admin-top"><div><div class="kicker">FRUITY CONTROL ROOM</div><h1>ADMIN</h1></div><button class="admin-logout" id="logout">LOG OUT</button></header>
    <div class="admin-grid">
      <section class="admin-panel"><div class="kicker">BRANDING</div><h2>Fruity logo</h2><p>Upload the real logo. It replaces the temporary text mark across the storefront.</p><div class="admin-logo-preview">${logo?`<img src="${esc(logo)}">`:`<span class="logo-text">frt.</span>`}</div><form class="admin-form" id="logo-form"><input id="logo-file" type="file" accept=".png,.jpg,.jpeg,.webp,.svg,image/*" required><button class="admin-button">UPLOAD LOGO</button></form></section>
      <section class="admin-panel"><div class="kicker">SHARED CONTENT</div><h2>About → Home</h2><p>The About content below also feeds the story section on the home page automatically.</p><div id="message" class="admin-message"></div></section>
      <section class="admin-panel wide"><div class="kicker">ABOUT PAGE</div><h2>Content</h2><form class="admin-form" id="about-form"><div class="admin-fields">
        <label>Eyebrow<input id="a-eyebrow" value="${esc(a.eyebrow||"")}"></label><label>Title<input id="a-title" value="${esc(a.title||"")}"></label>
        <label class="wide">Intro<textarea id="a-intro" rows="4">${esc(a.intro||"")}</textarea></label>
        <label class="wide">Main story<textarea id="a-body" rows="7">${esc(a.body||"")}</textarea></label>
        <label class="wide">Secondary / home story<textarea id="a-secondary" rows="5">${esc(a.secondary||"")}</textarea></label>
      </div><button class="admin-button yellow">SAVE ABOUT CONTENT</button></form></section>
      <section class="admin-panel wide"><div class="kicker">MERCH</div><h2>Products</h2><p>Starts empty. Add only real products when they are ready.</p><form class="admin-form" id="product-form"><div class="admin-fields">
        <label>Name<input id="p-name" required></label><label>Slug<input id="p-slug"></label>
        <label>Category<select id="p-category"><option value="hoodies">Hoodies</option><option value="t-shirts">T-shirts</option><option value="caps">Caps</option><option value="accessories">Accessories</option></select></label>
        <label>Price<input id="p-price" type="number" step="0.01" min="0" required></label>
        <label>Currency<select id="p-currency"><option>USD</option><option>GBP</option><option>EUR</option></select></label><label>Badge<input id="p-badge" value="FRUITFUL ESSENTIALS"></label>
        <label class="wide">Main image URL<input id="p-image"></label><label class="wide">Gallery URLs, one per line<textarea id="p-gallery" rows="4"></textarea></label>
        <label>Colours, comma separated hex<input id="p-colors" placeholder="#000000, #f6b900"></label><label>Sizes, comma separated<input id="p-sizes" placeholder="XS, S, M, L, XL"></label>
        <label class="wide">Description<textarea id="p-description" rows="5"></textarea></label>
      </div><button class="admin-button">ADD PRODUCT</button></form><div class="admin-products" id="product-list">${productRows()}</div></section>
    </div>
  </main>`;
  bindAdmin();
}

async function refreshProducts(){const r=await fetch("/api/products",{cache:"no-store"});products=r.ok?await r.json():[];const el=document.getElementById("product-list");if(el)el.innerHTML=productRows();bindDeletes()}

function msg(t,bad=false){const e=document.getElementById("message");if(e){e.textContent=t;e.style.color=bad?"#9a2222":"#277526"}}

function bindDeletes(){document.querySelectorAll("[data-delete]").forEach(b=>b.addEventListener("click",async()=>{if(!confirm(`Delete ${b.dataset.delete}?`))return;const r=await fetch(`/api/admin/products/${encodeURIComponent(b.dataset.delete)}`,{method:"DELETE"});const j=await r.json().catch(()=>({}));if(!r.ok)return msg(j.error||"Delete failed.",true);await refreshProducts();msg("Product deleted.")}))}

function bindAdmin(){
  document.getElementById("logout").addEventListener("click",async()=>{await fetch("/api/admin/logout",{method:"POST"});loginView()});
  document.getElementById("about-form").addEventListener("submit",async e=>{e.preventDefault();const r=await fetch("/api/admin/about",{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({eyebrow:document.getElementById("a-eyebrow").value,title:document.getElementById("a-title").value,intro:document.getElementById("a-intro").value,body:document.getElementById("a-body").value,secondary:document.getElementById("a-secondary").value})});const j=await r.json().catch(()=>({}));if(!r.ok)return msg(j.error||"Save failed.",true);site.about=j;msg("About saved. Home story now uses the same updated content.")});
  document.getElementById("logo-form").addEventListener("submit",async e=>{e.preventDefault();const file=document.getElementById("logo-file").files[0];if(!file)return;const fd=new FormData();fd.append("logo",file);const r=await fetch("/api/admin/logo",{method:"POST",body:fd});const j=await r.json().catch(()=>({}));if(!r.ok)return msg(j.error||"Upload failed.",true);site.brand.logoUrl=j.logoUrl;adminView();msg("Logo uploaded.")});
  const name=document.getElementById("p-name"),slug=document.getElementById("p-slug");name.addEventListener("input",()=>{if(slug.dataset.touched)return;slug.value=name.value.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"")});slug.addEventListener("input",()=>slug.dataset.touched="1");
  document.getElementById("product-form").addEventListener("submit",async e=>{e.preventDefault();const body={name:name.value,slug:slug.value,category:document.getElementById("p-category").value,price:Number(document.getElementById("p-price").value),currency:document.getElementById("p-currency").value,badge:document.getElementById("p-badge").value,image:document.getElementById("p-image").value,gallery:document.getElementById("p-gallery").value.split("\n").map(x=>x.trim()).filter(Boolean),colors:document.getElementById("p-colors").value.split(",").map(x=>x.trim()).filter(Boolean),sizes:document.getElementById("p-sizes").value.split(",").map(x=>x.trim()).filter(Boolean),description:document.getElementById("p-description").value};const r=await fetch("/api/admin/products",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});const j=await r.json().catch(()=>({}));if(!r.ok)return msg(j.error||"Could not add product.",true);e.target.reset();document.getElementById("p-badge").value="FRUITFUL ESSENTIALS";slug.dataset.touched="";await refreshProducts();msg("Product added.")});
  bindDeletes();
}

async function loadAdmin(){
  const [s,p]=await Promise.all([fetch("/api/site",{cache:"no-store"}),fetch("/api/products",{cache:"no-store"})]);site=await s.json();products=p.ok?await p.json():[];adminView();
}

(async()=>{const r=await fetch("/api/admin/session",{cache:"no-store"});const s=await r.json().catch(()=>({}));s.authenticated?loadAdmin():loginView()})();
})();