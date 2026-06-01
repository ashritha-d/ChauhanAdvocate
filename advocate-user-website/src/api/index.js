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
export const getMagazines = () => api.get('/magazines');
export const getDrafts = () => api.get('/drafts');
export const getBooks = () => api.get('/books');
export const bookAppointment = (data, headers = {}) => api.post('/appointments', data, { headers });
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

// ── Jr Advocate Applications ──────────────────────────────────────────────────
export const submitJrAdvocateApplication = (formData) => api.post('/jr-advocates', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getMyApplications = (headers) => api.get('/jr-advocates/my-applications', { headers });
