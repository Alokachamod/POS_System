const STORAGE_KEYS = {
  PRODUCTS: 'pos_products',
  CUSTOMERS: 'pos_customers',
  ORDERS: 'pos_orders'
};

function getAll(collection) {
  try {
    const raw = localStorage.getItem(collection);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

function saveAll(collection, items) {
  localStorage.setItem(collection, JSON.stringify(items || []));
}

function getById(collection, id) {
  const items = getAll(collection);
  return items.find(item => String(item.id) === String(id)) || null;
}

function addItem(collection, item) {
  const items = getAll(collection);
  const newItem = {
    ...item,
    id: item.id || ('id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6)),
    createdAt: item.createdAt || new Date().toISOString()
  };
  items.push(newItem);
  saveAll(collection, items);
  return newItem;
}

function updateItem(collection, id, changes) {
  const items = getAll(collection);
  const index = items.findIndex(item => String(item.id) === String(id));
  if (index === -1) return null;
  items[index] = { ...items[index], ...changes };
  saveAll(collection, items);
  return items[index];
}

function deleteItem(collection, id) {
  const items = getAll(collection);
  const filtered = items.filter(item => String(item.id) !== String(id));
  if (filtered.length !== items.length) {
    saveAll(collection, filtered);
    return true;
  }
  return false;
}

function getProducts() {
  return getAll(STORAGE_KEYS.PRODUCTS);
}

function getProductById(id) {
  return getById(STORAGE_KEYS.PRODUCTS, id);
}

function addProduct(product) {
  const cleanProduct = {
    name: (product.name || '').trim(),
    category: (product.category || 'Burgers').trim(),
    price: Number(product.price) || 0,
    stock: Number(product.stock !== undefined ? product.stock : (product.qty || 0)),
    image: product.image || product.imgLink || 'images/default-burger.svg',
    sku: product.sku || ('BRG-' + Math.floor(100 + Math.random() * 900))
  };
  return addItem(STORAGE_KEYS.PRODUCTS, cleanProduct);
}

function updateProduct(id, changes) {
  const cleanChanges = { ...changes };
  if (cleanChanges.price !== undefined) cleanChanges.price = Number(cleanChanges.price) || 0;
  if (cleanChanges.stock !== undefined) cleanChanges.stock = Number(cleanChanges.stock) || 0;
  return updateItem(STORAGE_KEYS.PRODUCTS, id, cleanChanges);
}

function deleteProduct(id) {
  return deleteItem(STORAGE_KEYS.PRODUCTS, id);
}

function addStock(id, additionalQty) {
  const product = getProductById(id);
  if (!product) return null;
  const currentStock = Number(product.stock) || 0;
  const added = Number(additionalQty) || 0;
  return updateProduct(id, { stock: Math.max(0, currentStock + added) });
}

function decreaseStock(id, qty) {
  const product = getProductById(id);
  if (!product) return null;
  const currentStock = Number(product.stock) || 0;
  const reduced = Number(qty) || 0;
  return updateProduct(id, { stock: Math.max(0, currentStock - reduced) });
}

function getCustomers() {
  return getAll(STORAGE_KEYS.CUSTOMERS);
}

function getCustomerById(id) {
  return getById(STORAGE_KEYS.CUSTOMERS, id);
}

function generateCustomerId() {
  const customers = getCustomers();
  let maxNum = 0;
  customers.forEach(c => {
    if (c.id && typeof c.id === 'string') {
      const match = c.id.match(/^cus_(\d+)$/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) maxNum = num;
      }
    }
  });
  return 'cus_' + String(maxNum + 1).padStart(3, '0');
}

function addCustomer(customer) {
  const newCust = {
    id: customer.id || generateCustomerId(),
    name: (customer.name || '').trim(),
    phone: (customer.phone || '').trim(),
    email: (customer.email || '').trim()
  };
  return addItem(STORAGE_KEYS.CUSTOMERS, newCust);
}

function updateCustomer(id, changes) {
  return updateItem(STORAGE_KEYS.CUSTOMERS, id, changes);
}

function deleteCustomer(id) {
  return deleteItem(STORAGE_KEYS.CUSTOMERS, id);
}

function getOrders() {
  return getAll(STORAGE_KEYS.ORDERS);
}

function getOrderById(id) {
  return getById(STORAGE_KEYS.ORDERS, id);
}

function deleteOrder(id) {
  return deleteItem(STORAGE_KEYS.ORDERS, id);
}

function placeOrder(customerId, cartItems, discount) {
  if (!cartItems || cartItems.length === 0) {
    return { success: false, message: 'Cart is empty. Please add items before placing order.' };
  }

  for (let i = 0; i < cartItems.length; i++) {
    const item = cartItems[i];
    const product = getProductById(item.productId);
    if (!product) return { success: false, message: `Product "${item.name}" was not found.` };
    const stock = Number(product.stock) || 0;
    const req = Number(item.qty) || 0;
    if (stock < req) {
      return { success: false, message: `Insufficient stock for "${item.name}". Available: ${stock}, Requested: ${req}` };
    }
  }

  let subtotal = 0;
  cartItems.forEach(item => {
    subtotal += (Number(item.price) || 0) * (Number(item.qty) || 0);
  });

  const discountAmount = Number(discount) || 0;
  const total = Math.max(0, subtotal - discountAmount);

  let customerName = 'Walk-in Customer';
  if (customerId) {
    const customer = getCustomerById(customerId);
    if (customer && customer.name) customerName = customer.name;
  }

  const existingOrders = getOrders();
  const nextOrderNumber = 'ORD-' + String(existingOrders.length + 1).padStart(4, '0');

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

  cartItems.forEach(item => {
    decreaseStock(item.productId, item.qty);
  });

  return { success: true, order: savedOrder };
}

function getDashboardStats() {
  const orders = getOrders();
  const products = getProducts();

  const totalSales = orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
  const totalOrders = orders.length;
  const totalProducts = products.length;
  const lowStock = products.filter(p => {
    const qty = Number(p.stock) || 0;
    return qty > 0 && qty <= 10;
  }).length;

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

function formatPrice(amount) {
  const num = Number(amount) || 0;
  return 'LKR ' + num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

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
  hours = hours % 12 || 12;
  const strHours = String(hours).padStart(2, '0');

  return `${day} ${month} ${year}, ${strHours}:${minutes} ${ampm}`;
}

function initStorage() {
  if (localStorage.getItem(STORAGE_KEYS.PRODUCTS) === null) saveAll(STORAGE_KEYS.PRODUCTS, []);
  if (localStorage.getItem(STORAGE_KEYS.CUSTOMERS) === null) saveAll(STORAGE_KEYS.CUSTOMERS, []);
  if (localStorage.getItem(STORAGE_KEYS.ORDERS) === null) saveAll(STORAGE_KEYS.ORDERS, []);

  const defaultProdIds = ['prod_1', 'prod_2', 'prod_3', 'prod_4', 'prod_5', 'prod_6', 'prod_7'];
  const defaultCustIds = ['cust_1', 'cust_2', 'cust_3'];
  const defaultOrderIds = ['ord_1', 'ord_2'];

  const products = getAll(STORAGE_KEYS.PRODUCTS);
  if (products.some(p => defaultProdIds.includes(p.id))) {
    saveAll(STORAGE_KEYS.PRODUCTS, products.filter(p => !defaultProdIds.includes(p.id)));
  }

  const customers = getAll(STORAGE_KEYS.CUSTOMERS);
  if (customers.some(c => defaultCustIds.includes(c.id))) {
    saveAll(STORAGE_KEYS.CUSTOMERS, customers.filter(c => !defaultCustIds.includes(c.id)));
  }

  const orders = getAll(STORAGE_KEYS.ORDERS);
  if (orders.some(o => defaultOrderIds.includes(o.id))) {
    saveAll(STORAGE_KEYS.ORDERS, orders.filter(o => !defaultOrderIds.includes(o.id)));
  }
}

initStorage();
