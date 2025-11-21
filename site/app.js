// app.js
const PAGE_SIZE = 8;
let products = [];
let filtered = [];
let page = 1;

async function loadProducts() {
  try {
    const resp = await fetch('products.json');
    products = await resp.json();
  } catch(e){
    // fallback sample packaged
    const resp2 = await fetch('site_products_sample.json');
    products = await resp2.json();
  }
  filtered = products.slice();
  populateCategoryFilter();
  render();
  renderWishlistCount();
}

function populateCategoryFilter() {
  const select = document.getElementById('category-filter');
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
  gallery.innerHTML = '';
  const start = (page-1)*PAGE_SIZE;
  const pageItems = filtered.slice(start, start+PAGE_SIZE);

  for (const p of pageItems) {
    const img = (p.images && p.images.length>0) ? p.images[0] : 'images/placeholder.png';
    const mrp = p.mrp || 0;
    const price = p.price || 0;
    const discount = p.discount_pct || (mrp && price ? Math.round(((mrp-price)/mrp)*100) : 0);

    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <div class="imgwrap"><img src="${img}" alt="${p.title}" loading="lazy" data-id="${p.id}"></div>
      <h4>${p.title}</h4>
      <p>${p.description}</p>
      <div class="price-row">
        <div class="mrp">₹${mrp.toFixed ? mrp.toFixed(2) : mrp}</div>
        <div class="price">₹${price.toFixed ? price.toFixed(2) : price}</div>
        <div class="discount">${discount}% OFF</div>
      </div>
      <div class="actions">
        <button class="add-to-cart" data-id="${p.id}">Add to cart</button>
        <button class="btn-ghost view" data-id="${p.id}">Quick view</button>
        <button class="btn-ghost wishlist" data-id="${p.id}">♡</button>
      </div>
    `;
    gallery.appendChild(card);
  }

  document.getElementById('page-info').textContent = `Page ${page} of ${Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))}`;
  document.getElementById('prev-page').disabled = page <= 1;
  document.getElementById('next-page').disabled = (page * PAGE_SIZE) >= filtered.length;

  // bind events
  document.querySelectorAll('.view, img[data-id]').forEach(el => {
    el.onclick = (e) => {
      const id = e.currentTarget.dataset.id;
      openModalById(id);
    };
  });
  document.querySelectorAll('.add-to-cart').forEach(btn=>{
    btn.onclick = (e) => {
      const id = e.currentTarget.dataset.id;
      addToCartById(id, 1);
    };
  });
  document.querySelectorAll('.wishlist').forEach(btn=>{
    btn.onclick = (e) => {
      const id = e.currentTarget.dataset.id;
      toggleWishlist(id);
    };
  });

  updateCartCount();
}

function openModalById(id) {
  const p = products.find(x=>x.id == id);
  if(!p) return;
  const img = (p.images && p.images.length>0) ? p.images[0] : 'images/placeholder.png';
  const galleryHtml = (p.images || []).map(u=>`<img class="modal-thumb" src="${u}" width="60" style="margin:6px;cursor:pointer">`).join('');
  document.getElementById('modal-img').src = img;
  document.getElementById('modal-caption').innerHTML = `<h3>${p.title}</h3><p>${p.description}</p>
  <div style="margin-top:8px"><strong>Price: ₹${p.price}</strong> <span style="text-decoration:line-through;color:#888;margin-left:8px">₹${p.mrp}</span> <span class="discount">${p.discount_pct}% OFF</span></div>
  <div style="margin-top:10px">Images: ${galleryHtml}</div>
  <div style="margin-top:10px"><a href="${p.whatsapp}" target="_blank">Chat on WhatsApp</a> • <a href="${p.upi}" target="_blank">Pay via UPI</a></div>
  <div style="margin-top:14px"><button class="add-to-cart" data-id="${p.id}">Add to cart</button> <button class="btn-ghost wishlist" data-id="${p.id}">♡ Wishlist</button></div>
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
      btn.onclick = (e) => { toggleWishlist(e.currentTarget.dataset.id); };
    });
  },100);
}

document.getElementById('modal-close').onclick = ()=> document.getElementById('modal').classList.add('hidden');
document.getElementById('prev-page').onclick = ()=>{ page = Math.max(1, page-1); render(); };
document.getElementById('next-page').onclick = ()=>{ page = page+1; render(); };
document.getElementById('search').oninput = debounce(applyFilters, 250);
document.getElementById('category-filter').onchange = applyFilters;

// cart UI toggles
document.getElementById('open-cart').onclick = ()=> { document.getElementById('cart-drawer').classList.toggle('hidden'); renderCartItems(); };
document.getElementById('close-cart').onclick = ()=> document.getElementById('cart-drawer').classList.add('hidden');

// wishlist toggles
document.getElementById('open-wishlist').onclick = ()=> { document.getElementById('wishlist-drawer').classList.toggle('hidden'); renderWishlist(); };
document.getElementById('close-wishlist').onclick = ()=> document.getElementById('wishlist-drawer').classList.add('hidden');

// account toggles
document.getElementById('open-account').onclick = ()=> { document.getElementById('account-drawer').classList.toggle('hidden'); renderAccountArea(); };
document.getElementById('close-account').onclick = ()=> document.getElementById('account-drawer').classList.add('hidden');

function debounce(fn, delay=200){
  let t;
  return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), delay); }
}

loadProducts();
