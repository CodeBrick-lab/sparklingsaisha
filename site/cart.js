// cart.js - cart, wishlist, account persisted in localStorage
const CART_KEY = 'static_shop_cart_v1';
const WISHLIST_KEY = 'static_shop_wishlist_v1';
const ACCOUNT_KEY = 'static_shop_account_v1';

function getCart(){ try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch(e){ return []; } }
function saveCart(cart){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
function getWishlist(){ try { return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]'); } catch(e){ return []; } }
function saveWishlist(w){ localStorage.setItem(WISHLIST_KEY, JSON.stringify(w)); }
function getAccount(){ try { return JSON.parse(localStorage.getItem(ACCOUNT_KEY) || '{}'); } catch(e){ return {}; } }
function saveAccount(a){ localStorage.setItem(ACCOUNT_KEY, JSON.stringify(a)); }

function addToCartById(id, qty=1){
  const cart = getCart();
  const item = cart.find(i=>i.id==id);
  if(item) item.qty += qty;
  else cart.push({id, qty});
  saveCart(cart);
  updateCartCount();
  renderCartItems();
}

function removeFromCart(id){
  let cart = getCart();
  cart = cart.filter(i=> i.id != id);
  saveCart(cart);
  updateCartCount();
  renderCartItems();
}

function updateQty(id, qty){
  const cart = getCart();
  const item = cart.find(i=>i.id==id);
  if(!item) return;
  item.qty = qty;
  if(item.qty <= 0) removeFromCart(id);
  else saveCart(cart);
  updateCartCount();
  renderCartItems();
}

async function renderCartItems(){
  const container = document.getElementById('cart-items');
  if(!container) return;
  container.innerHTML = '';
  const cart = getCart();
  if(cart.length === 0){ container.innerHTML = '<p>Cart is empty.</p>'; document.getElementById('cart-total').textContent='₹0'; return; }
  const resp = await fetch('products.json').catch(()=>fetch('site_products_sample.json'));
  const products = await resp.json();
  let total = 0;
  for(const it of cart){
    const p = products.find(pr=>pr.id==it.id);
    if(!p) continue;
    const price = parseFloat(p.price) || 0;
    const line = document.createElement('div');
    line.className = 'cart-line';
    line.innerHTML = `
      <div>
        <strong>${p.title}</strong><br>
        ${p.currency||'₹'}${price} x <input type="number" min="1" value="${it.qty}" data-id="${it.id}" style="width:60px;">
      </div>
      <div style="text-align:right">
        <div>${(price*it.qty).toFixed(2)}</div>
        <button class="remove" data-id="${it.id}">Remove</button>
      </div>
    `;
    container.appendChild(line);
    total += price * it.qty;
  }
  document.getElementById('cart-total').textContent = `₹${total.toFixed(2)}`;

  container.querySelectorAll('input[type="number"]').forEach(inp=>{
    inp.onchange = (e)=> updateQty(e.target.dataset.id, parseInt(e.target.value || 1));
  });
  container.querySelectorAll('.remove').forEach(btn=>{
    btn.onclick = (e)=> removeFromCart(e.currentTarget.dataset.id);
  });
}

function updateCartCount(){
  const c = getCart().reduce((s,i)=> s + (i.qty||0), 0);
  const el = document.getElementById('cart-count');
  if(el) el.textContent = c;
}

function toggleWishlist(id){
  const w = getWishlist();
  const exists = w.includes(id);
  if(exists){
    const nw = w.filter(x=>x!=id);
    saveWishlist(nw);
  } else {
    w.push(id); saveWishlist(w);
  }
  renderWishlistCount();
  renderWishlist();
}

function renderWishlistCount(){
  const el = document.getElementById('wishlist-count');
  if(!el) return;
  el.textContent = getWishlist().length;
}

async function renderWishlist(){
  const container = document.getElementById('wishlist-items');
  if(!container) return;
  container.innerHTML = '';
  const w = getWishlist();
  if(w.length==0){ container.innerHTML = '<p>Your wishlist is empty.</p>'; return; }
  const resp = await fetch('products.json').catch(()=>fetch('site_products_sample.json'));
  const products = await resp.json();
  for(const id of w){
    const p = products.find(pr=>pr.id==id);
    if(!p) continue;
    const node = document.createElement('div');
    node.className = 'cart-line';
    node.innerHTML = `<div><strong>${p.title}</strong><br>₹${p.price}</div>
      <div><button class="add-to-cart" data-id="${p.id}">Add to cart</button> <button class="remove-w" data-id="${p.id}">Remove</button></div>`;
    container.appendChild(node);
  }
  container.querySelectorAll('.add-to-cart').forEach(btn=> btn.onclick = (e)=> addToCartById(e.currentTarget.dataset.id,1));
  container.querySelectorAll('.remove-w').forEach(btn=> btn.onclick = (e)=> { const id=e.currentTarget.dataset.id; toggleWishlist(id); });
}

function renderAccountArea(){
  const container = document.getElementById('account-area');
  if(!container) return;
  const acc = getAccount();
  if(!acc || !acc.email){
    container.innerHTML = `<p>Please sign in (local-only demo)</p>
      <input id="acc-email" placeholder="Email" /><br><input id="acc-name" placeholder="Full name" /><br>
      <button id="acc-save">Save</button>`;
    document.getElementById('acc-save').onclick = ()=>{
      const email = document.getElementById('acc-email').value;
      const name = document.getElementById('acc-name').value;
      saveAccount({email,name});
      renderAccountArea();
    };
  } else {
    container.innerHTML = `<p>Signed in as <strong>${acc.email}</strong></p><p>${acc.name || ''}</p>
      <button id="acc-logout">Logout</button>`;
    document.getElementById('acc-logout').onclick = ()=> { saveAccount({}); renderAccountArea(); };
  }
}

document.getElementById('checkout').onclick = ()=>{
  // In real use, POST cart JSON to server or integrate with payment
  const cart = getCart();
  if(cart.length==0){ alert('Cart is empty'); return; }
  alert('Checkout placeholder — implement payment integration (serverless or payment gateway). Cart JSON available in localStorage.');
  // example: localStorage.getItem(CART_KEY)
}

// initial refresh
renderCartItems();
updateCartCount();
renderWishlistCount();
renderWishlist();
renderAccountArea();
