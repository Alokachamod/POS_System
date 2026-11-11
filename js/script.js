let currentStockFilter = 'all';
let cart = [];
let posCategory = 'All';
let selectedOrderType = 'Dine-in';
let selectedPaymentMethod = 'Cash';

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('productTableBody')) loadProductsTable();
  if (document.getElementById('customerTableBody')) loadCustomerTable();
  if (document.getElementById('posProductGrid')) initPosPage();
  if (document.getElementById('dashRecentOrdersTable')) loadDashboardPage();
  if (document.getElementById('ordersTableBody')) loadOrdersTable();
});

function getBadgeHtml(stock) {
  const num = Number(stock) || 0;
  if (num > 10) return '<span class="status-badge status-in-stock"><span class="status-dot"></span> In Stock</span>';
  if (num > 0) return '<span class="status-badge status-low-stock"><span class="status-dot"></span> Low Stock</span>';
  return '<span class="status-badge status-out-of-stock"><span class="status-dot"></span> Out of Stock</span>';
}

function updateFilterCounters(products) {
  const allCount = products.length;
  const lowCount = products.filter(p => Number(p.stock) > 0 && Number(p.stock) <= 10).length;
  const outCount = products.filter(p => Number(p.stock) <= 0).length;

  const countAll = document.getElementById('countFilterAll');
  const countLow = document.getElementById('countFilterLow');
  const countOut = document.getElementById('countFilterOut');

  if (countAll) countAll.textContent = allCount;
  if (countLow) countLow.textContent = lowCount;
  if (countOut) countOut.textContent = outCount;
}

function loadProductsTable() {
  const tableBody = document.getElementById('productTableBody');
  if (!tableBody) return;

  const allProducts = getProducts();
  updateFilterCounters(allProducts);

  const searchInput = document.getElementById('searchInput');
  const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';

  const categoryFilter = document.getElementById('categoryFilter');
  const selectedCategory = categoryFilter ? categoryFilter.value : 'All';

  const filteredProducts = allProducts.filter(product => {
    const nameMatch = (product.name || '').toLowerCase().includes(searchQuery);
    const skuMatch = (product.sku || '').toLowerCase().includes(searchQuery);
    const matchesSearch = !searchQuery || nameMatch || skuMatch;

    const productCategory = (product.category || '').toLowerCase();
    const filterCat = selectedCategory.toLowerCase();
    const matchesCategory = selectedCategory === 'All' || productCategory === filterCat;

    const stockQty = Number(product.stock) || 0;
    let matchesStock = true;
    if (currentStockFilter === 'low') matchesStock = stockQty > 0 && stockQty <= 10;
    else if (currentStockFilter === 'out') matchesStock = stockQty <= 0;

    return matchesSearch && matchesCategory && matchesStock;
  });

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
          <button type="button" class="btn-action btn-action-stock" title="Add Stock" onclick="openStockModal('${product.id}')">
            <i class="bi bi-plus-circle"></i>
          </button>
          <button type="button" class="btn-action btn-action-edit" title="Edit Product" onclick="openEditModal('${product.id}')">
            <i class="bi bi-pencil-square"></i>
          </button>
          <button type="button" class="btn-action btn-action-delete" title="Delete Product" onclick="openDeleteModal('${product.id}')">
            <i class="bi bi-trash3"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function applyFilters() {
  loadProductsTable();
}

function setStockFilter(type) {
  currentStockFilter = type;
  const btnAll = document.getElementById('btnFilterAll');
  const btnLow = document.getElementById('btnFilterLow');
  const btnOut = document.getElementById('btnFilterOut');

  if (btnAll) btnAll.classList.toggle('active', type === 'all');
  if (btnLow) btnLow.classList.toggle('active', type === 'low');
  if (btnOut) btnOut.classList.toggle('active', type === 'out');

  loadProductsTable();
}

function resetAllFilters() {
  const searchInput = document.getElementById('searchInput');
  if (searchInput) searchInput.value = '';

  const categoryFilter = document.getElementById('categoryFilter');
  if (categoryFilter) categoryFilter.value = 'All';

  setStockFilter('all');
}

function handleAddProduct() {
  const name = (document.getElementById('productName')?.value || document.getElementById('prod_name')?.value || '').trim();
  const category = document.getElementById('category')?.value || document.getElementById('prod_category')?.value || 'Burgers';
  const price = document.getElementById('price')?.value || document.getElementById('prod_price')?.value;
  const stock = document.getElementById('qty')?.value || document.getElementById('prod_qty')?.value;
  const image = (document.getElementById('imgLink')?.value || document.getElementById('prod_imgLink')?.value || '').trim();
  const sku = (document.getElementById('prod_sku')?.value || '').trim();

  if (!name) {
    alert('Please enter a product name.');
    return;
  }
  if (!price || Number(price) <= 0) {
    alert('Please enter a valid price greater than 0.');
    return;
  }
  if (stock === '' || Number(stock) < 0) {
    alert('Please enter a valid stock quantity.');
    return;
  }

  addProduct({
    name,
    category,
    price: Number(price),
    stock: Number(stock),
    image: image || 'images/default-burger.svg',
    sku: sku || undefined
  });

  if (document.getElementById('productName')) document.getElementById('productName').value = '';
  if (document.getElementById('price')) document.getElementById('price').value = '';
  if (document.getElementById('qty')) document.getElementById('qty').value = '';
  if (document.getElementById('imgLink')) document.getElementById('imgLink').value = '';

  closeModal('addProductModal');
  loadProductsTable();
  alert('Product added successfully!');
}

function openEditModal(productId) {
  const product = getProductById(productId);
  if (!product) return;

  const idInput = document.getElementById('editProductId') || document.getElementById('edit_prod_id');
  const nameInput = document.getElementById('editProductName') || document.getElementById('edit_prod_name');
  const catInput = document.getElementById('editCategory') || document.getElementById('edit_prod_category');
  const priceInput = document.getElementById('editPrice') || document.getElementById('edit_prod_price');
  const stockInput = document.getElementById('editQty') || document.getElementById('edit_prod_stock');
  const imgInput = document.getElementById('editImgLink') || document.getElementById('edit_prod_image');

  if (idInput) idInput.value = product.id;
  if (nameInput) nameInput.value = product.name || '';
  if (catInput) catInput.value = product.category || 'Burgers';
  if (priceInput) priceInput.value = product.price || 0;
  if (stockInput) stockInput.value = product.stock !== undefined ? product.stock : 0;
  if (imgInput) imgInput.value = product.image || '';

  const modalEl = document.getElementById('editProductModal');
  if (modalEl && typeof bootstrap !== 'undefined') {
    new bootstrap.Modal(modalEl).show();
  }
}

function handleUpdateProduct() {
  saveProductEdit();
}

function saveProductEdit() {
  const idInput = document.getElementById('editProductId') || document.getElementById('edit_prod_id');
  const nameInput = document.getElementById('editProductName') || document.getElementById('edit_prod_name');
  const catInput = document.getElementById('editCategory') || document.getElementById('edit_prod_category');
  const priceInput = document.getElementById('editPrice') || document.getElementById('edit_prod_price');
  const stockInput = document.getElementById('editQty') || document.getElementById('edit_prod_stock');
  const imgInput = document.getElementById('editImgLink') || document.getElementById('edit_prod_image');

  const id = idInput ? idInput.value : '';
  if (!id) return;

  const name = nameInput ? nameInput.value.trim() : '';
  const category = catInput ? catInput.value : 'Burgers';
  const price = priceInput ? priceInput.value : 0;
  const stock = stockInput ? stockInput.value : 0;
  const image = imgInput ? imgInput.value.trim() : '';

  if (!name || !price || Number(price) <= 0) {
    alert('Please enter valid product details.');
    return;
  }

  updateProduct(id, {
    name,
    category,
    price: Number(price),
    stock: Number(stock) || 0,
    image: image || 'images/default-burger.svg'
  });

  closeModal('editProductModal');
  loadProductsTable();
  alert('Product updated successfully!');
}

function openStockModal(productId) {
  const product = getProductById(productId);
  if (!product) return;

  const idInput = document.getElementById('stockProductId') || document.getElementById('stock_prod_id');
  const nameEl = document.getElementById('stockProductName') || document.getElementById('stock_prod_name');
  const currentEl = document.getElementById('stockCurrentQty') || document.getElementById('stock_prod_current');
  const addInput = document.getElementById('stockAddQty') || document.getElementById('stock_add_qty');

  if (idInput) idInput.value = product.id;
  if (nameEl) nameEl.textContent = product.name;
  if (currentEl) currentEl.textContent = (product.stock || 0) + ' pcs';
  if (addInput) addInput.value = '10';

  updateStockPreview();

  const modalEl = document.getElementById('addStockModal');
  if (modalEl && typeof bootstrap !== 'undefined') {
    new bootstrap.Modal(modalEl).show();
  }
}

function updateStockPreview() {
  const idInput = document.getElementById('stockProductId') || document.getElementById('stock_prod_id');
  const addInput = document.getElementById('stockAddQty') || document.getElementById('stock_add_qty');
  const previewEl = document.getElementById('stockNewQtyPreview');

  if (!idInput || !addInput || !previewEl) return;
  const product = getProductById(idInput.value);
  const current = product ? (Number(product.stock) || 0) : 0;
  const addVal = Number(addInput.value) || 0;
  previewEl.textContent = (current + addVal) + ' pcs';
}

function handleConfirmStock() {
  saveStockAddition();
}

function saveStockAddition() {
  const idInput = document.getElementById('stockProductId') || document.getElementById('stock_prod_id');
  const addInput = document.getElementById('stockAddQty') || document.getElementById('stock_add_qty');

  const id = idInput ? idInput.value : '';
  const addQty = addInput ? (Number(addInput.value) || 0) : 0;

  if (addQty <= 0) {
    alert('Please enter a quantity greater than 0.');
    return;
  }

  addStock(id, addQty);
  closeModal('addStockModal');
  loadProductsTable();
  alert('Stock updated successfully!');
}

function openDeleteModal(productId) {
  const product = getProductById(productId);
  if (!product) return;

  const idInput = document.getElementById('deleteProductId') || document.getElementById('delete_prod_id');
  const nameEl = document.getElementById('deleteProductName') || document.getElementById('delete_prod_name');

  if (idInput) idInput.value = product.id;
  if (nameEl) nameEl.textContent = `"${product.name}"`;

  const modalEl = document.getElementById('deleteProductModal');
  if (modalEl && typeof bootstrap !== 'undefined') {
    new bootstrap.Modal(modalEl).show();
  }
}

function handleConfirmDelete() {
  confirmDelete();
}

function confirmDelete() {
  const idInput = document.getElementById('deleteProductId') || document.getElementById('delete_prod_id');
  const id = idInput ? idInput.value : '';
  if (id) {
    deleteProduct(id);
    closeModal('deleteProductModal');
    loadProductsTable();
    alert('Product deleted successfully!');
  }
}

function closeModal(modalId) {
  const modalEl = document.getElementById(modalId);
  if (!modalEl || typeof bootstrap === 'undefined') return;
  const modalInstance = bootstrap.Modal.getInstance(modalEl);
  if (modalInstance) modalInstance.hide();
}

function loadCustomerTable() {
  let tableBody = document.getElementById("customerTableBody");
  if (!tableBody) return;

  let customers = getCustomers();
  let countElement = document.getElementById("totalCustomerCount");
  if (countElement) countElement.textContent = customers.length + " Customers";

  tableBody.innerHTML = "";

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

  customers.forEach(customer => {
    let initials = customer.name ? customer.name.substring(0, 2).toUpperCase() : "CU";

    tableBody.innerHTML += `
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
          <div class="text-dark"><i class="bi bi-telephone text-muted me-1"></i>${customer.phone}</div>
        </td>
        <td>
          <div class="text-dark"><i class="bi bi-envelope text-muted me-1"></i>${customer.email}</div>
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
  });
}

function handlerSaveCus() {
  let name = document.getElementById("cus_name").value.trim();
  let phone = document.getElementById("cus_phone").value.trim();
  let email = document.getElementById("cus_email").value.trim();

  if (name === "" || phone === "") {
    alert("Please enter Customer Name and Phone Number!");
    return;
  }

  let cusId = generateCustomerId();
  addCustomer({ id: cusId, name, phone, email });

  document.getElementById("cus_name").value = "";
  document.getElementById("cus_phone").value = "";
  document.getElementById("cus_email").value = "";

  closeModal("addCustomerModal");
  loadCustomerTable();
  alert("Customer (" + cusId + ") added successfully!");
}

function editCustomerBtn(id) {
  let customer = getCustomerById(id);
  if (!customer) return;

  document.getElementById("edit_cus_id").value = customer.id;
  document.getElementById("edit_cus_name").value = customer.name;
  document.getElementById("edit_cus_phone").value = customer.phone;
  document.getElementById("edit_cus_email").value = customer.email;

  const modalEl = document.getElementById("editCustomerModal");
  if (modalEl && typeof bootstrap !== "undefined") {
    new bootstrap.Modal(modalEl).show();
  }
}

function updateCustomerBtn() {
  let id = document.getElementById("edit_cus_id").value;
  let name = document.getElementById("edit_cus_name").value.trim();
  let phone = document.getElementById("edit_cus_phone").value.trim();
  let email = document.getElementById("edit_cus_email").value.trim();

  if (name === "" || phone === "") {
    alert("Please enter Name and Phone!");
    return;
  }

  updateCustomer(id, { name, phone, email });
  closeModal("editCustomerModal");
  loadCustomerTable();
  alert("Customer updated successfully!");
}

function deleteCustomerBtn(id) {
  let customer = getCustomerById(id);
  if (!customer) return;

  document.getElementById("delete_cus_id").value = customer.id;
  document.getElementById("delete_cus_name").textContent = '"' + customer.name + '"';

  const modalEl = document.getElementById("deleteCustomerModal");
  if (modalEl && typeof bootstrap !== "undefined") {
    new bootstrap.Modal(modalEl).show();
  }
}

function confirmDeleteCus() {
  let id = document.getElementById("delete_cus_id").value;
  if (id) deleteCustomer(id);
  closeModal("deleteCustomerModal");
  loadCustomerTable();
  alert("Customer deleted successfully!");
}

function searchCustomer() {
  let searchInput = document.getElementById("searchCustomerInput").value.toLowerCase().trim();
  let tableBody = document.getElementById("customerTableBody");
  if (!tableBody) return;

  let customers = getCustomers();
  let filtered = customers.filter(customer => {
    let nameMatch = (customer.name || "").toLowerCase().includes(searchInput);
    let phoneMatch = (customer.phone || "").toLowerCase().includes(searchInput);
    let emailMatch = (customer.email || "").toLowerCase().includes(searchInput);
    return nameMatch || phoneMatch || emailMatch;
  });

  tableBody.innerHTML = "";

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="4" class="text-center py-4 text-muted">
          No customer found matching "${searchInput}"
        </td>
      </tr>
    `;
    return;
  }

  filtered.forEach(customer => {
    let initials = customer.name ? customer.name.substring(0, 2).toUpperCase() : "CU";

    tableBody.innerHTML += `
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
          <div class="text-dark"><i class="bi bi-telephone text-muted me-1"></i>${customer.phone}</div>
        </td>
        <td>
          <div class="text-dark"><i class="bi bi-envelope text-muted me-1"></i>${customer.email}</div>
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
  });
}

function initPosPage() {
  loadPosProducts();
  loadPosCustomers();
  renderCart();
}

function loadPosProducts() {
  let grid = document.getElementById("posProductGrid");
  if (!grid) return;

  let products = getProducts();
  let searchInput = document.getElementById("posSearchInput");
  let query = searchInput ? searchInput.value.toLowerCase().trim() : "";

  let filtered = products.filter(p => {
    let nameMatch = (p.name || "").toLowerCase().includes(query);
    let skuMatch = (p.sku || "").toLowerCase().includes(query);
    let matchesSearch = !query || nameMatch || skuMatch;

    let cat = (p.category || "").toLowerCase();
    let selCat = posCategory.toLowerCase();
    let matchesCat = posCategory === "All" || cat === selCat || 
      (posCategory === "Fries & Sides" && (cat.includes("fries") || cat.includes("side")));

    return matchesSearch && matchesCat;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="text-muted">
          <i class="bi bi-box-seam fs-1 d-block mb-2"></i>
          <h5>No products available</h5>
          <p class="small">Add products from the Products page or clear your search.</p>
        </div>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    let stock = Number(p.stock) || 0;
    let stockBadge = "";
    let isOutOfStock = stock <= 0;

    if (stock > 10) stockBadge = `<span class="pos-product-stock text-success"><i class="bi bi-check-circle me-1"></i>In Stock: ${stock}</span>`;
    else if (stock > 0) stockBadge = `<span class="pos-product-stock text-warning"><i class="bi bi-exclamation-circle me-1"></i>Low Stock: ${stock}</span>`;
    else stockBadge = `<span class="pos-product-stock text-danger"><i class="bi bi-x-circle me-1"></i>Out of Stock</span>`;

    return `
      <div class="col-6 col-md-4">
        <div class="pos-product-card">
          <div class="pos-product-img-wrapper">
            <img src="${p.image || 'images/default-burger.svg'}" 
                 alt="${p.name}" 
                 class="pos-product-img"
                 onerror="this.src='images/default-burger.svg'">
            <span class="pos-price-tag">${formatPrice(p.price)}</span>
          </div>
          <div class="pos-product-body">
            <div>
              <h3 class="pos-product-title">${p.name}</h3>
              ${stockBadge}
            </div>
            <button type="button" class="pos-add-btn" 
                    onclick="addToCart('${p.id}')" 
                    ${isOutOfStock ? 'disabled' : ''}>
              <i class="bi ${isOutOfStock ? 'bi-dash-circle' : 'bi-plus-lg'}"></i> 
              ${isOutOfStock ? 'Out' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function filterPosProducts() {
  loadPosProducts();
}

function filterPosCategory(category) {
  posCategory = category;

  let catButtons = {
    'All': 'btnPosCatAll',
    'Burgers': 'btnPosCatBurgers',
    'Fries & Sides': 'btnPosCatSides',
    'Drinks': 'btnPosCatDrinks'
  };

  Object.keys(catButtons).forEach(key => {
    let btn = document.getElementById(catButtons[key]);
    if (btn) btn.classList.toggle('active', key === category);
  });

  loadPosProducts();
}

function loadPosCustomers() {
  let select = document.getElementById("posCustomerSelect");
  if (!select) return;

  let customers = getCustomers();
  select.innerHTML = `<option value="" selected>Walk-in Customer (Guest)</option>`;

  customers.forEach(c => {
    select.innerHTML += `<option value="${c.id}">${c.name} (${c.id})</option>`;
  });
}

function addToCart(productId) {
  let product = getProductById(productId);
  if (!product) return;

  let stock = Number(product.stock) || 0;
  if (stock <= 0) {
    alert("Sorry! This item is currently out of stock.");
    return;
  }

  let existingItem = cart.find(item => item.id === productId);
  if (existingItem) {
    if (existingItem.qty < stock) {
      existingItem.qty += 1;
    } else {
      alert("Cannot add more! Only " + stock + " items available in stock.");
      return;
    }
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: Number(product.price) || 0,
      stock: stock,
      qty: 1
    });
  }

  renderCart();
}

function changeCartQty(productId, delta) {
  let item = cart.find(i => i.id === productId);
  if (!item) return;

  let newQty = item.qty + delta;
  if (newQty <= 0) {
    removeFromCart(productId);
  } else if (newQty > item.stock) {
    alert("Cannot exceed available stock (" + item.stock + " items)!");
  } else {
    item.qty = newQty;
    renderCart();
  }
}

function removeFromCart(productId) {
  cart = cart.filter(item => item.id !== productId);
  renderCart();
}

function clearCart() {
  if (cart.length === 0) return;
  if (confirm("Are you sure you want to clear the current cart?")) {
    cart = [];
    renderCart();
  }
}

function renderCart() {
  let cartList = document.getElementById("cartItemsList");
  let subtotalEl = document.getElementById("cartSubtotal");
  let itemsCountEl = document.getElementById("cartItemsCount");
  let grandTotalEl = document.getElementById("cartGrandTotal");
  let placeOrderBtnText = document.getElementById("placeOrderBtnText");
  let btnPlaceOrder = document.getElementById("btnPlaceOrder");

  if (!cartList) return;

  if (cart.length === 0) {
    cartList.innerHTML = `
      <div class="text-center py-5 text-muted">
        <i class="bi bi-cart-x fs-2 d-block mb-2"></i>
        <span>Your cart is empty</span>
        <div class="small mt-1">Click "+ Add" on any product to start an order.</div>
      </div>
    `;
    if (subtotalEl) subtotalEl.textContent = formatPrice(0);
    if (itemsCountEl) itemsCountEl.textContent = "0 items";
    if (grandTotalEl) grandTotalEl.textContent = formatPrice(0);
    if (placeOrderBtnText) placeOrderBtnText.textContent = "Place Order (" + formatPrice(0) + ")";
    if (btnPlaceOrder) btnPlaceOrder.disabled = true;
    return;
  }

  if (btnPlaceOrder) btnPlaceOrder.disabled = false;

  let subtotal = 0;
  let totalItemsCount = 0;

  cartList.innerHTML = cart.map(item => {
    let itemTotal = item.price * item.qty;
    subtotal += itemTotal;
    totalItemsCount += item.qty;

    return `
      <div class="cart-item">
        <div style="flex: 1; padding-right: 8px;">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">${formatPrice(item.price)} each</div>
        </div>
        <div class="qty-control me-2">
          <button type="button" class="qty-btn" onclick="changeCartQty('${item.id}', -1)" title="Decrease">
            <i class="bi bi-dash"></i>
          </button>
          <span class="qty-val">${item.qty}</span>
          <button type="button" class="qty-btn" onclick="changeCartQty('${item.id}', 1)" title="Increase">
            <i class="bi bi-plus"></i>
          </button>
        </div>
        <div class="fw-bold text-dark me-2">${formatPrice(itemTotal)}</div>
        <button type="button" class="cart-remove-btn" onclick="removeFromCart('${item.id}')" title="Remove item">
          <i class="bi bi-x-circle"></i>
        </button>
      </div>
    `;
  }).join('');

  if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
  if (itemsCountEl) itemsCountEl.textContent = totalItemsCount + " items";
  if (grandTotalEl) grandTotalEl.textContent = formatPrice(subtotal);
  if (placeOrderBtnText) placeOrderBtnText.textContent = "Place Order (" + formatPrice(subtotal) + ")";
}

function setOrderType(type) {
  selectedOrderType = type;
  let chipDine = document.getElementById("chipDineIn");
  let chipTake = document.getElementById("chipTakeaway");
  let chipDeliv = document.getElementById("chipDelivery");

  if (chipDine) chipDine.classList.toggle("active", type === "Dine-in");
  if (chipTake) chipTake.classList.toggle("active", type === "Takeaway");
  if (chipDeliv) chipDeliv.classList.toggle("active", type === "Delivery");
}

function setPaymentMethod(method) {
  selectedPaymentMethod = method;
  let btnCash = document.getElementById("btnPayCash");
  let btnCard = document.getElementById("btnPayCard");
  let btnQR = document.getElementById("btnPayQR");

  if (btnCash) btnCash.classList.toggle("active", method === "Cash");
  if (btnCard) btnCard.classList.toggle("active", method === "Card");
  if (btnQR) btnQR.classList.toggle("active", method === "QR Pay");
}

function handlePlaceOrder() {
  if (cart.length === 0) {
    alert("Cart is empty! Please add items before placing an order.");
    return;
  }

  let customerSelect = document.getElementById("posCustomerSelect");
  let customerId = customerSelect ? customerSelect.value : "";

  let cartItems = cart.map(item => ({
    productId: item.id,
    name: item.name,
    price: item.price,
    qty: item.qty
  }));

  let result = placeOrder(customerId, cartItems, 0);

  if (result.success) {
    let order = result.order;

    let ticketEl = document.getElementById("modalOrderTicket");
    let custEl = document.getElementById("modalCustomerName");
    let payEl = document.getElementById("modalPaymentMethod");
    let totalEl = document.getElementById("modalOrderTotal");

    if (ticketEl) ticketEl.textContent = "#" + order.orderNumber;
    if (custEl) custEl.textContent = order.customerName + " (" + selectedOrderType + ")";
    if (payEl) payEl.textContent = selectedPaymentMethod;
    if (totalEl) totalEl.textContent = formatPrice(order.total);

    let successModalEl = document.getElementById("orderSuccessModal");
    if (successModalEl && typeof bootstrap !== "undefined") {
      new bootstrap.Modal(successModalEl).show();
    }

    cart = [];
    renderCart();
    loadPosProducts();
  } else {
    alert(result.message || "Failed to place order.");
  }
}

function loadDashboardPage() {
  const stats = getDashboardStats();

  const salesEl = document.getElementById("dashTotalSales");
  const ordersEl = document.getElementById("dashTotalOrders");
  const productsEl = document.getElementById("dashTotalProducts");
  const lowStockEl = document.getElementById("dashLowStock");
  const tableEl = document.getElementById("dashRecentOrdersTable");

  if (salesEl) salesEl.textContent = formatPrice(stats.totalSales);
  if (ordersEl) ordersEl.textContent = stats.totalOrders;
  if (productsEl) productsEl.textContent = stats.totalProducts;
  if (lowStockEl) lowStockEl.textContent = stats.lowStock + " Items";

  if (!tableEl) return;

  if (stats.recentOrders.length === 0) {
    tableEl.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4 text-muted">
          No orders placed yet. Go to <a href="pos.html">POS Terminal</a> to make your first sale!
        </td>
      </tr>
    `;
    return;
  }

  tableEl.innerHTML = stats.recentOrders.map(order => {
    const itemsSummary = (order.items || []).map(i => i.name).join(', ');
    const itemsCount = (order.items || []).reduce((sum, i) => sum + i.qty, 0);

    return `
      <tr>
        <td><span class="fw-semibold text-dark">#${order.orderNumber}</span></td>
        <td>
          <div class="d-flex align-items-center gap-2">
            <span class="customer-avatar">${order.customerName ? order.customerName.substring(0, 2).toUpperCase() : 'CU'}</span>
            <span class="fw-medium">${order.customerName || 'Walk-in Customer'}</span>
          </div>
        </td>
        <td>
          <span class="d-inline-block text-truncate" style="max-width: 200px;" title="${itemsSummary}">
            ${itemsSummary || 'N/A'}
          </span>
          <span class="badge bg-light text-dark border ms-1">${itemsCount} items</span>
        </td>
        <td class="text-muted small">${formatDate(order.createdAt)}</td>
        <td class="fw-bold text-dark">${formatPrice(order.total)}</td>
        <td>
          <span class="status-badge status-completed">
            <span class="status-dot"></span> ${order.status || 'Completed'}
          </span>
        </td>
        <td class="text-end">
          <button type="button" class="btn-action btn-action-view" onclick="openOrderDetailsModal('${order.id}')" title="View Order Details">
            <i class="bi bi-eye"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function loadOrdersTable() {
  const tableBody = document.getElementById('ordersTableBody');
  if (!tableBody) return;

  const orders = getOrders();
  const countEl = document.getElementById('totalOrdersCount');
  if (countEl) countEl.textContent = orders.length + ' Orders';

  const searchInput = document.getElementById('orderSearchInput');
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

  const filtered = orders.filter(order => {
    const numMatch = (order.orderNumber || '').toLowerCase().includes(query);
    const custMatch = (order.customerName || '').toLowerCase().includes(query);
    return !query || numMatch || custMatch;
  });

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-4 text-muted">
          No orders found matching your search.
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filtered.map(order => `
    <tr>
      <td><span class="fw-bold text-dark">#${order.orderNumber}</span></td>
      <td>
        <div class="d-flex align-items-center gap-2">
          <span class="customer-avatar">${order.customerName ? order.customerName.substring(0, 2).toUpperCase() : 'CU'}</span>
          <span class="fw-medium text-dark">${order.customerName || 'Walk-in Customer'}</span>
        </div>
      </td>
      <td class="text-muted small">${formatDate(order.createdAt)}</td>
      <td class="fw-bold text-dark">${formatPrice(order.total)}</td>
      <td>
        <span class="status-badge status-completed">
          <span class="status-dot"></span> ${order.status || 'Completed'}
        </span>
      </td>
      <td class="text-end">
        <div class="d-inline-flex gap-1">
          <button type="button" class="btn-action btn-action-view" onclick="openOrderDetailsModal('${order.id}')" title="View Order">
            <i class="bi bi-eye"></i>
          </button>
          <button type="button" class="btn-action btn-action-delete" onclick="openDeleteOrderModal('${order.id}')" title="Delete Order">
            <i class="bi bi-trash3"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function searchOrders() {
  loadOrdersTable();
}

function openOrderDetailsModal(orderId) {
  const order = getOrderById(orderId);
  if (!order) return;

  const modalEl = document.getElementById('viewOrderModal') || document.getElementById('recentOrderModal');
  if (!modalEl) return;

  const titleEl = document.getElementById('modalOrderNumber') || document.getElementById('dashOrderModalTicket');
  const timeEl = document.getElementById('modalOrderDateTime') || document.getElementById('dashOrderModalTime');
  const custEl = document.getElementById('modalOrderCustomerName') || document.getElementById('dashOrderModalCustomer');
  const totalEl = document.getElementById('modalOrderGrandTotal') || document.getElementById('dashOrderModalTotal');
  const itemsContainer = document.getElementById('modalOrderItemsTable') || document.getElementById('dashOrderModalItems');

  if (titleEl) titleEl.textContent = 'Order Ticket #' + order.orderNumber;
  if (timeEl) timeEl.textContent = formatDate(order.createdAt);
  if (custEl) custEl.textContent = order.customerName || 'Walk-in Customer';
  if (totalEl) totalEl.textContent = formatPrice(order.total);

  if (itemsContainer) {
    if (itemsContainer.tagName === 'TBODY') {
      itemsContainer.innerHTML = (order.items || []).map(i => `
        <tr>
          <td>${i.name}</td>
          <td class="text-center">${i.qty}</td>
          <td class="text-end">${formatPrice(i.price)}</td>
          <td class="text-end fw-semibold">${formatPrice(i.total)}</td>
        </tr>
      `).join('');
    } else {
      itemsContainer.innerHTML = (order.items || []).map(i => `
        <li class="list-group-item d-flex justify-content-between align-items-center px-0">
          <div>
            <span class="fw-medium">${i.name}</span>
            <div class="text-muted small">Qty: ${i.qty} &times; ${formatPrice(i.price)}</div>
          </div>
          <span class="fw-semibold">${formatPrice(i.total)}</span>
        </li>
      `).join('');
    }
  }

  if (typeof bootstrap !== 'undefined') {
    new bootstrap.Modal(modalEl).show();
  }
}

function openDeleteOrderModal(orderId) {
  const order = getOrderById(orderId);
  if (!order) return;

  const inputId = document.getElementById('delete_order_id');
  const numText = document.getElementById('delete_order_num');

  if (inputId) inputId.value = order.id;
  if (numText) numText.textContent = '#' + order.orderNumber;

  const modalEl = document.getElementById('deleteOrderModal');
  if (modalEl && typeof bootstrap !== 'undefined') {
    new bootstrap.Modal(modalEl).show();
  }
}

function confirmDeleteOrder() {
  const inputId = document.getElementById('delete_order_id');
  if (inputId && inputId.value) {
    deleteOrder(inputId.value);
    closeModal('deleteOrderModal');
    loadOrdersTable();
    alert('Order deleted successfully!');
  }
}
