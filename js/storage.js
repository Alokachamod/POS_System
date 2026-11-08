/* ==========================================================================
   GrillMaster POS - LocalStorage Database Helper (js/storage.js)
   Matches GrillMaster POS UI: Products, Customers, Orders, Dashboard & POS.
   Plain Beginner-Friendly JavaScript with CRUD Operations.
   ========================================================================== */

// --------------------------------------------------------------------------
// Storage Keys (Collections)
// --------------------------------------------------------------------------
const STORAGE_KEYS = {
  PRODUCTS: 'pos_products',
  CUSTOMERS: 'pos_customers',
  ORDERS: 'pos_orders'
};

// ==========================================================================
// 1) GENERIC CRUD FUNCTIONS (Works for any collection)
// ==========================================================================

/**
 * Retrieve all items from a given localStorage collection.
 * Wrapped in try/catch to safely return an empty array if data is missing or corrupted.
 * @param {string} collection - The localStorage key (e.g., 'pos_products')
 * @returns {Array} Array of parsed objects, or [] on error/empty.
 */
function getAll(collection) {
  try {
    const rawData = localStorage.getItem(collection);
    if (!rawData) return [];
    const parsed = JSON.parse(rawData);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(`Error reading collection "${collection}" from localStorage:`, error);
    return [];
  }
}

/**
 * Save an entire array of items to a collection in localStorage.
 * @param {string} collection - The localStorage key
 * @param {Array} items - Array of objects to save
 */
function saveAll(collection, items) {
  try {
    localStorage.setItem(collection, JSON.stringify(items || []));
  } catch (error) {
    console.error(`Error saving to collection "${collection}":`, error);
  }
}

/**
 * Generate a unique ID for records.
 * Uses current timestamp and a random string.
 * @returns {string} Unique ID
 */
function generateId(type) {
  return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
}

/**
 * Find and return a single item by its ID from a collection.
 * @param {string} collection - The localStorage key
 * @param {string|number} id - The ID to look for
 * @returns {Object|null} Found object or null if not found.
 */
function getById(collection, id) {
  const items = getAll(collection);
  const found = items.find(item => String(item.id) === String(id));
  return found || null;
}

/**
 * Add a new item to a collection.
 * Automatically generates a unique 'id' and 'createdAt' ISO timestamp if not provided.
 * @param {string} collection - The localStorage key
 * @param {Object} item - The item object to add
 * @returns {Object} The added item with id and createdAt
 */
function addItem(collection, item) {
  const items = getAll(collection);
  const newItem = {
    ...item,
    id: item.id || generateId(),
    createdAt: item.createdAt || new Date().toISOString()
  };
  items.push(newItem);
  saveAll(collection, items);
  return newItem;
}

/**
 * Update an existing item by ID with given changes.
 * @param {string} collection - The localStorage key
 * @param {string|number} id - ID of item to update
 * @param {Object} changes - Partial or full properties to merge
 * @returns {Object|null} Updated item or null if not found.
 */
function updateItem(collection, id, changes) {
  const items = getAll(collection);
  const index = items.findIndex(item => String(item.id) === String(id));
  if (index === -1) return null;

  items[index] = {
    ...items[index],
    ...changes,
    id: items[index].id, // preserve original ID
    updatedAt: new Date().toISOString()
  };

  saveAll(collection, items);
  return items[index];
}

/**
 * Delete an item from a collection by ID.
 * @param {string} collection - The localStorage key
 * @param {string|number} id - ID of item to delete
 * @returns {boolean} True if deleted, false if not found.
 */
function deleteItem(collection, id) {
  const items = getAll(collection);
  const filtered = items.filter(item => String(item.id) !== String(id));
  if (filtered.length === items.length) {
    return false; // Item was not found
  }
  saveAll(collection, filtered);
  return true;
}

/**
 * Search items in a collection by a text query matching specified fields.
 * Performs a case-insensitive check.
 * @param {string} collection - The localStorage key
 * @param {string} text - Search text
 * @param {Array<string>} fields - Array of property names to check (e.g. ['name', 'category'])
 * @returns {Array} Filtered list of matching items.
 */
function searchItems(collection, text, fields) {
  const items = getAll(collection);
  if (!text || text.trim() === '') return items;

  const query = text.toLowerCase().trim();
  return items.filter(item => {
    return fields.some(field => {
      const val = item[field];
      return val !== undefined && val !== null && String(val).toLowerCase().includes(query);
    });
  });
}

/**
 * Count total items in a collection.
 * @param {string} collection - The localStorage key
 * @returns {number} Count of items
 */
function countItems(collection) {
  return getAll(collection).length;
}

/**
 * Empty out a collection (resets to empty array).
 * @param {string} collection - The localStorage key
 */
function clearCollection(collection) {
  saveAll(collection, []);
}

// ==========================================================================
// 2) PRODUCTS & INVENTORY FUNCTIONS
// ==========================================================================

/**
 * Get all products from storage.
 * @returns {Array} List of products
 */
function getProducts() {
  return getAll(STORAGE_KEYS.PRODUCTS);
}

/**
 * Get products filtered by category.
 * If category is "All" or empty, returns all products.
 * Handles category name variants (e.g., 'Burgers' or 'burgers', 'Fries' or 'Fries & Sides').
 * @param {string} category - Category name
 * @returns {Array} Filtered products
 */
function getProductsByCategory(category) {
  const products = getProducts();
  if (!category || category.toLowerCase() === 'all' || category.toLowerCase() === 'all items') {
    return products;
  }

  const catQuery = category.toLowerCase().trim();
  return products.filter(product => {
    const prodCat = (product.category || '').toLowerCase().trim();
    return prodCat === catQuery ||
           (catQuery.includes('fries') && prodCat.includes('fries')) ||
           (catQuery.includes('burger') && prodCat.includes('burger')) ||
           (catQuery.includes('drink') && prodCat.includes('drink'));
  });
}

/**
 * Add a new product to storage.
 * Converts price and stock/qty to numbers.
 * Supports both property naming conventions (image or imgLink, stock or qty).
 * @param {Object} product - Product data { name, category, price, stock, image, sku }
 * @returns {Object} Added product record
 */
function addProduct(product) {
  const cleanProduct = {
    name: (product.name || '').trim(),
    category: (product.category || 'Burgers').trim(),
    price: Number(product.price) || 0,
    stock: Number(product.stock !== undefined ? product.stock : (product.qty !== undefined ? product.qty : 0)),
    image: product.image || product.imgLink || 'https://placehold.co/400x300/1f1f1f/ff5722?text=Product',
    sku: product.sku || ('BRG-' + Math.floor(100 + Math.random() * 900))
  };

  return addItem(STORAGE_KEYS.PRODUCTS, cleanProduct);
}

/**
 * Update product information.
 * Converts price and stock to numbers if provided in changes.
 * @param {string|number} id - Product ID
 * @param {Object} changes - Properties to update
 * @returns {Object|null} Updated product or null
 */
function updateProduct(id, changes) {
  const cleanChanges = { ...changes };

  if (cleanChanges.price !== undefined) {
    cleanChanges.price = Number(cleanChanges.price) || 0;
  }
  if (cleanChanges.stock !== undefined) {
    cleanChanges.stock = Number(cleanChanges.stock) || 0;
  } else if (cleanChanges.qty !== undefined) {
    cleanChanges.stock = Number(cleanChanges.qty) || 0;
    delete cleanChanges.qty;
  }
  if (cleanChanges.imgLink && !cleanChanges.image) {
    cleanChanges.image = cleanChanges.imgLink;
    delete cleanChanges.imgLink;
  }

  return updateItem(STORAGE_KEYS.PRODUCTS, id, cleanChanges);
}

/**
 * Delete a product by its ID.
 * @param {string|number} id - Product ID
 * @returns {boolean} True if deleted, false otherwise
 */
function deleteProduct(id) {
  return deleteItem(STORAGE_KEYS.PRODUCTS, id);
}

/**
 * Increase the stock quantity of a product (e.g. for "+ Stock" button).
 * @param {string|number} id - Product ID
 * @param {number} qty - Quantity to add
 * @returns {Object|null} Updated product
 */
function increaseStock(id, qty) {
  const product = getById(STORAGE_KEYS.PRODUCTS, id);
  if (!product) return null;

  const currentStock = Number(product.stock) || 0;
  const addQty = Number(qty) || 0;
  const newStock = currentStock + addQty;

  return updateItem(STORAGE_KEYS.PRODUCTS, id, { stock: newStock });
}

/**
 * Decrease the stock quantity of a product (never drops below 0).
 * @param {string|number} id - Product ID
 * @param {number} qty - Quantity to subtract
 * @returns {Object|null} Updated product
 */
function decreaseStock(id, qty) {
  const product = getById(STORAGE_KEYS.PRODUCTS, id);
  if (!product) return null;

  const currentStock = Number(product.stock) || 0;
  const subQty = Number(qty) || 0;
  const newStock = Math.max(0, currentStock - subQty);

  return updateItem(STORAGE_KEYS.PRODUCTS, id, { stock: newStock });
}

/**
 * Get stock status text and Bootstrap badge class based on stock number.
 * Thresholds:
 * - stock <= 0: "Out of Stock" (bg-danger)
 * - stock <= 10: "Low Stock" (bg-warning text-dark)
 * - stock > 10: "In Stock" (bg-success)
 * @param {number} stock - Current stock quantity
 * @returns {{ text: string, css: string }} Badge info
 */
function getStockStatus(stock) {
  const qty = Number(stock) || 0;
  if (qty <= 0) {
    return { text: 'Out of Stock', css: 'bg-danger' };
  } else if (qty <= 10) {
    return { text: 'Low Stock', css: 'bg-warning text-dark' };
  } else {
    return { text: 'In Stock', css: 'bg-success' };
  }
}

/**
 * Get all products that have low stock (stock > 0 and stock <= 10).
 * @returns {Array} List of low stock products
 */
function getLowStockProducts() {
  const products = getProducts();
  return products.filter(product => {
    const qty = Number(product.stock) || 0;
    return qty > 0 && qty <= 10;
  });
}

// ==========================================================================
// 3) CUSTOMERS FUNCTIONS
// ==========================================================================

/**
 * Get all customers.
 * @returns {Array} List of customers
 */
function getCustomers() {
  return getAll(STORAGE_KEYS.CUSTOMERS);
}

/**
 * Add a new customer.
 * @param {Object} customer - { name, phone, email }
 * @returns {Object} Added customer
 */
function addCustomer(customer) {
  const newCust = {
    name: (customer.name || '').trim(),
    phone: (customer.phone || '').trim(),
    email: (customer.email || '').trim()
  };
  return addItem(STORAGE_KEYS.CUSTOMERS, newCust);
}

/**
 * Update an existing customer.
 * @param {string|number} id - Customer ID
 * @param {Object} changes - Customer changes
 * @returns {Object|null} Updated customer
 */
function updateCustomer(id, changes) {
  return updateItem(STORAGE_KEYS.CUSTOMERS, id, changes);
}

/**
 * Delete a customer by ID.
 * @param {string|number} id - Customer ID
 * @returns {boolean} True if deleted, false otherwise
 */
function deleteCustomer(id) {
  return deleteItem(STORAGE_KEYS.CUSTOMERS, id);
}

// ==========================================================================
// 4) ORDERS & POS TRANSACTION FUNCTIONS
// ==========================================================================

/**
 * Get all orders.
 * @returns {Array} List of orders
 */
function getOrders() {
  return getAll(STORAGE_KEYS.ORDERS);
}

/**
 * Delete an order by ID.
 * @param {string|number} id - Order ID
 * @returns {boolean} True if deleted
 */
function deleteOrder(id) {
  return deleteItem(STORAGE_KEYS.ORDERS, id);
}

/**
 * Place a new order from POS.
 * Performs stock verification, subtotal/total calculations, assigns an order number (e.g. ORD-0001),
 * records customer name, reduces stock of each ordered product, and saves the order.
 *
 * @param {string|null} customerId - ID of customer or null/empty for Walk-in Customer
 * @param {Array<{productId: string, name: string, price: number, qty: number}>} cartItems - Items in the cart
 * @param {number} discount - Discount amount in currency
 * @returns {{ success: boolean, order?: Object, message?: string }}
 */
function placeOrder(customerId, cartItems, discount) {
  // 1. Check cart is not empty
  if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
    return { success: false, message: 'Cart is empty. Please add items before placing order.' };
  }

  // 2. Check stock availability for every product in the cart
  for (let i = 0; i < cartItems.length; i++) {
    const item = cartItems[i];
    const product = getById(STORAGE_KEYS.PRODUCTS, item.productId);

    if (!product) {
      return { success: false, message: `Product "${item.name}" was not found in inventory.` };
    }

    const availableStock = Number(product.stock) || 0;
    const requiredQty = Number(item.qty) || 0;

    if (requiredQty <= 0) {
      return { success: false, message: `Invalid quantity for "${item.name}".` };
    }

    if (availableStock < requiredQty) {
      return {
        success: false,
        message: `Insufficient stock for "${item.name}". Available: ${availableStock}, Requested: ${requiredQty}`
      };
    }
  }

  // 3. Calculate subtotal, discount, and grand total
  let subtotal = 0;
  cartItems.forEach(item => {
    subtotal += (Number(item.price) || 0) * (Number(item.qty) || 0);
  });

  const discountAmount = Math.max(0, Number(discount) || 0);
  const total = Math.max(0, subtotal - discountAmount);

  // 4. Resolve customer name
  let customerName = 'Walk-in Customer';
  if (customerId) {
    const customer = getById(STORAGE_KEYS.CUSTOMERS, customerId);
    if (customer && customer.name) {
      customerName = customer.name;
    }
  }

  // 5. Generate human-readable order number like ORD-0001
  const existingOrders = getOrders();
  const nextOrderNumber = 'ORD-' + String(existingOrders.length + 1).padStart(4, '0');

  // 6. Build and save the order object
  const orderRecord = {
    orderNumber: nextOrderNumber,
    customerId: customerId || null,
    customerName: customerName,
    items: cartItems.map(item => ({
      productId: item.productId,
      name: item.name,
      price: Number(item.price) || 0,
      qty: Number(item.qty) || 0,
      total: (Number(item.price) || 0) * (Number(item.qty) || 0)
    })),
    subtotal: subtotal,
    discount: discountAmount,
    total: total,
    status: 'Completed',
    createdAt: new Date().toISOString()
  };

  const savedOrder = addItem(STORAGE_KEYS.ORDERS, orderRecord);

  // 7. Reduce stock for each product in storage
  cartItems.forEach(item => {
    decreaseStock(item.productId, item.qty);
  });

  return { success: true, order: savedOrder };
}

// ==========================================================================
// 5) DASHBOARD STATS
// ==========================================================================

/**
 * Compute stats matching the 4 Dashboard cards and the Recent Orders table.
 * - totalSales: sum of all order totals
 * - totalOrders: total count of orders
 * - totalProducts: total count of products
 * - lowStock: count of products with low stock (1 to 10 units)
 * - recentOrders: last 5 orders, newest first
 * @returns {{ totalSales: number, totalOrders: number, totalProducts: number, lowStock: number, recentOrders: Array }}
 */
function getDashboardStats() {
  const orders = getOrders();
  const products = getProducts();

  // Sum total sales
  const totalSales = orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);

  // Total counts
  const totalOrders = orders.length;
  const totalProducts = products.length;

  // Count low stock products (1 to 10)
  const lowStock = products.filter(p => {
    const qty = Number(p.stock) || 0;
    return qty > 0 && qty <= 10;
  }).length;

  // Recent 5 orders, newest first
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return {
    totalSales,
    totalOrders,
    totalProducts,
    lowStock,
    recentOrders
  };
}

// ==========================================================================
// 6) DISPLAY HELPERS
// ==========================================================================

/**
 * Format a number into currency display (e.g. 1500 -> "Rs. 1,500.00").
 * @param {number|string} amount - The price amount
 * @returns {string} Formatted price
 */
function formatPrice(amount) {
  const num = Number(amount) || 0;
  return 'Rs. ' + num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

/**
 * Format an ISO date string into readable format: "08 Nov 2026, 10:30 AM".
 * @param {string} isoString - ISO date string
 * @returns {string} Formatted date string
 */
function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return String(isoString);

  const day = String(date.getDate()).padStart(2, '0');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 hour is 12 AM
  const strHours = String(hours).padStart(2, '0');

  return `${day} ${month} ${year}, ${strHours}:${minutes} ${ampm}`;
}

// ==========================================================================
// 7) DUMMY DATA SEEDING
// ==========================================================================

/**
 * Initialize default dummy data on first load.
 * Runs ONLY if 'pos_products' does not already exist in localStorage.
 * Seeds 7 burger shop products (including low-stock and out-of-stock items)
 * and 3 customers, using placehold.co images.
 */
function seedData() {
  if (localStorage.getItem(STORAGE_KEYS.PRODUCTS) !== null) {
    // Data has already been initialized
    return;
  }

  // 1. Initial 7 Burger Shop Products
  const initialProducts = [
    {
      id: 'prod_1',
      name: 'Classic Cheeseburger',
      category: 'Burgers',
      price: 8.99,
      stock: 45,
      sku: 'BRG-001',
      image: 'https://placehold.co/400x300/1f1f1f/ff5722?text=Classic+Cheeseburger',
      createdAt: new Date().toISOString()
    },
    {
      id: 'prod_2',
      name: 'Double Bacon Smash',
      category: 'Burgers',
      price: 11.49,
      stock: 28,
      sku: 'BRG-002',
      image: 'https://placehold.co/400x300/1f1f1f/ff5722?text=Double+Bacon+Smash',
      createdAt: new Date().toISOString()
    },
    {
      id: 'prod_3',
      name: 'Spicy Jalapeño Burger',
      category: 'Burgers',
      price: 9.99,
      stock: 8, // Low Stock (<= 10)
      sku: 'BRG-003',
      image: 'https://placehold.co/400x300/1f1f1f/ff5722?text=Spicy+Jalapeno+Burger',
      createdAt: new Date().toISOString()
    },
    {
      id: 'prod_4',
      name: 'Mushroom Swiss Burger',
      category: 'Burgers',
      price: 10.99,
      stock: 4, // Low Stock (<= 10)
      sku: 'BRG-004',
      image: 'https://placehold.co/400x300/1f1f1f/ff5722?text=Mushroom+Swiss+Burger',
      createdAt: new Date().toISOString()
    },
    {
      id: 'prod_5',
      name: 'Loaded Truffle Fries',
      category: 'Fries & Sides',
      price: 5.49,
      stock: 40,
      sku: 'FRY-001',
      image: 'https://placehold.co/400x300/1f1f1f/ff5722?text=Loaded+Truffle+Fries',
      createdAt: new Date().toISOString()
    },
    {
      id: 'prod_6',
      name: 'Crispy Onion Rings',
      category: 'Fries & Sides',
      price: 4.99,
      stock: 25,
      sku: 'FRY-002',
      image: 'https://placehold.co/400x300/1f1f1f/ff5722?text=Crispy+Onion+Rings',
      createdAt: new Date().toISOString()
    },
    {
      id: 'prod_7',
      name: 'Chocolate Thickshake',
      category: 'Drinks',
      price: 4.49,
      stock: 0, // Out of Stock (= 0)
      sku: 'DRK-001',
      image: 'https://placehold.co/400x300/1f1f1f/ff5722?text=Chocolate+Thickshake',
      createdAt: new Date().toISOString()
    }
  ];

  // 2. Initial 3 Customers
  const initialCustomers = [
    {
      id: 'cust_1',
      name: 'Alex Morgan',
      phone: '(555) 234-5678',
      email: 'alex.morgan@example.com',
      createdAt: new Date().toISOString()
    },
    {
      id: 'cust_2',
      name: 'Sarah Jenkins',
      phone: '(555) 345-6789',
      email: 'sarah.j@example.com',
      createdAt: new Date().toISOString()
    },
    {
      id: 'cust_3',
      name: 'David Kim',
      phone: '(555) 456-7890',
      email: 'david.kim@example.com',
      createdAt: new Date().toISOString()
    }
  ];

  // 3. Initial Sample Orders (so Dashboard and Orders table are immediately populated)
  const initialOrders = [
    {
      id: 'ord_1',
      orderNumber: 'ORD-0001',
      customerId: 'cust_1',
      customerName: 'Alex Morgan',
      items: [
        { productId: 'prod_1', name: 'Classic Cheeseburger', price: 8.99, qty: 2, total: 17.98 },
        { productId: 'prod_5', name: 'Loaded Truffle Fries', price: 5.49, qty: 1, total: 5.49 }
      ],
      subtotal: 23.47,
      discount: 2.00,
      total: 21.47,
      status: 'Completed',
      createdAt: new Date(Date.now() - 3600000 * 3).toISOString() // 3 hours ago
    },
    {
      id: 'ord_2',
      orderNumber: 'ORD-0002',
      customerId: 'cust_2',
      customerName: 'Sarah Jenkins',
      items: [
        { productId: 'prod_2', name: 'Double Bacon Smash', price: 11.49, qty: 1, total: 11.49 }
      ],
      subtotal: 11.49,
      discount: 0,
      total: 11.49,
      status: 'Completed',
      createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString() // 1.5 hours ago
    }
  ];

  saveAll(STORAGE_KEYS.PRODUCTS, initialProducts);
  saveAll(STORAGE_KEYS.CUSTOMERS, initialCustomers);
  saveAll(STORAGE_KEYS.ORDERS, initialOrders);

  console.log('GrillMaster POS: Dummy data initialized successfully.');
}

// Automatically seed default data on first script load
seedData();
