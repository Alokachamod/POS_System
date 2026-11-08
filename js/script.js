// Automatically load the products table when the page is ready
document.addEventListener('DOMContentLoaded', loadProductsTable);

/**
 * Handle adding a new product from the Add Product modal
 */
function handleAddProduct() {
  const form = document.querySelector('#addProductModal form');
  if (!form.reportValidity()) return;

  // 1. Collect product input values
  const product = {
    name: document.getElementById('productName').value,
    category: document.getElementById('category').value,
    price: document.getElementById('price').value,
    qty: document.getElementById('qty').value,
    imgLink: document.getElementById('imgLink').value
  };

  // 2. Save product to localStorage via storage.js
  const savedItem = addProduct(product);
  console.log('Saved product:', savedItem);

  // 3. Feedback & form reset
  alert(`${product.name} added successfully.`);
  form.reset();

  // 4. Close the modal cleanly
  const modalElement = document.getElementById('addProductModal');
  if (window.bootstrap && bootstrap.Modal) {
    const modalInstance = bootstrap.Modal.getInstance(modalElement) || new bootstrap.Modal(modalElement);
    modalInstance.hide();
  }

  // 5. Instantly refresh the table with the new product
  loadProductsTable();
}

/**
 * Helper to return clean status badge HTML based on stock quantity
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

/**
 * Load and render all products in the table
 */
function loadProductsTable() {
  const tableBody = document.getElementById('productTableBody');
  if (!tableBody) return;

  // 1. Get products from storage.js
  const products = getProducts();

  // 2. Handle empty state
  if (products.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4 text-muted">
          No products found. Click "+ Add Product" to create one.
        </td>
      </tr>
    `;
    return;
  }

  // 3. Render all rows simply and efficiently
  tableBody.innerHTML = products.map(product => `
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
      <td class="fw-semibold text-dark">$${Number(product.price).toFixed(2)}</td>
      <td><span class="fw-semibold">${product.stock}</span> pcs</td>
      <td>${getBadgeHtml(product.stock)}</td>
      <td class="text-end">
        <div class="d-inline-flex gap-1">
          <button type="button" class="btn-action btn-action-stock" title="Add Stock" data-bs-toggle="modal" data-bs-target="#addStockModal">
            <i class="bi bi-plus-circle"></i>
          </button>
          <button type="button" class="btn-action btn-action-edit" title="Edit Product" data-bs-toggle="modal" data-bs-target="#editProductModal">
            <i class="bi bi-pencil-square"></i>
          </button>
          <button type="button" class="btn-action btn-action-delete" title="Delete Product" onclick="handleDeleteProduct('${product.id}')">
            <i class="bi bi-trash3"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

/**
 * Simple delete product handler with confirmation
 */
function handleDeleteProduct(id) {
  if (confirm('Are you sure you want to delete this product?')) {
    deleteProduct(id);
    loadProductsTable();
  }
}
