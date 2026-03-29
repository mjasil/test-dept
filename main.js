/**
 * DEPT STORE | Traft.in Clone Logic
 */

// --- STATE MANAGEMENT ---
const state = {
    cart: [],
    products: [
        { id: 101, name: "G-SHOCK CASIOAK BLUE", originalPrice: 4999, price: 1999, rating: 4.8, imageHolder: "ph-watch", tag: "BEST SELLER" },
        { id: 102, name: "ROLEX SUBMARINER BLACK", originalPrice: 12000, price: 3499, rating: 5.0, imageHolder: "ph-watch", tag: "PREMIUM" },
        { id: 103, name: "APPLE AIRPODS PRO GEN 2", originalPrice: 3500, price: 1199, rating: 4.5, imageHolder: "ph-earbuds", tag: "SALE" },
        { id: 104, name: "DIESEL MEGA CHIEF GOLD", originalPrice: 8000, price: 2499, rating: 4.6, imageHolder: "ph-watch" },
        { id: 105, name: "SMARTWATCH ULTRA 8", originalPrice: 2999, price: 999, rating: 4.2, imageHolder: "ph-watch" },
        { id: 106, name: "PATEK PHILIPPE NAUTILUS", originalPrice: 15000, price: 4500, rating: 4.9, imageHolder: "ph-watch", tag: "LUXURY" },
        { id: 107, name: "SAMSUNG GALAXY BUDS", originalPrice: 2500, price: 899, rating: 4.3, imageHolder: "ph-headphones" },
        { id: 108, name: "HUBLOT BIG BANG CHRONO", originalPrice: 18000, price: 5999, rating: 4.7, imageHolder: "ph-watch" }
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
    renderProducts();
    updateCartUI();
});

// --- RENDER PRODUCTS ---
function renderProducts() {
    if(!elements.productGrid) return;

    elements.productGrid.innerHTML = state.products.map(product => `
        <div class="product-card">
            <div class="product-img-wrap">
                <i class="ph ${product.imageHolder}"></i>
                ${product.tag ? `<span style="position:absolute; top:10px; left:10px; background:var(--accent-black); color:#fff; font-size:0.7rem; font-weight:700; padding:4px 8px; border-radius:4px;">${product.tag}</span>` : ''}
            </div>
            <div class="product-body">
                <h3>${product.name}</h3>
                <div class="product-rating">
                    ${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5 - Math.floor(product.rating))} <span>(${product.rating})</span>
                </div>
                <div class="product-price">
                    <span class="old-price">Rs. ${product.originalPrice}</span>
                    <span class="new-price">Rs. ${product.price}</span>
                </div>
                <div style="display: flex; gap: 0.5rem; margin-top: auto;">
                    <button class="btn btn-outline w-full" style="padding: 0.6rem; font-size:1.2rem;" onclick="addToCart(${product.id})" title="Add to Cart">
                        <i class="ph ph-shopping-bag"></i>
                    </button>
                    <button class="btn btn-green w-full" style="padding: 0.6rem; flex: 2;" onclick="buyNow(${product.id})">
                        BUY NOW
                    </button>
                </div>
            </div>
        </div>
    `).join('');
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
