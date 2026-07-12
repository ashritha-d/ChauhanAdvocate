import api from './axios';

export const getSiteSettings = () => api.get('/site-settings');
export const getServices = () => api.get('/services');
export const getTestimonials = () => api.get('/testimonials');
export const getBlogs = (page = 1, limit = 6) => api.get(`/blogs?page=${page}&limit=${limit}`);
export const getBlogById = (id) => api.get(`/blogs/${id}`);
export const getFAQs = () => api.get('/faqs');
export const getHeroBanners = () => api.get('/hero-banners');
export const getYouTubeVideos = () => api.get('/youtube-videos');
export const getFacebookPosts = () => api.get('/facebook-posts');
export const getMagazines = (params = {}) => api.get('/magazines', { params });
export const checkMagazinePurchase          = (id, headers = {}) => api.get(`/magazines/${id}/purchase/status`, { headers });
export const submitMagazineManualPayment    = (id, formData, headers = {}) => api.post(`/magazines/${id}/purchase/manual`, formData, { headers });
export const createMagazineRazorpayOrder    = (id, headers = {}) => api.post(`/magazines/${id}/purchase/razorpay/create-order`, {}, { headers });
export const verifyMagazineRazorpayPayment  = (id, data, headers = {}) => api.post(`/magazines/${id}/purchase/razorpay/verify`, data, { headers });
export const downloadMagazineFull           = (id, headers = {}) => api.get(`/magazines/${id}/download/full`, { headers });
export const downloadMagazinePreview        = (id) => api.get(`/magazines/${id}/download/preview`);
export const getMyMagazinePurchases         = (headers = {}) => api.get('/magazines/my-purchases', { headers });
export const getDrafts = () => api.get('/drafts');
export const getBooks = () => api.get('/books');
export const bookAppointment = (data, headers = {}) => api.post('/appointments', data, { headers });
export const getAvailableSlots = (date) => api.get(`/appointments/available-slots?date=${date}`);
export const sendContact = (data) => api.post('/contacts', data);

// ── User Auth ─────────────────────────────────────────────────────────────────
export const userRegister = (data) => api.post('/users/register', data);
export const userLogin = (data) => api.post('/users/login', data);
export const userForgotPassword = (data) => api.post('/users/forgot-password', data);
export const userVerifyOTP = (data) => api.post('/users/verify-otp', data);
export const userResetPassword = (data) => api.post('/users/reset-password', data);

export const getUserProfile = (headers) => api.get('/users/profile', { headers });
export const updateUserProfile = (data, headers) => api.put('/users/profile', data, { headers });
export const changeUserPassword = (data, headers) => api.put('/users/change-password', data, { headers });
export const uploadUserPhoto = (formData, headers) => api.post('/users/upload-photo', formData, { headers: { ...headers, 'Content-Type': 'multipart/form-data' } });

export const getMyAppointments = (headers) => api.get('/users/my-appointments', { headers });
export const getMyOrders = (headers) => api.get('/users/my-orders', { headers });

export const getNotifications = (headers) => api.get('/users/notifications', { headers });
export const markNotificationRead = (id, headers) => api.put(`/users/notifications/${id}/read`, {}, { headers });
export const markAllNotificationsRead = (headers) => api.put('/users/notifications/mark-all-read', {}, { headers });

// ── Payments ──────────────────────────────────────────────────────────────────
export const getPaymentSettings = () => api.get('/payments/payment-settings');
export const submitManualPayment = (formData, headers = {}) => api.post('/payments/manual', formData, { headers });
export const submitBookManualPayment = (formData, headers = {}) => api.post('/payments/book-manual', formData, { headers });

// ── Jr Advocate Applications ──────────────────────────────────────────────────
export const submitJrAdvocateApplication = (formData) => api.post('/jr-advocates', formData);
export const getMyApplications = (headers) => api.get('/jr-advocates/my-applications', { headers });

// ── News ──────────────────────────────────────────────────────────────────────
export const getActiveNews = (limit = 0) => api.get(`/news/active${limit ? `?limit=${limit}` : ''}`);
export const getNewsPage   = (page = 1, limit = 9, search = '', from = '', to = '') => {
  const params = new URLSearchParams({ page, limit });
  if (search) params.set('search', search);
  if (from)   params.set('from', from);
  if (to)     params.set('to', to);
  return api.get(`/news/page?${params}`);
};

// ── Courses / LMS ─────────────────────────────────────────────────────────────
export const getPublicCourses = () => api.get('/courses/public');
export const getPublicCourse = (id, headers = {}) => api.get(`/courses/public/${id}`, { headers });
export const enrollCourse = (data, headers) => api.post('/courses/enroll', data, { headers });
export const getMyEnrollments = (headers) => api.get('/courses/my-enrollments', { headers });
export const updateCourseProgress = (data, headers) => api.post('/courses/progress', data, { headers });

// ── Internship Programme ────────────────────────────────────────────────────
export const submitInternshipApplication = (formData) => api.post('/internships', formData);
export const getMyInternships = (headers) => api.get('/internships/my-applications', { headers });

// ── Draft Purchases ────────────────────────────────────────────────────────
export const purchaseDraft = (draftId, formData, headers = {}) => api.post(`/draft-purchases/${draftId}`, formData, { headers });
export const checkDraftPurchase = (draftId, headers = {}) => api.get(`/draft-purchases/check/${draftId}`, { headers });
export const getMyDraftPurchases = (headers = {}) => api.get('/draft-purchases/my', { headers });

// ── Live Sessions ────────────────────────────────────────────────────────────
export const getLiveStatus          = ()                  => api.get('/live/current');
export const getUpcomingSessions    = ()                  => api.get('/live/upcoming');
export const getPastSessions        = ()                  => api.get('/live/past');
export const getLiveSessions        = (headers)           => api.get('/live', { headers });
export const createLiveSession      = (data, headers)     => api.post('/live', data, { headers });
export const updateLiveSession      = (id, data, headers) => api.put(`/live/${id}`, data, { headers });
export const deleteLiveSession      = (id, headers)       => api.delete(`/live/${id}`, { headers });
export const addLiveAnnouncement    = (id, text, headers) => api.post(`/live/${id}/announcements`, { text }, { headers });
export const deleteLiveAnnouncement = (id, annId, headers) => api.delete(`/live/${id}/announcements/${annId}`, { headers });
