// J2PGamingTech Catalog Application

// --- Product Database ---
let products = [];
let productsLoaded = false;

// --- Application State ---
let cart = [];
let currentCategory = "all";
let searchQuery = "";
// Track selected options for each product
const selectedOptionsState = {};

function updateSelectedOptionsState() {
    products.forEach(p => {
        selectedOptionsState[p.id] = {
            color: p.selectedColor || null,
            length: p.selectedLength || null,
            price: p.defaultPrice
        };
    });
}

// --- DOM Elements ---
const productsGrid = document.getElementById("products-grid");
const searchInput = document.getElementById("search-input");
const clearSearchBtn = document.getElementById("clear-search");
const categoryButtons = document.querySelectorAll(".category-btn");
const cartOverlay = document.getElementById("cart-overlay");
const cartDrawer = document.getElementById("cart-drawer");
const cartToggleBtn = document.getElementById("cart-toggle-btn");
const floatCartBtn = document.getElementById("float-cart-btn");
const closeCartBtn = document.getElementById("close-cart");
const cartItemsContainer = document.getElementById("cart-items");
const cartTotalPriceEl = document.getElementById("cart-total-price");
const cartBadgeCount = document.getElementById("cart-badge-count");
const floatCartCount = document.getElementById("float-cart-count");
const sendOrderBtn = document.getElementById("send-order-btn");

// --- Load Products from Firestore ---
async function loadProductsFromFirestore() {
    productsGrid.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>Cargando catálogo tecnológico...</p>
        </div>
    `;

    try {
        if (typeof firebase === 'undefined' || !firebase.apps.length) {
            productsGrid.innerHTML = `
                <div class="loading-spinner">
                    <i class="fa-solid fa-database" style="font-size:2.5rem;color:#4a5568"></i>
                    <p>Catálogo vacío — agrega productos desde el panel de administración.</p>
                </div>
            `;
            return;
        }

        const snapshot = await db.collection('products').orderBy('createdAt', 'desc').get();
        products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        productsLoaded = true;
        updateSelectedOptionsState();
        renderProducts();
    } catch (error) {
        console.error("Error loading products:", error);
        productsGrid.innerHTML = `
            <div class="loading-spinner">
                <i class="fa-solid fa-triangle-exclamation" style="font-size:2.5rem;color:#ff007f"></i>
                <p>Error al cargar el catálogo. Verifica la conexión con Firebase.</p>
            </div>
        `;
    }
}

// --- Initialization ---
document.addEventListener("DOMContentLoaded", () => {
    loadCartFromLocalStorage();
    setupEventListeners();
    updateCartUI();
    loadProductsFromFirestore();
});

// --- Event Listeners Setup ---
function setupEventListeners() {
    // Search
    searchInput.addEventListener("input", (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        clearSearchBtn.style.display = searchQuery ? "flex" : "none";
        renderProducts();
    });

    clearSearchBtn.addEventListener("click", () => {
        searchInput.value = "";
        searchQuery = "";
        clearSearchBtn.style.display = "none";
        renderProducts();
        searchInput.focus();
    });

    // Categories
    categoryButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            categoryButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentCategory = btn.dataset.category;
            renderProducts();
        });
    });

    // Cart Drawer Toggle
    const openCart = () => {
        cartDrawer.classList.add("open");
        cartOverlay.classList.add("open");
        document.body.style.overflow = "hidden"; // Prevent background scroll
    };

    const closeCart = () => {
        cartDrawer.classList.remove("open");
        cartOverlay.classList.remove("open");
        document.body.style.overflow = "";
    };

    cartToggleBtn.addEventListener("click", openCart);
    floatCartBtn.addEventListener("click", openCart);
    closeCartBtn.addEventListener("click", closeCart);
    cartOverlay.addEventListener("click", closeCart);

    // Send Order to WhatsApp
    sendOrderBtn.addEventListener("click", sendOrderToWhatsApp);
}

// --- Render Product Catalog ---
function renderProducts() {
    // Filter products
    const filteredProducts = products.filter(p => {
        const matchesCategory = currentCategory === "all" || p.category === currentCategory || 
            (currentCategory === "audio" && p.categoryLabel === "Moda & Regalo"); // Map Moda & Regalo under Audio for simplicity
        
        const matchesSearch = p.title.toLowerCase().includes(searchQuery) ||
            p.categoryLabel.toLowerCase().includes(searchQuery) ||
            p.use.toLowerCase().includes(searchQuery) ||
            p.features.some(f => f.toLowerCase().includes(searchQuery));
            
        return matchesCategory && matchesSearch;
    });

    // Clear grid
    productsGrid.innerHTML = "";

    if (filteredProducts.length === 0) {
        productsGrid.innerHTML = `
            <div class="loading-spinner">
                <i class="fa-solid fa-face-frown" style="font-size: 2.5rem; color: #4a5568;"></i>
                <p>No se encontraron productos coincidentes.</p>
            </div>
        `;
        return;
    }

    filteredProducts.forEach(p => {
        const card = document.createElement("div");
        card.className = "product-card";
        card.id = `card-${p.id}`;
        card.style.setProperty("--card-accent", p.accentColor);
        card.style.setProperty("--card-accent-alpha", p.accentColorAlpha);
        card.style.setProperty("--card-accent-alpha-10", p.accentColorAlpha10);

        // Get selections from state
        const state = selectedOptionsState[p.id];
        const currentPrice = state.price;

        // Construct HTML
        let optionsHTML = "";
        if (p.options) {
            optionsHTML = `<div class="product-options">`;
            
            // Render colors
            if (p.options.colors) {
                optionsHTML += `
                    <div class="option-group">
                        <span class="option-label">Color:</span>
                        <div class="option-selectors">
                `;
                p.options.colors.forEach(col => {
                    const isActive = state.color === col ? "active" : "";
                    // Select indicator dot color
                    let dotBg = "#fff";
                    if (col === "Negro") dotBg = "#1a202c";
                    else if (col === "Azul") dotBg = "#2b6cb0";
                    else if (col === "Rojo") dotBg = "#c53030";
                    else if (col === "Púrpura") dotBg = "#805ad5";
                    else if (col === "Rosado") dotBg = "#ed64a6";
                    else if (col === "Plateado") dotBg = "#cbd5e0";
                    else if (col === "Gris") dotBg = "#718096";
                    else if (col === "Transparente") dotBg = "rgba(255,255,255,0.4)";
                    
                    optionsHTML += `
                        <button class="color-btn ${isActive}" data-product="${p.id}" data-color="${col}">
                            <span class="color-dot" style="background-color: ${dotBg}"></span>
                            ${col}
                        </button>
                    `;
                });
                optionsHTML += `</div></div>`;
            }

            // Render lengths/sizes
            if (p.options.lengths) {
                optionsHTML += `
                    <div class="option-group">
                        <span class="option-label">Largo:</span>
                        <div class="option-selectors">
                `;
                p.options.lengths.forEach(len => {
                    const isActive = state.length === len.name ? "active" : "";
                    optionsHTML += `
                        <button class="size-btn ${isActive}" data-product="${p.id}" data-len="${len.name}" data-price="${len.price}">
                            ${len.name}
                        </button>
                    `;
                });
                optionsHTML += `</div></div>`;
            }

            optionsHTML += `</div>`;
        }

        // Feature list items
        const featuresListHTML = p.features.map(f => `<li>${f}</li>`).join("");

        card.innerHTML = `
            <div class="product-image-container">
                <span class="product-badge">${p.categoryLabel}</span>
                <img src="${p.image}" alt="${p.title}" class="product-image" onerror="this.src='https://placehold.co/400x400/0f0f1c/ffffff?text=${encodeURIComponent(p.title)}'">
            </div>
            <div class="product-info">
                <h3 class="product-title">${p.title}</h3>
                <p class="product-use"><strong>Uso:</strong> ${p.use}</p>
                <ul class="product-features">
                    ${featuresListHTML}
                </ul>
                ${optionsHTML}
                <div class="product-price-row">
                    <div class="product-price">
                        <span class="price-label">Precio</span>
                        <span class="price-value" id="price-display-${p.id}">S/. ${currentPrice.toFixed(2)}</span>
                    </div>
                    <button class="add-cart-btn" data-product-id="${p.id}">
                        <i class="fa-solid fa-plus"></i> Añadir
                    </button>
                </div>
            </div>
        `;

        productsGrid.appendChild(card);
    });

    // Bind dynamic option selection events
    bindOptionSelectors();
}

// --- Bind Event Listeners on Option Buttons ---
function bindOptionSelectors() {
    // Color Buttons
    document.querySelectorAll(".color-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const productId = btn.dataset.product;
            const color = btn.dataset.color;
            
            selectedOptionsState[productId].color = color;
            
            // Re-render only this card or all products
            renderProducts();
        });
    });

    // Length Buttons
    document.querySelectorAll(".size-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const productId = btn.dataset.product;
            const length = btn.dataset.len;
            const price = parseFloat(btn.dataset.price);
            
            selectedOptionsState[productId].length = length;
            selectedOptionsState[productId].price = price;
            
            renderProducts();
        });
    });

    // Add to Cart Button
    document.querySelectorAll(".add-cart-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const productId = btn.dataset.productId;
            addToCart(productId);
            
            // Micro-animation for feedback
            btn.innerHTML = `<i class="fa-solid fa-check"></i> Agregado`;
            btn.style.background = "#39ff14"; // Lime green glow feedback
            btn.style.boxShadow = "0 0 12px #39ff14";
            
            setTimeout(() => {
                renderProducts();
            }, 800);
        });
    });
}

// --- Cart Management Functions ---
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const state = selectedOptionsState[productId];
    
    // Create a unique cart item key based on selected options
    const cartKey = `${productId}-${state.color || 'none'}-${state.length || 'none'}`;
    
    const existingItem = cart.find(item => item.cartKey === cartKey);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            cartKey: cartKey,
            id: product.id,
            title: product.title,
            image: product.image,
            price: state.price,
            color: state.color,
            length: state.length,
            quantity: 1
        });
    }
    
    saveCartToLocalStorage();
    updateCartUI();
}

function updateCartUI() {
    // Calculate totals
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Update badges
    cartBadgeCount.innerText = totalCount;
    floatCartCount.innerText = totalCount;

    // Show/hide floating cart button based on items
    if (totalCount > 0) {
        floatCartBtn.style.display = "flex";
        floatCartBtn.style.transform = "scale(1)";
    } else {
        floatCartBtn.style.transform = "scale(0)";
        setTimeout(() => {
            if (cart.length === 0) floatCartBtn.style.display = "none";
        }, 300);
    }

    // Render cart items
    cartItemsContainer.innerHTML = "";
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart-state">
                <i class="fa-solid fa-cart-arrow-down"></i>
                <p>Tu carrito está vacío</p>
                <span>Selecciona productos y personaliza tus opciones para agregarlos.</span>
            </div>
        `;
        cartTotalPriceEl.innerText = "S/. 0.00";
        return;
    }

    cart.forEach(item => {
        const itemEl = document.createElement("div");
        itemEl.className = "cart-item";
        
        let optionsStr = "";
        if (item.color || item.length) {
            optionsStr = `<div class="cart-item-options">`;
            if (item.color) optionsStr += `<span>Color: ${item.color}</span>`;
            if (item.length) optionsStr += `<span>Largo: ${item.length}</span>`;
            optionsStr += `</div>`;
        }

        itemEl.innerHTML = `
            <img src="${item.image}" alt="${item.title}" class="cart-item-img" onerror="this.src='https://placehold.co/100x100/0f0f1c/ffffff?text=Tech'">
            <div class="cart-item-details">
                <h4 class="cart-item-title">${item.title}</h4>
                ${optionsStr}
                <div class="cart-item-price-qty">
                    <span class="cart-item-price">S/. ${(item.price * item.quantity).toFixed(2)}</span>
                    <div class="cart-item-qty">
                        <button class="qty-btn qty-minus" data-key="${item.cartKey}"><i class="fa-solid fa-minus"></i></button>
                        <span class="qty-val">${item.quantity}</span>
                        <button class="qty-btn qty-plus" data-key="${item.cartKey}"><i class="fa-solid fa-plus"></i></button>
                    </div>
                </div>
            </div>
            <button class="remove-item-btn" data-key="${item.cartKey}" aria-label="Eliminar item">
                <i class="fa-solid fa-trash-can"></i>
            </button>
        `;

        cartItemsContainer.appendChild(itemEl);
    });

    // Bind quantity and delete buttons in the cart drawer
    bindCartControls();
    
    // Update total price display
    cartTotalPriceEl.innerText = `S/. ${totalPrice.toFixed(2)}`;
}

function bindCartControls() {
    // Quantity Plus
    document.querySelectorAll(".qty-plus").forEach(btn => {
        btn.addEventListener("click", () => {
            const key = btn.dataset.key;
            const item = cart.find(i => i.cartKey === key);
            if (item) {
                item.quantity += 1;
                saveCartToLocalStorage();
                updateCartUI();
            }
        });
    });

    // Quantity Minus
    document.querySelectorAll(".qty-minus").forEach(btn => {
        btn.addEventListener("click", () => {
            const key = btn.dataset.key;
            const item = cart.find(i => i.cartKey === key);
            if (item) {
                item.quantity -= 1;
                if (item.quantity <= 0) {
                    cart = cart.filter(i => i.cartKey !== key);
                }
                saveCartToLocalStorage();
                updateCartUI();
            }
        });
    });

    // Remove Item Button
    document.querySelectorAll(".remove-item-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const key = btn.dataset.key;
            cart = cart.filter(i => i.cartKey !== key);
            saveCartToLocalStorage();
            updateCartUI();
        });
    });
}

// --- Local Storage Sync ---
function saveCartToLocalStorage() {
    localStorage.setItem("j2pgamingtech_cart", JSON.stringify(cart));
}

function loadCartFromLocalStorage() {
    const savedCart = localStorage.getItem("j2pgamingtech_cart");
    if (savedCart) {
        try {
            cart = JSON.parse(savedCart);
        } catch (e) {
            cart = [];
        }
    }
}

// --- WhatsApp Message Generator ---
function sendOrderToWhatsApp() {
    if (cart.length === 0) {
        alert("Tu carrito está vacío. Añade algunos productos antes de realizar el pedido.");
        return;
    }

    const phone = "51912667200"; // Store WhatsApp Phone Number with country code (+51 Peru)
    let message = "🤖 *Hola J2P GamingTech!* Me interesa comprar los siguientes productos de su catálogo:\n\n";
    
    let totalPrice = 0;
    cart.forEach((item, index) => {
        const itemSubtotal = item.price * item.quantity;
        totalPrice += itemSubtotal;
        
        let optionsList = [];
        if (item.color) optionsList.push(`Color: ${item.color}`);
        if (item.length) optionsList.push(`Largo: ${item.length}`);
        const optionsStr = optionsList.length > 0 ? ` (${optionsList.join(", ")})` : "";
        
        message += `*${index + 1}.* ${item.quantity}x _${item.title}_${optionsStr}\n`;
        message += `   Precio: S/. ${item.price.toFixed(2)} c/u  |  Subtotal: *S/. ${itemSubtotal.toFixed(2)}*\n\n`;
    });

    message += `-----------------------------------\n`;
    message += `💰 *TOTAL ESTIMADO: S/. ${totalPrice.toFixed(2)}*\n\n`;
    message += `📍 _Ubicación de entrega: Cajamarca_\n`;
    message += `📱 _Por favor confírmenme disponibilidad para concretar la compra. Gracias!_`;

    // Encode message
    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://api.whatsapp.com/send?phone=${phone}&text=${encodedMessage}`;

    // Open WhatsApp in new tab
    window.open(whatsappURL, "_blank");
}
