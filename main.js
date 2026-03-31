/**
 * DEPT STORE | Main Logic
 * Fixed: Firebase + Product Detail
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

const SITE_ASSETS = {
    logo: "assets/images/logo.png",
    heroBanner: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80",
    collections: { watch: "", shoe: "", headphone: "", airpods: "" }
};

const state = {
    cart: [],
    products: []
};

const elements = {
    productGrid: document.getElementById('productGrid'),
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

// --- INIT ---
document.addEventListener('DOMContentLoaded', async () => {
    applySiteAssets();
    setupSearch();

    // Check which page we are on
    const isProductPage = !!document.getElementById('productDetailArea');
    const isCatalogPage = !!document.getElementById('productGrid');

    if (isProductPage) {
        await renderProductDetail(); // product.html
    } else if (isCatalogPage) {
        await loadProductsFromFirebase(); // catalog.html
        renderProducts();
    } else {
        await loadProductsFromFirebase(); // index.html (search etc)
    }

    updateCartUI();
});

// --- LOAD PRODUCTS FROM FIREBASE ---
async function loadProductsFromFirebase() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const categoryFilter = urlParams.get('category');
        const searchFilter = urlParams.get('search');

        let snapshot;

        if (categoryFilter) {
            const q = query(
                collection(db, "products"),
                where("category", "==", categoryFilter.toLowerCase())
            );
            snapshot = await getDocs(q);
        } else {
            snapshot = await getDocs(collection(db, "products"));
        }

        state.products = [];
        snapshot.forEach(d => {
            state.products.push({ id: d.id, ...d.data() });
        });

        if (searchFilter) {
            const sq = searchFilter.toLowerCase();
            state.products = state.products.filter(p =>
                p.name.toLowerCase().includes(sq) ||
                (p.category && p.category.toLowerCase().includes(sq))
            );
        }

        console.log("Products loaded:", state.products.length);
    } catch (error) {
        console.error("Firebase load error:", error);
        if (elements.productGrid) {
            elements.productGrid.innerHTML = `
                <div style="grid-column:1/-1;text-align:center;padding:3rem;color:#888;">
                    Failed to load products. Please refresh.
                </div>`;
        }
    }
}

// --- RENDER PRODUCTS (catalog.html) ---
function renderProducts() {
    if (!elements.productGrid) return;

    const urlParams = new URLSearchParams(window.location.search);
    const categoryFilter = urlParams.get('category');
    const searchFilter = urlParams.get('search');

    const titleEl = document.getElementById('catalogTitle');
    if (titleEl) {
        if (categoryFilter) {
            titleEl.textContent = categoryFilter.toUpperCase() + " COLLECTION";
        } else if (searchFilter) {
            titleEl.textContent = `RESULTS FOR "${searchFilter.toUpperCase()}"`;
        }
    }

    // Hide loading
    const loadingEl = document.getElementById('loadingState');
    if (loadingEl) loadingEl.style.display = 'none';

    if (state.products.length === 0) {
        elements.productGrid.innerHTML = `
            <div style="grid-column:1/-1;text-align:center;padding:3rem;color:#888;">
                No products found in this category.
            </div>`;
        return;
    }

    elements.productGrid.innerHTML = state.products.map(product => {
        const imgContent = product.imageURL
            ? `<img src="${product.imageURL}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;">`
            : `<i class="ph ph-watch"></i>`;
        const hasDiscount = product.originalPrice && Number(product.originalPrice) > Number(product.price);

        return `
        <div class="product-card">
            <a href="product.html?id=${product.id}" style="text-decoration:none;color:inherit;display:block;flex:1">
                <div class="product-img-wrap">
                    ${imgContent}
                    ${product.tag ? `<span style="position:absolute;top:10px;left:10px;background:#000;color:#fff;font-size:0.7rem;font-weight:700;padding:4px 8px;border-radius:4px;">${product.tag}</span>` : ''}
                    ${Number(product.stock) === 0 ? `<span style="position:absolute;top:10px;right:10px;background:#ef4444;color:#fff;font-size:0.7rem;font-weight:700;padding:4px 8px;border-radius:4px;">OUT OF STOCK</span>` : ''}
                </div>
                <div class="product-body" style="padding-bottom:0;">
                    <h3>${product.name}</h3>
                    ${product.rating ? `<div class="product-rating">${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5-Math.floor(product.rating))} <span>(${product.rating})</span></div>` : ''}
                    <div class="product-price">
                        ${hasDiscount ? `<span class="old-price">Rs. ${Number(product.originalPrice).toLocaleString()}</span>` : ''}
                        <span class="new-price">Rs. ${Number(product.price).toLocaleString()}</span>
                    </div>
                </div>
            </a>
            <div class="product-actions" style="padding:1rem 1.25rem 1.25rem;">
                <button class="btn btn-outline btn-cart"
                    onclick="addToCart('${product.id}')"
                    ${Number(product.stock) === 0 ? 'disabled style="opacity:0.4;"' : ''}>
                    <i class="ph ph-shopping-bag"></i>
                </button>
                <button class="btn btn-green btn-buy"
                    onclick="buyNow('${product.id}')"
                    ${Number(product.stock) === 0 ? 'disabled style="opacity:0.4;"' : ''}>
                    ${Number(product.stock) === 0 ? 'OUT OF STOCK' : 'BUY NOW'}
                </button>
            </div>
        </div>`;
    }).join('');
}

// --- RENDER PRODUCT DETAIL (product.html) ---
async function renderProductDetail() {
    const detailArea = document.getElementById('productDetailArea');
    const loadingEl = document.getElementById('productLoading');
    if (!detailArea) return;

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');

    if (!id) {
        if (loadingEl) loadingEl.style.display = 'none';
        detailArea.style.display = 'block';
        detailArea.innerHTML = `<h2 style="text-align:center;color:#888;">Product not found</h2>`;
        return;
    }

    try {
        // Fetch single product by ID from Firebase
        const docSnap = await getDoc(doc(db, "products", id));

        if (loadingEl) loadingEl.style.display = 'none';
        detailArea.style.display = 'block';

        if (!docSnap.exists()) {
            detailArea.innerHTML = `<h2 style="text-align:center;color:#888;">Product not found</h2>`;
            return;
        }

        const product = { id: docSnap.id, ...docSnap.data() };

        // Push to state so addToCart works
        if (!state.products.find(p => p.id === product.id)) {
            state.products.push(product);
        }

        const hasDiscount = product.originalPrice && Number(product.originalPrice) > Number(product.price);

        detailArea.innerHTML = `
            <div class="pd-image">
                ${product.imageURL
                    ? `<img src="${product.imageURL}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;">`
                    : `<i class="ph ph-watch" style="font-size:6rem;color:#555;"></i>`}
                ${product.tag ? `<span style="position:absolute;top:20px;left:20px;background:#000;color:#fff;font-size:0.9rem;font-weight:700;padding:6px 12px;border-radius:6px;z-index:2;">${product.tag}</span>` : ''}
            </div>
            <div class="pd-info">
                <h1 class="pd-title">${product.name}</h1>
                ${product.rating ? `
                <div class="pd-rating">
                    ${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5-Math.floor(product.rating))}
                    <span>(${product.rating})</span>
                </div>` : ''}
                <div class="pd-price-wrap">
                    <span class="pd-new-price">Rs. ${Number(product.price).toLocaleString()}</span>
                    ${hasDiscount ? `<span class="pd-old-price">Rs. ${Number(product.originalPrice).toLocaleString()}</span>` : ''}
                </div>
                <p class="pd-desc" style="white-space:pre-line;">
                    ${product.description || 'Premium quality product. Carefully crafted for durability and style.'}
                </p>
                <p style="color:${Number(product.stock) > 0 ? '#4ade80' : '#ef4444'};font-weight:600;margin-bottom:1rem;">
                    ${Number(product.stock) > 0 ? `✓ In Stock (${product.stock} available)` : '✗ Out of Stock'}
                </p>
                <div class="pd-actions">
                    <button class="btn btn-green"
                        onclick="buyNow('${product.id}')"
                        ${Number(product.stock) === 0 ? 'disabled style="opacity:0.5;"' : ''}>
                        BUY NOW
                    </button>
                    <button class="btn btn-outline"
                        onclick="addToCart('${product.id}')"
                        ${Number(product.stock) === 0 ? 'disabled style="opacity:0.5;"' : ''}>
                        <i class="ph ph-shopping-bag"></i> Add to Cart
                    </button>
                </div>
            </div>`;

    } catch (error) {
        console.error('Product load error:', error);
        if (loadingEl) loadingEl.style.display = 'none';
        detailArea.style.display = 'block';
        detailArea.innerHTML = `<h2 style="text-align:center;color:#888;">Failed to load. Please refresh.</h2>`;
    }
}

// --- APPLY SITE ASSETS ---
function applySiteAssets() {
    const logoImg = document.querySelector('.brand-logo img');
    if (logoImg && SITE_ASSETS.logo) logoImg.src = SITE_ASSETS.logo;

    const bannerEl = document.querySelector('.banner-image');
    if (bannerEl && SITE_ASSETS.heroBanner) {
        bannerEl.style.backgroundImage = `url('${SITE_ASSETS.heroBanner}')`;
    }

    const collectionCards = document.querySelectorAll('.collection-card');
    const collectionKeys = ['watch', 'shoe', 'headphone', 'airpods'];
    collectionCards.forEach((card, i) => {
        const src = SITE_ASSETS.collections[collectionKeys[i]];
        if (src) {
            const placeholder = card.querySelector('.img-placeholder');
            if (placeholder) {
                placeholder.style.backgroundImage = `url('${src}')`;
                placeholder.style.backgroundSize = 'cover';
                placeholder.style.backgroundPosition = 'center';
            }
        }
    });
}

// --- SEARCH ---
function setupSearch() {
    document.querySelectorAll('.search-bar').forEach(bar => {
        const input = bar.querySelector('input');
        const btn = bar.querySelector('button');
        const doSearch = () => {
            const q = input.value.trim();
            if (q) window.location.href = `catalog.html?search=${encodeURIComponent(q)}`;
        };
        if (btn) btn.addEventListener('click', doSearch);
        if (input) input.addEventListener('keypress', e => { if (e.key === 'Enter') doSearch(); });
    });
}

// --- MOBILE MENU ---
window.toggleMobileMenu = () => document.body.classList.toggle('mobile-menu-active');

// --- CART ---
window.addToCart = (productId, silent = false) => {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    if (Number(product.stock) === 0) { alert("Sorry, this product is out of stock!"); return; }

    const existing = state.cart.find(item => item.id === productId);
    if (existing) { existing.quantity += 1; }
    else { state.cart.push({ ...product, quantity: 1 }); }

    updateCartUI();
    if (!silent) toggleCart(true);
};

window.removeFromCart = (productId) => {
    state.cart = state.cart.filter(item => item.id !== productId);
    updateCartUI();
};

window.updateQuantity = (productId, delta) => {
    const item = state.cart.find(i => i.id === productId);
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) removeFromCart(productId);
    else updateCartUI();
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
                ${item.imageURL
                    ? `<img src="${item.imageURL}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;border-radius:6px;">`
                    : `<i class="ph ph-watch"></i>`}
            </div>
            <div class="cart-item-details">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">Rs. ${Number(item.price).toLocaleString()}</div>
                <div style="display:flex;justify-content:space-between;align-items:flex-end;width:100%;">
                    <div class="cart-qty-ctrl">
                        <button onclick="updateQuantity('${item.id}',-1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateQuantity('${item.id}',1)">+</button>
                    </div>
                    <button class="icon-btn" style="color:#888;font-size:1.2rem" onclick="removeFromCart('${item.id}')">
                        <i class="ph ph-trash"></i>
                    </button>
                </div>
            </div>
        </div>`).join('');
}

// --- CHECKOUT ---
window.buyNow = (productId) => {
    state.cart = [];
    addToCart(productId, true);
    openCheckout();
};

window.openCheckout = () => {
    if (state.cart.length === 0) { alert("Your cart is empty!"); return; }
    toggleCart(false);
    document.body.classList.add('checkout-active');
    renderCheckoutSummary();
    if (elements.checkoutFeedback) {
        elements.checkoutFeedback.className = 'feedback-msg';
        elements.checkoutFeedback.style.display = 'none';
    }
    document.getElementById('checkoutForm')?.reset();
};

window.closeCheckout = () => document.body.classList.remove('checkout-active');

function renderCheckoutSummary() {
    const totalPrice = state.cart.reduce((s, i) => s + (i.price * i.quantity), 0);
    if (elements.summarySubtotal) elements.summarySubtotal.textContent = `Rs. ${totalPrice.toLocaleString()}`;
    if (elements.summaryTotal) elements.summaryTotal.textContent = `Rs. ${totalPrice.toLocaleString()}`;
    if (elements.summaryItemsContainer) {
        elements.summaryItemsContainer.innerHTML = state.cart.map(item => `
            <div class="summary-item">
                <div style="flex:1;">
                    <span style="font-weight:600">${item.name}</span>
                    <span style="color:#888;font-size:0.85rem"> x${item.quantity}</span>
                </div>
                <strong>Rs. ${(item.price * item.quantity).toLocaleString()}</strong>
            </div>`).join('');
    }
}

window.selectPayment = (type) => {
    document.querySelectorAll('.payment-card').forEach(c => c.classList.remove('active'));
    const ids = { online: 'payOnline', cod: 'payCod' };
    const radio = document.getElementById(ids[type]);
    if (radio) { radio.checked = true; radio.closest('.payment-card').classList.add('active'); }
};

// --- SAVE ORDER TO FIREBASE ---
async function saveOrderToFirebase(orderData) {
    const docRef = await addDoc(collection(db, "orders"), {
        ...orderData,
        createdAt: new Date(),
        status: orderData.paymentMethod === "cod" ? "pending" : "confirmed"
    });
    return docRef.id;
}

// --- SUBMIT ORDER ---
window.submitOrder = async () => {
    const name     = document.getElementById('chkName').value.trim();
    const phone    = document.getElementById('chkPhone').value.trim();
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

    const paymentMethod = paymentRadio.value;
    const totalPrice = state.cart.reduce((s, i) => s + (i.price * i.quantity), 0);
    const items = state.cart.map(item => ({
        id: item.id, name: item.name, price: item.price,
        quantity: item.quantity, total: item.price * item.quantity
    }));

    btn.innerHTML = `Processing...`;
    btn.disabled = true;

    try {
        const orderId = await saveOrderToFirebase({
            customerName: name, customerPhone: phone,
            customerAltPhone: altPhone, customerAddress: address,
            customerSize: size, customerPin: pin,
            customerCity: city, customerState: stateVal,
            customerLandmark: landmark, customerInsta: insta,
            items, total: totalPrice,
            paymentMethod: paymentMethod,
            paymentId: paymentMethod === 'cod' ? 'COD' : 'PENDING'
        });

        if (elements.checkoutFeedback) {
            elements.checkoutFeedback.style.display = 'block';
            elements.checkoutFeedback.className = 'feedback-msg feedback-success';
            elements.checkoutFeedback.innerHTML = paymentMethod === 'cod'
                ? `Order placed! We'll call you on ${phone} to confirm.`
                : `Order placed! We'll contact you on ${phone} for payment.`;
        }

        setTimeout(() => {
            alert(`✅ Order placed!\nOrder ID: ${orderId}\nThank you ${name}!`);
            completeOrderFlow();
        }, 1500);

    } catch (error) {
        console.error('Order error:', error);
        if (elements.checkoutFeedback) {
            elements.checkoutFeedback.style.display = 'block';
            elements.checkoutFeedback.className = 'feedback-msg feedback-error';
            elements.checkoutFeedback.innerHTML = `Something went wrong. Please try again.`;
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
