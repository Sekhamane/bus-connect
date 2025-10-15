// src/api.js - SUPER SIMPLE VERSION
const API_BASE_URL = 'http://localhost:5000/api';

// Simple fetch function
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

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✅ API Success: ${endpoint}`, data);
    return data;
  } catch (error) {
    console.error(`❌ API Error: ${endpoint}`, error.message);
    throw new Error(`Cannot connect to server. Make sure the backend is running on port 5000. Error: ${error.message}`);
  }
};

// API functions
export const testConnection = async () => {
  return apiRequest('/health');
};

export const initDatabase = async () => {
  return { success: true };
};

export const getUsers = async () => {
  return apiRequest('/users');
};

export const createUser = async (userData) => {
  return apiRequest('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

export const loginUser = async (email, password) => {
  return apiRequest('/users/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
};

export const getProducts = async () => {
  return apiRequest('/products');
};

export const createProduct = async (productData) => {
  return apiRequest('/products', {
    method: 'POST',
    body: JSON.stringify(productData),
  });
};

export const getCheckins = async () => {
  return apiRequest('/checkins');
};

export const createCheckin = async (checkinData) => {
  return apiRequest('/checkins', {
    method: 'POST',
    body: JSON.stringify(checkinData),
  });
};

export const getMessages = async (chatKey) => {
  return apiRequest(`/messages/${chatKey}`);
};

export const createMessage = async (messageData) => {
  return apiRequest('/messages', {
    method: 'POST',
    body: JSON.stringify(messageData),
  });
};