/**
 * DEPT STORE | Main Logic
 */

// ============================================================
//  🎨 SITE ASSETS — CHANGE YOUR IMAGES HERE
//  Just replace the file paths below with your own images.
//  Put all image files inside the "assets/images/" folder.
// ============================================================
const SITE_ASSETS = {

    // Header logo (appears in navbar)
    logo: "assets/images/logo.png",

    // Hero banner background image
    heroBanner: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?ixlib=rb-1.2.1&auto=format&fit=crop&w=1500&q=80",

    // Collection card images (set to "" to use icon fallback)
    collections: {
        watch:     "",   // e.g. "assets/images/watch-collection.jpg"
        shoe:      "",   // e.g. "assets/images/shoe-collection.jpg"
        headphone: "",   // e.g. "assets/images/headphone-collection.jpg"
        airpods:   "",   // e.g. "assets/images/airpods-collection.jpg"
    },

    // Product images — keyed by product ID (set to "" to use icon fallback)
    // To add an image: place it in assets/images/ and add the path here
    products: {
        101: "",   // G-SHOCK CASIOAK BLUE       e.g. "assets/images/gshock.jpg"
        102: "",   // ROLEX SUBMARINER BLACK      e.g. "assets/images/rolex.jpg"
        103: "",   // APPLE AIRPODS PRO GEN 2     e.g. "assets/images/airpods.jpg"
        104: "",   // DIESEL MEGA CHIEF GOLD
        105: "",   // SMARTWATCH ULTRA 8
        106: "",   // PATEK PHILIPPE NAUTILUS
        107: "",   // SAMSUNG GALAXY BUDS
        108: "",   // HUBLOT BIG BANG CHRONO
    }
};
// ============================================================

// --- STATE MANAGEMENT ---
const state = {
    cart: [],
    products: [
        { id: 101, name: "G-SHOCK CASIOAK BLUE", originalPrice: 4999, price: 1999, rating: 4.8, category: "watch", imageHolder: "ph-watch", tag: "BEST SELLER" },
        { id: 102, name: "ROLEX SUBMARINER BLACK", originalPrice: 12000, price: 3499, rating: 5.0, category: "watch", imageHolder: "ph-watch", tag: "PREMIUM" },
        { id: 103, name: "APPLE AIRPODS PRO GEN 2", originalPrice: 3500, price: 1199, rating: 4.5, category: "airpods", imageHolder: "ph-earbuds", tag: "SALE" },
        { id: 104, name: "DIESEL MEGA CHIEF GOLD", originalPrice: 8000, price: 2499, rating: 4.6, category: "watch", imageHolder: "ph-watch" },
        { id: 105, name: "SMARTWATCH ULTRA 8", originalPrice: 2999, price: 999, rating: 4.2, category: "watch", imageHolder: "ph-watch" },
        { id: 106, name: "NIKE AIR JORDAN 1 HIGH", originalPrice: 15000, price: 4500, rating: 4.9, category: "shoe", imageHolder: "ph-sneaker", tag: "LUXURY" },
        { id: 107, name: "SONY WH-1000XM5 ANC", originalPrice: 25000, price: 8999, rating: 4.9, category: "headphone", imageHolder: "ph-headphones" },
        { id: 108, name: "HUBLOT BIG BANG CHRONO", originalPrice: 18000, price: 5999, rating: 4.7, category: "watch", imageHolder: "ph-watch" }
    ]
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
document.addEventListener('DOMContentLoaded', () => {
    applySiteAssets();
    setupSearch();
    renderProductDetail();
    renderProducts();
    updateCartUI();
});

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
    if(!elements.productGrid) return;
    
    // Check for category filter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const categoryFilter = urlParams.get('category');
    const searchFilter = urlParams.get('search');
    
    let productsToRender = state.products;
    
    if (categoryFilter) {
        productsToRender = state.products.filter(p => p.category === categoryFilter.toLowerCase());
        const titleEl = document.getElementById('catalogTitle');
        if (titleEl) {
            titleEl.textContent = categoryFilter.toUpperCase() + " COLLECTION";
        }
    } else if (searchFilter) {
        const q = searchFilter.toLowerCase();
        productsToRender = state.products.filter(p => 
            p.name.toLowerCase().includes(q) || 
            (p.tag && p.tag.toLowerCase().includes(q)) || 
            (p.category && p.category.toLowerCase().includes(q))
        );
        const titleEl = document.getElementById('catalogTitle');
        if (titleEl) {
            titleEl.textContent = `SEARCH RESULTS FOR "${searchFilter.toUpperCase()}"`;
        }
    }

    if(productsToRender.length === 0) {
        elements.productGrid.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted);">No products found in this category.</div>`;
        return;
    }

    elements.productGrid.innerHTML = productsToRender.map(product => {
        const imgSrc = SITE_ASSETS.products[product.id];
        const imgContent = imgSrc
            ? `<img src="${imgSrc}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;">`
            : `<i class="ph ${product.imageHolder}"></i>`;
        
        return `
        <div class="product-card">
            <a href="product.html?id=${product.id}" style="text-decoration:none; color:inherit; display:block; flex:1">
                <div class="product-img-wrap">
                    ${imgContent}
                    ${product.tag ? `<span style="position:absolute; top:10px; left:10px; background:var(--accent-black); color:#fff; font-size:0.7rem; font-weight:700; padding:4px 8px; border-radius:4px;">${product.tag}</span>` : ''}
                </div>
                <div class="product-body" style="padding-bottom: 0;">
                    <h3>${product.name}</h3>
                    <div class="product-rating">
                        ${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5 - Math.floor(product.rating))} <span>(${product.rating})</span>
                    </div>
                    <div class="product-price">
                        <span class="old-price">Rs. ${product.originalPrice}</span>
                        <span class="new-price">Rs. ${product.price}</span>
                    </div>
                </div>
            </a>
            <div class="product-actions" style="padding: 1rem 1.25rem 1.25rem;">
                <button class="btn btn-outline btn-cart" onclick="addToCart(${product.id})" title="Add to Cart">
                    <i class="ph ph-shopping-bag"></i>
                </button>
                <button class="btn btn-green btn-buy" onclick="buyNow(${product.id})">
                    BUY NOW
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
    const id = parseInt(urlParams.get('id'));
    const product = state.products.find(p => p.id === id);

    if (!product) {
        detailArea.innerHTML = `<h2 style="text-align:center;width:100%;color:var(--text-muted)">Product not found</h2>`;
        return;
    }

    const imgSrc = SITE_ASSETS.products[product.id];
    const imgContent = imgSrc 
        ? `<img src="${imgSrc}" alt="${product.name}">` 
        : `<i class="ph ${product.imageHolder}"></i>`;

    detailArea.innerHTML = `
        <div class="pd-image">
            ${imgContent}
            ${product.tag ? `<span style="position:absolute; top:20px; left:20px; background:var(--accent-black); color:#fff; font-size:0.9rem; font-weight:700; padding:6px 12px; border-radius:6px; z-index:2;">${product.tag}</span>` : ''}
        </div>
        <div class="pd-info">
            <h1 class="pd-title">${product.name}</h1>
            <div class="pd-rating">
                ${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5 - Math.floor(product.rating))} <span>(${product.rating})</span>
            </div>
            <div class="pd-price-wrap">
                <span class="pd-new-price">Rs. ${product.price}</span>
                <span class="pd-old-price">Rs. ${product.originalPrice}</span>
            </div>
            <p class="pd-desc">
                Experience the premium quality of the ${product.name}. Carefully crafted for durability and style, providing unmatched comfort and performance for daily use.
            </p>
            <div class="pd-actions">
                <button class="btn btn-green" onclick="buyNow(${product.id})">BUY NOW</button>
                <button class="btn btn-outline" onclick="addToCart(${product.id})"><i class="ph ph-shopping-bag"></i> Add to Cart</button>
            </div>
        </div>
    `;
}

// --- APPLY SITE ASSETS ---
function applySiteAssets() {
    // Logo
    const logoImg = document.querySelector('.brand-logo img');
    if(logoImg && SITE_ASSETS.logo) logoImg.src = SITE_ASSETS.logo;

    // Hero banner
    const bannerEl = document.querySelector('.banner-image');
    if(bannerEl && SITE_ASSETS.heroBanner) {
        bannerEl.style.backgroundImage = `url('${SITE_ASSETS.heroBanner}')`;
    }

    // Collection images
    const collectionCards = document.querySelectorAll('.collection-card');
    const collectionKeys = ['watch', 'shoe', 'headphone', 'airpods'];
    collectionCards.forEach((card, i) => {
        const key = collectionKeys[i];
        const src = SITE_ASSETS.collections[key];
        if(src) {
            const placeholder = card.querySelector('.img-placeholder');
            if(placeholder) {
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
    if(!product) return;

    const existing = state.cart.find(item => item.id === productId);
    if(existing) {
        existing.quantity += 1;
    } else {
        state.cart.push({ ...product, quantity: 1 });
    }
    
    updateCartUI();
    if(!silent) toggleCart(true); // Open cart automatically
};

window.removeFromCart = (productId) => {
    state.cart = state.cart.filter(item => item.id !== productId);
    updateCartUI();
};

window.updateQuantity = (productId, delta) => {
    const item = state.cart.find(i => i.id === productId);
    if(!item) return;
    
    item.quantity += delta;
    if(item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        updateCartUI();
    }
};

window.toggleCart = (forceOpen = null) => {
    if(forceOpen === true) document.body.classList.add('cart-active');
    else if(forceOpen === false) document.body.classList.remove('cart-active');
    else document.body.classList.toggle('cart-active');
};

function updateCartUI() {
    // Totals
    const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Badge Update
    if(elements.cartBadge) elements.cartBadge.textContent = totalItems;
    
    // Sidebar Prices
    if(elements.cartSubtotal) elements.cartSubtotal.textContent = `Rs. ${totalPrice.toLocaleString()}`;
    if(elements.cartTotal) elements.cartTotal.textContent = `Rs. ${totalPrice.toLocaleString()}`;

    // Render HTML Items in Sidebar
    if(!elements.cartItemsContainer) return;
    
    if(state.cart.length === 0) {
        elements.cartItemsContainer.innerHTML = `<div class="empty-cart-message">Your cart is currently empty.</div>`;
        return;
    }

    elements.cartItemsContainer.innerHTML = state.cart.map(item => `
        <div class="cart-item">
            <div class="cart-item-img"><i class="ph ${item.imageHolder}"></i></div>
            <div class="cart-item-details">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">Rs. ${item.price.toLocaleString()}</div>
                <div style="display: flex; justify-content: space-between; align-items: flex-end; width:100%;">
                    <div class="cart-qty-ctrl">
                        <button onclick="updateQuantity(${item.id}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateQuantity(${item.id}, 1)">+</button>
                    </div>
                    <button class="icon-btn" style="color:var(--text-muted); font-size:1.2rem" onclick="removeFromCart(${item.id})"><i class="ph ph-trash"></i></button>
                </div>
            </div>
        </div>
    `).join('');
}


// --- CHECKOUT & BUY NOW LOGIC ---
window.buyNow = (productId) => {
    // Clear cart and add only this item
    state.cart = [];
    addToCart(productId, true); // add silently
    openCheckout();
};

window.openCheckout = () => {
    if(state.cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }
    toggleCart(false); // Close sidebar
    document.body.classList.add('checkout-active');
    renderCheckoutSummary();
    
    // Reset Form and Messages
    elements.checkoutFeedback.className = 'feedback-msg';
    elements.checkoutFeedback.style.display = 'none';
    document.getElementById('checkoutForm').reset();
};

window.closeCheckout = () => {
    document.body.classList.remove('checkout-active');
};

function renderCheckoutSummary() {
    const totalPrice = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    if(elements.summarySubtotal) elements.summarySubtotal.textContent = `Rs. ${totalPrice.toLocaleString()}`;
    if(elements.summaryTotal) elements.summaryTotal.textContent = `Rs. ${totalPrice.toLocaleString()}`;
    
    if(elements.summaryItemsContainer) {
        elements.summaryItemsContainer.innerHTML = state.cart.map(item => `
            <div class="summary-item">
                <div style="flex:1;">
                    <span style="font-weight:600">${item.name}</span>
                    <span style="color:var(--text-muted); font-size:0.85rem">x ${item.quantity}</span>
                </div>
                <strong>Rs. ${(item.price * item.quantity).toLocaleString()}</strong>
            </div>
        `).join('');
    }
}

// Payment Selection Styling
window.selectPayment = (type) => {
    document.querySelectorAll('.payment-card').forEach(c => c.classList.remove('active'));
    
    const cardOptions = {
        'online': 'payOnline',
        'cod': 'payCod'
    };
    
    const radioId = cardOptions[type];
    const radio = document.getElementById(radioId);
    
    if(radio) {
        radio.checked = true;
        radio.closest('.payment-card').classList.add('active');
    }
};

window.submitOrder = () => {
    const name = document.getElementById('chkName').value;
    const phone = document.getElementById('chkPhone').value;
    const altPhone = document.getElementById('chkAltPhone').value;
    const address = document.getElementById('chkAddress').value;
    const size = document.getElementById('chkSize'); // Newly added Size element
    const sizeVal = size && size.value ? size.value : 'N/A';
    const pin = document.getElementById('chkPin').value;
    const city = document.getElementById('chkCity').value;
    const stateVal = document.getElementById('chkState').value;
    const landmark = document.getElementById('chkLandmark').value;
    const insta = document.getElementById('chkInsta').value;
    const paymentRadio = document.querySelector('input[name="paymentMethod"]:checked');
    const btn = document.querySelector('.place-order-btn');

    if(!paymentRadio) {
        alert("Please select a payment method.");
        return;
    }

    const paymentMethod = paymentRadio.value;

    // Simulate Network Request
    btn.innerHTML = `<i class="ph-bold ph-spinner" style="animation: spin 1s linear infinite;"></i> Processing...`;
    btn.disabled = true;

    setTimeout(() => {
        elements.checkoutFeedback.style.display = 'block';
        
        if(paymentMethod === 'online') {
            elements.checkoutFeedback.className = 'feedback-msg feedback-success';
            elements.checkoutFeedback.innerHTML = `Redirecting to secure payment gateway for ${name}...`;
            
            // Further mock simulation
            setTimeout(() => {
                alert(`Order Success! Thanks ${name}. Payment verified!`);
                completeOrderFlow();
            }, 1500);
            
        } else {
            // COD
            elements.checkoutFeedback.className = 'feedback-msg feedback-success';
            elements.checkoutFeedback.innerHTML = `Order completely placed via COD. We'll verify you on ${phone}.`;
            setTimeout(() => {
                completeOrderFlow();
            }, 2000);
        }
    }, 1500);
};

function completeOrderFlow() {
    state.cart = [];
    updateCartUI();
    closeCheckout();
    const btn = document.querySelector('.place-order-btn');
    btn.innerHTML = `PLACE ORDER <i class="ph-bold ph-lightning"></i>`;
    btn.disabled = false;
}
