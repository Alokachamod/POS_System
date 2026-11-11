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

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // If on products page, load products
  if (document.getElementById('productTableBody')) {
    loadProductsTable();
  }
  // If on customers page, load customers
  if (document.getElementById('customerTableBody')) {
    loadCustomerTable();
  }
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

  addProduct(product);

  if (form) form.reset();

  closeModal('addProductModal');


  loadProductsTable();
}


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

  updateProduct(id, changes);


  closeModal('editProductModal');


  loadProductsTable();
}



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


function openDeleteModal(productId) {
  const product = getById(STORAGE_KEYS.PRODUCTS, productId);
  if (!product) return;

  document.getElementById('deleteProductId').value = product.id;
  document.getElementById('deleteProductName').textContent = `"${product.name}"`;

  openModal('deleteProductModal');
}


function handleConfirmDelete() {
  const id = document.getElementById('deleteProductId').value;
  if (id) {
    deleteProduct(id);
  }

  closeModal('deleteProductModal');
  loadProductsTable();
}


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


// ==========================================================================
// 7) CUSTOMER MANAGEMENT (Student-Friendly Code)
// ==========================================================================

// 1. Function to load all customers into the table
function loadCustomerTable() {
  let tableBody = document.getElementById("customerTableBody");
  if (!tableBody) return;

  // Get all customers from storage.js
  let customers = getCustomers();

  // Update total registered count
  let countElement = document.getElementById("totalCustomerCount");
  if (countElement) {
    countElement.textContent = customers.length + " Customers";
  }

  // Clear table first
  tableBody.innerHTML = "";

  // If no customers found
  if (customers.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center py-4 text-muted">
          No customers found! Click "+ Add Customer" to add one.
        </td>
      </tr>
    `;
    return;
  }

  // Loop through customers and add rows
  customers.forEach(customer => {
    // Make 2-letter avatar initials (e.g. "Alex Morgan" -> "AM")
    let initials = customer.name ? customer.name.substring(0, 2).toUpperCase() : "CU";

    let row = `
      <tr>
        <td>
          <div class="d-flex align-items-center gap-3">
            <span class="customer-avatar">${initials}</span>
            <div>
              <div class="fw-bold text-dark">${customer.name}</div>
              <small class="text-muted">ID: ${customer.id}</small>
            </div>
          </div>
        </td>
        <td>
          <div class="text-dark">
            <i class="bi bi-telephone text-muted me-1"></i>${customer.phone}
          </div>
        </td>
        <td>
          <div class="text-dark">
            <i class="bi bi-envelope text-muted me-1"></i>${customer.email}
          </div>
        </td>
        <td class="text-end">
          <div class="d-inline-flex gap-1">
            <!-- Edit Button -->
            <button type="button" class="btn-action btn-action-edit" title="Edit Customer" onclick="editCustomerBtn('${customer.id}')">
              <i class="bi bi-pencil-square"></i>
            </button>
            <!-- Delete Button -->
            <button type="button" class="btn-action btn-action-delete" title="Delete Customer" onclick="deleteCustomerBtn('${customer.id}')">
              <i class="bi bi-trash3"></i>
            </button>
          </div>
        </td>
      </tr>
    `;

    tableBody.innerHTML += row;
  });
}

// 2. Function to save a new customer (Called from Add Customer Modal)
function handlerSaveCus() {
  // Get values from input fields
  let name = document.getElementById("cus_name").value.trim();
  let phone = document.getElementById("cus_phone").value.trim();
  let email = document.getElementById("cus_email").value.trim();

  // Simple validation
  if (name === "" || phone === "") {
    alert("Please enter Customer Name and Phone Number!");
    return;
  }

  // Generate Customer ID (e.g. "cus_001") only when save is triggered
  let cusId = generateCustomerId();

  // Create customer object
  let customer = {
    id: cusId,
    name: name,
    phone: phone,
    email: email
  };

  // Save to localStorage using storage.js helper
  addCustomer(customer);

  // Clear input fields
  document.getElementById("cus_name").value = "";
  document.getElementById("cus_phone").value = "";
  document.getElementById("cus_email").value = "";

  // Close the modal
  let modalElement = document.getElementById("addCustomerModal");
  let modalInstance = bootstrap.Modal.getInstance(modalElement);
  if (modalInstance) {
    modalInstance.hide();
  }

  // Reload the customer table
  loadCustomerTable();

  alert("Customer (" + cusId + ") added successfully!");
}

// 3. Function to open Edit Modal and fill existing data
function editCustomerBtn(id) {
  let customer = getById(STORAGE_KEYS.CUSTOMERS, id);
  if (!customer) return;

  // Fill values into inputs
  document.getElementById("edit_cus_id").value = customer.id;
  document.getElementById("edit_cus_name").value = customer.name;
  document.getElementById("edit_cus_phone").value = customer.phone;
  document.getElementById("edit_cus_email").value = customer.email;

  // Open the edit modal
  let modal = new bootstrap.Modal(document.getElementById("editCustomerModal"));
  modal.show();
}

// 4. Function to save updated customer details
function updateCustomerBtn() {
  let id = document.getElementById("edit_cus_id").value;
  let name = document.getElementById("edit_cus_name").value.trim();
  let phone = document.getElementById("edit_cus_phone").value.trim();
  let email = document.getElementById("edit_cus_email").value.trim();

  if (name === "" || phone === "") {
    alert("Please enter Name and Phone!");
    return;
  }

  // Create changes object
  let changes = {
    name: name,
    phone: phone,
    email: email
  };

  // Update in localStorage
  updateCustomer(id, changes);

  // Close the edit modal
  let modalElement = document.getElementById("editCustomerModal");
  let modalInstance = bootstrap.Modal.getInstance(modalElement);
  if (modalInstance) {
    modalInstance.hide();
  }

  // Reload the table
  loadCustomerTable();

  alert("Customer updated successfully!");
}

// 5. Function to open Delete Modal with customer info
function deleteCustomerBtn(id) {
  let customer = getById(STORAGE_KEYS.CUSTOMERS, id);
  if (!customer) return;

  document.getElementById("delete_cus_id").value = customer.id;
  document.getElementById("delete_cus_name").textContent = '"' + customer.name + '"';

  // Open delete modal
  let modal = new bootstrap.Modal(document.getElementById("deleteCustomerModal"));
  modal.show();
}

// 6. Function to confirm delete customer
function confirmDeleteCus() {
  let id = document.getElementById("delete_cus_id").value;

  if (id) {
    deleteCustomer(id);
  }

  // Close modal
  let modalElement = document.getElementById("deleteCustomerModal");
  let modalInstance = bootstrap.Modal.getInstance(modalElement);
  if (modalInstance) {
    modalInstance.hide();
  }

  // Reload the table
  loadCustomerTable();

  alert("Customer deleted successfully!");
}

// 7. Function to search customer by name, phone or email
function searchCustomer() {
  let searchInput = document.getElementById("searchCustomerInput").value.toLowerCase().trim();
  let tableBody = document.getElementById("customerTableBody");
  if (!tableBody) return;

  let customers = getCustomers();

  // Filter customers array
  let filtered = customers.filter(customer => {
    let nameMatch = (customer.name || "").toLowerCase().includes(searchInput);
    let phoneMatch = (customer.phone || "").toLowerCase().includes(searchInput);
    let emailMatch = (customer.email || "").toLowerCase().includes(searchInput);
    return nameMatch || phoneMatch || emailMatch;
  });

  // Clear table
  tableBody.innerHTML = "";

  // If no match found
  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center py-4 text-muted">
          No customer found matching "${searchInput}"!
        </td>
      </tr>
    `;
    return;
  }

  // Display filtered rows
  filtered.forEach(customer => {
    let initials = customer.name ? customer.name.substring(0, 2).toUpperCase() : "CU";

    let row = `
      <tr>
        <td>
          <div class="d-flex align-items-center gap-3">
            <span class="customer-avatar">${initials}</span>
            <div>
              <div class="fw-bold text-dark">${customer.name}</div>
              <small class="text-muted">ID: ${customer.id}</small>
            </div>
          </div>
        </td>
        <td>
          <div class="text-dark">
            <i class="bi bi-telephone text-muted me-1"></i>${customer.phone}
          </div>
        </td>
        <td>
          <div class="text-dark">
            <i class="bi bi-envelope text-muted me-1"></i>${customer.email}
          </div>
        </td>
        <td class="text-end">
          <div class="d-inline-flex gap-1">
            <button type="button" class="btn-action btn-action-edit" title="Edit Customer" onclick="editCustomerBtn('${customer.id}')">
              <i class="bi bi-pencil-square"></i>
            </button>
            <button type="button" class="btn-action btn-action-delete" title="Delete Customer" onclick="deleteCustomerBtn('${customer.id}')">
              <i class="bi bi-trash3"></i>
            </button>
          </div>
        </td>
      </tr>
    `;

    tableBody.innerHTML += row;
  });
}