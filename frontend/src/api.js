// src/api.js - CORRECTED VERSION
const API_BASE_URL = 'https://busconnect-ftzz.onrender.com';

// Enhanced fetch function with better error handling
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
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
    const response = await fetch(API_BASE_URL);
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
  return apiRequest('/api/health');
};

export const healthCheck = async () => {
  return apiRequest('/');
};

// User management - ALL ENDPOINTS NOW USE /api/ PREFIX
export const getUsers = async () => {
  return apiRequest('/api/users');
};

export const createUser = async (userData) => {
  return apiRequest('/api/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

export const loginUser = async (email, password) => {
  return apiRequest('/api/users/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
};

export const getUserById = async (userId) => {
  return apiRequest(`/api/users/${userId}`);
};

export const updateUser = async (userId, userData) => {
  return apiRequest(`/api/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  });
};

// Product management
export const getProducts = async () => {
  return apiRequest('/api/products');
};

export const getProductById = async (productId) => {
  return apiRequest(`/api/products/${productId}`);
};

export const createProduct = async (productData) => {
  return apiRequest('/api/products', {
    method: 'POST',
    body: JSON.stringify(productData),
  });
};

export const updateProduct = async (productId, productData) => {
  return apiRequest(`/api/products/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(productData),
  });
};

export const deleteProduct = async (productId) => {
  return apiRequest(`/api/products/${productId}`, {
    method: 'DELETE',
  });
};

// Checkin management
export const getCheckins = async () => {
  return apiRequest('/api/checkins');
};

export const getCheckinById = async (checkinId) => {
  return apiRequest(`/api/checkins/${checkinId}`);
};

export const createCheckin = async (checkinData) => {
  return apiRequest('/api/checkins', {
    method: 'POST',
    body: JSON.stringify(checkinData),
  });
};

// Message management
export const getMessages = async (chatKey) => {
  return apiRequest(`/api/messages/${chatKey}`);
};

export const createMessage = async (messageData) => {
  return apiRequest('/api/messages', {
    method: 'POST',
    body: JSON.stringify(messageData),
  });
};

export const getChats = async (userId) => {
  return apiRequest(`/api/chats/${userId}`);
};

// Database initialization
export const initDatabase = async () => {
  return apiRequest('/api/init', {
    method: 'POST',
  });
};

// Search functionality
export const searchProducts = async (query) => {
  return apiRequest(`/api/products/search?q=${encodeURIComponent(query)}`);
};

export const searchUsers = async (query) => {
  return apiRequest(`/api/users/search?q=${encodeURIComponent(query)}`);
};

// Export the base URL for use in other components
export { API_BASE_URL };