/**
 * DEPT STORE | Main Application Logic
 * Premium, futuristic 3D eCommerce store.
 */

// --- STATE MANAGEMENT ---
const state = {
    cart: [],
    products: [
        { id: 1, name: "DEPT Phone Ultra", price: 1299, image: "ph-device-mobile", tag: "New", category: "phone" },
        { id: 2, name: "DEPT Sound Pro", price: 349, image: "ph-headphones", tag: "Trending", category: "audio" },
        { id: 3, name: "DEPT Watch Series 8", price: 599, image: "ph-watch", category: "wearable" },
        { id: 4, name: "DEPT Game Console", price: 899, image: "ph-game-controller", tag: "Limited", category: "gaming" },
        { id: 5, name: "DEPT VR Headset", price: 1499, image: "ph-headset", category: "gaming" },
        { id: 6, name: "DEPT Earbuds Alpha", price: 199, image: "ph-earbuds", tag: "Sale", category: "audio" }
    ]
};

// --- DOM ELEMENTS ---
const elements = {
    featuredGrid: document.getElementById('featuredProducts'),
    trendingCarousel: document.getElementById('trendingCarousel'),
    cartBadge: document.querySelector('.cart-badge'),
    cartItemsContainer: document.querySelector('.cart-items'),
    cartTotal: document.getElementById('cart-total-price'),
    checkoutModal: document.getElementById('checkoutModal'),
    paymentFlow: document.getElementById('paymentFlow'),
    checkoutForm: document.getElementById('checkoutForm'),
    nav: document.querySelector('.navbar'),
    scrollProgress: document.querySelector('.scroll-progress')
};

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    initProducts();
    initGSAP();
    initThreeJS();
    initVanillaTilt();
    setupScrollListeners();
});

// --- RENDER PRODUCTS ---
function initProducts() {
    // Render Featured (First 3)
    const featuredHTML = state.products.slice(0, 3).map(p => productCardTemplate(p)).join('');
    if(elements.featuredGrid) elements.featuredGrid.innerHTML = featuredHTML;

    // Render Trending (All)
    const trendingHTML = state.products.map(p => productCardTemplate(p)).join('');
    if(elements.trendingCarousel) elements.trendingCarousel.innerHTML = trendingHTML;
}

function productCardTemplate(product) {
    return `
    <div class="product-card glass-panel js-tilt" data-tilt data-tilt-max="10" data-tilt-speed="400" data-tilt-glare="true" data-tilt-max-glare="0.2">
        <div class="product-image-wrap">
            <i class="ph ${product.image} product-placeholder"></i>
            ${product.tag ? `<span class="product-tag">${product.tag}</span>` : ''}
            <div class="product-actions">
                <button class="btn btn-primary" onclick="addToCart(${product.id})">Add to Cart</button>
                <button class="icon-btn tooltip-anchor" data-tooltip="Quick View"><i class="ph ph-eye"></i></button>
            </div>
        </div>
        <div class="product-info">
            <h3>${product.name}</h3>
            <div class="product-price">$${product.price.toLocaleString()}</div>
        </div>
    </div>
    `;
}

// Custom CSS for Product Tag dynamically injected
const style = document.createElement('style');
style.textContent = `
    .product-tag {
        position: absolute; top: 1rem; right: 1rem;
        background: var(--accent-blue); color: #000;
        padding: 0.2rem 0.8rem; border-radius: 4px;
        font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
        box-shadow: 0 0 10px var(--accent-glow);
    }
`;
document.head.appendChild(style);


// --- CART LOGIC ---
function addToCart(productId) {
    const product = state.products.find(p => p.id === productId);
    if(!product) return;

    const existing = state.cart.find(item => item.id === productId);
    if(existing) {
        existing.quantity += 1;
    } else {
        state.cart.push({ ...product, quantity: 1 });
    }
    
    updateCartUI();
    
    // Animate badge
    gsap.fromTo(elements.cartBadge, 
        { scale: 1.5, backgroundColor: "#fff" }, 
        { scale: 1, backgroundColor: "var(--accent-blue)", duration: 0.5, ease: "back.out(1.7)" }
    );
}

function removeFromCart(productId) {
    state.cart = state.cart.filter(item => item.id !== productId);
    updateCartUI();
}

function updateQuantity(productId, delta) {
    const item = state.cart.find(i => i.id === productId);
    if(!item) return;
    
    item.quantity += delta;
    if(item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        updateCartUI();
    }
}

function updateCartUI() {
    // Update Badge
    const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    elements.cartBadge.textContent = totalItems;
    
    // Update Total
    const totalPrice = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    elements.cartTotal.textContent = `$${totalPrice.toLocaleString()}`;

    // Render Items
    if(state.cart.length === 0) {
        elements.cartItemsContainer.innerHTML = `
            <div class="empty-cart">
                <i class="ph ph-shopping-bag ph-3x"></i>
                <p>Your cart is empty.</p>
                <button class="btn btn-outline" onclick="toggleCart()">Continue Shopping</button>
            </div>
        `;
        return;
    }

    elements.cartItemsContainer.innerHTML = state.cart.map(item => `
        <div class="cart-item view-enter">
            <div class="cart-item-img">
                <i class="ph ${item.image}"></i>
            </div>
            <div class="cart-item-info">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">$${item.price.toLocaleString()}</div>
                <div class="cart-item-controls">
                    <div style="display:flex; gap: 0.5rem; align-items:center;">
                        <button class="qty-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                    </div>
                    <button class="icon-btn" style="width: 28px; height: 28px" onclick="removeFromCart(${item.id})">
                        <i class="ph ph-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

window.toggleCart = () => {
    document.body.classList.toggle('cart-active');
};


// --- CHECKOUT LOGIC ---
window.openCheckout = () => {
    if(state.cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }
    document.body.classList.remove('cart-active');
    document.body.classList.add('checkout-active');
    
    // Reset Flow
    elements.checkoutForm.style.display = 'block';
    elements.paymentFlow.style.display = 'none';
};

window.closeCheckout = () => {
    document.body.classList.remove('checkout-active');
};

window.simulatePaymentFlow = () => {
    // Basic Validation Check (mock)
    const inputs = elements.checkoutForm.querySelectorAll('input, textarea');
    let valid = true;
    inputs.forEach(input => {
        if(!input.value) valid = false;
    });

    if(!valid) {
        alert("Please fill in all details.");
        return;
    }

    // Switch View
    elements.checkoutForm.style.display = 'none';
    elements.paymentFlow.style.display = 'block';
    document.querySelectorAll('.step')[1].classList.add('active');

    // Simulate Processing & Success
    setTimeout(() => {
        elements.paymentFlow.innerHTML = `
            <div style="color:var(--accent-blue); font-size: 3rem; margin-bottom: 1rem;"><i class="ph ph-check-circle"></i></div>
            <h2>Payment Successful!</h2>
            <p>Order ID: #DEPT${Math.floor(Math.random()*10000)}</p>
            <p style="color:var(--text-muted); font-size:0.9rem; margin-top:2rem;">Redirecting to your dashboard...</p>
        `;
        
        setTimeout(() => {
            state.cart = [];
            updateCartUI();
            closeCheckout();
            
            // reset flow html
            setTimeout(() => {
                elements.paymentFlow.innerHTML = `
                    <div class="spinner"></div>
                    <p>Initializing secure payment gateway...</p>
                `;
                document.querySelectorAll('.step')[1].classList.remove('active');
            }, 500);

        }, 3000);
    }, 2500);
};

// Prevents form actual submit
window.handleCheckout = (e) => {
    e.preventDefault();
};


// --- UI INTERACTIONS ---
function setupScrollListeners() {
    window.addEventListener('scroll', () => {
        // Navbar blur on scroll
        if (window.scrollY > 50) {
            elements.nav.classList.add('scrolled');
        } else {
            elements.nav.classList.remove('scrolled');
        }

        // Scroll Progress
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        elements.scrollProgress.style.width = scrolled + "%";
    });
}

// Carousel Scroll
window.scrollCarousel = (direction) => {
    const scrollAmount = 320; // card width + gap
    elements.trendingCarousel.parentElement.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth'
    });
};

function initVanillaTilt() {
    if(window.VanillaTilt) {
        VanillaTilt.init(document.querySelectorAll(".js-tilt"));
    }
}


// --- GSAP ANIMATIONS ---
function initGSAP() {
    if(typeof gsap === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);

    // Hero Entry Timeline
    const tl = gsap.timeline();
    tl.to(".hero-content", {y: 0, opacity: 1, duration: 1, ease: "power4.out", delay: 0.2})
      .from(".hero-badge", {y: 20, opacity: 0, duration: 0.6}, "-=0.8")
      .from(".hero-title span", {backgroundPosition: "200% center", duration: 1.5}, "-=0.6")
      .from(".hero-cta", {y: 20, opacity: 0, duration: 0.6}, "-=0.6");

    // Sections Reveal on Scroll
    gsap.utils.toArray('.section-header').forEach(header => {
        gsap.from(header, {
            scrollTrigger: {
                trigger: header,
                start: "top 85%",
            },
            y: 30, opacity: 0, duration: 0.8, ease: "power2.out"
        });
    });

    gsap.utils.toArray('.category-card').forEach((card, i) => {
        gsap.from(card, {
            scrollTrigger: {
                trigger: ".categories-grid",
                start: "top 80%"
            },
            y: 50, opacity: 0, duration: 0.6, delay: i * 0.1, ease: "back.out(1.5)"
        });
    });

    // Parallax Banner Text
    gsap.from(".banner-content", {
        scrollTrigger: {
            trigger: ".banner-section",
            start: "top center",
            scrub: true
        },
        y: 100, opacity: 0.5
    });
}


// --- THREE.JS BACKGROUND HERO ---
function initThreeJS() {
    const container = document.getElementById('canvas-container');
    if(!container || typeof THREE === 'undefined') return;

    // Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Objects (Abstract tech gadgets floating)
    const objects = [];
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x111111,
        roughness: 0.2,
        metalness: 0.8,
        wireframe: false
    });

    const wireMaterial = new THREE.MeshBasicMaterial({
        color: 0x00D2FF,
        wireframe: true,
        transparent: true,
        opacity: 0.15
    });

    // Device Primitive 1 (Phone Shape)
    const geo1 = new THREE.BoxGeometry(1.5, 3, 0.2);
    const mesh1 = new THREE.Mesh(geo1, material);
    const mesh1Wire = new THREE.Mesh(geo1, wireMaterial);
    mesh1.add(mesh1Wire);
    mesh1.position.set(3, 0, -2);
    mesh1.rotation.set(0.5, -0.5, 0);
    scene.add(mesh1);
    objects.push({mesh: mesh1, speedX: 0.002, speedY: 0.003, speedZ: 0.001});

    // Device Primitive 2 (Watch/Square Shape)
    const geo2 = new THREE.CylinderGeometry(0.8, 0.8, 0.3, 32);
    const mesh2 = new THREE.Mesh(geo2, material);
    const mesh2Wire = new THREE.Mesh(geo2, wireMaterial);
    mesh2.add(mesh2Wire);
    mesh2.position.set(-3, 1, -4);
    mesh2.rotation.set(-0.2, 0.8, 0.5);
    scene.add(mesh2);
    objects.push({mesh: mesh2, speedX: -0.001, speedY: 0.004, speedZ: -0.002});

    // Device Primitive 3 (Earbud Shape)
    const geo3 = new THREE.SphereGeometry(0.5, 32, 32);
    const mesh3 = new THREE.Mesh(geo3, material);
    const mesh3Wire = new THREE.Mesh(geo3, wireMaterial);
    mesh3.add(mesh3Wire);
    mesh3.position.set(1, 2, -5);
    scene.add(mesh3);
    objects.push({mesh: mesh3, speedX: 0.004, speedY: -0.002, speedZ: 0.003});

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight1 = new THREE.PointLight(0x00D2FF, 2, 50); // Neon Blue
    pointLight1.position.set(5, 5, 5);
    scene.add(pointLight1);

    const pointLight2 = new THREE.PointLight(0x7A1A80, 2, 50); // Purple
    pointLight2.position.set(-5, -5, 5);
    scene.add(pointLight2);

    camera.position.z = 5;

    // Mouse Interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const documentHalfX = window.innerWidth / 2;
    const documentHalfY = window.innerHeight / 2;

    document.addEventListener('mousemove', (event) => {
        mouseX = (event.clientX - documentHalfX);
        mouseY = (event.clientY - documentHalfY);
    });

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);

        targetX = mouseX * .001;
        targetY = mouseY * .001;

        // Rotate scene slightly based on mouse
        scene.rotation.y += 0.05 * (targetX - scene.rotation.y);
        scene.rotation.x += 0.05 * (targetY - scene.rotation.x);

        // Rotate individual objects
        objects.forEach(obj => {
            obj.mesh.rotation.x += obj.speedX;
            obj.mesh.rotation.y += obj.speedY;
            obj.mesh.rotation.z += obj.speedZ;
            
            // Soft floating motion via Math.sin
            const time = Date.now() * 0.001;
            obj.mesh.position.y += Math.sin(time * 2) * 0.002;
        });

        renderer.render(scene, camera);
    }
    animate();

    // Resize Handler
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}
