// cart.js - cart, wishlist, account persisted in localStorage
const CART_KEY = 'static_shop_cart_v1';
const WISHLIST_KEY = 'static_shop_wishlist_v1';
const ACCOUNT_KEY = 'static_shop_account_v1';
const ORDERS_KEY = 'static_shop_orders_v1';
const ADDRESSES_KEY = 'static_shop_addresses_v1';

function getCart(){ try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch(e){ return []; } }
function saveCart(cart){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); }
function getWishlist(){ try { return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]'); } catch(e){ return []; } }
function saveWishlist(w){ localStorage.setItem(WISHLIST_KEY, JSON.stringify(w)); }
function getAccount(){ try { return JSON.parse(localStorage.getItem(ACCOUNT_KEY) || '{}'); } catch(e){ return {}; } }
function saveAccount(a){ localStorage.setItem(ACCOUNT_KEY, JSON.stringify(a)); }
function getOrders(){ try { return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]'); } catch(e){ return []; } }
function saveOrders(orders){ localStorage.setItem(ORDERS_KEY, JSON.stringify(orders)); }
function getAddresses(){ try { return JSON.parse(localStorage.getItem(ADDRESSES_KEY) || '[]'); } catch(e){ return []; } }
function saveAddresses(addrs){ localStorage.setItem(ADDRESSES_KEY, JSON.stringify(addrs)); }

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
  
  const user = getAuthUser();
  if(!user){
    alert('Please login first');
    document.getElementById('open-account').click();
    return;
  }
  
  showCheckoutModal(user);
}

function showCheckoutModal(user){
  let modal = document.getElementById('checkout-modal');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'checkout-modal';
    modal.className = 'checkout-modal';
    document.body.appendChild(modal);
  }
  
  const addresses = getAddresses();
  const defaultAddr = addresses.find(a => a.isDefault);
  
  let addressHTML = '';
  if(addresses.length > 0){
    addressHTML = `
      <div class="address-section">
        <h4>Select Saved Address</h4>
        <div id="saved-addresses-list">
          ${addresses.map((addr, idx) => `
            <div class="address-item ${defaultAddr && defaultAddr.id === addr.id ? 'selected' : ''}" onclick="selectAddress(${idx})">
              <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px">
                <div>
                  <span class="address-badge">${addr.type}</span>
                  ${addr.isDefault ? '<span class="default-badge">DEFAULT</span>' : ''}
                </div>
              </div>
              <p style="margin:0;font-size:0.9rem">${addr.street}, ${addr.apartment ? addr.apartment + ', ' : ''}${addr.city}, ${addr.state} ${addr.postalCode}</p>
            </div>
          `).join('')}
        </div>
        <button class="btn-secondary" style="width:100%;margin-top:8px" onclick="toggleAddressForm()">+ Add New Address</button>
      </div>
    `;
  }
  
  modal.innerHTML = `
    <div class="checkout-content">
      <h2>Checkout Details</h2>
      <div id="address-section-container">${addressHTML}</div>
      
      <div id="new-address-form" style="display:${addresses.length > 0 ? 'none' : 'block'}">
        <h4>Delivery Address</h4>
        <div class="form-group">
          <label>Address Type *</label>
          <select id="co-addr-type" required>
            <option value="">Select Type</option>
            <option value="Home">Home</option>
            <option value="Office">Office</option>
            <option value="Other">Other</option>
          </select>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>Street Address *</label>
            <input type="text" id="co-street" placeholder="123 Main Street" required>
          </div>
          <div class="form-group">
            <label>Apartment/Suite (Optional)</label>
            <input type="text" id="co-apartment" placeholder="Apt 4B">
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>City/Locality *</label>
            <input type="text" id="co-city" placeholder="Mumbai" required>
          </div>
          <div class="form-group">
            <label>Postal Code *</label>
            <input type="text" id="co-postal" placeholder="400001" required>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>State</label>
            <input type="text" id="co-state" value="Maharashtra" disabled style="background:#f0f0f0">
          </div>
          <div class="form-group">
            <label>Country</label>
            <input type="text" id="co-country" value="India" disabled style="background:#f0f0f0">
          </div>
        </div>
        
        <div class="form-group">
          <label style="display:flex;align-items:center;gap:8px">
            <input type="checkbox" id="co-set-default"> Set as default address
          </label>
        </div>
      </div>
      
      <div style="margin-top:16px;padding-top:16px;border-top:1px solid #e6e9ee">
        <h4>Contact Details</h4>
        <div class="form-row">
          <div class="form-group">
            <label>Full Name *</label>
            <input type="text" id="co-name" value="${user.name || ''}" required>
          </div>
          <div class="form-group">
            <label>Email *</label>
            <input type="email" id="co-email" value="${user.email || ''}" required>
          </div>
        </div>
        
        <div class="form-group">
          <label>Mobile Number *</label>
          <input type="tel" id="co-mobile" value="${user.mobile || ''}" required>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn-secondary" onclick="document.getElementById('checkout-modal').classList.add('hidden')">Cancel</button>
        <button class="btn-primary" onclick="proceedToPayment()">Proceed to Payment</button>
      </div>
    </div>
  `;
  modal.classList.remove('hidden');
  
  // Set initial selected address
  window.selectedAddressIndex = defaultAddr ? addresses.findIndex(a => a.id === defaultAddr.id) : -1;
}

function toggleAddressForm(){
  const form = document.getElementById('new-address-form');
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function selectAddress(idx){
  window.selectedAddressIndex = idx;
  document.querySelectorAll('.address-item').forEach((el, i) => {
    el.classList.toggle('selected', i === idx);
  });
}

async function proceedToPayment(){
  const name = document.getElementById('co-name').value.trim();
  const email = document.getElementById('co-email').value.trim();
  const mobile = document.getElementById('co-mobile').value.trim();
  
  if(!name || !email || !mobile){
    alert('Please fill contact details');
    return;
  }
  
  let address, street, apartment, city, postalCode, addressType;
  const addresses = getAddresses();
  
  if(window.selectedAddressIndex >= 0 && addresses[window.selectedAddressIndex]){
    const addr = addresses[window.selectedAddressIndex];
    street = addr.street;
    apartment = addr.apartment;
    city = addr.city;
    postalCode = addr.postalCode;
    address = `${street}${apartment ? ', ' + apartment : ''}, ${city}, Maharashtra ${postalCode}`;
    addressType = addr.type;
  } else {
    street = document.getElementById('co-street').value.trim();
    apartment = document.getElementById('co-apartment').value.trim();
    city = document.getElementById('co-city').value.trim();
    postalCode = document.getElementById('co-postal').value.trim();
    addressType = document.getElementById('co-addr-type').value;
    
    if(!street || !city || !postalCode || !addressType){
      alert('Please fill all address fields');
      return;
    }
    
    address = `${street}${apartment ? ', ' + apartment : ''}, ${city}, Maharashtra ${postalCode}`;
    
    const newAddr = {
      id: 'addr-' + Date.now(),
      type: addressType,
      street,
      apartment,
      city,
      state: 'Maharashtra',
      postalCode,
      country: 'India',
      isDefault: document.getElementById('co-set-default').checked
    };
    
    if(newAddr.isDefault){
      addresses.forEach(a => a.isDefault = false);
    }
    
    addresses.push(newAddr);
    saveAddresses(addresses);
  }
  
  const user = getAuthUser();
  saveUserProfile({...user, name, email, mobile, address, addressType});
  
  const cart = getCart();
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
  
  const orders = getOrders();
  const orderData = {
    orderNumber,
    date: new Date().toISOString(),
    items,
    total,
    status: 'pending',
    customer: {name, email, mobile, street, apartment, city, postalCode, state: 'Maharashtra', country: 'India', addressType}
  };
  orders.push(orderData);
  saveOrders(orders);
  
  // Don't send pending orders to backend - only confirmed orders
  
  document.getElementById('checkout-modal').classList.add('hidden');
  
  if(isMobile()){
    // Mobile: Add complete OrderID to UPI note
    const upiNote = orderNumber;
    const upiLink = `upi://pay?pa=amuk8580-3@okaxis&pn=Ankush Mukhedkar&am=${total.toFixed(2)}&tn=${encodeURIComponent(upiNote)}&cu=INR`;
    window.location.href = upiLink;
    setTimeout(() => { saveCart([]); updateCartCount(); renderCartItems(); }, 500);
  } else {
    showQRCodeModal(total, orderNumber, items, {name, email, mobile, street, apartment, city, postalCode, addressType});
  }
}

function showQRCodeModal(amount, orderNumber, items, customer, isResume=false){
  // Add complete OrderID to UPI note for reconciliation
  const upiNote = orderNumber;
  const upiLink = `upi://pay?pa=amuk8580-3@okaxis&pn=Ankush Mukhedkar&am=${amount.toFixed(2)}&tn=${encodeURIComponent(upiNote)}&cu=INR`;
  
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
      <p style="font-size:0.9rem;color:#666">Order #${orderNumber}</p>
      <div id="qr-container"></div>
      <div style="margin-top:16px;font-size:0.85rem;background:#f0f0f0;padding:8px;border-radius:6px">
        <p style="margin:0"><strong>Customer:</strong> ${customer.name}</p>
        <p style="margin:4px 0;font-size:0.8rem"><strong>Address:</strong> ${customer.street}${customer.apartment ? ', ' + customer.apartment : ''}, ${customer.city} ${customer.postalCode}</p>
        <p style="margin:4px 0;font-size:0.75rem;color:#666"><strong>Transaction Note:</strong> ${upiNote}</p>
      </div>
      <button onclick="confirmPayment('${orderNumber}', '${customer.email}', ${amount}, ${isResume})">Paid? Confirm Order</button>
      <button onclick="document.getElementById('qr-modal').classList.add('hidden')" style="margin-left:8px">Cancel</button>
    </div>
  `;
  modal.classList.remove('hidden');
  
  setTimeout(() => generateQRCode(upiLink), 100);
}

function generateQRCode(text){
  const container = document.getElementById('qr-container');
  if(!container) return;
  
  if(typeof QRCode !== 'undefined'){
    container.innerHTML = '';
    new QRCode(container, {
      text: text,
      width: 200,
      height: 200
    });
  } else {
    container.innerHTML = `<p><a href="${text}" target="_blank" style="color:var(--accent);text-decoration:underline">Open UPI Payment</a></p>`;
  }
}

async function confirmPayment(orderNumber, email, amount, isResume=false){
  const orders = getOrders();
  const order = orders.find(o => o.orderNumber === orderNumber);
  
  if(order){
    order.status = 'confirmed';
    order.paidAt = new Date().toISOString();
    saveOrders(orders);
    
    // Save only CONFIRMED order to backend (Orders.json)
    await saveOrderToBackend(order);
  }
  
  alert('Order confirmed! Order # ' + orderNumber);
  
  if(!isResume){
    saveCart([]);
    updateCartCount();
    renderCartItems();
  }
  
  document.getElementById('qr-modal').classList.add('hidden');
}

async function sendOrderToBackend(orderData){
  try {
    const apiUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:3000/api/orders'
      : '/api/orders';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    
    const result = await response.json();
    console.log('Pending order created:', result);
    return response.ok;
  } catch(e){
    console.error('Order submission error:', e);
    return false;
  }
}

async function saveOrderToBackend(order){
  try {
    const apiUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:3000/api/save-order'
      : '/api/save-order';
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order)
    });
    
    const result = await response.json();
    console.log('Confirmed order saved to Orders.json:', result);
    return response.ok;
  } catch(e){
    console.error('Error saving confirmed order:', e);
    return false;
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
