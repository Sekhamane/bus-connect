import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import { 
  testConnection, 
  initDatabase, 
  getUsers, 
  createUser, 
  getProducts, 
  createProduct, 
  getCheckins, 
  createCheckin, 
  getMessages, 
  createMessage 
} from './api';

function App() {
  const [currentView, setCurrentView] = useState('auth');
  const [user, setUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [chatMessages, setChatMessages] = useState({});
  const [vendorProducts, setVendorProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: '', price: '', image: null });
  const [cart, setCart] = useState([]);
  const [checkInLocation, setCheckInLocation] = useState('');
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [checkedInPassengers, setCheckedInPassengers] = useState([]);
  const [dbConnected, setDbConnected] = useState(false);
  const fileInputRef = useRef(null);

  // Initialize database and test connection
  useEffect(() => {
    const initializeApp = async () => {
      // Test database connection
      const testResult = await testConnection();
      if (!testResult.error) {
        setDbConnected(true);
        console.log('Database connected:', testResult);
        
        // Initialize tables
        await initDatabase();
        
        // Load initial data
        await loadInitialData();
      } else {
        console.error('Database connection failed:', testResult.error);
        // Fallback to localStorage if database is not available
        loadFromLocalStorage();
      }
    };

    initializeApp();
  }, []);

  const loadInitialData = async () => {
    try {
      const [usersData, productsData, checkinsData] = await Promise.all([
        getUsers(),
        getProducts(),
        getCheckins()
      ]);
      
      setAllUsers(usersData);
      setProducts(productsData);
      setCheckedInPassengers(checkinsData);
      
      // Load vendor-specific products
      const savedUser = localStorage.getItem('busconnect_user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setCurrentView('dashboard');
        setVendorProducts(productsData.filter(product => product.vendor === userData.username));
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      loadFromLocalStorage();
    }
  };

  const loadFromLocalStorage = () => {
    const savedUser = localStorage.getItem('busconnect_user');
    const savedUsers = localStorage.getItem('busconnect_all_users');
    const savedProducts = localStorage.getItem('busconnect_products');
    const savedCheckins = localStorage.getItem('busconnect_checkins');
    
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setCurrentView('dashboard');
      
      if (savedUsers) {
        setAllUsers(JSON.parse(savedUsers));
      }
      
      if (savedProducts) {
        const productsData = JSON.parse(savedProducts);
        setProducts(productsData);
        setVendorProducts(productsData.filter(product => product.vendor === userData.username));
      }
      
      if (savedCheckins) {
        setCheckedInPassengers(JSON.parse(savedCheckins));
      }
    }
  };

  const handleLogout = async () => {
    // Mark user as offline in database
    if (dbConnected) {
      // You would update the user's online status in the database here
    }
    
    // Mark user as offline in localStorage
    const updatedUsers = allUsers.map(u => 
      u.id === user.id ? { ...u, online: false } : u
    );
    setAllUsers(updatedUsers);
    localStorage.setItem('busconnect_all_users', JSON.stringify(updatedUsers));
    
    setUser(null);
    setCurrentView('auth');
    localStorage.removeItem('busconnect_user');
  };

  const handleLogin = async (userData) => {
    if (dbConnected) {
      // Save user to database
      const dbUser = await createUser({
        username: userData.username,
        password: userData.password, // In production, hash this!
        role: userData.role
      });
      
      if (!dbUser.error) {
        userData.id = dbUser.id;
      }
    }
    
    setUser(userData);
    localStorage.setItem('busconnect_user', JSON.stringify(userData));
    
    // Add to allUsers or update existing
    const userExists = allUsers.find(u => u.id === userData.id);
    let updatedUsers;
    
    if (userExists) {
      updatedUsers = allUsers.map(u => 
        u.id === userData.id ? { ...u, online: true } : u
      );
    } else {
      updatedUsers = [...allUsers, { ...userData, online: true }];
    }
    
    setAllUsers(updatedUsers);
    localStorage.setItem('busconnect_all_users', JSON.stringify(updatedUsers));
    setCurrentView('dashboard');
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewProduct({
          ...newProduct,
          image: e.target.result
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const addProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.image) {
      alert('Please fill all fields including product photo');
      return;
    }

    const productData = {
      name: newProduct.name,
      price: newProduct.price,
      image: newProduct.image,
      vendor: user.username,
      category: 'General',
      description: 'Product from ' + user.username
    };

    let productId = Date.now();

    if (dbConnected) {
      const dbProduct = await createProduct(productData);
      if (!dbProduct.error) {
        productId = dbProduct.id;
        productData.id = dbProduct.id;
        productData.created_at = dbProduct.created_at;
      }
    } else {
      productData.id = productId;
    }

    const updatedVendorProducts = [...vendorProducts, productData];
    const updatedProducts = [...products, productData];
    
    setVendorProducts(updatedVendorProducts);
    setProducts(updatedProducts);
    setNewProduct({ name: '', price: '', image: null });
    
    // Save to localStorage as fallback
    localStorage.setItem('busconnect_products', JSON.stringify(updatedProducts));
    alert('Product added successfully!');
  };

  const handleBuyProduct = (product) => {
    const paymentMethod = prompt(
      `Buy ${product.name} for R${product.price}?\n\nSelect payment method:\n1. M-Pesa\n2. Ecocash\n3. Cash\n\nEnter 1, 2, or 3:`
    );

    const methods = { '1': 'M-Pesa', '2': 'Ecocash', '3': 'Cash' };
    const method = methods[paymentMethod];

    if (method) {
      alert(`Payment successful!\n\nProduct: ${product.name}\nAmount: R${product.price}\nMethod: ${method}\n\nThank you for your purchase!`);
    }
  };

  // Cart functions
  const addToCart = (product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
    alert(`${product.name} added to cart!`);
  };

  const removeFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(productId);
      return;
    }
    setCart(prevCart =>
      prevCart.map(item =>
        item.id === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (parseFloat(item.price) * item.quantity), 0).toFixed(2);
  };

  const sendMessage = async (chatKey, message, senderUser = user) => {
    if (!message.trim()) return;

    const messageData = {
      chat_key: chatKey,
      text: message,
      sender: 'user',
      sender_name: senderUser.username,
    };

    // Save to database
    if (dbConnected) {
      await createMessage(messageData);
    }

    const newMsg = {
      id: Date.now(),
      text: message,
      sender: 'user',
      senderName: senderUser.username,
      timestamp: new Date(),
    };

    setChatMessages(prev => ({
      ...prev,
      [chatKey]: [...(prev[chatKey] || []), newMsg]
    }));

    setTimeout(async () => {
      const replyMessageData = {
        chat_key: chatKey,
        text: `Hello I am ${senderUser.username}, I will get back to you as soon as possible`,
        sender: 'other',
        sender_name: senderUser.username,
      };

      // Save reply to database
      if (dbConnected) {
        await createMessage(replyMessageData);
      }

      const replyMessage = {
        id: Date.now() + 1,
        text: `Hello I am ${senderUser.username}, I will get back to you as soon as possible`,
        sender: 'other',
        senderName: senderUser.username,
        timestamp: new Date(),
      };

      setChatMessages(prev => ({
        ...prev,
        [chatKey]: [...(prev[chatKey] || []), replyMessage]
      }));
    }, 1000);
  };

  const handleCheckIn = async (e) => {
    if (e) e.preventDefault();
    if (!checkInLocation.trim()) {
      alert('Please enter your check-in location');
      return;
    }

    const checkInData = {
      passenger_id: user.id,
      passenger_name: user.username,
      location: checkInLocation,
    };

    let checkInId = Date.now();

    if (dbConnected) {
      const dbCheckin = await createCheckin(checkInData);
      if (!dbCheckin.error) {
        checkInId = dbCheckin.id;
        checkInData.id = dbCheckin.id;
        checkInData.timestamp = dbCheckin.timestamp;
      }
    } else {
      checkInData.id = checkInId;
      checkInData.timestamp = new Date().toLocaleString();
    }

    const updatedCheckIns = [...checkedInPassengers.filter(c => c.passenger_id !== user.id), checkInData];
    setCheckedInPassengers(updatedCheckIns);
    localStorage.setItem('busconnect_checkins', JSON.stringify(updatedCheckIns));

    alert(`Check-in successful!\nLocation: ${checkInLocation}\nTime: ${new Date().toLocaleString()}`);
    setCheckInLocation('');
  };

  // Auth Screen Component
  const AuthScreen = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('');

    const handleAuth = (e) => {
      e.preventDefault();
      if (!username || !password || !role) {
        alert('Please fill all fields');
        return;
      }

      const userData = { 
        username, 
        role, 
        id: Date.now(),
      };
      
      handleLogin(userData);
    };

    return (
      <div className="auth-container">
        <div className="auth-header">
          <h1>BusConnect</h1>
          <p className="subtitle">Connected to public Wi-Fi</p>
        </div>

        <div className="auth-card">
          <h2>{isLogin ? 'Login' : 'Sign Up'}</h2>
          
          <form onSubmit={handleAuth} className="auth-form">
            <div className="input-group">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                required
              />
            </div>
            
            <div className="input-group">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div className="role-selection">
              <label>Select Role:</label>
              <div className="role-buttons">
                {['driver', 'vendor', 'passenger'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    className={`role-btn ${role === r ? 'active' : ''}`}
                    onClick={() => setRole(r)}
                  >
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" className="auth-submit-btn">
              {isLogin ? 'Login' : 'Sign Up'}
            </button>
          </form>

          <button 
            type="button"
            className="switch-auth-btn"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Login"}
          </button>
        </div>
      </div>
    );
  };

  // Driver Dashboard
  const DriverDashboard = () => (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Driver Dashboard</h1>
        <p>Welcome, {user?.username}</p>
      </header>
      
      <div className="dashboard-content">
        <div className="card" onClick={() => setCurrentView('products')}>
          <h3>View and Order Products</h3>
          <p>Browse available products from vendors</p>
        </div>
        
        <div className="card" onClick={() => setCurrentView('user-selection-passenger')}>
          <h3>Chat with Passenger</h3>
          <p>Communicate with passengers</p>
        </div>
        
        <div className="card" onClick={() => setCurrentView('user-selection-vendor')}>
          <h3>Chat with Vendor</h3>
          <p>Coordinate with product vendors</p>
        </div>

        <div className="card" onClick={() => setCurrentView('checked-in-passengers')}>
          <h3>Checked-in Passengers</h3>
          <p>View and chat with passengers who checked in ({checkedInPassengers.length})</p>
        </div>

        <div className="card" onClick={() => setCurrentView('cart')}>
          <h3>Shopping Cart</h3>
          <p>View your cart and checkout</p>
        </div>
      </div>
      
      <button type="button" onClick={handleLogout} className="logout-btn">Logout</button>
    </div>
  );

  // Passenger Dashboard
  const PassengerDashboard = () => (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Passenger Dashboard</h1>
        <p>Welcome, {user?.username}</p>
      </header>
      
      <div className="dashboard-content">
        <div className="card" onClick={() => setCurrentView('products')}>
          <h3>Browse Products</h3>
          <p>View and buy products from vendors</p>
        </div>
        
        <div className="card" onClick={() => setCurrentView('user-selection-driver')}>
          <h3>Chat with Driver</h3>
          <p>Communicate with your driver</p>
        </div>
        
        <div className="card" onClick={() => setCurrentView('user-selection-vendor')}>
          <h3>Chat with Vendor</h3>
          <p>Contact product vendors</p>
        </div>
        
        <div className="card" onClick={() => setCurrentView('cart')}>
          <h3>Shopping Cart</h3>
          <p>View your cart and checkout</p>
        </div>

        <div className="card">
          <h3>Check In</h3>
          <form onSubmit={handleCheckIn}>
            <div className="input-group">
              <input
                type="text"
                placeholder="Enter your location (e.g., Cape Town Station, Johannesburg CBD, Durban Beach)"
                value={checkInLocation}
                onChange={(e) => setCheckInLocation(e.target.value)}
                className="input-field"
              />
            </div>
            <button type="submit" className="checkin-btn">Check In</button>
          </form>
        </div>
      </div>
      
      <button type="button" onClick={handleLogout} className="logout-btn">Logout</button>
    </div>
  );

  // Vendor Dashboard
  const VendorDashboard = () => {
    return (
      <div className="dashboard">
        <header className="dashboard-header">
          <h1>Vendor Dashboard</h1>
          <p>Welcome, {user?.username}</p>
        </header>
        
        <div className="dashboard-content">
          <div className="card">
            <h3>Add New Product</h3>
            <div className="input-group">
              <input
                type="text"
                placeholder="Product Name"
                value={newProduct.name}
                onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                className="input-field"
              />
            </div>
            <div className="input-group">
              <input
                type="text"
                placeholder="Price in Rands"
                value={newProduct.price}
                onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                className="input-field"
              />
            </div>
            <div className="input-group">
              <label>Upload Product Photo:</label>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <button 
                type="button"
                onClick={triggerFileInput}
                className="upload-photo-btn"
              >
                📷 Choose Photo from Gallery
              </button>
              {newProduct.image && (
                <div className="image-preview">
                  <img src={newProduct.image} alt="Product preview" className="preview-image" />
                  <p>Photo selected ✓</p>
                </div>
              )}
            </div>
            <button type="button" onClick={addProduct} className="add-product-btn">Add Product</button>
          </div>

          <div className="card">
            <h3>My Products</h3>
            {vendorProducts.length === 0 ? (
              <p className="no-products">No products added yet</p>
            ) : (
              vendorProducts.map(product => (
                <div key={product.id} className="product-item">
                  {product.image && typeof product.image === 'string' && product.image.startsWith('data:image') ? (
                    <img src={product.image} alt={product.name} className="product-image-small" />
                  ) : (
                    <span className="product-image-small">{product.image}</span>
                  )}
                  <span className="product-name">{product.name}</span>
                  <span className="product-price">R{product.price}</span>
                </div>
              ))
            )}
          </div>
          
          <div className="card" onClick={() => setCurrentView('user-selection-passenger')}>
            <h3>Chat with Passenger</h3>
            <p>Communicate with passengers</p>
          </div>
          
          <div className="card" onClick={() => setCurrentView('user-selection-driver')}>
            <h3>Chat with Driver</h3>
            <p>Coordinate with drivers</p>
          </div>
        </div>
        
        <button type="button" onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
    );
  };

  // Checked-in Passengers Screen for Drivers
  const CheckedInPassengersScreen = () => {
    const handleChatWithPassenger = (passenger) => {
      const passengerUser = allUsers.find(u => u.id === passenger.passenger_id);
      if (passengerUser) {
        setSelectedChatUser(passengerUser);
        setCurrentView('chat-passenger');
      }
    };

    return (
      <div className="checked-in-screen">
        <header className="screen-header">
          <button type="button" onClick={() => setCurrentView('dashboard')} className="back-btn">← Back</button>
          <h1>Checked-in Passengers</h1>
        </header>

        <div className="passengers-list">
          {checkedInPassengers.length === 0 ? (
            <div className="no-passengers">
              <p>No passengers have checked in yet</p>
            </div>
          ) : (
            checkedInPassengers.map(passenger => (
              <div key={passenger.id} className="passenger-card">
                <div className="passenger-info">
                  <div className="passenger-avatar">👤</div>
                  <div className="passenger-details">
                    <h4 className="passenger-name">{passenger.passenger_name}</h4>
                    <p className="passenger-location">📍 {passenger.location}</p>
                    <p className="passenger-time">🕒 {passenger.timestamp}</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => handleChatWithPassenger(passenger)}
                  className="chat-passenger-btn"
                >
                  Chat
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // User Selection Screen for Chat
  const UserSelectionScreen = ({ targetRole }) => {
    const filteredUsers = allUsers.filter(u => 
      u.role === targetRole && u.id !== user.id
    );

    const handleUserSelect = (selectedUser) => {
      setSelectedChatUser(selectedUser);
      setCurrentView(`chat-${targetRole}`);
    };

    return (
      <div className="user-selection-screen">
        <header className="screen-header">
          <button type="button" onClick={() => setCurrentView('dashboard')} className="back-btn">← Back</button>
          <h1>Select {targetRole.charAt(0).toUpperCase() + targetRole.slice(1)} to Chat With</h1>
        </header>

        <div className="users-list">
          {filteredUsers.length === 0 ? (
            <div className="no-users">
              <p>No {targetRole}s available online</p>
            </div>
          ) : (
            filteredUsers.map(userItem => (
              <div 
                key={userItem.id} 
                className="user-card"
                onClick={() => handleUserSelect(userItem)}
              >
                <div className="user-info">
                  <div className="user-avatar">
                    {userItem.role === 'driver' ? '🚗' : 
                     userItem.role === 'vendor' ? '🏪' : '👤'}
                  </div>
                  <div className="user-details">
                    <h4 className="user-name">{userItem.username}</h4>
                    <p className="user-role">{userItem.role}</p>
                    <div className={`user-status ${userItem.online ? 'online' : 'offline'}`}>
                      {userItem.online ? 'Online' : 'Offline'}
                    </div>
                  </div>
                </div>
                <button type="button" className="select-user-btn">Chat</button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // Products Screen
  const ProductsScreen = () => {
    const [selectedCategory, setSelectedCategory] = useState('All');
    
    const categories = ['All', 'Beverages', 'Snacks', 'Food', 'General'];
    
    const filteredProducts = selectedCategory === 'All' 
      ? products 
      : products.filter(product => product.category === selectedCategory);

    return (
      <div className="products-screen">
        <header className="screen-header">
          <button type="button" onClick={() => setCurrentView('dashboard')} className="back-btn">← Go Back</button>
          <h1>Products</h1>
        </header>

        {/* Category Filter */}
        <div className="categories-filter">
          {categories.map(category => (
            <button
              key={category}
              type="button"
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="products-grid">
          {filteredProducts.length === 0 ? (
            <div className="no-products-message">
              <p>No products available yet. Vendors will add products soon!</p>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <div key={product.id} className="product-card">
                <div className="product-image">
                  {product.image && typeof product.image === 'string' && product.image.startsWith('data:image') ? (
                    <img src={product.image} alt={product.name} className="product-photo" />
                  ) : (
                    <span className="product-emoji">{product.image}</span>
                  )}
                </div>
                <div className="product-info">
                  <h3 className="product-title">{product.name}</h3>
                  <p className="product-description">{product.description}</p>
                  <p className="product-vendor">by {product.vendor}</p>
                  <div className="product-meta">
                    <span className="product-category">{product.category}</span>
                    <span className="product-price">R{product.price}</span>
                  </div>
                </div>
                <button 
                  type="button"
                  className="buy-btn"
                  onClick={() => addToCart(product)}
                >
                  Add to Cart
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  // Cart Screen
  const CartScreen = () => {
    const handleCheckout = () => {
      if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
      }

      const paymentMethod = prompt(
        `Checkout Total: R${getCartTotal()}\n\nSelect payment method:\n1. M-Pesa\n2. Ecocash\n3. Cash\n\nEnter 1, 2, or 3:`
      );

      const methods = { '1': 'M-Pesa', '2': 'Ecocash', '3': 'Cash' };
      const method = methods[paymentMethod];

      if (method) {
        alert(`Order successful!\n\nTotal: R${getCartTotal()}\nPayment Method: ${method}\n\nThank you for your order!`);
        setCart([]);
        setCurrentView('dashboard');
      }
    };

    return (
      <div className="cart-screen">
        <header className="screen-header">
          <button type="button" onClick={() => setCurrentView('products')} className="back-btn">← Back to Products</button>
          <h1>Shopping Cart</h1>
        </header>

        <div className="cart-content">
          {cart.length === 0 ? (
            <div className="empty-cart">
              <div className="empty-icon">🛒</div>
              <h3>Your cart is empty</h3>
              <p>Add some products to get started!</p>
              <button 
                type="button"
                onClick={() => setCurrentView('products')}
                className="continue-shopping-btn"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <>
              <div className="cart-items">
                {cart.map(item => (
                  <div key={item.id} className="cart-item">
                    <div className="item-image">
                      {item.image && typeof item.image === 'string' && item.image.startsWith('data:image') ? (
                        <img src={item.image} alt={item.name} className="item-photo" />
                      ) : (
                        <span className="item-emoji">{item.image}</span>
                      )}
                    </div>
                    <div className="item-details">
                      <h4 className="item-name">{item.name}</h4>
                      <p className="item-vendor">by {item.vendor}</p>
                      <p className="item-price">R{item.price} each</p>
                    </div>
                    <div className="quantity-controls">
                      <button 
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="quantity-btn"
                      >
                        -
                      </button>
                      <span className="quantity">{item.quantity}</span>
                      <button 
                        type="button"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="quantity-btn"
                      >
                        +
                      </button>
                    </div>
                    <div className="item-total">
                      R{(parseFloat(item.price) * item.quantity).toFixed(2)}
                    </div>
                    <button 
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      className="remove-btn"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="cart-summary">
                <div className="total-section">
                  <h3>Total: R{getCartTotal()}</h3>
                </div>
                <button 
                  type="button"
                  onClick={handleCheckout}
                  className="checkout-btn"
                >
                  Proceed to Checkout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // Chat Screen
  const ChatScreen = ({ chatType }) => {
    const [message, setMessage] = useState('');
    const chatKey = `${user?.role}-${chatType}-${selectedChatUser?.id}`;
    const messages = chatMessages[chatKey] || [];

    const handleSendMessage = (e) => {
      if (e) e.preventDefault();
      if (!message.trim()) return;
      
      sendMessage(chatKey, message, user);
      setMessage('');
    };

    return (
      <div className="chat-screen">
        <header className="screen-header">
          <button type="button" onClick={() => {
            if (currentView === 'chat-passenger' && user?.role === 'driver') {
              setCurrentView('checked-in-passengers');
            } else {
              setCurrentView('user-selection-' + chatType);
            }
          }} className="back-btn">← Back</button>
          <h1>Chat with {selectedChatUser?.username}</h1>
        </header>

        <div className="chat-container">
          <div className="chat-header">
            <div className="chat-user-info">
              <div className="user-avatar">
                {chatType === 'driver' ? '🚗' : 
                 chatType === 'vendor' ? '🏪' : '👤'}
              </div>
              <div>
                <h4>{selectedChatUser?.username}</h4>
                <p className="user-role">{selectedChatUser?.role}</p>
              </div>
            </div>
          </div>

          <div className="messages-area">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`message ${msg.sender === 'user' ? 'user-message' : 'other-message'}`}
              >
                <div className="message-text">{msg.text}</div>
                <div className="message-sender">{msg.senderName}</div>
                <div className="message-time">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="chat-input-area">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="chat-input"
            />
            <button 
              type="submit"
              disabled={!message.trim()}
              className="send-btn"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    );
  };

  // Main Render Logic
  return (
    <div className="App">
      {!dbConnected && (
        <div className="db-warning">
          ⚠️ Running in offline mode. Some features may not persist.
        </div>
      )}
      {currentView === 'auth' || !user ? (
        <AuthScreen />
      ) : currentView === 'products' ? (
        <ProductsScreen />
      ) : currentView === 'cart' ? (
        <CartScreen />
      ) : currentView === 'checked-in-passengers' ? (
        <CheckedInPassengersScreen />
      ) : currentView.startsWith('user-selection-') ? (
        <UserSelectionScreen targetRole={currentView.split('-')[2]} />
      ) : currentView.startsWith('chat-') ? (
        <ChatScreen chatType={currentView.split('-')[1]} />
      ) : (
        // Dashboard based on user role
        (() => {
          switch (user.role) {
            case 'driver':
              return <DriverDashboard />;
            case 'passenger':
              return <PassengerDashboard />;
            case 'vendor':
              return <VendorDashboard />;
            default:
              return <AuthScreen />;
          }
        })()
      )}
    </div>
  );
}

export default App;