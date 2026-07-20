// J2PGamingTech Admin Panel

// --- Category Config ---
const categoryConfig = {
    cables: {
        label: 'Cables & Accesorios',
        accent: '#00f0ff',
        alpha: 'rgba(0, 240, 255, 0.2)',
        alpha10: 'rgba(0, 240, 255, 0.1)',
        defaultCategoryLabel: 'Carga Rápida'
    },
    audio: {
        label: 'Audio & Accesorios',
        accent: '#ff007f',
        alpha: 'rgba(255, 0, 127, 0.2)',
        alpha10: 'rgba(255, 0, 127, 0.1)',
        defaultCategoryLabel: 'Audio'
    },
    'personal-care': {
        label: 'Cuidado Personal',
        accent: '#bd00ff',
        alpha: 'rgba(189, 0, 255, 0.2)',
        alpha10: 'rgba(189, 0, 255, 0.1)',
        defaultCategoryLabel: 'Cuidado Personal'
    }
};

// --- DOM Elements ---
// Auth
const loginScreen = document.getElementById('login-screen');
const adminApp = document.getElementById('admin-app');
const loginForm = document.getElementById('login-form');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginError = document.getElementById('login-error');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userEmailDisplay = document.getElementById('user-email-display');

// Navigation
const navItems = document.querySelectorAll('.nav-item');
const viewTitle = document.getElementById('view-title');
const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebarClose = document.getElementById('sidebar-close');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const sidebar = document.getElementById('sidebar');

// Dashboard
const statTotal = document.getElementById('stat-total');
const statCategories = document.getElementById('stat-categories');
const statInventory = document.getElementById('stat-inventory-value');
const statRecent = document.getElementById('stat-recent');
const categoryBreakdown = document.getElementById('category-breakdown');
const recentProductsEl = document.getElementById('recent-products');

// Products View
const productsTbody = document.getElementById('products-tbody');
const productSearch = document.getElementById('product-search');
const addProductBtn = document.getElementById('add-product-btn');

// Export
const exportBtn = document.getElementById('export-btn');
const exportPreview = document.getElementById('export-preview');

// Modal
const modalOverlay = document.getElementById('product-modal-overlay');
const modal = document.getElementById('product-modal');
const modalTitle = document.getElementById('modal-title');
const modalClose = document.getElementById('modal-close');
const modalCancel = document.getElementById('modal-cancel');
const modalSave = document.getElementById('modal-save');
const formError = document.getElementById('form-error');
const productForm = document.getElementById('product-form');
const pfId = document.getElementById('pf-id');
const pfCode = document.getElementById('pf-code');
const pfCategory = document.getElementById('pf-category');
const pfTitle = document.getElementById('pf-title');
const pfCategoryLabel = document.getElementById('pf-category-label');
const pfPrice = document.getElementById('pf-price');
const pfUse = document.getElementById('pf-use');
const pfHasOptions = document.getElementById('pf-has-options');
const optionsSection = document.getElementById('options-section');
const featuresContainer = document.getElementById('features-container');
const addFeatureBtn = document.getElementById('add-feature-btn');
const colorsContainer = document.getElementById('colors-container');
const addColorBtn = document.getElementById('add-color-btn');
const lengthsContainer = document.getElementById('lengths-container');
const addLengthBtn = document.getElementById('add-length-btn');
const imagesContainer = document.getElementById('images-container');
const addImageBtn = document.getElementById('add-image-btn');

// --- State ---
let allProducts = [];
let editingProductId = null;
let currentImageUrl = null;
let productsListener = null;

// --- Auth State Management ---
auth.onAuthStateChanged(user => {
    if (user) {
        loginScreen.style.display = 'none';
        adminApp.style.display = 'block';
        userEmailDisplay.textContent = user.email;
        loadData();
    } else {
        loginScreen.style.display = 'flex';
        adminApp.style.display = 'none';
        if (productsListener) {
            productsListener();
            productsListener = null;
        }
    }
});

loginForm.addEventListener('submit', async e => {
    e.preventDefault();
    loginError.textContent = '';
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<div class="spinner-mini"></div> Ingresando...';

    try {
        await auth.signInWithEmailAndPassword(loginEmail.value, loginPassword.value);
        loginForm.reset();
    } catch (err) {
        const messages = {
            'auth/user-not-found': 'Usuario no encontrado.',
            'auth/wrong-password': 'Contraseña incorrecta.',
            'auth/invalid-email': 'Correo electrónico inválido.',
            'auth/invalid-credential': 'Credenciales inválidas.'
        };
        loginError.textContent = messages[err.code] || 'Error al iniciar sesión. Verifica tus credenciales.';
    } finally {
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<span>Ingresar</span><i class="fa-solid fa-arrow-right"></i>';
    }
});

logoutBtn.addEventListener('click', async () => {
    await auth.signOut();
    allProducts = [];
});

// --- Navigation ---
navItems.forEach(item => {
    item.addEventListener('click', () => {
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(`view-${item.dataset.view}`).classList.add('active');
        viewTitle.textContent = item.querySelector('span').textContent;
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('open');
        }
    });
});

sidebarToggle.addEventListener('click', () => {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('open');
});

sidebarClose.addEventListener('click', () => {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('open');
});

sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('open');
});

productSearch.addEventListener('input', renderProductTable);

// --- Load Data ---
async function loadData() {
    loadDashboard();
    listenProducts();
}

function listenProducts() {
    if (productsListener) productsListener();
    productsListener = db.collection('products')
        .orderBy('createdAt', 'desc')
        .onSnapshot(snapshot => {
            allProducts = [];
            snapshot.forEach(doc => {
                allProducts.push({ id: doc.id, ...doc.data() });
            });
            renderProductTable();
            loadDashboard();
            updateExportPreview();
        }, error => {
            console.error('Error loading products:', error);
            productsTbody.innerHTML = `<tr><td colspan="7" class="table-empty">Error al cargar productos: ${error.message}</td></tr>`;
        });
}

// --- Dashboard ---
function loadDashboard() {
    const total = allProducts.length;
    statTotal.textContent = total;

    const categories = new Set(allProducts.map(p => p.category));
    statCategories.textContent = categories.size;

    const inventoryValue = allProducts.reduce((sum, p) => sum + (p.defaultPrice || 0), 0);
    statInventory.textContent = `S/. ${inventoryValue.toFixed(2)}`;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recent = allProducts.filter(p => {
        const created = p.createdAt?.toDate ? p.createdAt.toDate() : new Date(0);
        return created >= thirtyDaysAgo;
    });
    statRecent.textContent = recent.length;

    renderCategoryBreakdown();
    renderRecentProducts();
}

function renderCategoryBreakdown() {
    const counts = {};
    allProducts.forEach(p => {
        const cat = p.category || 'other';
        counts[cat] = (counts[cat] || 0) + 1;
    });

    const colors = { cables: '#00f0ff', audio: '#ff007f', 'personal-care': '#bd00ff' };
    const labels = { cables: 'Cables & Accesorios', audio: 'Audio & Accesorios', 'personal-care': 'Cuidado Personal' };

    let html = '';
    const entries = Object.entries(counts);
    if (entries.length === 0) {
        html = '<div class="loading-spinner-mini"><p style="color:#718096">Sin productos registrados.</p></div>';
    } else {
        entries.forEach(([cat, count]) => {
            html += `
                <div class="category-item">
                    <span class="category-name">
                        <span class="category-dot" style="background:${colors[cat] || '#fff'}"></span>
                        ${labels[cat] || cat}
                    </span>
                    <span class="category-count">${count}</span>
                </div>
            `;
        });
    }
    categoryBreakdown.innerHTML = html;
}

function renderRecentProducts() {
    const recent = allProducts.slice(0, 5);
    let html = '';
    if (recent.length === 0) {
        html = '<div class="loading-spinner-mini"><p style="color:#718096">Aún no hay productos.</p></div>';
    } else {
        recent.forEach(p => {
            const created = p.createdAt?.toDate ? p.createdAt.toDate() : null;
            const dateStr = created ? created.toLocaleDateString('es-PE') : '—';
            const imgUrl = (p.images && p.images[0]) || p.image || 'https://placehold.co/100x100/0f0f1c/ffffff?text=?';
            html += `
                <div class="recent-item">
                    <img src="${imgUrl}" alt="${p.title}" class="recent-img" onerror="this.src='https://placehold.co/100x100/0f0f1c/ffffff?text=?'">
                    <div class="recent-info">
                        <div class="recent-title">${p.title}</div>
                        <div class="recent-meta">${dateStr} · S/. ${(p.defaultPrice || 0).toFixed(2)}</div>
                    </div>
                </div>
            `;
        });
    }
    recentProductsEl.innerHTML = html;
}

// --- Products Table ---
function renderProductTable() {
    const query = productSearch.value.toLowerCase().trim();
    const filtered = query
        ? allProducts.filter(p =>
            p.title?.toLowerCase().includes(query) ||
            p.category?.toLowerCase().includes(query) ||
            p.categoryLabel?.toLowerCase().includes(query)
          )
        : allProducts;

    if (filtered.length === 0) {
        productsTbody.innerHTML = `<tr><td colspan="7" class="table-empty">${
            query ? 'No se encontraron productos.' : 'No hay productos registrados. ¡Agrega el primero!'
        }</td></tr>`;
        return;
    }

    const categoryBadgeClass = {
        cables: 'badge-cables',
        audio: 'badge-audio',
        'personal-care': 'badge-personal-care'
    };

    let html = '';
    filtered.forEach(p => {
        const badgeClass = categoryBadgeClass[p.category] || '';
        const hasOptions = p.options && (p.options.colors?.length || p.options.lengths?.length);
        const firstImg = (p.images && p.images[0]) || p.image || '';
        html += `
            <tr>
                <td><img src="${firstImg}" alt="" class="table-product-img" onerror="this.src='https://placehold.co/100x100/0f0f1c/ffffff?text=?'"></td>
                <td class="table-product-code">${p.code || '—'}</td>
                <td class="table-product-name">${p.title}</td>
                <td><span class="table-category-badge ${badgeClass}">${p.categoryLabel || p.category || '—'}</span></td>
                <td class="table-price">S/. ${(p.defaultPrice || 0).toFixed(2)}</td>
                <td style="text-align:center">${hasOptions ? '<span class="table-options-yes"><i class="fa-solid fa-check"></i></span>' : '<span class="table-options-no">—</span>'}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn-action btn-edit" data-id="${p.id}" title="Editar"><i class="fa-solid fa-pen"></i></button>
                        <button class="btn-action btn-delete" data-id="${p.id}" title="Eliminar"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });
    productsTbody.innerHTML = html;

    // Bind edit/delete buttons
    productsTbody.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => openEditModal(btn.dataset.id));
    });
    productsTbody.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => confirmDelete(btn.dataset.id));
    });
}

// --- Product Modal ---
function openModal(title) {
    modalTitle.textContent = title;
    modal.classList.add('open');
    modalOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    modal.classList.remove('open');
    modalOverlay.classList.remove('open');
    document.body.style.overflow = '';
    productForm.reset();
    pfId.value = '';
    editingProductId = null;
    formError.textContent = '';
    optionsSection.classList.add('hidden');
    pfHasOptions.checked = false;
    resetImagesContainer();
    resetDynamicFields();
}

function resetDynamicFields() {
    featuresContainer.innerHTML = `
        <div class="dynamic-item">
            <input type="text" class="feature-input" placeholder="Ej: Carga rápida hasta 66W">
            <button type="button" class="btn-remove-feature" title="Eliminar"><i class="fa-solid fa-trash-can"></i></button>
        </div>
    `;
    colorsContainer.innerHTML = `
        <div class="dynamic-item">
            <input type="text" class="color-input" placeholder="Ej: Negro">
            <button type="button" class="btn-remove-color" title="Eliminar"><i class="fa-solid fa-trash-can"></i></button>
        </div>
    `;
    lengthsContainer.innerHTML = `
        <div class="dynamic-item-row">
            <input type="text" class="length-name" placeholder="Ej: 1m">
            <input type="number" class="length-price" step="0.01" min="0" placeholder="S/. 0.00">
            <button type="button" class="btn-remove-length" title="Eliminar"><i class="fa-solid fa-trash-can"></i></button>
        </div>
    `;
}

function resetImagesContainer() {
    imagesContainer.innerHTML = `
        <div class="dynamic-image-item">
            <div class="image-url-row">
                <input type="url" class="image-url-input" placeholder="https://ejemplo.com/imagen1.jpg">
                <button type="button" class="btn-remove-image-url" title="Eliminar"><i class="fa-solid fa-trash-can"></i></button>
            </div>
            <div class="image-thumb-wrap hidden"><img class="image-thumb" alt="Vista previa"></div>
        </div>
    `;
    bindImageUrlPreviews();
    bindImageRemoveButtons();
}

// Close modal events
modalClose.addEventListener('click', closeModal);
modalCancel.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', closeModal);

// Category change → auto-fill label
pfCategory.addEventListener('change', () => {
    const config = categoryConfig[pfCategory.value];
    if (config && !pfCategoryLabel.value) {
        pfCategoryLabel.value = config.defaultCategoryLabel;
    }
});

// Options toggle
pfHasOptions.addEventListener('change', () => {
    optionsSection.classList.toggle('hidden', !pfHasOptions.checked);
});

// Add Product Button
addProductBtn.addEventListener('click', () => {
    editingProductId = null;
    pfCode.value = generateCode();
    openModal('Nuevo Producto');
    modalSave.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar Producto';
});

// --- Dynamic Fields ---
function addDynamicItem(container, className, placeholder) {
    const item = document.createElement('div');
    item.className = 'dynamic-item';
    item.innerHTML = `
        <input type="text" class="${className}" placeholder="${placeholder}">
        <button type="button" class="btn-remove-${className.replace('-input', '')}" title="Eliminar"><i class="fa-solid fa-trash-can"></i></button>
    `;
    container.appendChild(item);
    bindRemoveButtons(container);
}

function addLengthItem() {
    const item = document.createElement('div');
    item.className = 'dynamic-item-row';
    item.innerHTML = `
        <input type="text" class="length-name" placeholder="Ej: 1m">
        <input type="number" class="length-price" step="0.01" min="0" placeholder="S/. 0.00">
        <button type="button" class="btn-remove-length" title="Eliminar"><i class="fa-solid fa-trash-can"></i></button>
    `;
    lengthsContainer.appendChild(item);
    bindRemoveButtons(lengthsContainer);
}

function bindRemoveButtons(container) {
    container.querySelectorAll('.btn-remove-feature, .btn-remove-color, .btn-remove-length').forEach(btn => {
        btn.addEventListener('click', () => {
            const parent = btn.closest('.dynamic-item, .dynamic-item-row');
            if (parent && container.children.length > 1) {
                parent.remove();
            }
        });
    });
}

addFeatureBtn.addEventListener('click', () => addDynamicItem(featuresContainer, 'feature-input', 'Ej: Cable trenzado reforzado'));
addColorBtn.addEventListener('click', () => addDynamicItem(colorsContainer, 'color-input', 'Ej: Azul'));
addLengthBtn.addEventListener('click', addLengthItem);

// Initialize remove buttons
bindRemoveButtons(featuresContainer);
bindRemoveButtons(colorsContainer);
bindRemoveButtons(lengthsContainer);

// --- Image URL List ---
function bindImageUrlPreviews() {
    imagesContainer.querySelectorAll('.image-url-input').forEach(input => {
        input.addEventListener('input', () => {
            const wrap = input.closest('.dynamic-image-item').querySelector('.image-thumb-wrap');
            const thumb = wrap.querySelector('.image-thumb');
            const url = input.value.trim();
            if (url) {
                thumb.src = url;
                wrap.classList.remove('hidden');
            } else {
                wrap.classList.add('hidden');
                thumb.src = '';
            }
        });
        // Trigger preview if value exists
        if (input.value.trim()) {
            input.dispatchEvent(new Event('input'));
        }
    });
}

function bindImageRemoveButtons() {
    imagesContainer.querySelectorAll('.btn-remove-image-url').forEach(btn => {
        btn.addEventListener('click', () => {
            const items = imagesContainer.querySelectorAll('.dynamic-image-item');
            if (items.length > 1) {
                btn.closest('.dynamic-image-item').remove();
            }
        });
    });
}

addImageBtn.addEventListener('click', () => {
    const item = document.createElement('div');
    item.className = 'dynamic-image-item';
    item.innerHTML = `
        <div class="image-url-row">
            <input type="url" class="image-url-input" placeholder="https://ejemplo.com/imagen${imagesContainer.children.length + 1}.jpg">
            <button type="button" class="btn-remove-image-url" title="Eliminar"><i class="fa-solid fa-trash-can"></i></button>
        </div>
        <div class="image-thumb-wrap hidden"><img class="image-thumb" alt="Vista previa"></div>
    `;
    imagesContainer.appendChild(item);
    bindImageUrlPreviews();
    bindImageRemoveButtons();
});

bindImageUrlPreviews();
bindImageRemoveButtons();

// --- Save Product ---
modalSave.addEventListener('click', async () => {
    formError.textContent = '';

    // Validation
    const title = pfTitle.value.trim();
    const category = pfCategory.value;
    const price = parseFloat(pfPrice.value);
    const use = pfUse.value.trim();
    const code = pfCode.value.trim();

    if (!title) { formError.textContent = 'El nombre del producto es obligatorio.'; return; }
    if (!category) { formError.textContent = 'Selecciona una categoría.'; return; }
    if (!price || price <= 0) { formError.textContent = 'Ingresa un precio válido.'; return; }
    if (!use) { formError.textContent = 'La descripción es obligatoria.'; return; }

    // Features
    const features = [];
    featuresContainer.querySelectorAll('.feature-input').forEach(input => {
        const val = input.value.trim();
        if (val) features.push(val);
    });

    // Options
    let options = null;
    if (pfHasOptions.checked) {
        const colors = [];
        colorsContainer.querySelectorAll('.color-input').forEach(input => {
            const val = input.value.trim();
            if (val) colors.push(val);
        });
        const lengths = [];
        lengthsContainer.querySelectorAll('.dynamic-item-row').forEach(row => {
            const name = row.querySelector('.length-name')?.value.trim();
            const priceVal = parseFloat(row.querySelector('.length-price')?.value);
            if (name && !isNaN(priceVal) && priceVal >= 0) {
                lengths.push({ name, price: priceVal });
            }
        });
        if (colors.length || lengths.length) {
            options = {};
            if (colors.length) options.colors = colors;
            if (lengths.length) options.lengths = lengths;
        }
    }

    // Images array
    const productImages = [];
    imagesContainer.querySelectorAll('.image-url-input').forEach(input => {
        const url = input.value.trim();
        if (url) productImages.push(url);
    });

    // Category config
    const config = categoryConfig[category];
    const categoryLabel = pfCategoryLabel.value.trim() || config?.defaultCategoryLabel || category;

    modalSave.disabled = true;
    modalSave.innerHTML = '<div class="spinner-mini"></div> Guardando...';

    try {
        const productData = {
            code,
            title,
            category,
            categoryLabel,
            accentColor: config?.accent || '#00f0ff',
            accentColorAlpha: config?.alpha || 'rgba(0, 240, 255, 0.2)',
            accentColorAlpha10: config?.alpha10 || 'rgba(0, 240, 255, 0.1)',
            use,
            features,
            images: productImages,
            image: productImages[0] || '',
            options: options || null,
            defaultPrice: price,
            selectedColor: options?.colors?.[0] || null,
            selectedLength: options?.lengths?.[0]?.name || null,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (editingProductId) {
            await db.collection('products').doc(editingProductId).update(productData);
        } else {
            productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection('products').add(productData);
        }

        closeModal();
    } catch (err) {
        console.error('Save error:', err);
        formError.textContent = `Error al guardar: ${err.message}`;
    } finally {
        modalSave.disabled = false;
        modalSave.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar Producto';
    }
});

// --- Edit Product ---
async function openEditModal(productId) {
    try {
        const doc = await db.collection('products').doc(productId).get();
        if (!doc.exists) return;

        const data = doc.data();
        editingProductId = productId;

        pfId.value = productId;
        pfCode.value = data.code || '';
        pfCategory.value = data.category || '';
        pfTitle.value = data.title || '';
        pfCategoryLabel.value = data.categoryLabel || '';
        pfPrice.value = data.defaultPrice || '';
        pfUse.value = data.use || '';

        // Features
        featuresContainer.innerHTML = '';
        const features = data.features || [''];
        features.forEach(f => {
            const item = document.createElement('div');
            item.className = 'dynamic-item';
            item.innerHTML = `
                <input type="text" class="feature-input" value="${escapeHtml(f)}" placeholder="Ej: Carga rápida hasta 66W">
                <button type="button" class="btn-remove-feature" title="Eliminar"><i class="fa-solid fa-trash-can"></i></button>
            `;
            featuresContainer.appendChild(item);
        });
        bindRemoveButtons(featuresContainer);

        // Options
        const hasOptions = data.options && (data.options.colors?.length || data.options.lengths?.length);
        pfHasOptions.checked = !!hasOptions;
        optionsSection.classList.toggle('hidden', !hasOptions);

        // Colors
        colorsContainer.innerHTML = '';
        const colors = data.options?.colors || [''];
        colors.forEach(c => {
            const item = document.createElement('div');
            item.className = 'dynamic-item';
            item.innerHTML = `
                <input type="text" class="color-input" value="${escapeHtml(c)}" placeholder="Ej: Negro">
                <button type="button" class="btn-remove-color" title="Eliminar"><i class="fa-solid fa-trash-can"></i></button>
            `;
            colorsContainer.appendChild(item);
        });
        bindRemoveButtons(colorsContainer);

        // Lengths
        lengthsContainer.innerHTML = '';
        const lengths = data.options?.lengths || [{ name: '', price: '' }];
        lengths.forEach(l => {
            const item = document.createElement('div');
            item.className = 'dynamic-item-row';
            item.innerHTML = `
                <input type="text" class="length-name" value="${escapeHtml(l.name)}" placeholder="Ej: 1m">
                <input type="number" class="length-price" step="0.01" min="0" value="${l.price || ''}" placeholder="S/. 0.00">
                <button type="button" class="btn-remove-length" title="Eliminar"><i class="fa-solid fa-trash-can"></i></button>
            `;
            lengthsContainer.appendChild(item);
        });
        bindRemoveButtons(lengthsContainer);

        // Images
        const images = (data.images && data.images.length) ? data.images : (data.image ? [data.image] : []);
        if (images.length === 0) images.push('');
        imagesContainer.innerHTML = '';
        images.forEach((url, i) => {
            const item = document.createElement('div');
            item.className = 'dynamic-image-item';
            item.innerHTML = `
                <div class="image-url-row">
                    <input type="url" class="image-url-input" value="${escapeHtml(url)}" placeholder="https://ejemplo.com/imagen${i + 1}.jpg">
                    <button type="button" class="btn-remove-image-url" title="Eliminar"><i class="fa-solid fa-trash-can"></i></button>
                </div>
                <div class="image-thumb-wrap ${url ? '' : 'hidden'}"><img class="image-thumb" src="${escapeHtml(url)}" alt="Vista previa"></div>
            `;
            imagesContainer.appendChild(item);
        });
        bindImageUrlPreviews();
        bindImageRemoveButtons();

        openModal('Editar Producto');
        modalSave.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Actualizar Producto';
    } catch (err) {
        console.error('Error loading product for edit:', err);
        formError.textContent = 'Error al cargar producto.';
    }
}

// --- Delete Product ---
function confirmDelete(productId) {
    const product = allProducts.find(p => p.id === productId);
    const name = product?.title || 'este producto';
    if (!confirm(`¿Eliminar "${name}" permanentemente? Esta acción no se puede deshacer.`)) return;

    db.collection('products').doc(productId).delete()
        .catch(err => {
            console.error('Delete error:', err);
            alert(`Error al eliminar: ${err.message}`);
        });
}

// --- Export ---
exportBtn.addEventListener('click', () => {
    if (allProducts.length === 0) {
        alert('No hay productos para exportar.');
        return;
    }

    const exportData = allProducts.map(({ id, ...rest }) => ({
        id,
        ...rest,
        createdAt: rest.createdAt?.toDate ? rest.createdAt.toDate().toISOString() : null,
        updatedAt: rest.updatedAt?.toDate ? rest.updatedAt.toDate().toISOString() : null
    }));

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `j2pgamingtech-catalogo-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
});

function updateExportPreview() {
    if (allProducts.length === 0) {
        exportPreview.querySelector('code').textContent = '// No hay productos registrados aún.';
        return;
    }
    const preview = allProducts.slice(0, 3).map(({ id, ...rest }) => ({
        id,
        title: rest.title,
        category: rest.category,
        price: rest.defaultPrice
    }));
    exportPreview.querySelector('code').textContent = JSON.stringify(preview, null, 2) +
        (allProducts.length > 3 ? `\n// ... y ${allProducts.length - 3} productos más` : '');
}

// --- Code Generator ---
function generateCode() {
    const existing = allProducts.map(p => parseInt(p.code)).filter(n => !isNaN(n));
    const max = existing.length > 0 ? Math.max(...existing) : 0;
    return String(max + 1).padStart(2, '0');
}

// --- Utility ---
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
