// app.js
const PAGE_SIZE = 8;
let products = [];
let filtered = [];
let page = 1;
let currentPage = 'home';

async function loadProducts() {
  try {
    const resp = await fetch('products.json');
    if(!resp.ok) throw new Error('Failed to load products.json');
    products = await resp.json();
  } catch(e){
    console.warn('products.json failed, trying fallback:', e);
    try {
      const resp2 = await fetch('site_products_sample.json');
      if(!resp2.ok) throw new Error('Fallback also failed');
      products = await resp2.json();
    } catch(e2){
      console.error('Both product sources failed:', e2);
      products = [];
    }
  }
  
  if(!Array.isArray(products) || products.length === 0){
    console.error('No products loaded');
    document.getElementById('gallery').innerHTML = '<p style="grid-column:1/-1;text-align:center;padding:40px;color:var(--muted)">No products available. Please check products.json</p>';
    return;
  }
  
  filtered = products.slice();
  populateCategoryFilter();
  render();
  renderWishlistCount();
}

function populateCategoryFilter() {
  const select = document.getElementById('category-filter');
  if(!select) return;
  select.innerHTML = '<option value="">All categories</option>';
  const cats = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c.charAt(0).toUpperCase() + c.slice(1);
    select.appendChild(opt);
  });
}

function applyFilters() {
  const q = document.getElementById('search').value.trim().toLowerCase();
  const category = document.getElementById('category-filter').value;

  filtered = products.filter(p => {
    if (category && p.category !== category) return false;
    if (!q) return true;
    return (p.title + ' ' + p.description + ' ' + (p.tags||[]).join(' ')).toLowerCase().includes(q);
  });

  page = 1;
  render();
}

function render() {
  const gallery = document.getElementById('gallery');
  if(!gallery) {
    console.error('Gallery element not found');
    return;
  }
  
  gallery.innerHTML = '';
  const start = (page-1)*PAGE_SIZE;
  const pageItems = filtered.slice(start, start+PAGE_SIZE);
  const wishlist = getWishlist();

  console.log('Rendering', pageItems.length, 'products on page', page);

  if(pageItems.length === 0){
    gallery.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--muted);padding:40px">No products found</p>';
    document.getElementById('page-info').textContent = 'Page 0 of 0';
    return;
  }

  for (const p of pageItems) {
    if(!p.id) {
      console.warn('Product without ID:', p);
      continue;
    }
    
    const img = (p.images && p.images.length>0 && p.images[0] && p.images[0] !== 'nan') ? p.images[0] : 'images/placeholder.png';
    const mrp = p.mrp || 0;
    const price = p.price || 0;
    const discount = p.discount_pct || (mrp && price ? Math.round(((mrp-price)/mrp)*100) : 0);
    const isWishlisted = wishlist.includes(p.id);

    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <div class="imgwrap">
        <img src="${img}" alt="${p.title}" loading="lazy" data-id="${p.id}" style="width:100%;height:220px;object-fit:cover;display:block;border-radius:8px" onerror="this.src='images/placeholder.png'">
      </div>
      <h4>${p.title}</h4>
      <p>${p.description || 'Product'}</p>
      <div class="price-row">
        <div class="mrp">₹${mrp.toFixed ? mrp.toFixed(2) : mrp}</div>
        <div class="price">₹${price.toFixed ? price.toFixed(2) : price}</div>
        <div class="discount">${discount}% OFF</div>
      </div>
      <div class="actions">
        <button class="add-to-cart" data-id="${p.id}">Add to cart</button>
        <button class="btn-ghost view" data-id="${p.id}">Quick view</button>
        <button class="btn-ghost wishlist ${isWishlisted ? 'active' : ''}" data-id="${p.id}">♡</button>
      </div>
    `;
    gallery.appendChild(card);
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  document.getElementById('page-info').textContent = `Page ${page} of ${totalPages}`;
  document.getElementById('prev-page').disabled = page <= 1;
  document.getElementById('next-page').disabled = (page * PAGE_SIZE) >= filtered.length;

  // bind events
  document.querySelectorAll('.view').forEach(el => {
    el.onclick = (e) => {
      e.preventDefault();
      const id = e.currentTarget.dataset.id;
      openModalById(id);
    };
  });
  
  document.querySelectorAll('img[data-id]').forEach(el => {
    el.onclick = (e) => {
      e.preventDefault();
      const id = e.currentTarget.dataset.id;
      openModalById(id);
    };
  });
  
  document.querySelectorAll('.add-to-cart').forEach(btn=>{
    btn.onclick = (e) => {
      e.preventDefault();
      const id = e.currentTarget.dataset.id;
      addToCartById(id, 1);
    };
  });
  
  document.querySelectorAll('.wishlist').forEach(btn=>{
    btn.onclick = (e) => {
      e.preventDefault();
      const id = e.currentTarget.dataset.id;
      toggleWishlist(id, e.currentTarget);
    };
  });

  updateCartCount();
}

function openModalById(id) {
  const p = products.find(x=>x.id == id);
  if(!p) return;
  const img = (p.images && p.images.length>0 && p.images[0] && p.images[0] !== 'nan') ? p.images[0] : 'images/placeholder.png';
  const galleryHtml = (p.images || []).filter(u => u && u !== 'nan').map(u=>`<img class="modal-thumb" src="${u}" width="60" style="margin:6px;cursor:pointer" onerror="this.src='images/placeholder.png'">`).join('');
  const isWishlisted = getWishlist().includes(p.id);
  document.getElementById('modal-img').src = img;
  document.getElementById('modal-caption').innerHTML = `<h3>${p.title}</h3><p>${p.description}</p>
  <div style="margin-top:8px"><strong>Price: ₹${p.price}</strong> <span style="text-decoration:line-through;color:#888;margin-left:8px">₹${p.mrp}</span> <span class="discount">${p.discount_pct}% OFF</span></div>
  ${galleryHtml ? '<div style="margin-top:10px">Images: ' + galleryHtml + '</div>' : ''}
  <div style="margin-top:10px"><a href="${p.whatsapp}" target="_blank">Chat on WhatsApp</a> • <a href="${p.upi}" target="_blank">Pay via UPI</a></div>
  <div style="margin-top:14px"><button class="add-to-cart" data-id="${p.id}">Add to cart</button> <button class="btn-ghost wishlist ${isWishlisted ? 'active' : ''}" data-id="${p.id}">♡ Wishlist</button></div>
  `;
  document.getElementById('modal').classList.remove('hidden');
  // re-bind inside modal
  setTimeout(()=> {
    document.querySelectorAll('.modal-thumb').forEach(imgEl=>{
      imgEl.onclick = (e)=> document.getElementById('modal-img').src = e.currentTarget.src;
    });
    document.querySelectorAll('.add-to-cart').forEach(btn=>{
      btn.onclick = (e) => { addToCartById(e.currentTarget.dataset.id,1); };
    });
    document.querySelectorAll('.wishlist').forEach(btn=>{
      btn.onclick = (e) => { 
        e.preventDefault();
        toggleWishlist(e.currentTarget.dataset.id, e.currentTarget); 
      };
    });
  },100);
}

document.getElementById('modal-close').onclick = ()=> document.getElementById('modal').classList.add('hidden');
document.getElementById('prev-page').onclick = ()=>{ page = Math.max(1, page-1); render(); };
document.getElementById('next-page').onclick = ()=>{ page = page+1; render(); };
document.getElementById('search').oninput = debounce(applyFilters, 250);
document.getElementById('category-filter').onchange = applyFilters;

// cart UI toggles
document.getElementById('open-cart').onclick = ()=> { 
  closeAllDrawers();
  document.getElementById('cart-drawer').classList.toggle('hidden'); 
  renderCartItems(); 
};
document.getElementById('close-cart').onclick = ()=> document.getElementById('cart-drawer').classList.add('hidden');

// wishlist toggles
document.getElementById('open-wishlist').onclick = ()=> { 
  closeAllDrawers();
  document.getElementById('wishlist-drawer').classList.toggle('hidden'); 
  renderWishlist(); 
};
document.getElementById('close-wishlist').onclick = ()=> document.getElementById('wishlist-drawer').classList.add('hidden');

// account toggles
document.getElementById('open-account').onclick = ()=> { 
  closeAllDrawers();
  document.getElementById('account-drawer').classList.toggle('hidden'); 
  renderAccountPage(); 
};
document.getElementById('close-account').onclick = ()=> document.getElementById('account-drawer').classList.add('hidden');

// orders page toggle
function showOrdersPage(){
  currentPage = 'orders';
  document.getElementById('main-content').style.display = 'none';
  document.getElementById('orders-page').style.display = 'block';
  renderOrdersPage();
}

function backToHome(){
  currentPage = 'home';
  document.getElementById('main-content').style.display = 'block';
  document.getElementById('orders-page').style.display = 'none';
}

function renderOrdersPage(){
  const container = document.getElementById('orders-page-content');
  if(!container) return;
  
  const user = getAuthUser();
  if(!user){
    container.innerHTML = '<p style="text-align:center;padding:40px">Please login to view orders</p>';
    return;
  }
  
  const orders = getOrders();
  
  container.innerHTML = `
    <div style="max-width:900px;margin:0 auto;padding:20px">
      <button onclick="backToHome()" style="margin-bottom:16px">← Back to Shopping</button>
      <h2>My Orders</h2>
      <div id="orders-list-container"></div>
    </div>
  `;
  
  const listContainer = container.querySelector('#orders-list-container');
  
  if(orders.length === 0){
    listContainer.innerHTML = '<p style="text-align:center;color:var(--muted);padding:40px">No orders yet. <a href="#" onclick="backToHome()">Start shopping</a></p>';
    return;
  }
  
  orders.slice().reverse().forEach(order => {
    const card = document.createElement('div');
    card.className = 'order-details-card';
    const orderDate = new Date(order.date).toLocaleDateString();
    const statusColor = order.status === 'confirmed' ? '#28a745' : order.status === 'pending' ? '#ffc107' : '#dc3545';
    
    let actionBtn = '';
    if(order.status === 'pending'){
      actionBtn = `<button class="btn-primary" onclick="resumePayment('${order.orderNumber}')" style="margin-top:12px">Continue Payment</button>`;
    }
    
    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:12px">
        <div>
          <h3 style="margin:0">${order.orderNumber}</h3>
          <p style="margin:4px 0;color:var(--muted);font-size:0.9rem">${orderDate}</p>
        </div>
        <span style="background:${statusColor};color:white;padding:6px 12px;border-radius:6px;font-weight:600;font-size:0.85rem">${order.status.toUpperCase()}</span>
      </div>
      
      <div style="background:#f9fbff;padding:12px;border-radius:6px;margin-bottom:12px">
        <p style="margin:0;font-weight:600;margin-bottom:8px">Items:</p>
        ${order.items.map(item => `
          <div style="display:flex;justify-content:space-between;font-size:0.9rem;margin:4px 0">
            <span>${item.title} x ${item.qty}</span>
            <span>₹${(item.price * item.qty).toFixed(2)}</span>
          </div>
        `).join('')}
        <div style="border-top:1px dashed #e6e9ee;margin-top:8px;padding-top:8px;font-weight:600">
          <span>Total: ₹${order.total.toFixed(2)}</span>
        </div>
      </div>
      
      <div style="background:#f0f0f0;padding:12px;border-radius:6px;font-size:0.85rem">
        <p style="margin:0;font-weight:600;margin-bottom:6px">Delivery Address:</p>
        <p style="margin:0;color:var(--muted)">${order.customer.name}<br>${order.customer.address}<br>PIN: ${order.customer.pincode}</p>
      </div>
      ${actionBtn}
    `;
    listContainer.appendChild(card);
  });
}

function resumePayment(orderNumber){
  const orders = getOrders();
  const order = orders.find(o => o.orderNumber === orderNumber);
  
  if(!order || order.status !== 'pending'){
    alert('Order not found or already completed');
    return;
  }
  
  backToHome();
  closeAllDrawers();
  
  if(isMobile()){
    const upiLink = `upi://pay?pa=amuk8580-3@okaxis&pn=Ankush Mukhedkar&am=${order.total.toFixed(2)}&cu=INR`;
    window.location.href = upiLink;
  } else {
    showQRCodeModal(order.total, order.orderNumber, order.items, order.customer, true);
  }
}

function closeAllDrawers(){
  document.getElementById('cart-drawer').classList.add('hidden');
  document.getElementById('wishlist-drawer').classList.add('hidden');
  document.getElementById('account-drawer').classList.add('hidden');
}

function debounce(fn, delay=200){
  let t;
  return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), delay); }
}

function renderAccountPage(){
  const container = document.getElementById('account-area');
  if(!container) return;
  
  const user = getAuthUser();
  
  if(!user){
    renderOTPLogin(container);
  } else {
    renderAccountOrders(container, user);
  }
}

function renderOTPLogin(container){
  container.innerHTML = `
    <div class="auth-container">
      <h3>Sign In with WhatsApp OTP</h3>
      <p style="color:var(--muted);font-size:0.9rem">We will send you an OTP via WhatsApp to verify your number</p>
      
      <div class="country-code">
        <select id="country-select" style="width:80px">
          <option value="+91">🇮🇳 +91</option>
        </select>
        <input type="tel" id="otp-mobile" placeholder="Phone number" maxlength="10" style="flex:1;padding:10px;border:1px solid #e6e9ee;border-radius:6px">
      </div>
      
      <button class="btn-primary" onclick="requestOTPClick()" id="request-otp-btn">Request OTP via WhatsApp</button>
      
      <div id="otp-verification" style="display:none;margin-top:16px">
        <label style="display:block;margin-bottom:8px">Enter 6-digit OTP received on WhatsApp</label>
        <div class="otp-container" id="otp-inputs"></div>
        <button class="btn-primary" onclick="verifyOTPClick()" id="verify-otp-btn">Verify OTP</button>
      </div>
      
      <div id="profile-form" style="display:none;margin-top:16px">
        <div class="form-group">
          <label>Full Name *</label>
          <input type="text" id="profile-name" placeholder="Your name">
        </div>
        <div class="form-group">
          <label>Email *</label>
          <input type="email" id="profile-email" placeholder="your@email.com">
        </div>
        <button class="btn-primary" onclick="saveProfile()">Complete Profile</button>
      </div>
      
      <p style="margin-top:16px;font-size:0.85rem;color:var(--muted)">
        <input type="checkbox" id="accept-terms"> I accept that I have read & understood <a href="#" style="color:var(--accent)">Privacy Policy and T&Cs.</a>
      </p>
    </div>
  `;
  
  generateOTPInputs();
}

function generateOTPInputs(){
  const container = document.getElementById('otp-inputs');
  if(!container) return;
  container.innerHTML = '';
  
  for(let i = 0; i < 6; i++){
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = '1';
    input.className = 'otp-input';
    input.inputMode = 'numeric';
    input.dataset.index = i;
    input.onkeyup = (e) => {
      if(e.key === 'Backspace'){
        if(i > 0) document.querySelectorAll('.otp-input')[i-1].focus();
      } else if(/[0-9]/.test(e.target.value)){
        if(i < 5) document.querySelectorAll('.otp-input')[i+1].focus();
      }
    };
    container.appendChild(input);
  }
}

function requestOTPClick(){
  const mobile = document.getElementById('otp-mobile').value.trim();
  const country = document.getElementById('country-select').value;
  
  if(!mobile || mobile.length !== 10){
    alert('Please enter valid 10-digit mobile number');
    return;
  }
  
  requestOTPViaWhatsApp(country + mobile);
  document.getElementById('request-otp-btn').style.display = 'none';
  document.getElementById('otp-verification').style.display = 'block';
  
  setTimeout(() => document.querySelectorAll('.otp-input')[0].focus(), 100);
}

function verifyOTPClick(){
  const mobile = document.getElementById('otp-mobile').value.trim();
  const country = document.getElementById('country-select').value;
  const otp = Array.from(document.querySelectorAll('.otp-input')).map(i => i.value).join('');
  
  if(otp.length !== 6){
    alert('Please enter complete OTP');
    return;
  }
  
  if(verifyOTP(country + mobile, otp)){
    document.getElementById('otp-verification').style.display = 'none';
    document.getElementById('profile-form').style.display = 'block';
    document.getElementById('verify-otp-btn').disabled = true;
  } else {
    alert('Invalid or expired OTP');
  }
}

function saveProfile(){
  const name = document.getElementById('profile-name').value.trim();
  const email = document.getElementById('profile-email').value.trim();
  const mobile = document.getElementById('country-select').value + document.getElementById('otp-mobile').value.trim();
  const terms = document.getElementById('accept-terms').checked;
  
  if(!name || !email){
    alert('Please fill all fields');
    return;
  }
  
  if(!terms){
    alert('Please accept terms and conditions');
    return;
  }
  
  saveUserProfile({name, email, mobile, createdAt: new Date().toISOString()});
  renderAccountPage();
}

function renderAccountOrders(container, user){
  container.innerHTML = `
    <div style="padding:12px">
      <h4>${user.name}</h4>
      <p style="color:var(--muted);margin:4px 0;font-size:0.9rem">${user.email}</p>
      <p style="color:var(--muted);margin:4px 0;font-size:0.9rem">${user.mobile}</p>
      
      <button class="btn-primary" onclick="showOrdersPage()" style="margin-top:12px;margin-bottom:12px">View All Orders</button>
      
      <h4 style="margin-top:16px">Recent Orders</h4>
      ${getOrders().length === 0 ? '<p style="color:var(--muted)">No orders yet</p>' : ''}
      
      <div id="recent-orders"></div>
      
      <button class="btn-secondary" onclick="logoutAccount()" style="margin-top:16px">Logout</button>
    </div>
  `;
  
  const recent = getOrders().slice(-3).reverse();
  const ordersDiv = container.querySelector('#recent-orders');
  
  recent.forEach(order => {
    const card = document.createElement('div');
    card.className = 'order-card';
    const orderDate = new Date(order.date).toLocaleDateString();
    const statusColor = order.status === 'confirmed' ? '#28a745' : '#ffc107';
    
    card.innerHTML = `
      <h4>${order.orderNumber}</h4>
      <p><strong>Date:</strong> ${orderDate}</p>
      <p><strong>Amount:</strong> ₹${order.total.toFixed(2)}</p>
      <p><strong>Status:</strong> <span style="color:${statusColor};font-weight:600">${order.status.toUpperCase()}</span></p>
    `;
    ordersDiv.appendChild(card);
  });
}

function logoutAccount(){
  logout();
  renderAccountPage();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM ready, loading products...');
  loadProducts();
});

// Fallback if DOMContentLoaded already fired
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', loadProducts);
} else {
  loadProducts();
}
