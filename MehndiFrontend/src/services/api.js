// const API_BASE_URL = 'http://localhost:5001/api';
const API_BASE_URL = 'https://mehndi-server.vercel.app/api';

// API utility functions
const handleResponse = async (response) => {
  try {
    const data = await response.json();
    
    if (!response.ok) {
      console.error('API error response:', data);
      
      // For validation errors, include detailed error information
      if (data.errors && Array.isArray(data.errors)) {
        const errorMessages = data.errors.map(err => err.msg || err.message).join(', ');
        throw new Error(`Validation errors: ${errorMessages}`);
      }
      
      throw new Error(data.message || `Server error: ${response.status} ${response.statusText}`);
    }
    
    console.log('API success response:', data);
    return data;
  } catch (error) {
    if (error.name === 'SyntaxError') {
      // Response is not valid JSON
      throw new Error(`Server returned invalid response: ${response.status} ${response.statusText}`);
    }
    throw error;
  }
};

const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  // Attach Bearer token from localStorage if present
  try {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      config.headers.Authorization = `Bearer ${storedToken}`;
    }
  } catch {}

  try {
    console.log('Making API request to:', url);
    console.log('Request config:', config);
    
    const response = await fetch(url, config);
    console.log('Response received:', response.status, response.statusText);
    
    return handleResponse(response);
  } catch (error) {
    console.error('API request failed:', error);
    
    // More specific error messages
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Unable to connect to server. Please check if the backend server is running.');
    }
    
    throw error;
  }
};

// Authentication API functions
export const authAPI = {
  // Register a new user
  register: async (userData) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Login user
  login: async (credentials) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  // Logout user
  // Note: logout is client-side only now; no server call required

  // Get current user profile
  getProfile: async () => {
    return apiRequest('/auth/me');
  },

  // Update user profile (includes password if provided)
  updateProfile: async (userData) => {
    return apiRequest('/auth/update-profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  // Forgot password
  forgotPassword: async (email) => {
    return apiRequest('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Reset password
  resetPassword: async (token, password) => {
    return apiRequest('/auth/reset-password', {
      method: 'PUT',
      body: JSON.stringify({ token, password }),
    });
  },

  // Verify email
  verifyEmail: async (token) => {
    return apiRequest(`/auth/verify-email/${token}`, {
      method: 'GET',
    });
  },

  // Resend verification email
  resendVerificationEmail: async (email) => {
    return apiRequest('/auth/resend-verification-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Send phone verification code
  sendPhoneCode: async (email) => {
    return apiRequest('/auth/send-phone-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Verify phone code
  verifyPhoneCode: async (email, code) => {
    return apiRequest('/auth/verify-phone-code', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  },

  // Google OAuth authentication
  googleAuth: async (credential) => {
    return apiRequest('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    });
  },

  // Get artist rating by ID
  getArtistRating: async (artistId) => {
    return apiRequest(`/auth/artist-rating/${artistId}`);
  },
};

// Jobs API functions
export const jobsAPI = {
  // Get all jobs
  getAllJobs: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/jobs?${queryParams}` : '/jobs';
    return apiRequest(endpoint);
  },

  // Get single job
  getJob: async (jobId) => {
    return apiRequest(`/jobs/${jobId}`);
  },

  // Create new job (clients only)
  createJob: async (jobData) => {
    return apiRequest('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  },

  // Update job
  updateJob: async (jobId, jobData) => {
    return apiRequest(`/jobs/${jobId}`, {
      method: 'PUT',
      body: JSON.stringify(jobData),
    });
  },

  // Delete job
  deleteJob: async (jobId) => {
    return apiRequest(`/jobs/${jobId}`, {
      method: 'DELETE',
    });
  },

  // Get client's jobs
  getMyJobs: async () => {
    return apiRequest('/jobs/client/me');
  },
};

// Proposals API functions will be defined later

// Messages API functions
export const messagesAPI = {
  // Get conversations
  getConversations: async () => {
    return apiRequest('/messages/conversations');
  },

  // Get messages with a specific user
  getMessages: async (userId) => {
    return apiRequest(`/messages/conversation/${userId}`);
  },

  // Send message
  sendMessage: async (messageData) => {
    return apiRequest('/messages', {
      method: 'POST',
      body: JSON.stringify(messageData),
    });
  },

  // Get unread count
  getUnreadCount: async () => {
    return apiRequest('/messages/unread-count');
  },
};

// Chats API functions
export const chatAPI = {
  ensureChat: async (clientId, artistId) => {
    return apiRequest('/chats/ensure', {
      method: 'POST',
      body: JSON.stringify({ clientId, artistId }),
    });
  },
  listMyChats: async () => {
    return apiRequest('/chats');
  },
  getChat: async (chatId) => {
    return apiRequest(`/chats/${chatId}`);
  },
  sendMessage: async (chatId, text, attachments = []) => {
    return apiRequest(`/chats/${chatId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ text, attachments }),
    });
  },
  markRead: async (chatId) => {
    return apiRequest(`/chats/${chatId}/read`, {
      method: 'PUT'
    });
  }
};

// Reviews API functions
export const reviewsAPI = {
  // Create review (clients only)
  createReview: async (reviewData) => {
    return apiRequest('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  },

  // Get artist reviews
  getArtistReviews: async (artistId) => {
    return apiRequest(`/reviews/artist/${artistId}`);
  },

  // Get current client's completed bookings to review
  getCompletedBookingsToReview: async (onlyNotRated = true) => {
    const qs = onlyNotRated ? '?onlyNotRated=true' : '';
    return apiRequest(`/bookings/completed${qs}`);
  },

  // Get my review for specific booking
  getMyReviewForBooking: async (bookingId) => {
    return apiRequest(`/reviews/booking/${bookingId}`);
  },
};

// Users API functions
export const usersAPI = {
  // Get all artists
  getArtists: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/users/artists?${queryParams}` : '/users/artists';
    return apiRequest(endpoint);
  },

  // Get single artist
  getArtist: async (artistId) => {
    return apiRequest(`/users/artist/${artistId}`);
  },
};

// Admin API functions
export const adminAPI = {
  // Users
  listUsers: async () => apiRequest('/admin/users'),
  updateUser: async (userId, updates) => apiRequest(`/admin/users/${userId}`, { method: 'PUT', body: JSON.stringify(updates) }),
  deleteUser: async (userId) => apiRequest(`/admin/users/${userId}`, { method: 'DELETE' }),
  getUserBookings: async (userId) => apiRequest(`/admin/users/${userId}/bookings`),
  getUserApplications: async (userId) => apiRequest(`/admin/users/${userId}/applications`),

  // Applications status summary
  getApplicationStatusSummary: async () => apiRequest('/admin/applications/status'),
  getAllApplications: async () => apiRequest('/admin/applications'),

  // Blogs
  listBlogs: async () => apiRequest('/admin/blogs'),
  createBlog: async (data) => apiRequest('/admin/blogs', { method: 'POST', body: JSON.stringify(data) }),
  updateBlog: async (blogId, data) => apiRequest(`/admin/blogs/${blogId}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteBlog: async (blogId) => apiRequest(`/admin/blogs/${blogId}`, { method: 'DELETE' }),

  // Analytics
  getAnalytics: async (params) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/admin/analytics?${queryString}`);
  },
  getRequestsByStatus: async (params) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/admin/analytics/requests-by-status?${queryString}`);
  },
  getApplicationsByStatus: async (params) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/admin/analytics/applications-by-status?${queryString}`);
  },
  getGrowthOverTime: async (params) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/admin/analytics/growth-over-time?${queryString}`);
  },
  getActivityByCity: async (params) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/admin/analytics/activity-by-city?${queryString}`);
  },
};

// Public Blogs API
export const blogsAPI = {
  list: async () => apiRequest('/blogs'),
  getById: async (id) => apiRequest(`/blogs/${id}`)
};

// Upload API functions
export const uploadAPI = {
  // Upload single image
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    return apiRequest('/upload/image', {
      method: 'POST',
      body: formData,
      headers: {}, // Remove Content-Type header to let browser set it for FormData
    });
  },

  // Upload multiple images
  uploadImages: async (files) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });
    
    return apiRequest('/upload/images', {
      method: 'POST',
      body: formData,
      headers: {}, // Remove Content-Type header to let browser set it for FormData
    });
  },

  // Upload document
  uploadDocument: async (file) => {
    const formData = new FormData();
    formData.append('document', file);
    
    return apiRequest('/upload/document', {
      method: 'POST',
      body: formData,
      headers: {}, // Remove Content-Type header to let browser set it for FormData
    });
  },
};

// Notifications API functions
export const notificationsAPI = {
  // Get user notifications
  getNotifications: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const endpoint = queryParams ? `/notifications?${queryParams}` : '/notifications';
    return apiRequest(endpoint);
  },

  // Get unread notification count
  getUnreadCount: async () => {
    return apiRequest('/notifications/unread-count');
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    return apiRequest(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    return apiRequest('/notifications/mark-all-read', {
      method: 'PUT',
    });
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    return apiRequest(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  },

  // Clear all read notifications
  clearReadNotifications: async () => {
    return apiRequest('/notifications/clear-read', {
      method: 'DELETE',
    });
  },
};

// Portfolios API functions
export const portfoliosAPI = {
  listMine: async () => {
    return apiRequest('/portfolios/me');
  },
  getArtistPortfolio: async (artistId) => {
    return apiRequest(`/portfolios/artist/${artistId}`);
  },
  create: async (data) => {
    return apiRequest('/portfolios', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: async (id, data) => {
    return apiRequest(`/portfolios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  remove: async (id) => {
    return apiRequest(`/portfolios/${id}`, {
      method: 'DELETE'
    });
  }
};

// Bookings API functions
export const bookingsAPI = {
  // Create new booking
  createBooking: async (bookingData) => {
    return apiRequest('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  },

  // Get client's bookings
  getMyBookings: async () => {
    return apiRequest('/bookings');
  },

  // Get all bookings (for artists/admin)
  getAllBookings: async () => {
    return apiRequest('/bookings/all');
  },

  // Get pending bookings (for artists/admin)
  getPendingBookings: async () => {
    return apiRequest('/bookings/pending');
  },

  // Get nearby bookings within radius (for artists)
  getNearbyBookings: async (latitude, longitude, radius = 3) => {
    const queryParams = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      radius: radius.toString()
    });
    return apiRequest(`/bookings/nearby?${queryParams}`);
  },

  // Get saved bookings for current user
  getSavedBookings: async () => {
    return apiRequest('/bookings/saved');
  },

  // Save/like a booking
  saveBooking: async (bookingId) => {
    return apiRequest(`/bookings/${bookingId}/save`, { method: 'POST' });
  },

  // Unsave/unlike a booking
  unsaveBooking: async (bookingId) => {
    return apiRequest(`/bookings/${bookingId}/save`, { method: 'DELETE' });
  },

  // Get single booking
  getBooking: async (bookingId) => {
    return apiRequest(`/bookings/${bookingId}`);
  },

  // Update booking status
  updateBookingStatus: async (bookingId, status) => {
    return apiRequest(`/bookings/${bookingId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Complete booking with media URLs
  completeBooking: async (bookingId, { images = [], video = '' }) => {
    return apiRequest(`/bookings/${bookingId}/complete`, {
      method: 'PUT',
      body: JSON.stringify({ images, video })
    });
  },
  
  // Update booking (client edits)
  updateBooking: async (bookingId, bookingData) => {
    return apiRequest(`/bookings/${bookingId}`, {
      method: 'PUT',
      body: JSON.stringify(bookingData),
    });
  },

  // Delete booking (client deletes)
  deleteBooking: async (bookingId) => {
    return apiRequest(`/bookings/${bookingId}`, {
      method: 'DELETE',
    });
  },

  // Cancel booking with reason and details
  cancelBooking: async ({ bookingId, cancellationReason, cancellationDescription,artistId }) => {
    return apiRequest('/bookings/cancel', {
      method: 'PUT',
      body: JSON.stringify({ bookingId, cancellationReason, cancellationDescription,artistId }),
    });
  },

  // Create remaining payment checkout
  createRemainingPayment: async ({ bookingId, remainingAmount,artistId }) => {
    return apiRequest('/payments/remaining-checkout', {
      method: 'POST',
      body: JSON.stringify({ bookingId, remainingAmount,artistId}),
    });
  },

  // Update booking payment status
  updateBookingPaymentStatus: async ({ isPaid, remainingPayment, bookingId,artistId }) => {
    return apiRequest(`/bookings/payment-status`, {
      method: 'PUT',
      body: JSON.stringify({ isPaid, remainingPayment, bookingId,artistId }),
    });
  },

  // Process refund for booking
  processRefund: async ({ bookingId, userId, artistId }) => {
    return apiRequest('/bookings/refund', {
      method: 'POST',
      body: JSON.stringify({ bookingId, userId, artistId }),
    });
  },
};

// Proposals API
export const proposalsAPI = {
  // Create new proposal
  createProposal: async (proposalData) => {
    return apiRequest('/proposals', {
      method: 'POST',
      body: JSON.stringify(proposalData),
    });
  },

  // Get artist's proposals
  getMyProposals: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/proposals/my-proposals?${queryParams}` : '/proposals/my-proposals';
    return apiRequest(endpoint);
  },

  // Get proposals for a job (for clients)
  getJobProposals: async (jobId, filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/proposals/job/${jobId}?${queryParams}` : `/proposals/job/${jobId}`;
    return apiRequest(endpoint);
  },

  // Get single proposal
  getProposal: async (proposalId) => {
    return apiRequest(`/proposals/${proposalId}`);
  },

  // Update proposal
  updateProposal: async (proposalId, proposalData) => {
    return apiRequest(`/proposals/${proposalId}`, {
      method: 'PUT',
      body: JSON.stringify(proposalData),
    });
  },

  // Accept proposal (for clients)
  acceptProposal: async (proposalId) => {
    return apiRequest(`/proposals/${proposalId}/accept`, {
      method: 'PUT',
    });
  },

  // Reject proposal (for clients)
  rejectProposal: async (proposalId, message = '') => {
    return apiRequest(`/proposals/${proposalId}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ message }),
    });
  },

  // Withdraw proposal (for artists)
  withdrawProposal: async (proposalId) => {
    return apiRequest(`/proposals/${proposalId}/withdraw`, {
      method: 'PUT',
    });
  },

  // Get proposal statistics (for artists)
  getStats: async () => {
    return apiRequest('/proposals/stats');
  },
};

// Applications API
export const applicationsAPI = {
  applyToBooking: async (bookingId, artistDetails) => {
    return apiRequest('/applications/apply', {
      method: 'POST',
      body: JSON.stringify({ bookingId, artistDetails })
    });
  },
  withdrawApplication: async (bookingId) => {
    return apiRequest('/applications/withdraw', {
      method: 'PUT',
      body: JSON.stringify({ bookingId })
    });
  },
  getMyAppliedBookings: async () => {
    return apiRequest('/applications/my-applied');
  },
  getMyStats: async () => {
    return apiRequest('/applications/stats/my');
  },
  getMyApplicationsByStatus: async (status) => {
    const qs = new URLSearchParams({ status }).toString();
    return apiRequest(`/applications/my-applied?${qs}`);
  },
  getApplicationsForBooking: async (bookingId) => {
    return apiRequest(`/applications/booking/${bookingId}`);
  },
  updateApplicationStatus: async (applicationId, bookingId, status, extras = {}) => {
    return apiRequest(`/applications/${applicationId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ bookingId, status, ...extras })
    });
  },
  notifyCancelAccepted: async ({ bookingId, reason }) => {
    return apiRequest('/applications/cancel', {
      method: 'POST',
      body: JSON.stringify({ bookingId, reason })
    });
  },
  completeApplication: async ({ bookingId, images = [], video = '' }) => {
    return apiRequest('/applications/complete', {
      method: 'PUT',
      body: JSON.stringify({ bookingId, images, video })
    });
  },
  
  // Add note to application (artist only)
  addApplicationNote: async (bookingId, { content, followUp = false }) => {
    return apiRequest('/applications/notes', {
      method: 'POST',
      body: JSON.stringify({ bookingId, content, followUp })
    });
  },

  // Get notes for an application (artist only)
  getApplicationNotes: async (bookingId) => {
    return apiRequest(`/applications/notes/${bookingId}`);
  }
};

// Payments API
export const paymentsAPI = {
  createCheckout: async ({ amount, currency = 'gbp', bookingId, applicationId, successUrl, cancelUrl, description, isPaid, remainingAmount }) => {
    return apiRequest('/payments/create-checkout', {
      method: 'POST',
      body: JSON.stringify({ amount, currency, bookingId, applicationId, successUrl, cancelUrl, description, isPaid, remainingAmount })
    });
  },
};

// Wallet API
export const walletAPI = {
  getWallet: async () => {
    return apiRequest('/wallet', {
      method: 'GET'
    });
  },
  getWalletSummary: async () => {
    return apiRequest('/wallet/summary', {
      method: 'GET'
    });
  },
  updateWallet: async (userId, amount, operation) => {
    return apiRequest('/wallet/update', {
      method: 'PUT',
      body: JSON.stringify({ userId, amount, operation })
    });
  },
  getAllWallets: async () => {
    return apiRequest('/wallet/all', {
      method: 'GET'
    });
  },
  withdrawFunds: async ({ amount }) => {
    return apiRequest('/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount })
    });
  }
};

// Transaction API
export const transactionAPI = {
  getAllTransactions: async () => {
    return apiRequest('/transactions', {
      method: 'GET'
    });
  },
  getMyTransactions: async () => {
    return apiRequest('/transactions/my-transactions', {
      method: 'GET'
    });
  },
  getArtistEarnings: async () => {
    return apiRequest('/transactions/artist-earnings', {
      method: 'GET'
    });
  },
  getPlatformTransactions: async () => {
    return apiRequest('/transactions/platform', {
      method: 'GET'
    });
  }
};

// Notification API
export const notificationAPI = {
  getNotifications: async () => {
    return apiRequest('/notifications', {
      method: 'GET'
    });
  },
  markAsRead: async (notificationId) => {
    return apiRequest(`/notifications/${notificationId}/read`, {
      method: 'PUT'
    });
  },
  markAllAsRead: async () => {
    return apiRequest('/notifications/mark-all-read', {
      method: 'PUT'
    });
  },
  deleteNotification: async (notificationId) => {
    return apiRequest(`/notifications/${notificationId}`, {
      method: 'DELETE'
    });
  }
};


const apiExports = {
  authAPI,
  jobsAPI,
  bookingsAPI,
  proposalsAPI,
  applicationsAPI,
  paymentsAPI,
  messagesAPI,
  chatAPI,
  reviewsAPI,
  usersAPI,
  adminAPI,
  uploadAPI,
  notificationsAPI,
  portfoliosAPI,
  walletAPI,
  transactionAPI,
  notificationAPI,
  blogsAPI
};

export default apiExports; 
