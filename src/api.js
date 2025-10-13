const API_BASE_URL = "http://localhost:5000/api";

// Test database connection
export const testConnection = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/test`);
    return await response.json();
  } catch (error) {
    console.error("API connection error:", error);
    return { error: "Cannot connect to server" };
  }
};

// Initialize database tables
export const initDatabase = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/init`);
    return await response.json();
  } catch (error) {
    console.error("Database initialization error:", error);
    return { error: "Cannot initialize database" };
  }
};

// Users API
export const getUsers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`);
    return await response.json();
  } catch (error) {
    console.error("Get users error:", error);
    return [];
  }
};

export const createUser = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });
    return await response.json();
  } catch (error) {
    console.error("Create user error:", error);
    return { error: "Cannot create user" };
  }
};

// Products API
export const getProducts = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/products`);
    return await response.json();
  } catch (error) {
    console.error("Get products error:", error);
    return [];
  }
};

export const createProduct = async (productData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(productData),
    });
    return await response.json();
  } catch (error) {
    console.error("Create product error:", error);
    return { error: "Cannot create product" };
  }
};

// Check-ins API
export const getCheckins = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/checkins`);
    return await response.json();
  } catch (error) {
    console.error("Get checkins error:", error);
    return [];
  }
};

export const createCheckin = async (checkinData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/checkins`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(checkinData),
    });
    return await response.json();
  } catch (error) {
    console.error("Create checkin error:", error);
    return { error: "Cannot create checkin" };
  }
};

// Messages API
export const getMessages = async (chatKey) => {
  try {
    const response = await fetch(`${API_BASE_URL}/messages/${chatKey}`);
    return await response.json();
  } catch (error) {
    console.error("Get messages error:", error);
    return [];
  }
};

export const createMessage = async (messageData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messageData),
    });
    return await response.json();
  } catch (error) {
    console.error("Create message error:", error);
    return { error: "Cannot create message" };
  }
};
