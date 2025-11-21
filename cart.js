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
    const thumb = (p.images && p.images.length>0 && p.images[0]!=='nan') ? p.images[0] : 'images/placeholder.png';
    const line = document.createElement('div');
    line.className = 'cart-line';
    line.innerHTML = `
      <div>
        <img src="${thumb}" alt="${p.title}" class="cart-thumb" loading="lazy">
        <div>
          <strong>${p.title}</strong><br>
          ${p.currency||'₹'}${price} x <input type="number" min="1" value="${it.qty}" data-id="${it.id}" style="width:60px;">
        </div>
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

function toggleWishlist(id, btnElement){
  const w = getWishlist();
  const exists = w.includes(id);
  let message = '';
  
  if(exists){
    const nw = w.filter(x=>x!=id);
    saveWishlist(nw);
    message = 'Removed from wishlist';
  } else {
    w.push(id);
    saveWishlist(w);
    message = 'Added to wishlist';
  }
  
  // Update all wishlist buttons with this id
  updateWishlistButtons(id);
  renderWishlistCount();
  renderWishlist();
  
  // Show feedback message
  showWishlistFeedback(message);
}

function updateWishlistButtons(id){
  document.querySelectorAll(`.wishlist[data-id="${id}"]`).forEach(btn => {
    const w = getWishlist();
    if(w.includes(id)){
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function showWishlistFeedback(message){
  // Remove existing feedback if present
  const existing = document.getElementById('wishlist-feedback-msg');
  if(existing) existing.remove();
  
  // Create feedback element
  const feedback = document.createElement('div');
  feedback.id = 'wishlist-feedback-msg';
  feedback.className = 'wishlist-feedback';
  feedback.textContent = message;
  document.body.appendChild(feedback);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    feedback.remove();
  }, 3000);
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
    const thumb = (p.images && p.images.length>0 && p.images[0]!=='nan') ? p.images[0] : 'images/placeholder.png';
    const node = document.createElement('div');
    node.className = 'cart-line';
    node.innerHTML = `
      <div>
        <img src="${thumb}" alt="${p.title}" class="cart-thumb" loading="lazy">
        <div>
          <strong>${p.title}</strong><br>₹${p.price}
        </div>
      </div>
      <div><button class="add-to-cart" data-id="${p.id}">Add to cart</button> <button class="remove-w" data-id="${p.id}">Remove</button></div>`;
    container.appendChild(node);
  }
  container.querySelectorAll('.add-to-cart').forEach(btn=> btn.onclick = (e)=> addToCartById(e.currentTarget.dataset.id,1));
  container.querySelectorAll('.remove-w').forEach(btn=> btn.onclick = (e)=> { const id=e.currentTarget.dataset.id; toggleWishlist(id, btn); });
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

function isMobile(){
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
}

function generateOrderNumber(){
  return 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

async function processCheckout(){
  const cart = getCart();
  if(cart.length==0){ alert('Cart is empty'); return; }
  
  const resp = await fetch('products.json').catch(()=>fetch('site_products_sample.json'));
  const products = await resp.json();
  
  let total = 0;
  const items = [];
  for(const it of cart){
    const p = products.find(pr=>pr.id==it.id);
    if(!p) continue;
    const price = parseFloat(p.price) || 0;
    total += price * it.qty;
    items.push({id: p.id, title: p.title, price: price, qty: it.qty});
  }
  
  const orderNumber = generateOrderNumber();
  const acc = getAccount();
  
  if(isMobile()){
    // Mobile: Redirect to UPI
    const upiLink = `upi://pay?pa=amuk8580-3@okaxis&pn=Ankush Mukhedkar&am=${total.toFixed(2)}&cu=INR`;
    
    // Send order details to backend
    await sendOrderToBackend({orderNumber, items, total, email: acc.email || 'guest@example.com', status: 'pending'});
    
    // Redirect to UPI
    window.location.href = upiLink;
    
    // Clear cart after a delay
    setTimeout(() => { saveCart([]); updateCartCount(); renderCartItems(); }, 500);
  } else {
    // Desktop: Show QR code modal
    showQRCodeModal(total, orderNumber, items, acc.email);
  }
}

function showQRCodeModal(amount, orderNumber, items, email){
  const upiLink = `upi://pay?pa=amuk8580-3@okaxis&pn=Ankush Mukhedkar&am=${amount.toFixed(2)}&cu=INR`;
  
  // Create modal
  let modal = document.getElementById('qr-modal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'qr-modal';
    modal.className = 'qr-modal';
    document.body.appendChild(modal);
  }
  
  modal.innerHTML = `
    <div class="qr-content">
      <h3>Scan to Pay</h3>
      <p>Amount: <strong>₹${amount.toFixed(2)}</strong></p>
      <canvas id="qr-canvas"></canvas>
      <p style="font-size:0.9rem;color:#666">Order #${orderNumber}</p>
      <button onclick="confirmPayment('${orderNumber}', '${email}', ${amount})">Paid? Confirm Order</button>
      <button onclick="document.getElementById('qr-modal').classList.add('hidden')" style="margin-left:8px">Cancel</button>
    </div>
  `;
  modal.classList.remove('hidden');
  
  // Generate QR code
  setTimeout(() => generateQRCode(upiLink), 100);
}

function generateQRCode(text){
  const canvas = document.getElementById('qr-canvas');
  if(!canvas) return;
  
  // Simple QR code generation using qrcode.js library
  if(typeof QRCode !== 'undefined'){
    canvas.parentNode.innerHTML = '<div id="qr-container"></div>';
    new QRCode(document.getElementById('qr-container'), {
      text: text,
      width: 200,
      height: 200
    });
  } else {
    // Fallback: show UPI link
    canvas.style.display = 'none';
    const link = document.createElement('p');
    link.innerHTML = `<a href="${text}" target="_blank" style="color:var(--accent);text-decoration:underline">Open UPI Payment</a>`;
    canvas.parentNode.appendChild(link);
  }
}

async function confirmPayment(orderNumber, email, amount){
  const cart = getCart();
  const resp = await fetch('products.json').catch(()=>fetch('site_products_sample.json'));
  const products = await resp.json();
  
  const items = [];
  for(const it of cart){
    const p = products.find(pr=>pr.id==it.id);
    if(!p) continue;
    const price = parseFloat(p.price) || 0;
    items.push({id: p.id, title: p.title, price: price, qty: it.qty});
  }
  
  // Send confirmed order to backend
  const success = await sendOrderToBackend({
    orderNumber, 
    items, 
    total: amount,
    email: email || 'guest@example.com',
    status: 'confirmed',
    paidAt: new Date().toISOString()
  });
  
  if(success){
    alert('Order confirmed! Order # ' + orderNumber);
    saveCart([]);
    updateCartCount();
    renderCartItems();
    document.getElementById('qr-modal').classList.add('hidden');
  }
}

async function sendOrderToBackend(orderData){
  try {
    // Replace with your actual backend endpoint
    const response = await fetch('https://your-backend.com/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    }).catch(() => ({ok: true})); // Fallback for local testing
    
    return response.ok;
  } catch(e){
    console.error('Order submission error:', e);
    return true; // Proceed anyway for demo
  }
}

document.getElementById('checkout').onclick = () => processCheckout();

// initial refresh
renderCartItems();
updateCartCount();
renderWishlistCount();
renderWishlist();
renderAccountArea();

// Apply wishlist colors to initially loaded items
setTimeout(() => {
  const w = getWishlist();
  w.forEach(id => updateWishlistButtons(id));
}, 100);

// Close other drawers when opening one
function closeAllDrawers(){
  document.getElementById('cart-drawer').classList.add('hidden');
  document.getElementById('wishlist-drawer').classList.add('hidden');
  document.getElementById('account-drawer').classList.add('hidden');
}
