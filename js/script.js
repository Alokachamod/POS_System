/* ==========================================================================
   GrillMaster POS - Products Page Script (js/script.js)
   Handles all UI interactions:
   - Live Search & Category Filtering
   - Stock Status Filter Pills (All / Low Stock / Out of Stock) with live counters
   - Add Product Modal (Create)
   - Edit Product Modal (Update)
   - Add Stock Modal (Quick Restock)
   - Delete Product Modal (Delete Confirmation)
   - Dynamic Table Rendering & Currency Formatting
   ========================================================================== */

// Active stock status filter ('all', 'low', 'out')
let currentStockFilter = 'all';

// Initialize table on DOM load
document.addEventListener('DOMContentLoaded', () => {
  loadProductsTable();
});

// ==========================================================================
// 1) TABLE RENDERING & FILTERING
// ==========================================================================

/**
 * Load, filter, and render products in the inventory table
 */
function loadProductsTable() {
  const tableBody = document.getElementById('productTableBody');
  if (!tableBody) return;

  // 1. Fetch all products from storage.js
  const allProducts = getProducts();

  // 2. Update stock filter badge counters in the top toolbar
  updateFilterCounters(allProducts);

  // 3. Apply search filter
  const searchInput = document.getElementById('searchInput');
  const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';

  // 4. Apply category filter
  const categoryFilter = document.getElementById('categoryFilter');
  const selectedCategory = categoryFilter ? categoryFilter.value : 'All';

  // 5. Filter products array
  const filteredProducts = allProducts.filter(product => {
    // Search match (name or SKU)
    const nameMatch = (product.name || '').toLowerCase().includes(searchQuery);
    const skuMatch = (product.sku || '').toLowerCase().includes(searchQuery);
    const matchesSearch = !searchQuery || nameMatch || skuMatch;

    // Category match
    const productCategory = (product.category || '').toLowerCase();
    const filterCat = selectedCategory.toLowerCase();
    const matchesCategory = selectedCategory === 'All' || productCategory === filterCat;

    // Stock status match
    const stockQty = Number(product.stock) || 0;
    let matchesStock = true;
    if (currentStockFilter === 'low') {
      matchesStock = stockQty > 0 && stockQty <= 10;
    } else if (currentStockFilter === 'out') {
      matchesStock = stockQty <= 0;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  // 6. Handle empty state
  if (filteredProducts.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-5">
          <div class="text-muted mb-2">
            <i class="bi bi-inbox fs-1 d-block mb-1"></i>
            No products found matching your current filter.
          </div>
          <button type="button" class="btn btn-sm btn-outline-secondary" onclick="resetAllFilters()">
            <i class="bi bi-arrow-counterclockwise me-1"></i> Reset Filters
          </button>
        </td>
      </tr>
    `;
    return;
  }

  // 7. Render table rows
  tableBody.innerHTML = filteredProducts.map(product => `
    <tr>
      <td>
        <img src="${product.image || 'images/default-burger.svg'}" 
             alt="${product.name}" 
             class="table-img"
             onerror="this.src='images/default-burger.svg'">
      </td>
      <td>
        <div class="fw-bold text-dark">${product.name}</div>
        <small class="text-muted">SKU: ${product.sku || 'N/A'}</small>
      </td>
      <td><span class="badge bg-light text-dark border">${product.category}</span></td>
      <td class="fw-semibold text-dark">${formatPrice(product.price)}</td>
      <td><span class="fw-semibold">${product.stock}</span> pcs</td>
      <td>${getBadgeHtml(product.stock)}</td>
      <td class="text-end">
        <div class="d-inline-flex gap-1">
          <!-- Quick Restock Button -->
          <button type="button" class="btn-action btn-action-stock" title="Add Stock" onclick="openStockModal('${product.id}')">
            <i class="bi bi-plus-circle"></i>
          </button>
          <!-- Edit Product Button -->
          <button type="button" class="btn-action btn-action-edit" title="Edit Product" onclick="openEditModal('${product.id}')">
            <i class="bi bi-pencil-square"></i>
          </button>
          <!-- Delete Product Button -->
          <button type="button" class="btn-action btn-action-delete" title="Delete Product" onclick="openDeleteModal('${product.id}')">
            <i class="bi bi-trash3"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

/**
 * Triggered on search input change or category dropdown selection
 */
function applyFilters() {
  loadProductsTable();
}

/**
 * Set stock status filter pill ('all', 'low', 'out')
 */
function setStockFilter(type) {
  currentStockFilter = type;

  // Toggle active button style
  const btnAll = document.getElementById('btnFilterAll');
  const btnLow = document.getElementById('btnFilterLow');
  const btnOut = document.getElementById('btnFilterOut');

  if (btnAll) btnAll.classList.toggle('active', type === 'all');
  if (btnLow) btnLow.classList.toggle('active', type === 'low');
  if (btnOut) btnOut.classList.toggle('active', type === 'out');

  loadProductsTable();
}

/**
 * Update the dynamic counts in the stock status filter buttons
 */
function updateFilterCounters(products) {
  const countAllEl = document.getElementById('countAll');
  const countLowEl = document.getElementById('countLow');
  const countOutEl = document.getElementById('countOut');

  const total = products.length;
  const low = products.filter(p => Number(p.stock) > 0 && Number(p.stock) <= 10).length;
  const out = products.filter(p => Number(p.stock) <= 0).length;

  if (countAllEl) countAllEl.textContent = total;
  if (countLowEl) countLowEl.textContent = low;
  if (countOutEl) countOutEl.textContent = out;
}

/**
 * Reset all filters to default
 */
function resetAllFilters() {
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');

  if (searchInput) searchInput.value = '';
  if (categoryFilter) categoryFilter.value = 'All';

  setStockFilter('all');
}

/**
 * Helper to generate status badge HTML with pulse animation
 */
function getBadgeHtml(stock) {
  const qty = Number(stock) || 0;
  if (qty <= 0) {
    return `<span class="status-badge status-out-of-stock pulse-danger"><span class="status-dot"></span> Out of Stock</span>`;
  } else if (qty <= 10) {
    return `<span class="status-badge status-low-stock pulse-warning"><span class="status-dot"></span> Low Stock</span>`;
  } else {
    return `<span class="status-badge status-in-stock"><span class="status-dot"></span> In Stock</span>`;
  }
}

// ==========================================================================
// 2) ADD PRODUCT (CREATE)
// ==========================================================================

/**
 * Handle adding a new product from the Add Product modal
 */
function handleAddProduct() {
  const form = document.querySelector('#addProductModal form');
  if (form && !form.reportValidity()) return;

  const nameInput = document.getElementById('productName');
  const categoryInput = document.getElementById('category');
  const priceInput = document.getElementById('price');
  const qtyInput = document.getElementById('qty');
  const imgInput = document.getElementById('imgLink');

  const product = {
    name: nameInput ? nameInput.value : '',
    category: categoryInput ? categoryInput.value : 'Burgers',
    price: priceInput ? Number(priceInput.value) : 0,
    stock: qtyInput ? Number(qtyInput.value) : 0,
    image: imgInput && imgInput.value.trim() ? imgInput.value.trim() : 'images/default-burger.svg'
  };

  // Save to storage
  addProduct(product);

  // Reset form
  if (form) form.reset();

  // Close modal
  closeModal('addProductModal');

  // Refresh table
  loadProductsTable();
}

// ==========================================================================
// 3) EDIT PRODUCT (UPDATE)
// ==========================================================================

/**
 * Open the Edit Product modal and pre-fill it with existing product data
 */
function openEditModal(productId) {
  const product = getById(STORAGE_KEYS.PRODUCTS, productId);
  if (!product) return;

  document.getElementById('editProductId').value = product.id;
  document.getElementById('editProductName').value = product.name || '';
  document.getElementById('editCategory').value = product.category || 'Burgers';
  document.getElementById('editPrice').value = product.price !== undefined ? product.price : 0;
  document.getElementById('editQty').value = product.stock !== undefined ? product.stock : 0;
  document.getElementById('editImgLink').value = product.image || '';

  openModal('editProductModal');
}

/**
 * Handle saving the updated product data
 */
function handleUpdateProduct() {
  const form = document.getElementById('editProductForm');
  if (form && !form.reportValidity()) return;

  const id = document.getElementById('editProductId').value;
  if (!id) return;

  const changes = {
    name: document.getElementById('editProductName').value.trim(),
    category: document.getElementById('editCategory').value,
    price: Number(document.getElementById('editPrice').value) || 0,
    stock: Number(document.getElementById('editQty').value) || 0,
    image: document.getElementById('editImgLink').value.trim() || 'images/default-burger.svg'
  };

  // Update in storage
  updateProduct(id, changes);

  // Close modal
  closeModal('editProductModal');

  // Refresh table
  loadProductsTable();
}

// ==========================================================================
// 4) QUICK RESTOCK (+ STOCK)
// ==========================================================================

/**
 * Open the Quick "+ Stock" modal for a specific product
 */
function openStockModal(productId) {
  const product = getById(STORAGE_KEYS.PRODUCTS, productId);
  if (!product) return;

  document.getElementById('stockProductId').value = product.id;
  document.getElementById('stockProductName').textContent = product.name;
  document.getElementById('stockCurrentQty').textContent = (product.stock || 0) + ' pcs';

  const addQtyInput = document.getElementById('stockAddQty');
  if (addQtyInput) {
    addQtyInput.value = 10;
  }

  updateStockPreview();
  openModal('addStockModal');
}

/**
 * Calculate and display the preview of the new stock total in the restock modal
 */
function updateStockPreview() {
  const id = document.getElementById('stockProductId').value;
  const product = getById(STORAGE_KEYS.PRODUCTS, id);
  if (!product) return;

  const addQtyInput = document.getElementById('stockAddQty');
  const addQty = addQtyInput ? (Number(addQtyInput.value) || 0) : 0;
  const currentStock = Number(product.stock) || 0;
  const newTotal = Math.max(0, currentStock + addQty);

  const previewEl = document.getElementById('stockNewQtyPreview');
  if (previewEl) {
    previewEl.textContent = newTotal + ' pcs';
  }
}

/**
 * Confirm and save the increased stock quantity
 */
function handleConfirmStock() {
  const id = document.getElementById('stockProductId').value;
  const addQtyInput = document.getElementById('stockAddQty');
  const addQty = addQtyInput ? Number(addQtyInput.value) : 0;

  if (id && addQty > 0) {
    increaseStock(id, addQty);
  }

  closeModal('addStockModal');
  loadProductsTable();
}

// ==========================================================================
// 5) DELETE PRODUCT
// ==========================================================================

/**
 * Open the Delete Product confirmation modal
 */
function openDeleteModal(productId) {
  const product = getById(STORAGE_KEYS.PRODUCTS, productId);
  if (!product) return;

  document.getElementById('deleteProductId').value = product.id;
  document.getElementById('deleteProductName').textContent = `"${product.name}"`;

  openModal('deleteProductModal');
}

/**
 * Confirm and delete the product from storage
 */
function handleConfirmDelete() {
  const id = document.getElementById('deleteProductId').value;
  if (id) {
    deleteProduct(id);
  }

  closeModal('deleteProductModal');
  loadProductsTable();
}

// ==========================================================================
// 6) MODAL HELPER FUNCTIONS
// ==========================================================================

/**
 * Show a Bootstrap modal by element ID safely
 */
function openModal(modalId) {
  const modalEl = document.getElementById(modalId);
  if (!modalEl || !window.bootstrap) return;

  const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
  modalInstance.show();
}

/**
 * Hide a Bootstrap modal by element ID safely
 */
function closeModal(modalId) {
  const modalEl = document.getElementById(modalId);
  if (!modalEl || !window.bootstrap) return;

  const modalInstance = bootstrap.Modal.getInstance(modalEl);
  if (modalInstance) {
    modalInstance.hide();
  }
}
