/**
 * DEPT STORE | Main Logic
 * Updated: Firebase Connected
 */

// ============================================================
//  🔥 FIREBASE CONFIG — PASTE YOUR CONFIG HERE
// ============================================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, query, where }
    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// ============================================================

// ============================================================
//  🎨 SITE ASSETS — CHANGE YOUR IMAGES HERE
// ============================================================
const SITE_ASSETS = {
    logo: "assets/images/logo.png",
    heroBanner: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80",
    collections: {
        watch:     "",
        shoe:      "",
        headphone: "",
        airpods:   "",
    }
};
// ============================================================

// --- STATE MANAGEMENT ---
const state = {
    cart: [],
    products: [] // Now loaded from Firebase!
};

// --- DOM ELEMENTS ---
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

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    applySiteAssets();
    setupSearch();
    await loadProductsFromFirebase(); // 🔥 Load from Firebase first
    renderProducts();
    renderProductDetail();
    updateCartUI();
});

// ============================================================
//  🔥 FIREBASE — LOAD PRODUCTS
// ============================================================
async function loadProductsFromFirebase() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const categoryFilter = urlParams.get('category');
        const searchFilter = urlParams.get('search');

        let snapshot;

        if (categoryFilter) {
            // Load only this category
            const q = query(
                collection(db, "products"),
                where("category", "==", categoryFilter.toLowerCase())
            );
            snapshot = await getDocs(q);
        } else {
            // Load all products
            snapshot = await getDocs(collection(db, "products"));
        }

        state.products = [];
        snapshot.forEach(doc => {
            state.products.push({ id: doc.id, ...doc.data() });
        });

        // If search filter, filter locally
        if (searchFilter) {
            const q = searchFilter.toLowerCase();
            state.products = state.products.filter(p =>
                p.name.toLowerCase().includes(q) ||
                (p.category && p.category.toLowerCase().includes(q))
            );
        }

        console.log("✅ Products loaded from Firebase:", state.products.length);

    } catch (error) {
        console.error("❌ Firebase load error:", error);
        // Show error in grid
        if (elements.productGrid) {
            elements.productGrid.innerHTML = `
                <div style="grid-column:1/-1; text-align:center; padding:3rem; color:var(--text-muted);">
                    Failed to load products. Please refresh.
                </div>`;
        }
    }
}

// ============================================================
//  🔥 FIREBASE — SAVE ORDER
// ============================================================
async function saveOrderToFirebase(orderData) {
    try {
        const docRef = await addDoc(collection(db, "orders"), {
            ...orderData,
            createdAt: new Date(),
            status: orderData.paymentMethod === "cod" ? "pending" : "confirmed"
        });
        console.log("✅ Order saved:", docRef.id);
        return docRef.id;
    } catch (error) {
        console.error("❌ Order save error:", error);
        throw error;
    }
}
// ============================================================

// --- SEARCH LOGIC ---
function setupSearch() {
    const searchBars = document.querySelectorAll('.search-bar');
    searchBars.forEach(bar => {
        const input = bar.querySelector('input');
        const btn = bar.querySelector('button');

        const doSearch = () => {
            const query = input.value.trim();
            if (query) {
                window.location.href = `catalog.html?search=${encodeURIComponent(query)}`;
            }
        };

        if (btn) btn.addEventListener('click', doSearch);
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') doSearch();
            });
        }
    });
}

// --- RENDER PRODUCTS ---
function renderProducts() {
    if (!elements.productGrid) return;

    const urlParams = new URLSearchParams(window.location.search);
    const categoryFilter = urlParams.get('category');
    const searchFilter = urlParams.get('search');

    // Update page title
    const titleEl = document.getElementById('catalogTitle');
    if (titleEl) {
        if (categoryFilter) {
            titleEl.textContent = categoryFilter.toUpperCase() + " COLLECTION";
        } else if (searchFilter) {
            titleEl.textContent = `SEARCH RESULTS FOR "${searchFilter.toUpperCase()}"`;
        }
    }

    if (state.products.length === 0) {
        elements.productGrid.innerHTML = `
            <div style="grid-column:1/-1; text-align:center; padding:3rem; color:var(--text-muted);">
                No products found in this category.
            </div>`;
        return;
    }

    elements.productGrid.innerHTML = state.products.map(product => {
        // Firebase products use imageURL field
        const imgContent = product.imageURL
            ? `<img src="${product.imageURL}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;">`
            : `<i class="ph ph-watch"></i>`;

        const hasDiscount = product.originalPrice && product.originalPrice > product.price;

        return `
        <div class="product-card">
            <a href="product.html?id=${product.id}" style="text-decoration:none; color:inherit; display:block; flex:1">
                <div class="product-img-wrap">
                    ${imgContent}
                    ${product.tag ? `<span style="position:absolute; top:10px; left:10px; background:var(--accent-black); color:#fff; font-size:0.7rem; font-weight:700; padding:4px 8px; border-radius:4px;">${product.tag}</span>` : ''}
                    ${product.stock === 0 ? `<span style="position:absolute; top:10px; right:10px; background:#ef4444; color:#fff; font-size:0.7rem; font-weight:700; padding:4px 8px; border-radius:4px;">OUT OF STOCK</span>` : ''}
                </div>
                <div class="product-body" style="padding-bottom:0;">
                    <h3>${product.name}</h3>
                    ${product.rating ? `
                    <div class="product-rating">
                        ${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5 - Math.floor(product.rating))} <span>(${product.rating})</span>
                    </div>` : ''}
                    <div class="product-price">
                        ${hasDiscount ? `<span class="old-price">Rs. ${Number(product.originalPrice).toLocaleString()}</span>` : ''}
                        <span class="new-price">Rs. ${Number(product.price).toLocaleString()}</span>
                    </div>
                </div>
            </a>
            <div class="product-actions" style="padding:1rem 1.25rem 1.25rem;">
                <button class="btn btn-outline btn-cart" 
                    onclick="addToCart('${product.id}')" 
                    title="Add to Cart"
                    ${product.stock === 0 ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : ''}>
                    <i class="ph ph-shopping-bag"></i>
                </button>
                <button class="btn btn-green btn-buy" 
                    onclick="buyNow('${product.id}')"
                    ${product.stock === 0 ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : ''}>
                    ${product.stock === 0 ? 'OUT OF STOCK' : 'BUY NOW'}
                </button>
            </div>
        </div>`;
    }).join('');
}

// --- RENDER SINGLE PRODUCT DETAIL ---
function renderProductDetail() {
    const detailArea = document.getElementById('productDetailArea');
    if (!detailArea) return;

    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    const product = state.products.find(p => p.id === id);

    if (!product) {
        detailArea.innerHTML = `<h2 style="text-align:center;width:100%;color:var(--text-muted)">Product not found</h2>`;
        return;
    }

    const imgContent = product.imageURL
        ? `<img src="${product.imageURL}" alt="${product.name}">`
        : `<i class="ph ph-watch"></i>`;

    const hasDiscount = product.originalPrice && product.originalPrice > product.price;

    detailArea.innerHTML = `
        <div class="pd-image">
            ${imgContent}
            ${product.tag ? `<span style="position:absolute; top:20px; left:20px; background:var(--accent-black); color:#fff; font-size:0.9rem; font-weight:700; padding:6px 12px; border-radius:6px; z-index:2;">${product.tag}</span>` : ''}
        </div>
        <div class="pd-info">
            <h1 class="pd-title">${product.name}</h1>
            ${product.rating ? `
            <div class="pd-rating">
                ${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5 - Math.floor(product.rating))} <span>(${product.rating})</span>
            </div>` : ''}
            <div class="pd-price-wrap">
                <span class="pd-new-price">Rs. ${Number(product.price).toLocaleString()}</span>
                ${hasDiscount ? `<span class="pd-old-price">Rs. ${Number(product.originalPrice).toLocaleString()}</span>` : ''}
            </div>
            <p class="pd-desc">${product.description || `Experience the premium quality of the ${product.name}. Carefully crafted for durability and style.`}</p>
            <p style="color:${product.stock > 0 ? '#4ade80' : '#ef4444'}; font-weight:600; margin-bottom:1rem;">
                ${product.stock > 0 ? `✓ In Stock (${product.stock} available)` : '✗ Out of Stock'}
            </p>
            <div class="pd-actions">
                <button class="btn btn-green" onclick="buyNow('${product.id}')" ${product.stock === 0 ? 'disabled' : ''}>BUY NOW</button>
                <button class="btn btn-outline" onclick="addToCart('${product.id}')" ${product.stock === 0 ? 'disabled' : ''}><i class="ph ph-shopping-bag"></i> Add to Cart</button>
            </div>
        </div>
    `;
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
        const key = collectionKeys[i];
        const src = SITE_ASSETS.collections[key];
        if (src) {
            const placeholder = card.querySelector('.img-placeholder');
            if (placeholder) {
                placeholder.innerHTML = '';
                placeholder.style.cssText = '';
                placeholder.style.backgroundImage = `url('${src}')`;
                placeholder.style.backgroundSize = 'cover';
                placeholder.style.backgroundPosition = 'center';
            }
        }
    });
}

// --- MOBILE MENU ---
window.toggleMobileMenu = () => {
    document.body.classList.toggle('mobile-menu-active');
};

// --- CART LOGIC ---
window.addToCart = (productId, silent = false) => {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;
    if (product.stock === 0) {
        alert("Sorry, this product is out of stock!");
        return;
    }

    const existing = state.cart.find(item => item.id === productId);
    if (existing) {
        existing.quantity += 1;
    } else {
        state.cart.push({ ...product, quantity: 1 });
    }

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
    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        updateCartUI();
    }
};

window.toggleCart = (forceOpen = null) => {
    if (forceOpen === true) document.body.classList.add('cart-active');
    else if (forceOpen === false) document.body.classList.remove('cart-active');
    else document.body.classList.toggle('cart-active');
};

function updateCartUI() {
    const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

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
                <div style="display:flex; justify-content:space-between; align-items:flex-end; width:100%;">
                    <div class="cart-qty-ctrl">
                        <button onclick="updateQuantity('${item.id}', -1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateQuantity('${item.id}', 1)">+</button>
                    </div>
                    <button class="icon-btn" style="color:var(--text-muted); font-size:1.2rem" onclick="removeFromCart('${item.id}')">
                        <i class="ph ph-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// --- CHECKOUT & BUY NOW ---
window.buyNow = (productId) => {
    state.cart = [];
    addToCart(productId, true);
    openCheckout();
};

window.openCheckout = () => {
    if (state.cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }
    toggleCart(false);
    document.body.classList.add('checkout-active');
    renderCheckoutSummary();

    elements.checkoutFeedback.className = 'feedback-msg';
    elements.checkoutFeedback.style.display = 'none';
    document.getElementById('checkoutForm').reset();
};

window.closeCheckout = () => {
    document.body.classList.remove('checkout-active');
};

function renderCheckoutSummary() {
    const totalPrice = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    if (elements.summarySubtotal) elements.summarySubtotal.textContent = `Rs. ${totalPrice.toLocaleString()}`;
    if (elements.summaryTotal) elements.summaryTotal.textContent = `Rs. ${totalPrice.toLocaleString()}`;

    if (elements.summaryItemsContainer) {
        elements.summaryItemsContainer.innerHTML = state.cart.map(item => `
            <div class="summary-item">
                <div style="flex:1;">
                    <span style="font-weight:600">${item.name}</span>
                    <span style="color:var(--text-muted); font-size:0.85rem"> x${item.quantity}</span>
                </div>
                <strong>Rs. ${(item.price * item.quantity).toLocaleString()}</strong>
            </div>
        `).join('');
    }
}

window.selectPayment = (type) => {
    document.querySelectorAll('.payment-card').forEach(c => c.classList.remove('active'));
    const cardOptions = { 'online': 'payOnline', 'cod': 'payCod' };
    const radio = document.getElementById(cardOptions[type]);
    if (radio) {
        radio.checked = true;
        radio.closest('.payment-card').classList.add('active');
    }
};

// ============================================================
//  🔥 SUBMIT ORDER — Saves to Firebase
// ============================================================
window.submitOrder = async () => {
    const name = document.getElementById('chkName').value.trim();
    const phone = document.getElementById('chkPhone').value.trim();
    const altPhone = document.getElementById('chkAltPhone').value.trim();
    const address = document.getElementById('chkAddress').value.trim();
    const size = document.getElementById('chkSize');
    const sizeVal = size && size.value ? size.value : 'N/A';
    const pin = document.getElementById('chkPin').value.trim();
    const city = document.getElementById('chkCity').value.trim();
    const stateVal = document.getElementById('chkState').value.trim();
    const landmark = document.getElementById('chkLandmark').value.trim();
    const insta = document.getElementById('chkInsta').value.trim();
    const paymentRadio = document.querySelector('input[name="paymentMethod"]:checked');
    const btn = document.querySelector('.place-order-btn');

    if (!paymentRadio) {
        alert("Please select a payment method.");
        return;
    }

    const paymentMethod = paymentRadio.value;
    const totalPrice = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Build order items list
    const items = state.cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity
    }));

    // Show loading
    btn.innerHTML = `<i class="ph-bold ph-spinner" style="animation:spin 1s linear infinite;"></i> Processing...`;
    btn.disabled = true;

    try {
        if (paymentMethod === 'online') {
            // 🔥 TODO: Razorpay integration comes here later
            // For now show message
            elements.checkoutFeedback.style.display = 'block';
            elements.checkoutFeedback.className = 'feedback-msg feedback-success';
            elements.checkoutFeedback.innerHTML = `Redirecting to payment gateway...`;

            // Save order to Firebase
            const orderId = await saveOrderToFirebase({
                customerName: name,
                customerPhone: phone,
                customerAltPhone: altPhone,
                customerAddress: address,
                customerSize: sizeVal,
                customerPin: pin,
                customerCity: city,
                customerState: stateVal,
                customerLandmark: landmark,
                customerInsta: insta,
                items,
                total: totalPrice,
                paymentMethod: "online",
                paymentId: "PENDING", // Will be updated by Razorpay later
            });

            setTimeout(() => {
                alert(`✅ Order placed! Order ID: ${orderId}\nWe'll contact you on ${phone} to confirm payment.`);
                completeOrderFlow();
            }, 1500);

        } else {
            // COD — Save directly to Firebase
            elements.checkoutFeedback.style.display = 'block';
            elements.checkoutFeedback.className = 'feedback-msg feedback-success';
            elements.checkoutFeedback.innerHTML = `Placing your COD order...`;

            const orderId = await saveOrderToFirebase({
                customerName: name,
                customerPhone: phone,
                customerAltPhone: altPhone,
                customerAddress: address,
                customerSize: sizeVal,
                customerPin: pin,
                customerCity: city,
                customerState: stateVal,
                customerLandmark: landmark,
                customerInsta: insta,
                items,
                total: totalPrice,
                paymentMethod: "cod",
                paymentId: "COD",
            });

            setTimeout(() => {
                alert(`✅ Order placed successfully!\nOrder ID: ${orderId}\nWe'll call you on ${phone} to confirm delivery.`);
                completeOrderFlow();
            }, 1500);
        }

    } catch (error) {
        elements.checkoutFeedback.style.display = 'block';
        elements.checkoutFeedback.className = 'feedback-msg feedback-error';
        elements.checkoutFeedback.innerHTML = `❌ Something went wrong. Please try again.`;
        btn.innerHTML = `PLACE ORDER <i class="ph-bold ph-lightning"></i>`;
        btn.disabled = false;
    }
};
// ============================================================

function completeOrderFlow() {
    state.cart = [];
    updateCartUI();
    closeCheckout();
    const btn = document.querySelector('.place-order-btn');
    if (btn) {
        btn.innerHTML = `PLACE ORDER <i class="ph-bold ph-lightning"></i>`;
        btn.disabled = false;
    }
}
