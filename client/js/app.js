import { apiCall } from './api.js';
import { showToast } from './ui.js';
import {
  setCartAuthState,
  getCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  getCartCount,
  syncGuestCart
} from './cart.js';

// Application State
let currentUser = null;
let currentCategory = 'all';
let currentSearch = '';
let redirectAfterLogin = null;

// DOM Cache
const appRoot = document.getElementById('app-root');
const navHome = document.getElementById('nav-home');
const navOrders = document.getElementById('nav-orders');
const userProfileSec = document.getElementById('user-profile-sec');

/**
 * Check if user is authenticated via API session cookie.
 */
async function checkAuthStatus() {
  try {
    const response = await apiCall('/auth/me');
    if (response.success) {
      currentUser = response.user;
      setCartAuthState(true);
    } else {
      currentUser = null;
      setCartAuthState(false);
    }
  } catch (error) {
    currentUser = null;
    setCartAuthState(false);
  }
}

/**
 * Update global layout state (navbar options, greetings, cart badge).
 */
async function updateLayout() {
  // Update nav links active states
  const hash = window.location.hash || '#/';
  navHome.classList.toggle('active', hash === '#/');
  document.getElementById('nav-about')?.classList.toggle('active', hash === '#/about');
  document.getElementById('nav-faq')?.classList.toggle('active', hash === '#/faq');
  document.getElementById('nav-contact')?.classList.toggle('active', hash === '#/contact');
  navOrders.classList.toggle('active', hash === '#/orders');

  // Update navbar auth profile section
  if (currentUser) {
    navOrders.style.display = 'block';
    userProfileSec.innerHTML = `
      <span class="user-name"><i class="fa-regular fa-user"></i> ${currentUser.name}</span>
      <button class="btn btn-secondary btn-sm" id="btn-logout-nav" style="padding: 0.4rem 0.8rem; font-size: 0.85rem;">Sign Out</button>
    `;
    
    // Add logout action
    document.getElementById('btn-logout-nav').addEventListener('click', handleLogout);
  } else {
    navOrders.style.display = 'none';
    userProfileSec.innerHTML = `
      <a href="#/login" class="btn btn-secondary btn-sm" id="btn-login-nav">Sign In</a>
    `;
  }

  // Update dynamic cart badge
  const count = await getCartCount();
  const badge = document.getElementById('cart-badge-count');
  if (count > 0) {
    badge.textContent = count;
    badge.style.display = 'block';
  } else {
    badge.style.display = 'none';
  }
}

/**
 * Handle user logout request.
 */
async function handleLogout() {
  try {
    const res = await apiCall('/auth/logout', { method: 'POST' });
    if (res.success) {
      currentUser = null;
      setCartAuthState(false);
      showToast('Logged out successfully', 'success');
      await updateLayout();
      window.location.hash = '#/';
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

/**
 * Standard Loading Spinner component.
 */
function renderLoader(message = 'Loading details...') {
  return `
    <div class="loader-container">
      <div class="loader"></div>
      <p style="color: var(--text-secondary); margin-top: 1rem;">${message}</p>
    </div>
  `;
}

/**
 * -----------------------------------------
 * VIEW RENDERING CONTROLLERS
 * -----------------------------------------
 */

// 1. Catalog Page
async function renderCatalog() {
  appRoot.innerHTML = renderLoader('Loading product catalog...');
  
  try {
    // Fetch products
    let query = `?category=${currentCategory}`;
    if (currentSearch) {
      query += `&search=${encodeURIComponent(currentSearch)}`;
    }
    
    const response = await apiCall(`/products${query}`);
    const products = response.data || [];

    // Category lists for rendering filter tabs
    const categories = ['all', 'Electronics', 'Wearables', 'Lifestyle', 'Home Office', 'Apparel'];

    let categoriesHtml = categories.map(cat => `
      <button class="category-tab ${currentCategory === cat ? 'active' : ''}" data-cat="${cat}">
        ${cat.charAt(0).toUpperCase() + cat.slice(1)}
      </button>
    `).join('');

    let productsGridHtml = '';
    if (products.length === 0) {
      productsGridHtml = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 0; color: var(--text-secondary);">
          <i class="fa-solid fa-box-open fa-3x" style="margin-bottom: 1rem; opacity: 0.5;"></i>
          <h3>No products found</h3>
          <p>Try clearing your filters or search terms.</p>
        </div>
      `;
    } else {
      productsGridHtml = products.map(product => `
        <div class="product-card">
          <div class="product-img-wrapper">
            <img class="product-img" src="${product.imageUrl}" alt="${product.name}" loading="lazy">
            <span class="product-category-tag">${product.category}</span>
          </div>
          <div class="product-card-body">
            <h3 class="product-card-title">${product.name}</h3>
            <p class="product-card-desc">${product.description}</p>
            <div class="product-card-footer">
              <span class="product-price">$${product.price.toFixed(2)}</span>
              ${product.stock > 0 
                ? `<button class="btn btn-primary btn-sm btn-add-to-cart" data-id="${product._id}">
                     <i class="fa-solid fa-cart-plus"></i> Add to Cart
                   </button>`
                : `<button class="btn btn-secondary btn-sm" disabled>Out of Stock</button>`
              }
            </div>
          </div>
        </div>
      `).join('');
    }

    appRoot.innerHTML = `
      <section class="hero-banner">
        <h1 class="hero-title">Experience Innovation.</h1>
        <p class="hero-subtitle">Discover a curated collection of state-of-the-art gadgets, luxury office accessories, and everyday carry products built for high performance.</p>
      </section>

      <div class="catalog-actions">
        <div class="search-box">
          <i class="fa-solid fa-magnifying-glass search-icon"></i>
          <input type="text" class="search-input" id="catalog-search" placeholder="Search products..." value="${currentSearch}">
        </div>
        <div class="category-filter">
          ${categoriesHtml}
        </div>
      </div>

      <div class="product-grid">
        ${productsGridHtml}
      </div>
    `;

    // Event listeners
    // Search input handler
    const searchInput = document.getElementById('catalog-search');
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentSearch = e.target.value.trim();
        renderCatalog();
      }, 500); // Debounce searches
    });

    // Category click handler
    document.querySelectorAll('.category-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        currentCategory = e.currentTarget.getAttribute('data-cat');
        renderCatalog();
      });
    });

    // Add to cart delegation
    document.querySelectorAll('.btn-add-to-cart').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        e.currentTarget.disabled = true;
        
        try {
          await addToCart(id, 1);
          showToast('Added to cart successfully!', 'success');
          await updateLayout();
        } catch (err) {
          showToast(err.message, 'error');
        } finally {
          e.currentTarget.disabled = false;
        }
      });
    });

    // Product card title click navigation
    document.querySelectorAll('.product-card').forEach((card, idx) => {
      const img = card.querySelector('.product-img-wrapper');
      const title = card.querySelector('.product-card-title');
      const handler = () => {
        const product = products[idx];
        window.location.hash = `#/product/${product._id}`;
      };
      img.style.cursor = 'pointer';
      title.style.cursor = 'pointer';
      img.addEventListener('click', handler);
      title.addEventListener('click', handler);
    });

  } catch (error) {
    appRoot.innerHTML = `
      <div style="text-align: center; padding: 4rem 0;">
        <i class="fa-solid fa-triangle-exclamation fa-3x" style="color: var(--error); margin-bottom: 1rem;"></i>
        <h2>Failed to load products</h2>
        <p>${error.message}</p>
        <button class="btn btn-primary" onclick="window.location.reload()" style="margin-top: 1rem;">Try Again</button>
      </div>
    `;
  }
}

// 2. Product Detail Page
async function renderProductDetail(id) {
  appRoot.innerHTML = renderLoader('Fetching product details...');
  
  try {
    const response = await apiCall(`/products/${id}`);
    const product = response.data;

    let stockText = 'In Stock';
    let stockClass = 'in-stock';
    if (product.stock === 0) {
      stockText = 'Out of Stock';
      stockClass = 'out-of-stock';
    } else if (product.stock < 10) {
      stockText = `Low Stock (${product.stock} left)`;
      stockClass = 'low-stock';
    }

    appRoot.innerHTML = `
      <div style="margin-bottom: 2rem;">
        <a href="#/" class="btn btn-secondary btn-sm"><i class="fa-solid fa-arrow-left"></i> Back to Catalog</a>
      </div>
      
      <div class="detail-container">
        <div class="detail-img-card">
          <img class="detail-img" src="${product.imageUrl}" alt="${product.name}">
        </div>
        <div class="detail-info">
          <span class="detail-category">${product.category}</span>
          <h1 class="detail-title">${product.name}</h1>
          <div class="detail-price">$${product.price.toFixed(2)}</div>
          
          <div>
            <span class="stock-status ${stockClass}">
              <i class="fa-solid ${product.stock > 0 ? 'fa-circle-check' : 'fa-circle-xmark'}"></i>
              ${stockText}
            </span>
          </div>

          <p class="detail-desc">${product.description}</p>
          
          ${product.stock > 0 ? `
            <div class="purchase-controls">
              <div class="qty-selector">
                <button class="qty-btn" id="qty-dec">-</button>
                <span class="qty-value" id="qty-val">1</span>
                <button class="qty-btn" id="qty-inc">+</button>
              </div>
              <button class="btn btn-primary" id="btn-add-detail">
                <i class="fa-solid fa-cart-plus"></i> Add to Cart
              </button>
            </div>
          ` : `
            <button class="btn btn-secondary" style="margin-top: 1rem; width: fit-content;" disabled>Out of Stock</button>
          `}
        </div>
      </div>
    `;

    // Quantity selectors logic
    if (product.stock > 0) {
      let qty = 1;
      const val = document.getElementById('qty-val');
      const dec = document.getElementById('qty-dec');
      const inc = document.getElementById('qty-inc');
      const addBtn = document.getElementById('btn-add-detail');

      dec.addEventListener('click', () => {
        if (qty > 1) {
          qty--;
          val.textContent = qty;
        }
      });

      inc.addEventListener('click', () => {
        if (qty < product.stock) {
          qty++;
          val.textContent = qty;
        } else {
          showToast(`Cannot select more than available stock (${product.stock})`, 'warning');
        }
      });

      addBtn.addEventListener('click', async () => {
        addBtn.disabled = true;
        try {
          await addToCart(product._id, qty);
          showToast(`Added ${qty} item(s) to cart!`, 'success');
          await updateLayout();
        } catch (err) {
          showToast(err.message, 'error');
        } finally {
          addBtn.disabled = false;
        }
      });
    }

  } catch (error) {
    appRoot.innerHTML = `
      <div style="text-align: center; padding: 4rem 0;">
        <i class="fa-solid fa-circle-exclamation fa-3x" style="color: var(--error); margin-bottom: 1rem;"></i>
        <h2>Product not found</h2>
        <p>${error.message}</p>
        <a href="#/" class="btn btn-primary" style="margin-top: 1rem;">Return to Catalog</a>
      </div>
    `;
  }
}

// 3. Cart Page
async function renderCart() {
  appRoot.innerHTML = renderLoader('Loading your cart...');

  try {
    const cart = await getCart();
    
    if (!cart.items || cart.items.length === 0) {
      appRoot.innerHTML = `
        <div class="cart-empty-state">
          <div class="success-icon-wrapper" style="background-color: rgba(255,255,255,0.05); color: var(--text-secondary); border-color: var(--border-color);">
            <i class="fa-solid fa-basket-shopping"></i>
          </div>
          <h2 class="cart-empty-title">Your Cart is Empty</h2>
          <p class="cart-empty-desc">Looks like you haven't added anything to your cart yet. Explore our premium catalog to get started!</p>
          <a href="#/" class="btn btn-primary">Start Shopping</a>
        </div>
      `;
      return;
    }

    let itemsHtml = '';
    let totalCartPrice = 0;

    cart.items.forEach(item => {
      const product = item.productId;
      const itemTotal = product.price * item.quantity;
      totalCartPrice += itemTotal;

      itemsHtml += `
        <div class="cart-item-row" data-id="${product._id}">
          <img class="cart-item-img" src="${product.imageUrl}" alt="${product.name}">
          <div class="cart-item-details">
            <h4>${product.name}</h4>
            <p>Category: ${product.category}</p>
            <p>Stock status: ${product.stock > 0 ? `In Stock (${product.stock} available)` : '<span style="color: var(--error);">Out of stock</span>'}</p>
          </div>
          <div class="cart-item-price">$${product.price.toFixed(2)}</div>
          
          <div class="cart-item-qty-cell">
            <div class="qty-selector" style="transform: scale(0.9); margin-left: -10px;">
              <button class="qty-btn btn-cart-dec" data-id="${product._id}">-</button>
              <span class="qty-value">${item.quantity}</span>
              <button class="qty-btn btn-cart-inc" data-id="${product._id}">+</button>
            </div>
          </div>
          
          <div class="cart-item-total">$${itemTotal.toFixed(2)}</div>
          
          <button class="cart-icon-btn cart-item-delete-btn btn-cart-remove" data-id="${product._id}" style="color: var(--error);">
            <i class="fa-solid fa-trash-can fa-lg"></i>
          </button>
        </div>
      `;
    });

    appRoot.innerHTML = `
      <h1 class="cart-title">
        <span><i class="fa-solid fa-cart-shopping"></i> Shopping Cart</span>
      </h1>
      
      <div class="cart-layout">
        <div class="cart-items-list">
          ${itemsHtml}
        </div>
        
        <div class="cart-summary-card">
          <h3 class="summary-heading">Order Summary</h3>
          <div class="summary-row">
            <span>Items count</span>
            <span>${cart.items.reduce((acc, curr) => acc + curr.quantity, 0)}</span>
          </div>
          <div class="summary-row">
            <span>Shipping</span>
            <span style="color: var(--success); font-weight: 600;">FREE</span>
          </div>
          <div class="summary-row total">
            <span>Total</span>
            <span>$${totalCartPrice.toFixed(2)}</span>
          </div>
          <button class="btn btn-primary" id="btn-checkout-proceed" style="width: 100%; margin-top: 1.5rem;">
            Proceed to Checkout <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
    `;

    // Event listeners
    // 1. Decrement Quantity
    document.querySelectorAll('.btn-cart-dec').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const pid = e.currentTarget.getAttribute('data-id');
        const item = cart.items.find(i => i.productId._id === pid);
        if (item.quantity > 1) {
          try {
            await updateCartQuantity(pid, item.quantity - 1);
            showToast('Cart updated', 'info');
            await updateLayout();
            renderCart();
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      });
    });

    // 2. Increment Quantity
    document.querySelectorAll('.btn-cart-inc').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const pid = e.currentTarget.getAttribute('data-id');
        const item = cart.items.find(i => i.productId._id === pid);
        try {
          await updateCartQuantity(pid, item.quantity + 1);
          showToast('Cart updated', 'info');
          await updateLayout();
          renderCart();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });

    // 3. Remove Item
    document.querySelectorAll('.btn-cart-remove').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const pid = e.currentTarget.getAttribute('data-id');
        try {
          await removeFromCart(pid);
          showToast('Item removed from cart', 'info');
          await updateLayout();
          renderCart();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });

    // 4. Proceed to Checkout
    document.getElementById('btn-checkout-proceed').addEventListener('click', () => {
      if (!currentUser) {
        redirectAfterLogin = '#/checkout';
        showToast('Please sign in to proceed with checkout', 'info');
        window.location.hash = '#/login';
      } else {
        window.location.hash = '#/checkout';
      }
    });

  } catch (error) {
    appRoot.innerHTML = `
      <div style="text-align: center; padding: 4rem 0;">
        <i class="fa-solid fa-triangle-exclamation fa-3x" style="color: var(--error); margin-bottom: 1rem;"></i>
        <h2>Failed to load cart</h2>
        <p>${error.message}</p>
        <button class="btn btn-primary" onclick="renderCart()" style="margin-top: 1rem;">Retry</button>
      </div>
    `;
  }
}

// 4. Checkout Page
async function renderCheckout() {
  if (!currentUser) {
    redirectAfterLogin = '#/checkout';
    window.location.hash = '#/login';
    return;
  }

  appRoot.innerHTML = renderLoader('Loading checkout information...');

  try {
    const cart = await getCart();
    if (!cart.items || cart.items.length === 0) {
      window.location.hash = '#/';
      return;
    }

    let summaryItemsHtml = '';
    let totalCartPrice = 0;

    cart.items.forEach(item => {
      const product = item.productId;
      const itemTotal = product.price * item.quantity;
      totalCartPrice += itemTotal;
      summaryItemsHtml += `
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.75rem; font-size: 0.95rem;">
          <span style="color: var(--text-secondary); max-width: 75%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${product.name} <strong style="color: #ffffff;">x ${item.quantity}</strong>
          </span>
          <span style="font-family: 'Space Grotesk'; font-weight: 700;">$${itemTotal.toFixed(2)}</span>
        </div>
      `;
    });

    appRoot.innerHTML = `
      <div style="margin-bottom: 2rem;">
        <a href="#/cart" class="btn btn-secondary btn-sm"><i class="fa-solid fa-arrow-left"></i> Return to Cart</a>
      </div>

      <div class="checkout-grid">
        <div class="checkout-card">
          <h2 class="checkout-section-title"><i class="fa-solid fa-truck-fast"></i> Shipping Details</h2>
          
          <form id="checkout-form">
            <div class="form-group">
              <label class="form-label" for="street">Street Address</label>
              <input type="text" class="form-input" id="street" required placeholder="123 Innovation Boulevard, Suite 404">
            </div>
            
            <div class="form-row-2">
              <div class="form-group">
                <label class="form-label" for="city">City</label>
                <input type="text" class="form-input" id="city" required placeholder="San Francisco">
              </div>
              <div class="form-group">
                <label class="form-label" for="zip">Zip / Postal Code</label>
                <input type="text" class="form-input" id="zip" required placeholder="94103">
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label" for="country">Country</label>
              <input type="text" class="form-input" id="country" required placeholder="United States">
            </div>

            <button type="submit" class="btn btn-primary" id="btn-submit-order" style="width: 100%; margin-top: 1.5rem; padding: 1rem;">
              Place Order - $${totalCartPrice.toFixed(2)}
            </button>
          </form>
        </div>

        <div class="cart-summary-card" style="align-self: start;">
          <h3 class="summary-heading">Checkout Summary</h3>
          <div style="border-bottom: 1px solid var(--border-color); padding-bottom: 1rem; margin-bottom: 1.5rem;">
            ${summaryItemsHtml}
          </div>
          <div class="summary-row">
            <span>Subtotal</span>
            <span>$${totalCartPrice.toFixed(2)}</span>
          </div>
          <div class="summary-row">
            <span>Shipping</span>
            <span style="color: var(--success); font-weight: 600;">FREE</span>
          </div>
          <div class="summary-row total">
            <span>Total</span>
            <span>$${totalCartPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>
    `;

    // Form submission
    const form = document.getElementById('checkout-form');
    const submitBtn = document.getElementById('btn-submit-order');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const street = document.getElementById('street').value.trim();
      const city = document.getElementById('city').value.trim();
      const zip = document.getElementById('zip').value.trim();
      const country = document.getElementById('country').value.trim();

      // Basic front validation
      if (!street || !city || !zip || !country) {
        showToast('Please enter all shipping details', 'warning');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.innerHTML = '<div class="loader" style="width: 20px; height: 20px; border-width: 2px;"></div> Processing...';

      try {
        const response = await apiCall('/orders', {
          method: 'POST',
          body: {
            shippingAddress: { street, city, zip, country }
          }
        });

        if (response.success) {
          showToast('Order created successfully!', 'success');
          await updateLayout();
          window.location.hash = `#/order/${response.data._id}`;
        }
      } catch (err) {
        showToast(err.message, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = `Place Order - $${totalCartPrice.toFixed(2)}`;
      }
    });

  } catch (error) {
    appRoot.innerHTML = `
      <div style="text-align: center; padding: 4rem 0;">
        <i class="fa-solid fa-circle-exclamation fa-3x" style="color: var(--error); margin-bottom: 1rem;"></i>
        <h2>Failed to load checkout</h2>
        <p>${error.message}</p>
        <a href="#/cart" class="btn btn-primary" style="margin-top: 1rem;">Return to Cart</a>
      </div>
    `;
  }
}

// 5. Login Page
function renderLogin() {
  appRoot.innerHTML = `
    <div class="auth-container">
      <h2 class="auth-title">Sign In</h2>
      <p class="auth-subtitle">Welcome back to Aether store</p>
      
      <form id="login-form">
        <div class="form-group">
          <label class="form-label" for="email">Email Address</label>
          <input type="email" class="form-input" id="email" required placeholder="you@example.com">
        </div>
        <div class="form-group">
          <label class="form-label" for="password">Password</label>
          <input type="password" class="form-input" id="password" required placeholder="••••••••">
        </div>
        
        <button type="submit" class="btn btn-primary" id="btn-submit-login" style="width: 100%; margin-top: 1rem; padding: 0.85rem;">
          Sign In
        </button>
      </form>
      
      <div class="form-footer">
        Don't have an account? <span class="form-footer-link" id="link-to-register">Create Account</span>
      </div>
    </div>
  `;

  // Navigation hooks
  document.getElementById('link-to-register').addEventListener('click', () => {
    window.location.hash = '#/register';
  });

  const form = document.getElementById('login-form');
  const submitBtn = document.getElementById('btn-submit-login');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      showToast('Please enter both email and password', 'warning');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="loader" style="width: 18px; height: 18px; border-width: 2px;"></div> Signing In...';

    try {
      const response = await apiCall('/auth/login', {
        method: 'POST',
        body: { email, password }
      });

      if (response.success) {
        currentUser = response.user;
        setCartAuthState(true);
        showToast(`Welcome back, ${currentUser.name}!`, 'success');
        
        // Synchronize local guest cart sequential operations
        await syncGuestCart();

        await updateLayout();
        
        // Redirect logic
        const dest = redirectAfterLogin || '#/';
        redirectAfterLogin = null;
        window.location.hash = dest;
      }
    } catch (err) {
      showToast(err.message, 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In';
    }
  });
}

// 6. Register Page
function renderRegister() {
  appRoot.innerHTML = `
    <div class="auth-container">
      <h2 class="auth-title">Create Account</h2>
      <p class="auth-subtitle">Join us to experience state-of-the-art designs</p>
      
      <form id="register-form">
        <div class="form-group">
          <label class="form-label" for="reg-name">Full Name</label>
          <input type="text" class="form-input" id="reg-name" required placeholder="John Doe">
        </div>
        <div class="form-group">
          <label class="form-label" for="reg-email">Email Address</label>
          <input type="email" class="form-input" id="reg-email" required placeholder="john@example.com">
        </div>
        <div class="form-group">
          <label class="form-label" for="reg-password">Password (min. 8 characters)</label>
          <input type="password" class="form-input" id="reg-password" required minlength="8" placeholder="••••••••">
        </div>
        
        <button type="submit" class="btn btn-primary" id="btn-submit-register" style="width: 100%; margin-top: 1rem; padding: 0.85rem;">
          Register Account
        </button>
      </form>
      
      <div class="form-footer">
        Already have an account? <span class="form-footer-link" id="link-to-login">Sign In</span>
      </div>
    </div>
  `;

  document.getElementById('link-to-login').addEventListener('click', () => {
    window.location.hash = '#/login';
  });

  const form = document.getElementById('register-form');
  const submitBtn = document.getElementById('btn-submit-register');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;

    if (!name || !email || !password || password.length < 8) {
      showToast('Please enter all fields. Password must be 8+ characters.', 'warning');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="loader" style="width: 18px; height: 18px; border-width: 2px;"></div> Registering...';

    try {
      const response = await apiCall('/auth/register', {
        method: 'POST',
        body: { name, email, password }
      });

      if (response.success) {
        currentUser = response.user;
        setCartAuthState(true);
        showToast('Registration successful!', 'success');
        
        // Sync local cart if any
        await syncGuestCart();

        await updateLayout();
        
        const dest = redirectAfterLogin || '#/';
        redirectAfterLogin = null;
        window.location.hash = dest;
      }
    } catch (err) {
      showToast(err.message, 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Register Account';
    }
  });
}

// 7. Orders History Page
async function renderOrders() {
  if (!currentUser) {
    window.location.hash = '#/login';
    return;
  }

  appRoot.innerHTML = renderLoader('Loading order history...');

  try {
    const response = await apiCall('/orders');
    const orders = response.data || [];

    if (orders.length === 0) {
      appRoot.innerHTML = `
        <div class="cart-empty-state">
          <div class="success-icon-wrapper" style="background-color: rgba(255,255,255,0.05); color: var(--text-secondary); border-color: var(--border-color);">
            <i class="fa-solid fa-clock-rotate-left"></i>
          </div>
          <h2 class="cart-empty-title">No Orders Found</h2>
          <p class="cart-empty-desc">You haven't placed any orders yet. Place your first order to see it in your history.</p>
          <a href="#/" class="btn btn-primary">Start Shopping</a>
        </div>
      `;
      return;
    }

    const ordersHtml = orders.map(order => {
      const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const totalItems = order.items.reduce((acc, curr) => acc + curr.quantity, 0);

      const itemsPreview = order.items.map(item => `
        <span style="display: inline-block; margin-right: 0.75rem; padding: 0.15rem 0.5rem; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 4px; font-size: 0.85rem;">
          ${item.name} x${item.quantity}
        </span>
      `).join('');

      return `
        <div class="order-history-card">
          <div class="order-header-info">
            <div>
              <span class="order-id">#ID: ${order._id}</span>
              <div class="order-date">${formattedDate}</div>
            </div>
            <span class="order-badge ${order.status}">${order.status}</span>
          </div>
          
          <div style="margin-bottom: 1.25rem;">
            <p style="color: var(--text-secondary); font-size: 0.85rem; margin-bottom: 0.5rem;">Items Purchased:</p>
            ${itemsPreview}
          </div>

          <div class="order-summary-details">
            <span class="order-items-summary">${totalItems} item(s) purchased</span>
            <div>
              <span style="font-size: 0.95rem; color: var(--text-secondary); margin-right: 0.5rem;">Total Price:</span>
              <strong style="font-family: 'Space Grotesk'; font-size: 1.25rem; color: #ffffff;">$${order.totalPrice.toFixed(2)}</strong>
            </div>
            <a href="#/order/${order._id}" class="btn btn-secondary btn-sm">View Receipt</a>
          </div>
        </div>
      `;
    }).join('');

    appRoot.innerHTML = `
      <h1 class="cart-title">
        <span><i class="fa-solid fa-clock-rotate-left"></i> Order History</span>
      </h1>
      <div class="orders-list-container">
        ${ordersHtml}
      </div>
    `;

  } catch (error) {
    appRoot.innerHTML = `
      <div style="text-align: center; padding: 4rem 0;">
        <i class="fa-solid fa-circle-exclamation fa-3x" style="color: var(--error); margin-bottom: 1rem;"></i>
        <h2>Failed to load orders</h2>
        <p>${error.message}</p>
        <button class="btn btn-primary" onclick="renderOrders()" style="margin-top: 1rem;">Retry</button>
      </div>
    `;
  }
}

// 8. Order Confirmation / Receipt Page
async function renderOrderConfirmation(id) {
  appRoot.innerHTML = renderLoader('Loading receipt details...');

  try {
    const response = await apiCall(`/orders/${id}`);
    const order = response.data;

    const formattedDate = new Date(order.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const itemsRows = order.items.map(item => `
      <div style="display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
        <span>${item.name} <strong style="color: var(--text-secondary);">x ${item.quantity}</strong></span>
        <span style="font-family: 'Outfit';">$${(item.price * item.quantity).toFixed(2)}</span>
      </div>
    `).join('');

    appRoot.innerHTML = `
      <div class="confirmation-card">
        <div class="success-icon-wrapper">
          <i class="fa-solid fa-circle-check"></i>
        </div>
        <h1 style="font-size: 2.25rem; margin-bottom: 0.5rem;">Thank You!</h1>
        <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Your order was placed successfully and is now pending processing.</p>
        
        <div class="receipt-details">
          <div><strong style="color: #ffffff;">Order ID:</strong> <span style="font-family: 'Space Grotesk'; color: var(--accent-cyan); font-weight: 700;">${order._id}</span></div>
          <div><strong style="color: #ffffff;">Date:</strong> ${formattedDate}</div>
          <div><strong style="color: #ffffff;">Status:</strong> <span class="order-badge ${order.status}" style="font-size: 0.75rem; padding: 0.15rem 0.5rem; display: inline; margin-left: 0.5rem;">${order.status}</span></div>
          
          <div style="border-top: 1px solid var(--border-color); margin-top: 1rem; padding-top: 1rem;">
            <strong style="color: #ffffff; display: block; margin-bottom: 0.5rem;">Shipping Address:</strong>
            <p style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.4;">
              ${order.shippingAddress.street}<br>
              ${order.shippingAddress.city}, ${order.shippingAddress.zip}<br>
              ${order.shippingAddress.country}
            </p>
          </div>

          <div style="border-top: 1px solid var(--border-color); margin-top: 1rem; padding-top: 1rem;">
            <strong style="color: #ffffff; display: block; margin-bottom: 0.5rem;">Items Summary:</strong>
            ${itemsRows}
          </div>

          <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border-color); margin-top: 1rem; padding-top: 1rem; font-size: 1.2rem; font-weight: 700; color: #ffffff;">
            <span>Total Paid</span>
            <span style="font-family: 'Space Grotesk';">$${order.totalPrice.toFixed(2)}</span>
          </div>
        </div>

        <div style="display: flex; justify-content: center; gap: 1.5rem; margin-top: 2rem;">
          <a href="#/" class="btn btn-primary">Continue Shopping</a>
          <a href="#/orders" class="btn btn-secondary">Order History</a>
        </div>
      </div>
    `;

  } catch (error) {
    appRoot.innerHTML = `
      <div style="text-align: center; padding: 4rem 0;">
        <i class="fa-solid fa-circle-exclamation fa-3x" style="color: var(--error); margin-bottom: 1rem;"></i>
        <h2>Failed to retrieve receipt</h2>
        <p>${error.message}</p>
        <a href="#/" class="btn btn-primary" style="margin-top: 1rem;">Return to Catalog</a>
      </div>
    `;
  }
}

// 9. About Page
function renderAbout() {
  appRoot.innerHTML = `
    <h1 class="cart-title">
      <span><i class="fa-solid fa-cube"></i> About Aether</span>
    </h1>
    
    <div style="max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 2rem;">
      <section class="hero-banner" style="padding: 3rem 2rem;">
        <h2 style="font-size: 2rem; text-transform: uppercase; margin-bottom: 1rem;">The Curated Workspace</h2>
        <p style="color: var(--text-secondary); line-height: 1.7; text-transform: none;">Aether is an experimental laboratory focused on premium desktop and workspace equipment. We believe that the digital creator's environment should be clean, high-performance, and atmospheric. Our design direction rejects generic templates in favor of structured geometry, high-contrast void backdrops, and neon highlights.</p>
      </section>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2.5rem; margin-top: 1rem;">
        <div>
          <h3 style="text-transform: uppercase; font-size: 1.15rem; margin-bottom: 0.75rem; color: var(--primary);">Craftsmanship</h3>
          <p style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.6; text-transform: none;">Every product in our catalog—from mechanical keyboards to ambient workspace lighting—is evaluated for its mechanical responsiveness, longevity, and industrial visual design. We work with specialized manufacturers to customize colors and key components to our rigorous void-theme specifications.</p>
        </div>
        <div>
          <h3 style="text-transform: uppercase; font-size: 1.15rem; margin-bottom: 0.75rem; color: var(--primary);">Synthetic Ether</h3>
          <p style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.6; text-transform: none;">Our design strategy focuses on "web-as-an-environment." This digital store is optimized to provide a frictionless, highly aesthetic interface. We use zero border-radii, sharp geometric cuts, glassmorphic layout layering, and reactive micro-interactions to deliver a state-of-the-art shopping experience.</p>
        </div>
      </div>
    </div>
  `;
}

// 10. FAQ Page
function renderFAQ() {
  appRoot.innerHTML = `
    <h1 class="cart-title">
      <span><i class="fa-solid fa-circle-question"></i> Frequently Asked Questions</span>
    </h1>
    
    <div class="faq-accordion">
      <details class="faq-item">
        <summary>How fast is shipping? <i class="fa-solid fa-chevron-down" style="font-size: 0.8rem; color: var(--primary); display: none;"></i></summary>
        <div class="faq-content">
          All workspace instruments and hardware products are shipped free via express logistics. Delivery times are between 2 to 4 business days depending on location. Tracking information is automatically generated and visible in your Order History page.
        </div>
      </details>

      <details class="faq-item">
        <summary>What is your return policy?</summary>
        <div class="faq-content">
          We offer a 30-day hassle-free return policy. If you are not satisfied with your workspace equipment, you can initiate a return within 30 days of receipt. Items must be returned in their original packaging, including all accessories and documentation.
        </div>
      </details>

      <details class="faq-item">
        <summary>Are the products covered by warranty?</summary>
        <div class="faq-content">
          Yes. All electronics, peripherals, and office furniture items purchased on the Aether Store are protected by our 2-year comprehensive technical warranty. If you experience hardware failure under normal usage, contact our support agents for immediate replacement.
        </div>
      </details>

      <details class="faq-item">
        <summary>How do I sync my shopping cart?</summary>
        <div class="faq-content">
          For guest shoppers, your cart is automatically saved locally in your browser's localStorage. Once you create an account or sign in, Aether will sequentially sync and merge your local items with your database cart so you never lose your selected items.
        </div>
      </details>

      <details class="faq-item">
        <summary>Can I cancel or edit my order?</summary>
        <div class="faq-content">
          Orders are processed quickly to ensure rapid delivery. If your order status is marked as 'pending' in your dashboard, you can request a cancellation or shipping address adjustment by submitting a ticket on our Contact page. Once shipped, address details cannot be altered.
        </div>
      </details>
    </div>
  `;
}

// 11. Contact Page
function renderContact() {
  appRoot.innerHTML = `
    <h1 class="cart-title">
      <span><i class="fa-solid fa-envelope"></i> Contact Curators</span>
    </h1>

    <div class="checkout-grid" style="max-width: 900px; margin: 0 auto; grid-template-columns: 1.2fr 1fr; gap: 4rem;">
      <div class="checkout-card">
        <h2 class="checkout-section-title"><i class="fa-regular fa-paper-plane"></i> Transmit Message</h2>
        
        <form id="contact-form">
          <div class="form-group">
            <label class="form-label" for="contact-name">Your Name</label>
            <input type="text" class="form-input" id="contact-name" required placeholder="John Doe">
          </div>

          <div class="form-group">
            <label class="form-label" for="contact-email">Email Address</label>
            <input type="email" class="form-input" id="contact-email" required placeholder="you@example.com">
          </div>

          <div class="form-group">
            <label class="form-label" for="contact-subject">Subject</label>
            <input type="text" class="form-input" id="contact-subject" required placeholder="Workspace Customization Request">
          </div>

          <div class="form-group">
            <label class="form-label" for="contact-message">Message Details</label>
            <textarea class="form-input" id="contact-message" required rows="4" placeholder="Describe your request in detail..." style="resize: none; background: transparent; border: none; border-bottom: 1px solid var(--outline-variant); color: #ffffff;"></textarea>
          </div>

          <button type="submit" class="btn btn-primary" id="btn-submit-contact" style="width: 100%; margin-top: 1rem; padding: 0.9rem;">
            Send Transmission
          </button>
        </form>
      </div>

      <div style="display: flex; flex-direction: column; gap: 2rem; justify-content: flex-start; padding-top: 1rem;">
        <div>
          <h3 style="text-transform: uppercase; font-size: 1.1rem; margin-bottom: 0.5rem; color: var(--primary);">Curator Studio</h3>
          <p style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.6; text-transform: none;">Aether Curators Group LLC<br>100 Space Park Ave, Suite 900<br>San Francisco, CA 94107</p>
        </div>
        
        <div>
          <h3 style="text-transform: uppercase; font-size: 1.1rem; margin-bottom: 0.5rem; color: var(--primary);">Direct Inquiries</h3>
          <p style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.6; text-transform: none;">Email: curators@aetherstore.com<br>Response times: 12-24 hours</p>
        </div>
      </div>
    </div>
  `;

  const form = document.getElementById('contact-form');
  const submitBtn = document.getElementById('btn-submit-contact');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="loader" style="width: 18px; height: 18px; border-width: 2px;"></div> Transmitting...';

    // Simulate network delay
    setTimeout(() => {
      showToast('Transmission received. Our curators will respond shortly.', 'success');
      form.reset();
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Transmission';
    }, 1200);
  });
}

// 12. Privacy Policy Page
function renderPrivacy() {
  appRoot.innerHTML = `
    <h1 class="cart-title">
      <span><i class="fa-solid fa-shield-halved"></i> Privacy Policy</span>
    </h1>
    
    <div style="max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 2rem; line-height: 1.7; color: var(--text-secondary);">
      <p style="font-size: 1.05rem; color: #ffffff; text-transform: none;">Effective Date: May 23, 2026. This policy describes how Aether collects, preserves, and protects your information when you shop with us.</p>
      
      <div>
        <h3 style="text-transform: uppercase; font-size: 1.15rem; margin-bottom: 0.75rem; color: var(--primary);">1. Data Collection</h3>
        <p style="font-size: 0.9rem; text-transform: none;">We collect credentials (name, email) only when you register an account. During transaction workflows, we capture the shipping address necessary for order logistics and fulfillment.</p>
      </div>

      <div>
        <h3 style="text-transform: uppercase; font-size: 1.15rem; margin-bottom: 0.75rem; color: var(--primary);">2. Cookie Infrastructure</h3>
        <p style="font-size: 0.9rem; text-transform: none;">We use secure HTTP-Only cookies to store session JWT tokens. This keeps your user credentials fully protected from cross-site scripting (XSS) risks. We do not store tracking cookies.</p>
      </div>

      <div>
        <h3 style="text-transform: uppercase; font-size: 1.15rem; margin-bottom: 0.75rem; color: var(--primary);">3. Security Protocols</h3>
        <p style="font-size: 0.9rem; text-transform: none;">All user passwords are hashed using bcrypt. Our servers enforce helmet header guards, restricted CORS requests, and MongoDB sanitization models to prevent injection vectors.</p>
      </div>
    </div>
  `;
}

// 13. Terms of Service Page
function renderTerms() {
  appRoot.innerHTML = `
    <h1 class="cart-title">
      <span><i class="fa-solid fa-scale-balanced"></i> Terms of Service</span>
    </h1>
    
    <div style="max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 2rem; line-height: 1.7; color: var(--text-secondary);">
      <p style="font-size: 1.05rem; color: #ffffff; text-transform: none;">Welcome to Aether. By interacting with our store, catalog, and ordering systems, you comply with the following regulations.</p>
      
      <div>
        <h3 style="text-transform: uppercase; font-size: 1.15rem; margin-bottom: 0.75rem; color: var(--primary);">1. Order Placement</h3>
        <p style="font-size: 0.9rem; text-transform: none;">Order document placement creates a pending state request. We validate inventory balances before completion. If stock counts are insufficient, we reserve the right to decline transactions.</p>
      </div>

      <div>
        <h3 style="text-transform: uppercase; font-size: 1.15rem; margin-bottom: 0.75rem; color: var(--primary);">2. Account Conduct</h3>
        <p style="font-size: 0.9rem; text-transform: none;">You are responsible for protecting your session details. Attempting to bypass endpoint middleware validations or access routes reserved for administrators will lead to direct account closure.</p>
      </div>

      <div>
        <h3 style="text-transform: uppercase; font-size: 1.15rem; margin-bottom: 0.75rem; color: var(--primary);">3. System Liability</h3>
        <p style="font-size: 0.9rem; text-transform: none;">Aether workspace instruments are provided "as-is." We are not liable for peripheral delays, custom configuration setups, or workspace incompatibility issues once items are shipped.</p>
      </div>
    </div>
  `;
}

// 14. Shipping & Returns Page
function renderShippingReturns() {
  appRoot.innerHTML = `
    <h1 class="cart-title">
      <span><i class="fa-solid fa-truck-ramp-box"></i> Shipping & Returns Policy</span>
    </h1>
    
    <div style="max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 2rem; line-height: 1.7; color: var(--text-secondary);">
      <p style="font-size: 1.05rem; color: #ffffff; text-transform: none;">We optimize our packaging and logistics workflows to ensure premium products arrive in flawless condition.</p>
      
      <div>
        <h3 style="text-transform: uppercase; font-size: 1.15rem; margin-bottom: 0.75rem; color: var(--primary);">Shipping Timelines</h3>
        <p style="font-size: 0.9rem; text-transform: none;">Orders are processed within 12-24 hours. Free express shipping is enabled globally for all inventory items, taking 2-4 business days to reach destination locations.</p>
      </div>

      <div>
        <h3 style="text-transform: uppercase; font-size: 1.15rem; margin-bottom: 0.75rem; color: var(--primary);">Packaging Standards</h3>
        <p style="font-size: 0.9rem; text-transform: none;">Peripherals, keycaps, and desktop accessories are double-boxed in high-density void cushioning to prevent physical compression or scratching during transport.</p>
      </div>

      <div>
        <h3 style="text-transform: uppercase; font-size: 1.15rem; margin-bottom: 0.75rem; color: var(--primary);">Returns & Replacements</h3>
        <p style="font-size: 0.9rem; text-transform: none;">To return a product, contact our curator agents within 30 days of arrival. We issue pre-paid return labels. Refunds are credited to the original account upon product inspection.</p>
      </div>
    </div>
  `;
}

/**
 * -----------------------------------------
 * HASH ROUTER DISPATCHER
 * -----------------------------------------
 */
async function dispatchRoute() {
  const hash = window.location.hash || '#/';
  
  if (hash === '#/') {
    await renderCatalog();
  } else if (hash === '#/about') {
    renderAbout();
  } else if (hash === '#/faq') {
    renderFAQ();
  } else if (hash === '#/contact') {
    renderContact();
  } else if (hash === '#/privacy') {
    renderPrivacy();
  } else if (hash === '#/terms') {
    renderTerms();
  } else if (hash === '#/shipping-returns') {
    renderShippingReturns();
  } else if (hash.startsWith('#/product/')) {
    const id = hash.split('#/product/')[1];
    await renderProductDetail(id);
  } else if (hash === '#/cart') {
    await renderCart();
  } else if (hash === '#/checkout') {
    await renderCheckout();
  } else if (hash === '#/login') {
    renderLogin();
  } else if (hash === '#/register') {
    renderRegister();
  } else if (hash === '#/orders') {
    await renderOrders();
  } else if (hash.startsWith('#/order/')) {
    const id = hash.split('#/order/')[1];
    await renderOrderConfirmation(id);
  } else {
    // 404 Fallback to Catalog
    window.location.hash = '#/';
  }

  // Sync nav highlight & cart badge count
  await updateLayout();
}

// Initial Bootstrap on Load
async function initApp() {
  // Check auth session
  await checkAuthStatus();
  
  // Update view and header configurations
  await updateLayout();
  
  // Initial routing
  await dispatchRoute();
}

// Router Event Listeners
window.addEventListener('hashchange', dispatchRoute);
window.addEventListener('DOMContentLoaded', () => {
  initApp();

  // Initialize Custom Cursor Position and Hover Events
  const cursor = document.getElementById('custom-cursor');
  if (cursor) {
    document.addEventListener('mousemove', (e) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    });

    document.addEventListener('mouseover', (e) => {
      if (e.target.closest('a, button, .category-tab, .product-card, .qty-btn, input, select, .cart-item-row')) {
        cursor.classList.add('hover');
      }
    });

    document.addEventListener('mouseout', (e) => {
      if (e.target.closest('a, button, .category-tab, .product-card, .qty-btn, input, select, .cart-item-row')) {
        cursor.classList.remove('hover');
      }
    });
  }
});
