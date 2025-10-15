// src/api.js - COMPLETE VERSION
const API_BASE_URL = 'https://busconnect-back-end.onrender.com';

// Enhanced fetch function with better error handling
const apiRequest = async (endpoint, options = {}) => {
  const url = `https://busconnect-back-end.onrender.com${endpoint}`;
  console.log(`🔄 API Call: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    console.log(`📊 Response Status: ${response.status}`);
    
    if (!response.ok) {
      // Try to get error message from response
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText || 'Unknown error'}`);
    }

    // Check if response has content
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      console.log(`✅ API Success: ${endpoint}`, data);
      return data;
    } else {
      const text = await response.text();
      console.log(`✅ API Success (non-JSON): ${endpoint}`, text);
      return { message: text };
    }
  } catch (error) {
    console.error(`❌ API Error: ${endpoint}`, error.message);
    throw new Error(`Cannot connect to server: ${error.message}`);
  }
};

// Test backend connection
export const testBackendConnection = async () => {
  try {
    console.log('🧪 Testing backend connection...');
    const response = await fetch('https://busconnect-back-end.onrender.com');
    console.log('Backend response status:', response.status);
    
    const text = await response.text();
    console.log('Backend response:', text);
    
    return { success: true, status: response.status, data: text };
  } catch (error) {
    console.error('Backend connection test failed:', error);
    return { success: false, error: error.message };
  }
};

// Health check endpoints
export const testConnection = async () => {
  try {
    return await apiRequest('/health');
  } catch (error) {
    return await apiRequest('/api/health');
  }
};

export const healthCheck = async () => {
  return apiRequest('/');
};

// User management
export const getUsers = async () => {
  try {
    return await apiRequest('/api/users');
  } catch (error) {
    return await apiRequest('/users');
  }
};

export const createUser = async (userData) => {
  try {
    return await apiRequest('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  } catch (error) {
    return await apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }
};

export const loginUser = async (email, password) => {
  try {
    return await apiRequest('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  } catch (error) {
    return await apiRequest('/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }
};

export const getUserById = async (userId) => {
  try {
    return await apiRequest(`/api/users/${userId}`);
  } catch (error) {
    return await apiRequest(`/users/${userId}`);
  }
};

export const updateUser = async (userId, userData) => {
  try {
    return await apiRequest(`/api/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  } catch (error) {
    return await apiRequest(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }
};

// Product management
export const getProducts = async () => {
  try {
    return await apiRequest('/api/products');
  } catch (error) {
    return await apiRequest('/products');
  }
};

export const getProductById = async (productId) => {
  try {
    return await apiRequest(`/api/products/${productId}`);
  } catch (error) {
    return await apiRequest(`/products/${productId}`);
  }
};

export const createProduct = async (productData) => {
  try {
    return await apiRequest('/api/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  } catch (error) {
    return await apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  }
};

export const updateProduct = async (productId, productData) => {
  try {
    return await apiRequest(`/api/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  } catch (error) {
    return await apiRequest(`/products/${productId}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  }
};

export const deleteProduct = async (productId) => {
  try {
    return await apiRequest(`/api/products/${productId}`, {
      method: 'DELETE',
    });
  } catch (error) {
    return await apiRequest(`/products/${productId}`, {
      method: 'DELETE',
    });
  }
};

// Checkin management
export const getCheckins = async () => {
  try {
    return await apiRequest('/api/checkins');
  } catch (error) {
    return await apiRequest('/checkins');
  }
};

export const getCheckinById = async (checkinId) => {
  try {
    return await apiRequest(`/api/checkins/${checkinId}`);
  } catch (error) {
    return await apiRequest(`/checkins/${checkinId}`);
  }
};

export const createCheckin = async (checkinData) => {
  try {
    return await apiRequest('/api/checkins', {
      method: 'POST',
      body: JSON.stringify(checkinData),
    });
  } catch (error) {
    return await apiRequest('/checkins', {
      method: 'POST',
      body: JSON.stringify(checkinData),
    });
  }
};

// Message management
export const getMessages = async (chatKey) => {
  try {
    return await apiRequest(`/api/messages/${chatKey}`);
  } catch (error) {
    return await apiRequest(`/messages/${chatKey}`);
  }
};

export const createMessage = async (messageData) => {
  try {
    return await apiRequest('/api/messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  } catch (error) {
    return await apiRequest('/messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  }
};

export const getChats = async (userId) => {
  try {
    return await apiRequest(`/api/chats/${userId}`);
  } catch (error) {
    return await apiRequest(`/chats/${userId}`);
  }
};

// Database initialization
export const initDatabase = async () => {
  try {
    return await apiRequest('/api/init', {
      method: 'POST',
    });
  } catch (error) {
    return await apiRequest('/init', {
      method: 'POST',
    });
  }
};

// Search functionality
export const searchProducts = async (query) => {
  try {
    return await apiRequest(`/api/products/search?q=${encodeURIComponent(query)}`);
  } catch (error) {
    return await apiRequest(`/products/search?q=${encodeURIComponent(query)}`);
  }
};

export const searchUsers = async (query) => {
  try {
    return await apiRequest(`/api/users/search?q=${encodeURIComponent(query)}`);
  } catch (error) {
    return await apiRequest(`/users/search?q=${encodeURIComponent(query)}`);
  }
};

// Export the base URL for use in other components
export { API_BASE_URL };