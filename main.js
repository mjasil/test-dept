/**
 * DEPT STORE | Main Logic
 * Updated: All new features
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, query, where, doc, getDoc }
    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyB5CGMpMGsInKMHwpTboKYa-bKNSrSxQsA",
    authDomain: "dept-store-ae1d4.firebaseapp.com",
    databaseURL: "https://dept-store-ae1d4-default-rtdb.firebaseio.com",
    projectId: "dept-store-ae1d4",
    storageBucket: "dept-store-ae1d4.firebasestorage.app",
    messagingSenderId: "704212117774",
    appId: "1:704212117774:web:31ef72455c76d006e7cf5f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const RAZORPAY_KEY_ID = "rzp_live_SXNDMFH4dRAdRN";
const STORE_NAME = "DEPT Store";
const STORE_CURRENCY = "INR";
const COD_FEE = 100;
const WHATSAPP_NUMBER = "918281097861";

const SITE_ASSETS = {
    logo: "assets/images/logo.png",
    heroBanner: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80",
    collections: { 'ladies-watch': "", 'mens-watch': "", gadgets: "", all: "" }
};

const state = {
    cart: [],
    products: [],
    currentProduct: null,
    selectedVariant: null,
    currentImageIndex: 0
};

const elements = {
    productGrid: document.getElementById('productGrid'),
    trendingGrid: document.getElementById('trendingGrid'),
    cartBadge: document.querySelector('.cart-badge'),
    cartSidebar: document.getElementById('cartSidebar'),
    cartItemsContainer: document.getElementById('cartItemsContainer'),
    cartSubtotal: document.getElementById('cartSubtotal'),
    cartTotal: document.getElementById('cartTotal'),
    checkoutModal: document.getElementById('checkoutModal'),
    summaryItemsContainer: document.getElementById('summaryItemsContainer'),
    summarySubtotal: document.getElementById('summarySubtotal'),
    summaryTotal: document.getElementById('summaryTotal'),
    checkoutFeedback: document.getElementById('checkoutFeedback')
};

document.addEventListener('DOMContentLoaded', async () => {
    applySiteAssets();
    setupSearch();
    loadRazorpayScript();

    const isProductPage = !!document.getElementById('productDetailArea');
    const isCatalogPage = !!document.getElementById('productGrid') && !document.getElementById('trendingGrid');
    const isHomePage = !!document.getElementById('trendingGrid');

    if (isProductPage) {
        await renderProductDetail();
    } else if (isHomePage) {
        await loadTrendingProducts();
    } else if (isCatalogPage) {
        await loadProductsFromFirebase();
        renderProducts();
    }

    updateCartUI();
});

function loadRazorpayScript() {
    if (document.getElementById('razorpay-sdk')) return;
    const script = document.createElement('script');
    script.id = 'razorpay-sdk';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    document.head.appendChild(script);
}

// --- LOAD TRENDING PRODUCTS (homepage) ---
async function loadTrendingProducts() {
    const grid = document.getElementById('trendingGrid');
    if (!grid) return;
    try {
        const q = query(collection(db, "products"), where("trending", "==", true));
        const snapshot = await getDocs(q);
        const products = [];
        snapshot.forEach(d => products.push({ id: d.id, ...d.data() }));

        if (products.length === 0) {
            grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:2rem;color:#888;">No trending products yet.</div>`;
            return;
        }

        state.products = products;
        grid.innerHTML = products.map(product => renderProductCard(product)).join('');
    } catch (error) {
        console.error("Trending load error:", error);
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:2rem;color:#888;">Failed to load.</div>`;
    }
}

// --- LOAD PRODUCTS (catalog page) ---
async function loadProductsFromFirebase() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const categoryFilter = urlParams.get('category');
        const searchFilter = urlParams.get('search');
        let snapshot;

        if (categoryFilter && categoryFilter !== 'all') {
            const q = query(collection(db, "products"), where("category", "==", categoryFilter));
            snapshot = await getDocs(q);
        } else {
            snapshot = await getDocs(collection(db, "products"));
        }

        state.products = [];
        snapshot.forEach(d => state.products.push({ id: d.id, ...d.data() }));

        if (searchFilter) {
            const sq = searchFilter.toLowerCase();
            state.products = state.products.filter(p =>
                p.name.toLowerCase().includes(sq) ||
                (p.category && p.category.toLowerCase().includes(sq))
            );
        }
    } catch (error) {
        console.error("Firebase error:", error);
        if (elements.productGrid) {
            elements.productGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:#888;">Failed to load products. Please refresh.</div>`;
        }
    }
}

// --- PRODUCT CARD HTML ---
function renderProductCard(product) {
    const imgContent = product.imageURL
        ? `<img src="${product.imageURL}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;">`
        : `<i class="ph ph-watch"></i>`;
    const hasDiscount = product.originalPrice && Number(product.originalPrice) > Number(product.price);
    const outOfStock = Number(product.stock) === 0;
    const savePercent = hasDiscount ? Math.round((1 - Number(product.price)/Number(product.originalPrice))*100) : 0;

    return `
    <div class="product-card">
        <a href="product.html?id=${product.id}" style="text-decoration:none;color:inherit;display:block;flex:1">
            <div class="product-img-wrap">
                ${imgContent}
                ${product.tag ? `<span style="position:absolute;top:10px;left:10px;background:#000;color:#fff;font-size:0.7rem;font-weight:700;padding:4px 8px;border-radius:4px;">${product.tag}</span>` : ''}
                ${outOfStock ? `<span style="position:absolute;top:10px;right:10px;background:#ef4444;color:#fff;font-size:0.7rem;font-weight:700;padding:4px 8px;border-radius:4px;">OUT OF STOCK</span>` : ''}
                ${savePercent > 0 ? `<span style="position:absolute;bottom:10px;left:10px;background:#16a34a;color:#fff;font-size:0.7rem;font-weight:700;padding:4px 8px;border-radius:4px;">SAVE ${savePercent}%</span>` : ''}
            </div>
            <div class="product-body" style="padding-bottom:0;">
                <h3>${product.name}</h3>
                <div class="product-price">
                    ${hasDiscount ? `<span class="old-price">Rs. ${Number(product.originalPrice).toLocaleString()}</span>` : ''}
                    <span class="new-price">Rs. ${Number(product.price).toLocaleString()}</span>
                </div>
            </div>
        </a>
        <div class="product-actions" style="padding:1rem 1.25rem 1.25rem;">
            <button class="btn btn-outline btn-cart" onclick="addToCart('${product.id}')" ${outOfStock ? 'disabled style="opacity:0.4;"' : ''}>
                <i class="ph ph-shopping-bag"></i>
            </button>
            <button class="btn btn-green btn-buy" onclick="buyNow('${product.id}')" ${outOfStock ? 'disabled style="opacity:0.4;"' : ''}>
                ${outOfStock ? 'OUT OF STOCK' : 'BUY NOW'}
            </button>
        </div>
    </div>`;
}

function renderProducts() {
    if (!elements.productGrid) return;

    const urlParams = new URLSearchParams(window.location.search);
    const categoryFilter = urlParams.get('category') || 'all';
    const searchFilter = urlParams.get('search');

    const titleEl = document.getElementById('catalogTitle');
    if (titleEl) {
        const titles = {
            'ladies-watch': '👩 LADIES WATCH',
            'mens-watch': '👨 MENS WATCH',
            'gadgets': '📱 GADGETS',
            'all': '🛍️ SHOP ALL',
        };
        if (searchFilter) titleEl.textContent = `RESULTS FOR "${searchFilter.toUpperCase()}"`;
        else titleEl.textContent = titles[categoryFilter] || categoryFilter.toUpperCase();
    }

    const loadingEl = document.getElementById('loadingState');
    if (loadingEl) loadingEl.style.display = 'none';

    if (state.products.length === 0) {
        elements.productGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:#888;">No products found in this category.</div>`;
        return;
    }

    elements.productGrid.innerHTML = state.products.map(p => renderProductCard(p)).join('');
}

// --- RENDER PRODUCT DETAIL ---
async function renderProductDetail() {
    const detailArea = document.getElementById('productDetailArea');
    const loadingEl = document.getElementById('productLoading');
    if (!detailArea) return;

    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) {
        if (loadingEl) loadingEl.style.display = 'none';
        detailArea.style.display = 'block';
        detailArea.innerHTML = `<h2 style="text-align:center;color:#888;">Product not found</h2>`;
        return;
    }

    try {
        const docSnap = await getDoc(doc(db, "products", id));
        if (loadingEl) loadingEl.style.display = 'none';
        detailArea.style.display = 'block';

        if (!docSnap.exists()) {
            detailArea.innerHTML = `<h2 style="text-align:center;color:#888;">Product not found</h2>`;
            return;
        }

        const product = { id: docSnap.id, ...docSnap.data() };
        state.currentProduct = product;
        state.selectedVariant = null;
        state.currentImageIndex = 0;
        if (!state.products.find(p => p.id === product.id)) state.products.push(product);

        const images = product.images && product.images.length > 0 ? product.images : (product.imageURL ? [product.imageURL] : []);
        const hasDiscount = product.originalPrice && Number(product.originalPrice) > Number(product.price);
        const outOfStock = Number(product.stock) === 0;
        const hasVariants = product.variants && product.variants.length > 0;
        const savePercent = hasDiscount ? Math.round((1 - Number(product.price)/Number(product.originalPrice))*100) : 0;
        const inCart = state.cart.some(i => i.id === product.id);

        detailArea.innerHTML = `
        <div style="max-width:600px;margin:0 auto;padding:0 0 2rem;">

            <!-- MAIN IMAGE with zoom -->
            <div id="mainImageContainer" style="width:100%;aspect-ratio:1/1;background:#111;border-radius:12px;overflow:hidden;margin-bottom:12px;position:relative;cursor:zoom-in;"
                onclick="toggleZoom(this)">
                <img id="mainProductImage" src="${images[0] || ''}" alt="${product.name}"
                    style="width:100%;height:100%;object-fit:cover;transition:transform 0.3s,opacity 0.25s;"
                    id="mainProductImage">
                <div style="position:absolute;top:10px;right:10px;background:rgba(0,0,0,0.5);border-radius:20px;padding:4px 8px;font-size:0.75rem;color:#fff;">
                    <i class="ph ph-magnifying-glass-plus"></i> Tap to zoom
                </div>
            </div>

            <!-- ZOOM OVERLAY -->
            <div id="zoomOverlay" onclick="closeZoom()" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.95);z-index:9999;cursor:zoom-out;overflow:auto;display:none;align-items:center;justify-content:center;">
                <img id="zoomImage" src="${images[0] || ''}" style="max-width:100%;max-height:100%;object-fit:contain;transform:scale(1);transition:transform 0.3s;">
                <button onclick="closeZoom()" style="position:fixed;top:20px;right:20px;background:#fff;border:none;border-radius:50%;width:40px;height:40px;font-size:1.2rem;cursor:pointer;z-index:10000;">✕</button>
            </div>

            <!-- THUMBNAILS -->
            ${images.length > 1 ? `
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:20px;">
                ${images.map((img, i) => `
                    <div onclick="switchImage(${i})" id="thumb-wrap-${i}"
                        style="aspect-ratio:1/1;border-radius:8px;overflow:hidden;cursor:pointer;border:2px solid ${i===0?'#fff':'#333'};transition:border 0.2s;">
                        <img src="${img}" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.style.display='none'">
                    </div>
                `).join('')}
            </div>` : ''}

            <!-- NAME -->
            <h1 style="font-size:1.6rem;font-weight:800;color:#fff;margin-bottom:8px;line-height:1.2;">${product.name}</h1>

            <!-- RATING -->
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:16px;">
                <div>${[1,2,3,4,5].map(s => `<span style="font-size:1.1rem;color:${s<=Math.round(product.rating||0)?'#f59e0b':'#444'};">★</span>`).join('')}</div>
                <span style="color:#888;font-size:0.85rem;">${product.rating ? `${product.rating} reviews` : '0 reviews'}</span>
            </div>

            <!-- PRICE -->
            <div style="margin-bottom:20px;">
                ${hasDiscount ? `<p style="color:#888;font-size:0.85rem;margin-bottom:4px;">Special Price</p>` : ''}
                <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
                    ${hasDiscount ? `<span style="color:#888;font-size:1.1rem;text-decoration:line-through;">₹${Number(product.originalPrice).toLocaleString()}</span>` : ''}
                    <span id="productPrice" style="color:#fff;font-size:1.8rem;font-weight:800;">₹${Number(product.price).toLocaleString()}</span>
                    ${savePercent > 0 ? `<span style="background:#16a34a;color:#fff;font-size:0.85rem;font-weight:700;padding:4px 10px;border-radius:20px;">Save ${savePercent}%</span>` : ''}
                </div>
            </div>

            <!-- COLOR VARIANTS -->
            ${hasVariants ? `
            <div style="margin-bottom:20px;padding:16px;background:#111;border-radius:12px;border:1px solid #222;">
                <p style="color:#aaa;font-size:0.85rem;margin-bottom:10px;">
                    ${product.variantTitle || 'Color'}:
                    <span id="selectedColorName" style="color:#fff;font-weight:700;margin-left:4px;">${product.variants[0].name}</span>
                </p>
                <div style="display:flex;gap:10px;flex-wrap:wrap;">
                    ${product.variants.map((v, i) => `
                        <button onclick="selectVariant(${i})" id="variantBtn-${i}" title="${v.name}"
                            style="width:36px;height:36px;border-radius:50%;background:${v.name.toLowerCase()};
                            border:${i===0?'3px solid #fff':'2px solid #555'};cursor:pointer;transition:all 0.2s;
                            box-shadow:${i===0?'0 0 0 2px rgba(255,255,255,0.3)':'none'};">
                        </button>
                    `).join('')}
                </div>
            </div>` : ''}

            <!-- IN CART MSG -->
            <div id="inCartMsg" style="display:${inCart?'flex':'none'};align-items:center;gap:8px;color:#4ade80;font-weight:600;margin-bottom:12px;">
                <i class="ph ph-check-circle" style="font-size:1.2rem;"></i> This item is in your cart
            </div>

            <!-- BUY NOW -->
            <button onclick="buyNow('${product.id}')"
                style="width:100%;padding:18px;background:${outOfStock?'#333':'#16a34a'};color:${outOfStock?'#666':'#fff'};border:none;border-radius:12px;font-size:1.1rem;font-weight:700;cursor:${outOfStock?'not-allowed':'pointer'};display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:12px;"
                ${outOfStock ? 'disabled' : ''}>
                <i class="ph-bold ph-lightning"></i>
                ${outOfStock ? 'Out of Stock' : 'Buy Now'}
            </button>

            <!-- ADD TO CART -->
            <button onclick="addToCartFromPage('${product.id}')" id="addToCartBtn"
                style="width:100%;padding:16px;background:transparent;color:#fff;border:2px solid #333;border-radius:12px;font-size:1rem;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:20px;"
                ${outOfStock ? 'disabled style="width:100%;padding:16px;background:transparent;color:#555;border:2px solid #222;border-radius:12px;font-size:1rem;font-weight:600;cursor:not-allowed;display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:20px;"' : ''}>
                <i class="ph ph-shopping-bag"></i>
                ${inCart ? 'View in Cart' : 'Add to Cart'}
            </button>

            <!-- BUTTON GUIDE -->
            <div style="border:1px solid #222;border-radius:12px;padding:16px;margin-bottom:20px;">
                <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;">
                    <i class="ph-bold ph-lightning" style="color:#16a34a;font-size:1rem;margin-top:2px;flex-shrink:0;"></i>
                    <p style="color:#aaa;font-size:0.85rem;margin:0;"><span style="color:#fff;font-weight:600;">Buy Now:</span> Add to cart and proceed to checkout immediately</p>
                </div>
                <div style="display:flex;align-items:flex-start;gap:10px;">
                    <i class="ph ph-shopping-bag" style="color:#888;font-size:1rem;margin-top:2px;flex-shrink:0;"></i>
                    <p style="color:#aaa;font-size:0.85rem;margin:0;"><span style="color:#fff;font-weight:600;">Add to Cart:</span> Add to cart and continue shopping</p>
                </div>
            </div>

            <!-- DESCRIPTION -->
            <div style="border:1px solid #222;border-radius:12px;padding:16px;margin-bottom:16px;">
                <h3 style="color:#fff;font-size:1rem;font-weight:700;margin-bottom:10px;">Product Details</h3>
                <p style="color:#aaa;font-size:0.9rem;line-height:1.6;white-space:pre-line;margin:0;">${product.description || 'Premium quality product.'}</p>
            </div>

            <!-- STOCK -->
            <p style="color:${outOfStock?'#ef4444':'#4ade80'};font-size:0.85rem;font-weight:600;">
                ${outOfStock ? '✗ Out of Stock' : `✓ In Stock (${product.stock} available)`}
            </p>
        </div>`;

        if (hasVariants) selectVariant(0, false);

    } catch (error) {
        console.error('Product load error:', error);
        if (loadingEl) loadingEl.style.display = 'none';
        detailArea.style.display = 'block';
        detailArea.innerHTML = `<h2 style="text-align:center;color:#888;">Failed to load. Please refresh.</h2>`;
    }
}

// --- IMAGE ZOOM ---
window.toggleZoom = (container) => {
    const overlay = document.getElementById('zoomOverlay');
    const zoomImg = document.getElementById('zoomImage');
    const mainImg = document.getElementById('mainProductImage');
    if (!overlay || !zoomImg || !mainImg) return;
    zoomImg.src = mainImg.src;
    overlay.style.display = 'flex';
    document.body.style.overflow = 'hidden';
};

window.closeZoom = () => {
    const overlay = document.getElementById('zoomOverlay');
    if (overlay) overlay.style.display = 'none';
    document.body.style.overflow = '';
};

// --- SWITCH IMAGE ---
window.switchImage = (index) => {
    const product = state.currentProduct;
    if (!product) return;
    const images = product.images && product.images.length > 0 ? product.images : [product.imageURL];
    state.currentImageIndex = index;
    const mainImg = document.getElementById('mainProductImage');
    if (mainImg && images[index]) {
        mainImg.style.opacity = '0';
        setTimeout(() => { mainImg.src = images[index]; mainImg.style.opacity = '1'; }, 150);
    }
    images.forEach((_, i) => {
        const tw = document.getElementById(`thumb-wrap-${i}`);
        if (tw) tw.style.border = `2px solid ${i===index?'#fff':'#333'}`;
    });
};

// --- SELECT VARIANT ---
window.selectVariant = (index, updateImage = true) => {
    const product = state.currentProduct;
    if (!product || !product.variants) return;
    const variant = product.variants[index];
    state.selectedVariant = variant;
    const nameEl = document.getElementById('selectedColorName');
    if (nameEl) nameEl.textContent = variant.name;
    const priceEl = document.getElementById('productPrice');
    if (priceEl) priceEl.textContent = `₹${Number(variant.price || product.price).toLocaleString()}`;
    if (updateImage && variant.image) {
        const mainImg = document.getElementById('mainProductImage');
        if (mainImg) {
            mainImg.style.opacity = '0';
            setTimeout(() => { mainImg.src = variant.image; mainImg.style.opacity = '1'; }, 150);
        }
    }
    product.variants.forEach((_, i) => {
        const btn = document.getElementById(`variantBtn-${i}`);
        if (btn) {
            btn.style.border = i===index ? '3px solid #fff' : '2px solid #555';
            btn.style.boxShadow = i===index ? '0 0 0 2px rgba(255,255,255,0.3)' : 'none';
        }
    });
};

// --- ADD TO CART FROM PRODUCT PAGE ---
window.addToCartFromPage = (productId) => {
    const inCart = state.cart.some(i => i.id === productId);
    if (inCart) { toggleCart(true); return; }
    addToCart(productId, true);
    const btn = document.getElementById('addToCartBtn');
    if (btn) btn.innerHTML = `<i class="ph ph-check"></i> View in Cart`;
    const msg = document.getElementById('inCartMsg');
    if (msg) msg.style.display = 'flex';
};

function applySiteAssets() {
    const logoImg = document.querySelector('.brand-logo img');
    if (logoImg && SITE_ASSETS.logo) logoImg.src = SITE_ASSETS.logo;
    const bannerEl = document.querySelector('.banner-image');
    if (bannerEl) bannerEl.style.backgroundImage = `url('${SITE_ASSETS.heroBanner}')`;
}

function setupSearch() {
    document.querySelectorAll('.search-bar').forEach(bar => {
        const input = bar.querySelector('input');
        const btn = bar.querySelector('button');
        const doSearch = () => { const q = input.value.trim(); if (q) window.location.href = `catalog.html?search=${encodeURIComponent(q)}`; };
        if (btn) btn.addEventListener('click', doSearch);
        if (input) input.addEventListener('keypress', e => { if (e.key === 'Enter') doSearch(); });
    });
}

window.toggleMobileMenu = () => document.body.classList.toggle('mobile-menu-active');

window.addToCart = (productId, silent = false) => {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    if (Number(product.stock) === 0) { alert("Sorry, this product is out of stock!"); return; }
    const price = state.selectedVariant?.price || product.price;
    const variantName = state.selectedVariant?.name || '';
    const cartId = variantName ? `${productId}-${variantName}` : productId;
    const existing = state.cart.find(item => item.cartId === cartId);
    if (existing) existing.quantity += 1;
    else state.cart.push({
        cartId, id: productId,
        name: product.name + (variantName ? ` (${variantName})` : ''),
        price: Number(price),
        imageURL: state.selectedVariant?.image || product.imageURL,
        quantity: 1
    });
    updateCartUI();
    if (!silent) toggleCart(true);
};

window.removeFromCart = (cartId) => {
    state.cart = state.cart.filter(item => item.cartId !== cartId);
    updateCartUI();
};

window.updateQuantity = (cartId, delta) => {
    const item = state.cart.find(i => i.cartId === cartId);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) state.cart = state.cart.filter(i => i.cartId !== cartId);
    updateCartUI();
};

window.toggleCart = (forceOpen = null) => {
    if (forceOpen === true) document.body.classList.add('cart-active');
    else if (forceOpen === false) document.body.classList.remove('cart-active');
    else document.body.classList.toggle('cart-active');
};

function updateCartUI() {
    const totalItems = state.cart.reduce((s, i) => s + i.quantity, 0);
    const totalPrice = state.cart.reduce((s, i) => s + (i.price * i.quantity), 0);
    if (elements.cartBadge) elements.cartBadge.textContent = totalItems;
    if (elements.cartSubtotal) elements.cartSubtotal.textContent = `Rs. ${totalPrice.toLocaleString()}`;
    if (elements.cartTotal) elements.cartTotal.textContent = `Rs. ${totalPrice.toLocaleString()}`;
    if (!elements.cartItemsContainer) return;
    if (state.cart.length === 0) {
        elements.cartItemsContainer.innerHTML = `<div class="empty-cart-message">Your cart is currently empty.</div>`;
        return;
    }
    elements.cartItemsContainer.innerHTML = state.cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-img">
                ${item.imageURL ? `<img src="${item.imageURL}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;border-radius:6px;">` : `<i class="ph ph-watch"></i>`}
            </div>
            <div class="cart-item-details">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">Rs. ${Number(item.price).toLocaleString()}</div>
                <div style="display:flex;justify-content:space-between;align-items:flex-end;width:100%;">
                    <div class="cart-qty-ctrl">
                        <button onclick="updateQuantity('${item.cartId}',-1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateQuantity('${item.cartId}',1)">+</button>
                    </div>
                    <button class="icon-btn" style="color:#888;font-size:1.2rem" onclick="removeFromCart('${item.cartId}')"><i class="ph ph-trash"></i></button>
                </div>
            </div>
        </div>`).join('');
}

window.buyNow = (productId) => { state.cart = []; addToCart(productId, true); openCheckout(); };

window.openCheckout = () => {
    if (state.cart.length === 0) { alert("Your cart is empty!"); return; }
    toggleCart(false);
    document.body.classList.add('checkout-active');
    renderCheckoutSummary();
    if (elements.checkoutFeedback) { elements.checkoutFeedback.className = 'feedback-msg'; elements.checkoutFeedback.style.display = 'none'; }
    document.getElementById('checkoutForm')?.reset();
    // Hide COD notice on open
    const codNotice = document.getElementById('codNotice');
    if (codNotice) codNotice.style.display = 'none';
    const codFeeRow = document.getElementById('codFeeRow');
    if (codFeeRow) codFeeRow.style.display = 'none';
};

window.closeCheckout = () => document.body.classList.remove('checkout-active');

function renderCheckoutSummary(isCod = false) {
    const subtotal = state.cart.reduce((s, i) => s + (i.price * i.quantity), 0);
    const total = isCod ? subtotal + COD_FEE : subtotal;

    if (elements.summarySubtotal) elements.summarySubtotal.textContent = `Rs. ${subtotal.toLocaleString()}`;
    if (elements.summaryTotal) elements.summaryTotal.textContent = `Rs. ${total.toLocaleString()}`;

    const codFeeRow = document.getElementById('codFeeRow');
    if (codFeeRow) codFeeRow.style.display = isCod ? 'flex' : 'none';

    if (elements.summaryItemsContainer) {
        elements.summaryItemsContainer.innerHTML = state.cart.map(item => `
            <div class="summary-item">
                <div style="flex:1;"><span style="font-weight:600">${item.name}</span><span style="color:#888;font-size:0.85rem"> x${item.quantity}</span></div>
                <strong>Rs. ${(item.price * item.quantity).toLocaleString()}</strong>
            </div>`).join('');
    }
}

window.selectPayment = (type) => {
    document.querySelectorAll('.payment-card').forEach(c => c.classList.remove('active'));
    const radio = document.getElementById({ online: 'payOnline', cod: 'payCod' }[type]);
    if (radio) { radio.checked = true; radio.closest('.payment-card').classList.add('active'); }

    // Show/hide COD notice and update total
    const codNotice = document.getElementById('codNotice');
    const isCod = type === 'cod';
    if (codNotice) codNotice.style.display = isCod ? 'block' : 'none';
    renderCheckoutSummary(isCod);
};

async function saveOrderToFirebase(orderData) {
    const docRef = await addDoc(collection(db, "orders"), {
        ...orderData,
        createdAt: new Date(),
        status: orderData.paymentMethod === "cod" ? "pending" : "confirmed"
    });
    return docRef.id;
}

async function openRazorpay(orderDetails) {
    return new Promise((resolve, reject) => {
        const options = {
            key: RAZORPAY_KEY_ID,
            amount: orderDetails.total * 100,
            currency: STORE_CURRENCY,
            name: STORE_NAME,
            description: `Order - ${orderDetails.items.length} item(s)`,
            prefill: { name: orderDetails.customerName, contact: orderDetails.customerPhone, email: orderDetails.customerEmail },
            theme: { color: "#16a34a" },
            modal: { ondismiss: () => reject(new Error('Payment cancelled by user')) },
            handler: function(response) {
                resolve({ paymentId: response.razorpay_payment_id, orderId: response.razorpay_order_id || '' });
            }
        };
        if (!window.Razorpay) { reject(new Error('Razorpay SDK not loaded. Please refresh.')); return; }
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', r => reject(new Error(r.error.description)));
        rzp.open();
    });
}

window.submitOrder = async () => {
    const name     = document.getElementById('chkName').value.trim();
    const phone    = document.getElementById('chkPhone').value.trim();
    const email    = document.getElementById('chkEmail').value.trim();
    const altPhone = document.getElementById('chkAltPhone').value.trim();
    const address  = document.getElementById('chkAddress').value.trim();
    const size     = document.getElementById('chkSize')?.value || 'N/A';
    const pin      = document.getElementById('chkPin').value.trim();
    const city     = document.getElementById('chkCity').value.trim();
    const stateVal = document.getElementById('chkState').value.trim();
    const landmark = document.getElementById('chkLandmark').value.trim();
    const insta    = document.getElementById('chkInsta').value.trim();
    const paymentRadio = document.querySelector('input[name="paymentMethod"]:checked');
    const btn = document.querySelector('.place-order-btn');

    if (!paymentRadio) { alert("Please select a payment method."); return; }
    if (!email) { alert("Please enter your email address."); return; }

    const paymentMethod = paymentRadio.value;
    const isCod = paymentMethod === 'cod';
    const subtotal = state.cart.reduce((s, i) => s + (i.price * i.quantity), 0);
    const totalPrice = isCod ? subtotal + COD_FEE : subtotal;

    const items = state.cart.map(item => ({
        id: item.id, name: item.name,
        price: item.price, quantity: item.quantity,
        total: item.price * item.quantity
    }));

    const orderData = {
        customerName: name, customerPhone: phone,
        customerEmail: email, customerAltPhone: altPhone,
        customerAddress: address, customerSize: size,
        customerPin: pin, customerCity: city,
        customerState: stateVal, customerLandmark: landmark,
        customerInsta: insta, items,
        subtotal, total: totalPrice,
        codFee: isCod ? COD_FEE : 0,
    };

    btn.innerHTML = `Processing...`;
    btn.disabled = true;

    try {
        if (paymentMethod === 'online') {
            if (elements.checkoutFeedback) {
                elements.checkoutFeedback.style.display = 'block';
                elements.checkoutFeedback.className = 'feedback-msg feedback-success';
                elements.checkoutFeedback.innerHTML = `Opening payment gateway...`;
            }
            try {
                const payment = await openRazorpay({ ...orderData });
                const orderId = await saveOrderToFirebase({
                    ...orderData, paymentMethod: "online",
                    paymentId: payment.paymentId, razorpayOrderId: payment.orderId,
                });
                completeOrderFlow();
                window.location.href = `success.html?orderId=${orderId}`;
            } catch (paymentError) {
                if (elements.checkoutFeedback) {
                    elements.checkoutFeedback.style.display = 'block';
                    elements.checkoutFeedback.className = 'feedback-msg feedback-error';
                    elements.checkoutFeedback.innerHTML = `❌ ${paymentError.message}`;
                }
                btn.innerHTML = `PLACE ORDER <i class="ph-bold ph-lightning"></i>`;
                btn.disabled = false;
            }
        } else {
            // COD
            if (elements.checkoutFeedback) {
                elements.checkoutFeedback.style.display = 'block';
                elements.checkoutFeedback.className = 'feedback-msg feedback-success';
                elements.checkoutFeedback.innerHTML = `Placing your COD order...`;
            }
            const orderId = await saveOrderToFirebase({
                ...orderData, paymentMethod: "cod", paymentId: "COD",
            });
            completeOrderFlow();
            window.location.href = `success.html?orderId=${orderId}`;
        }
    } catch (error) {
        console.error('Order error:', error);
        if (elements.checkoutFeedback) {
            elements.checkoutFeedback.style.display = 'block';
            elements.checkoutFeedback.className = 'feedback-msg feedback-error';
            elements.checkoutFeedback.innerHTML = `❌ Something went wrong. Please try again.`;
        }
        btn.innerHTML = `PLACE ORDER <i class="ph-bold ph-lightning"></i>`;
        btn.disabled = false;
    }
};

function completeOrderFlow() {
    state.cart = [];
    updateCartUI();
    closeCheckout();
    const btn = document.querySelector('.place-order-btn');
    if (btn) { btn.innerHTML = `PLACE ORDER <i class="ph-bold ph-lightning"></i>`; btn.disabled = false; }
}
