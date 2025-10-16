// src/api.js - WORKING VERSION
const API_BASE_URL = 'https://busconnect-ftzz.onrender.com';

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
    throw new Error(`Cannot connect to server: ${error.message}`);
  }
};

// API functions
export const testConnection = async () => {
  return apiRequest('/api/health');
};

export const initDatabase = async () => {
  return { success: true };
};

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

export const getProducts = async () => {
  return apiRequest('/api/products');
};

export const createProduct = async (productData) => {
  return apiRequest('/api/products', {
    method: 'POST',
    body: JSON.stringify(productData),
  });
};

export const getCheckins = async () => {
  return apiRequest('/api/checkins');
};

export const createCheckin = async (checkinData) => {
  return apiRequest('/api/checkins', {
    method: 'POST',
    body: JSON.stringify(checkinData),
  });
};

export const getMessages = async (chatKey) => {
  return apiRequest(`/api/messages/${chatKey}`);
};

export const createMessage = async (messageData) => {
  return apiRequest('/api/messages', {
    method: 'POST',
    body: JSON.stringify(messageData),
  });
};

export { API_BASE_URL };