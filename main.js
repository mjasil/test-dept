/**
 * DEPT STORE | Main Logic
 * Updated: Multi-image gallery + Color variants
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

const SITE_ASSETS = {
    logo: "assets/images/logo.png",
    heroBanner: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80",
    collections: { watch: "", shoe: "", headphone: "", airpods: "" }
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
    loadRazorpayScript();

    const isProductPage = !!document.getElementById('productDetailArea');
    const isCatalogPage = !!document.getElementById('productGrid');

    if (isProductPage) {
        await renderProductDetail();
    } else if (isCatalogPage) {
        await loadProductsFromFirebase();
        renderProducts();
    } else {
        await loadProductsFromFirebase();
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

// --- LOAD PRODUCTS ---
async function loadProductsFromFirebase() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const categoryFilter = urlParams.get('category');
        const searchFilter = urlParams.get('search');
        let snapshot;

        if (categoryFilter) {
            const q = query(collection(db, "products"), where("category", "==", categoryFilter.toLowerCase()));
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

// --- RENDER PRODUCTS (catalog page) ---
function renderProducts() {
    if (!elements.productGrid) return;

    const urlParams = new URLSearchParams(window.location.search);
    const categoryFilter = urlParams.get('category');
    const searchFilter = urlParams.get('search');

    const titleEl = document.getElementById('catalogTitle');
    if (titleEl) {
        if (categoryFilter) titleEl.textContent = categoryFilter.toUpperCase() + " COLLECTION";
        else if (searchFilter) titleEl.textContent = `RESULTS FOR "${searchFilter.toUpperCase()}"`;
    }

    const loadingEl = document.getElementById('loadingState');
    if (loadingEl) loadingEl.style.display = 'none';

    if (state.products.length === 0) {
        elements.productGrid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:#888;">No products found.</div>`;
        return;
    }

    elements.productGrid.innerHTML = state.products.map(product => {
        const imgContent = product.imageURL
            ? `<img src="${product.imageURL}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;">`
            : `<i class="ph ph-watch"></i>`;
        const hasDiscount = product.originalPrice && Number(product.originalPrice) > Number(product.price);
        const outOfStock = Number(product.stock) === 0;

        return `
        <div class="product-card">
            <a href="product.html?id=${product.id}" style="text-decoration:none;color:inherit;display:block;flex:1">
                <div class="product-img-wrap">
                    ${imgContent}
                    ${product.tag ? `<span style="position:absolute;top:10px;left:10px;background:#000;color:#fff;font-size:0.7rem;font-weight:700;padding:4px 8px;border-radius:4px;">${product.tag}</span>` : ''}
                    ${outOfStock ? `<span style="position:absolute;top:10px;right:10px;background:#ef4444;color:#fff;font-size:0.7rem;font-weight:700;padding:4px 8px;border-radius:4px;">OUT OF STOCK</span>` : ''}
                </div>
                <div class="product-body" style="padding-bottom:0;">
                    <h3>${product.name}</h3>
                    ${product.rating ? `<div class="product-rating">${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5-Math.floor(product.rating))} <span>(${product.rating})</span></div>` : ''}
                    <div class="product-price">
                        ${hasDiscount ? `<span class="old-price">Rs. ${Number(product.originalPrice).toLocaleString()}</span>` : ''}
                        <span class="new-price">Rs. ${Number(product.price).toLocaleString()}</span>
                    </div>
                    ${product.variants && product.variants.length > 0 ? `
                    <div style="display:flex;gap:4px;margin-top:8px;">
                        ${product.variants.slice(0,5).map(v => `
                            <div title="${v.name}" style="width:14px;height:14px;border-radius:50%;background:${v.name.toLowerCase()};border:1px solid #555;"></div>
                        `).join('')}
                    </div>` : ''}
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
    }).join('');
}

// --- RENDER PRODUCT DETAIL (product page) ---
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

        // Build images array
        const images = product.images && product.images.length > 0
            ? product.images
            : (product.imageURL ? [product.imageURL] : []);

        const hasDiscount = product.originalPrice && Number(product.originalPrice) > Number(product.price);
        const outOfStock = Number(product.stock) === 0;
        const hasVariants = product.variants && product.variants.length > 0;

        detailArea.innerHTML = `
            <!-- Image Gallery -->
            <div class="pd-image" style="position:relative;">
                <div id="mainImageWrap" style="width:100%;height:100%;overflow:hidden;">
                    <img id="mainProductImage"
                        src="${images[0] || ''}"
                        alt="${product.name}"
                        style="width:100%;height:100%;object-fit:cover;transition:opacity 0.3s;">
                </div>
                ${product.tag ? `<span style="position:absolute;top:20px;left:20px;background:#000;color:#fff;font-size:0.9rem;font-weight:700;padding:6px 12px;border-radius:6px;z-index:2;">${product.tag}</span>` : ''}

                <!-- Image dots -->
                ${images.length > 1 ? `
                <div id="imageDots" style="position:absolute;bottom:12px;left:50%;transform:translateX(-50%);display:flex;gap:6px;">
                    ${images.map((_, i) => `
                        <button onclick="switchImage(${i})" id="dot-${i}"
                            style="width:8px;height:8px;border-radius:50%;border:none;cursor:pointer;transition:all 0.2s;background:${i === 0 ? '#fff' : 'rgba(255,255,255,0.4)'};">
                        </button>
                    `).join('')}
                </div>` : ''}
            </div>

            <!-- Product Info -->
            <div class="pd-info">
                <h1 class="pd-title">${product.name}</h1>

                ${product.rating ? `
                <div class="pd-rating">
                    ${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5-Math.floor(product.rating))}
                    <span>(${product.rating})</span>
                </div>` : ''}

                <!-- Price — updates when color selected -->
                <div class="pd-price-wrap">
                    <span class="pd-new-price" id="productPrice">Rs. ${Number(product.price).toLocaleString()}</span>
                    ${hasDiscount ? `<span class="pd-old-price">Rs. ${Number(product.originalPrice).toLocaleString()}</span>` : ''}
                </div>

                <!-- Thumbnail strip -->
                ${images.length > 1 ? `
                <div style="display:flex;gap:8px;margin:12px 0;flex-wrap:wrap;">
                    ${images.map((img, i) => `
                        <img src="${img}" onclick="switchImage(${i})" id="thumb-${i}"
                            style="width:60px;height:60px;object-fit:cover;border-radius:6px;cursor:pointer;border:2px solid ${i === 0 ? '#fff' : '#333'};transition:border 0.2s;"
                            onerror="this.style.display='none'">
                    `).join('')}
                </div>` : ''}

                <!-- Color Variants -->
                ${hasVariants ? `
                <div style="margin:16px 0;">
                    <p style="color:#aaa;font-size:0.9rem;margin-bottom:8px;">
                        ${product.variantTitle || 'Color'}:
                        <span id="selectedColorName" style="color:#fff;font-weight:600;margin-left:4px;">
                            ${product.variants[0].name}
                        </span>
                    </p>
                    <div style="display:flex;gap:10px;flex-wrap:wrap;" id="colorSelector">
                        ${product.variants.map((v, i) => `
                            <button
                                onclick="selectVariant(${i})"
                                id="variantBtn-${i}"
                                title="${v.name}"
                                style="
                                    width:32px;height:32px;border-radius:50%;
                                    background:${v.name.toLowerCase()};
                                    border:${i === 0 ? '3px solid #fff' : '2px solid #555'};
                                    cursor:pointer;transition:all 0.2s;
                                    box-shadow:${i === 0 ? '0 0 0 2px #000' : 'none'};
                                ">
                            </button>
                        `).join('')}
                    </div>
                </div>` : ''}

                <!-- Description -->
                <p class="pd-desc" style="white-space:pre-line;">${product.description || 'Premium quality product.'}</p>

                <!-- Stock -->
                <p style="color:${outOfStock ? '#ef4444' : '#4ade80'};font-weight:600;margin-bottom:1rem;">
                    ${outOfStock ? '✗ Out of Stock' : `✓ In Stock (${product.stock} available)`}
                </p>

                <!-- Actions -->
                <div class="pd-actions">
                    <button class="btn btn-green" onclick="buyNow('${product.id}')" ${outOfStock ? 'disabled style="opacity:0.5;"' : ''}>BUY NOW</button>
                    <button class="btn btn-outline" onclick="addToCart('${product.id}')" ${outOfStock ? 'disabled style="opacity:0.5;"' : ''}><i class="ph ph-shopping-bag"></i> Add to Cart</button>
                </div>
            </div>`;

        // Auto select first variant
        if (hasVariants) selectVariant(0);

    } catch (error) {
        console.error('Product load error:', error);
        if (loadingEl) loadingEl.style.display = 'none';
        detailArea.style.display = 'block';
        detailArea.innerHTML = `<h2 style="text-align:center;color:#888;">Failed to load. Please refresh.</h2>`;
    }
}

// --- SWITCH IMAGE ---
window.switchImage = (index) => {
    const product = state.currentProduct;
    if (!product) return;

    const images = product.images && product.images.length > 0
        ? product.images : [product.imageURL];

    state.currentImageIndex = index;

    const mainImg = document.getElementById('mainProductImage');
    if (mainImg && images[index]) {
        mainImg.style.opacity = '0';
        setTimeout(() => {
            mainImg.src = images[index];
            mainImg.style.opacity = '1';
        }, 150);
    }

    // Update dots
    images.forEach((_, i) => {
        const dot = document.getElementById(`dot-${i}`);
        if (dot) dot.style.background = i === index ? '#fff' : 'rgba(255,255,255,0.4)';
        const thumb = document.getElementById(`thumb-${i}`);
        if (thumb) thumb.style.border = `2px solid ${i === index ? '#fff' : '#333'}`;
    });
};

// --- SELECT COLOR VARIANT ---
window.selectVariant = (index) => {
    const product = state.currentProduct;
    if (!product || !product.variants) return;

    const variant = product.variants[index];
    state.selectedVariant = variant;

    // Update selected color name
    const nameEl = document.getElementById('selectedColorName');
    if (nameEl) nameEl.textContent = variant.name;

    // Update price if variant has its own price
    const priceEl = document.getElementById('productPrice');
    if (priceEl) {
        const price = variant.price || product.price;
        priceEl.textContent = `Rs. ${Number(price).toLocaleString()}`;
    }

    // Change main image to this variant's image
    if (variant.image) {
        const mainImg = document.getElementById('mainProductImage');
        if (mainImg) {
            mainImg.style.opacity = '0';
            setTimeout(() => {
                mainImg.src = variant.image;
                mainImg.style.opacity = '1';
            }, 150);
        }
    }

    // Update button borders
    product.variants.forEach((_, i) => {
        const btn = document.getElementById(`variantBtn-${i}`);
        if (btn) {
            btn.style.border = i === index ? '3px solid #fff' : '2px solid #555';
            btn.style.boxShadow = i === index ? '0 0 0 2px #000' : 'none';
        }
    });
};

// --- APPLY SITE ASSETS ---
function applySiteAssets() {
    const logoImg = document.querySelector('.brand-logo img');
    if (logoImg && SITE_ASSETS.logo) logoImg.src = SITE_ASSETS.logo;
    const bannerEl = document.querySelector('.banner-image');
    if (bannerEl) bannerEl.style.backgroundImage = `url('${SITE_ASSETS.heroBanner}')`;
    const collectionCards = document.querySelectorAll('.collection-card');
    ['watch','shoe','headphone','airpods'].forEach((key, i) => {
        const src = SITE_ASSETS.collections[key];
        if (src && collectionCards[i]) {
            const ph = collectionCards[i].querySelector('.img-placeholder');
            if (ph) { ph.style.backgroundImage = `url('${src}')`; ph.style.backgroundSize = 'cover'; }
        }
    });
}

// --- SEARCH ---
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

// --- CART ---
window.addToCart = (productId, silent = false) => {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    if (Number(product.stock) === 0) { alert("Sorry, this product is out of stock!"); return; }

    // Use selected variant price if available
    const price = state.selectedVariant?.price || product.price;
    const variantName = state.selectedVariant?.name || '';

    const cartId = variantName ? `${productId}-${variantName}` : productId;
    const existing = state.cart.find(item => item.cartId === cartId);

    if (existing) { existing.quantity += 1; }
    else {
        state.cart.push({
            cartId,
            id: productId,
            name: product.name + (variantName ? ` (${variantName})` : ''),
            price: Number(price),
            imageURL: state.selectedVariant?.image || product.imageURL,
            quantity: 1
        });
    }

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
    if (item.quantity <= 0) { state.cart = state.cart.filter(i => i.cartId !== cartId); }
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
};

window.closeCheckout = () => document.body.classList.remove('checkout-active');

function renderCheckoutSummary() {
    const totalPrice = state.cart.reduce((s, i) => s + (i.price * i.quantity), 0);
    if (elements.summarySubtotal) elements.summarySubtotal.textContent = `Rs. ${totalPrice.toLocaleString()}`;
    if (elements.summaryTotal) elements.summaryTotal.textContent = `Rs. ${totalPrice.toLocaleString()}`;
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
            prefill: { name: orderDetails.customerName, contact: orderDetails.customerPhone },
            theme: { color: "#000000" },
            modal: { ondismiss: () => reject(new Error('Payment cancelled by user')) },
            handler: function(response) {
                resolve({
                    paymentId: response.razorpay_payment_id,
                    orderId: response.razorpay_order_id || '',
                    signature: response.razorpay_signature || ''
                });
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
        id: item.id, name: item.name,
        price: item.price, quantity: item.quantity,
        total: item.price * item.quantity
    }));

    const orderData = {
        customerName: name, customerPhone: phone,
        customerAltPhone: altPhone, customerAddress: address,
        customerSize: size, customerPin: pin,
        customerCity: city, customerState: stateVal,
        customerLandmark: landmark, customerInsta: insta,
        items, total: totalPrice,
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
                if (elements.checkoutFeedback) elements.checkoutFeedback.innerHTML = `✅ Payment successful!`;
                setTimeout(() => {
                    alert(`✅ Payment Successful!\nOrder ID: ${orderId}\nThank you ${name}!`);
                    completeOrderFlow();
                }, 500);
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
            if (elements.checkoutFeedback) {
                elements.checkoutFeedback.style.display = 'block';
                elements.checkoutFeedback.className = 'feedback-msg feedback-success';
                elements.checkoutFeedback.innerHTML = `Placing your COD order...`;
            }
            const orderId = await saveOrderToFirebase({
                ...orderData, paymentMethod: "cod", paymentId: "COD",
            });
            setTimeout(() => {
                alert(`✅ Order Placed!\nOrder ID: ${orderId}\nWe'll call you on ${phone} to confirm.\nThank you ${name}!`);
                completeOrderFlow();
            }, 500);
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
