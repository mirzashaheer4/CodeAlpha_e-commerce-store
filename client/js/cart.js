import { apiCall } from './api.js';

let isUserLoggedIn = false;

// Set the logged-in status (called by app.js when auth state changes)
export function setCartAuthState(loggedIn) {
  isUserLoggedIn = loggedIn;
}

// Get guest cart array from localStorage
function getGuestCartItems() {
  try {
    return JSON.parse(localStorage.getItem('guest_cart') || '[]');
  } catch (e) {
    return [];
  }
}

// Save guest cart array to localStorage
function saveGuestCartItems(items) {
  localStorage.setItem('guest_cart', JSON.stringify(items));
}

/**
 * Retrieve the current cart.
 * If logged in, fetches from database.
 * If guest, reads localStorage and populates details from product listings.
 */
export async function getCart() {
  if (isUserLoggedIn) {
    const response = await apiCall('/cart');
    return response.data; // { userId, items: [{ productId: {...}, quantity }] }
  } else {
    const guestItems = getGuestCartItems();
    if (guestItems.length === 0) {
      return { items: [] };
    }

    // Fetch products to populate names/prices/images for the guest cart
    try {
      const productsResponse = await apiCall('/products');
      const products = productsResponse.data || [];
      
      const populatedItems = guestItems.map(item => {
        const product = products.find(p => p._id === item.productId);
        return {
          productId: product || {
            _id: item.productId,
            name: 'Unknown Product',
            price: 0,
            imageUrl: '',
            stock: 0
          },
          quantity: item.quantity
        };
      });

      return { items: populatedItems };
    } catch (error) {
      console.error('Failed to populate guest cart:', error.message);
      return { items: [] };
    }
  }
}

/**
 * Add an item to the cart.
 */
export async function addToCart(productId, quantity) {
  if (isUserLoggedIn) {
    const response = await apiCall('/cart', {
      method: 'POST',
      body: { productId, quantity }
    });
    return response.data;
  } else {
    // 1. Fetch product detail to check stock
    const productResponse = await apiCall(`/products/${productId}`);
    const product = productResponse.data;
    if (!product) {
      throw new Error('Product not found');
    }

    // 2. Check if quantity exceeds stock
    const items = getGuestCartItems();
    const existingIndex = items.findIndex(item => item.productId === productId);
    
    let targetQty = quantity;
    if (existingIndex > -1) {
      targetQty += items[existingIndex].quantity;
    }

    if (targetQty > product.stock) {
      throw new Error('Insufficient stock');
    }

    // 3. Save
    if (existingIndex > -1) {
      items[existingIndex].quantity = targetQty;
    } else {
      items.push({ productId, quantity });
    }
    
    saveGuestCartItems(items);
    return await getCart();
  }
}

/**
 * Update the quantity of an item in the cart.
 */
export async function updateCartQuantity(productId, quantity) {
  if (isUserLoggedIn) {
    const response = await apiCall('/cart', {
      method: 'PUT',
      body: { productId, quantity }
    });
    return response.data;
  } else {
    // 1. Fetch product detail to check stock
    const productResponse = await apiCall(`/products/${productId}`);
    const product = productResponse.data;
    if (!product) {
      throw new Error('Product not found');
    }

    if (quantity > product.stock) {
      throw new Error('Insufficient stock');
    }

    // 2. Update quantity
    const items = getGuestCartItems();
    const existingIndex = items.findIndex(item => item.productId === productId);
    if (existingIndex > -1) {
      items[existingIndex].quantity = quantity;
      saveGuestCartItems(items);
    }
    
    return await getCart();
  }
}

/**
 * Remove an item from the cart entirely.
 */
export async function removeFromCart(productId) {
  if (isUserLoggedIn) {
    const response = await apiCall(`/cart/${productId}`, {
      method: 'DELETE'
    });
    return response.data;
  } else {
    let items = getGuestCartItems();
    items = items.filter(item => item.productId !== productId);
    saveGuestCartItems(items);
    return await getCart();
  }
}

/**
 * Clear the local cart data.
 */
export function clearLocalCart() {
  localStorage.removeItem('guest_cart');
}

/**
 * Synchronize guest cart items with the database cart on login.
 * Calls POST /api/cart sequentially for each local item, then clears guest cart.
 */
export async function syncGuestCart() {
  const items = getGuestCartItems();
  if (items.length === 0) return;

  console.log(`Syncing ${items.length} guest cart items to the database...`);
  
  // Sync items sequentially
  for (const item of items) {
    try {
      await apiCall('/cart', {
        method: 'POST',
        body: {
          productId: item.productId,
          quantity: item.quantity
        }
      });
    } catch (err) {
      console.error(`Failed to sync guest cart item ${item.productId}:`, err.message);
    }
  }

  // Clear guest cart
  clearLocalCart();
}

/**
 * Get total quantity of items in the cart (for navbar badge).
 */
export async function getCartCount() {
  try {
    const cart = await getCart();
    return cart.items.reduce((total, item) => total + item.quantity, 0);
  } catch (error) {
    return 0;
  }
}
