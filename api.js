/**
 * API Utility for KLE Alumni Connect
 * Handles all API communications with the backend
 */

const API_BASE_URL = 'http://localhost:5000/api';

class AlumniAPI {
  constructor() {
    this.token = localStorage.getItem('token') || null;
  }

  // Set authorization header
  getHeaders(includeAuth = true) {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  // Save token
  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  // Remove token
  clearToken() {
    this.token = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Generic request handler
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: this.getHeaders(options.auth !== false)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // ==================== AUTH ENDPOINTS ====================
  
  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      auth: false
    });
    
    if (data.token) {
      this.setToken(data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  }

  async login(email, password, role) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, role }),
      auth: false
    });
    
    if (data.token) {
      this.setToken(data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  }

  async forgotPassword(email) {
    return await this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
      auth: false
    });
  }

  async resetPassword(email, resetCode, newPassword) {
    return await this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, resetCode, newPassword }),
      auth: false
    });
  }

  async verifyToken() {
    return await this.request('/auth/verify');
  }

  logout() {
    this.clearToken();
  }

  // ==================== STUDENT ENDPOINTS ====================
  
  async getAlumniList(filters = {}) {
    const params = new URLSearchParams(filters);
    return await this.request(`/students/alumni?${params}`);
  }

  async getStudentProfile() {
    return await this.request('/students/profile');
  }

  async updateStudentProfile(updates) {
    return await this.request('/students/profile', {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async getStudentConnections() {
    return await this.request('/students/connections');
  }

  // ==================== ALUMNI ENDPOINTS ====================
  
  async getAlumniProfile() {
    return await this.request('/alumni/profile');
  }

  async updateAlumniProfile(updates) {
    return await this.request('/alumni/profile', {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async getAlumniConnectionRequests() {
    return await this.request('/alumni/connection-requests');
  }

  async getAlumniPosts() {
    return await this.request('/alumni/posts');
  }

  // ==================== ADMIN ENDPOINTS ====================
  
  async getAdminStats() {
    return await this.request('/admin/stats');
  }

  async getAllUsers(filters = {}) {
    const params = new URLSearchParams(filters);
    return await this.request(`/admin/users?${params}`);
  }

  async updateUserStatus(userId, isActive) {
    return await this.request(`/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ isActive })
    });
  }

  async deleteUser(userId) {
    return await this.request(`/admin/users/${userId}`, {
      method: 'DELETE'
    });
  }

  async getAllPostsForModeration(filters = {}) {
    const params = new URLSearchParams(filters);
    return await this.request(`/admin/posts?${params}`);
  }

  async approvePost(postId, isApproved) {
    return await this.request(`/admin/posts/${postId}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ isApproved })
    });
  }

  // ==================== POST ENDPOINTS ====================
  
  async getPosts(filters = {}) {
    const params = new URLSearchParams(filters);
    return await this.request(`/posts?${params}`);
  }

  async createPost(postData) {
    return await this.request('/posts', {
      method: 'POST',
      body: JSON.stringify(postData)
    });
  }

  async appreciatePost(postId) {
    return await this.request(`/posts/${postId}/appreciate`, {
      method: 'POST'
    });
  }

  async addAnswer(postId, text) {
    return await this.request(`/posts/${postId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ text })
    });
  }

  async deletePost(postId) {
    return await this.request(`/posts/${postId}`, {
      method: 'DELETE'
    });
  }

  // ==================== CONNECTION ENDPOINTS ====================
  
  async getConnections() {
    return await this.request('/connections');
  }

  async sendConnectionRequest(alumniId, requestMessage = '') {
    return await this.request('/connections', {
      method: 'POST',
      body: JSON.stringify({ alumniId, requestMessage })
    });
  }

  async updateConnectionStatus(connectionId, status) {
    return await this.request(`/connections/${connectionId}`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  async deleteConnection(connectionId) {
    return await this.request(`/connections/${connectionId}`, {
      method: 'DELETE'
    });
  }

  // ==================== MESSAGE ENDPOINTS ====================
  
  async getMessages(otherUserId = null) {
    const params = otherUserId ? `?with=${otherUserId}` : '';
    return await this.request(`/messages${params}`);
  }

  async getConversations() {
    return await this.request('/messages/conversations');
  }

  async sendMessage(receiverId, text) {
    return await this.request('/messages', {
      method: 'POST',
      body: JSON.stringify({ receiverId, text })
    });
  }

  async markMessageAsRead(messageId) {
    return await this.request(`/messages/${messageId}/read`, {
      method: 'PUT'
    });
  }

  async deleteMessage(messageId) {
    return await this.request(`/messages/${messageId}`, {
      method: 'DELETE'
    });
  }

  // ==================== HELPER METHODS ====================
  
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated() {
    return !!this.token && !!localStorage.getItem('user');
  }

  getUserRole() {
    const user = this.getCurrentUser();
    return user ? user.role : null;
  }
}

// Create global instance
const api = new AlumniAPI();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AlumniAPI;
}
