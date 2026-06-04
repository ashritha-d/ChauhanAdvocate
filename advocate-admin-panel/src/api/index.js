import api from './axios';

// Auth
export const login = (data) => api.post('/auth/login', data);
export const getMe = () => api.get('/auth/me');
export const changePassword = (data) => api.put('/auth/change-password', data);
export const updateProfile = (data) => api.put('/auth/profile', data);

// Services
export const getServices = () => api.get('/services');
export const createService = (data) => api.post('/services', data);
export const updateService = (id, data) => api.put(`/services/${id}`, data);
export const deleteService = (id) => api.delete(`/services/${id}`);

// Blogs
export const getBlogs = (p = 1, l = 10) => api.get(`/blogs/admin/all?page=${p}&limit=${l}`);
export const createBlog = (data) => api.post('/blogs', data);
export const updateBlog = (id, data) => api.put(`/blogs/${id}`, data);
export const deleteBlog = (id) => api.delete(`/blogs/${id}`);

// Testimonials
export const getTestimonials = () => api.get('/testimonials/admin/all');
export const createTestimonial = (data) => api.post('/testimonials', data);
export const updateTestimonial = (id, data) => api.put(`/testimonials/${id}`, data);
export const deleteTestimonial = (id) => api.delete(`/testimonials/${id}`);

// FAQs
export const getFAQs = () => api.get('/faqs/admin/all');
export const createFAQ = (data) => api.post('/faqs', data);
export const updateFAQ = (id, data) => api.put(`/faqs/${id}`, data);
export const deleteFAQ = (id) => api.delete(`/faqs/${id}`);

// Appointments
export const getAppointments = (p = 1, l = 10, status = '') => api.get(`/appointments?page=${p}&limit=${l}${status ? `&status=${status}` : ''}`);
export const updateAppointment = (id, data) => api.put(`/appointments/${id}`, data);
export const deleteAppointment = (id) => api.delete(`/appointments/${id}`);

// Contacts
export const getContacts = (p = 1, l = 10) => api.get(`/contacts?page=${p}&limit=${l}`);
export const updateContact = (id, data) => api.put(`/contacts/${id}`, data);
export const deleteContact = (id) => api.delete(`/contacts/${id}`);

// Site Settings
export const getSiteSettings = () => api.get('/site-settings');
export const updateSiteSettings = (data) => api.put('/site-settings', data);
export const seedSiteSettings = () => api.get('/site-settings/seed');

// Hero Banners
export const getHeroBanners = () => api.get('/hero-banners/admin');
export const createHeroBanner = (data) => api.post('/hero-banners', data);
export const updateHeroBanner = (id, data) => api.put(`/hero-banners/${id}`, data);
export const deleteHeroBanner = (id) => api.delete(`/hero-banners/${id}`);

// YouTube Videos
export const getYouTubeVideos = () => api.get('/youtube-videos/admin');
export const createYouTubeVideo = (data) => api.post('/youtube-videos', data);
export const updateYouTubeVideo = (id, data) => api.put(`/youtube-videos/${id}`, data);
export const deleteYouTubeVideo = (id) => api.delete(`/youtube-videos/${id}`);

// Orders
export const getOrders = (p = 1, l = 10, status = '') => api.get(`/orders?page=${p}&limit=${l}${status ? `&status=${status}` : ''}`);
export const updateOrder = (id, data) => api.put(`/orders/${id}`, data);
export const deleteOrder = (id) => api.delete(`/orders/${id}`);

// Jr. Advocates
export const getJrAdvocates = (p = 1, l = 10, status = '') => api.get(`/jr-advocates?page=${p}&limit=${l}${status ? `&status=${status}` : ''}`);
export const updateJrAdvocate = (id, data) => api.put(`/jr-advocates/${id}`, data);
export const deleteJrAdvocate = (id) => api.delete(`/jr-advocates/${id}`);

// Book Orders
export const getBookOrders = (p = 1, l = 10, status = '') => api.get(`/book-orders?page=${p}&limit=${l}${status ? `&status=${status}` : ''}`);
export const updateBookOrder = (id, data) => api.put(`/book-orders/${id}`, data);
export const deleteBookOrder = (id) => api.delete(`/book-orders/${id}`);

// Payments
export const getPayments = (p = 1, l = 200, status = '') => api.get(`/payments?page=${p}&limit=${l}${status ? `&status=${status}` : ''}`);
export const getPayment = (id) => api.get(`/payments/${id}`);
export const updatePayment = (id, data) => api.put(`/payments/${id}`, data);
export const deletePayment = (id) => api.delete(`/payments/${id}`);
export const getPaymentStats = () => api.get('/payments/stats');
export const getPaymentRevenue = (from, to) => api.get(`/payments/revenue${from || to ? `?${from?`from=${from}`:''}${from&&to?'&':''}${to?`to=${to}`:''}` : ''}`);
export const exportPaymentsCsv = (status = '') => api.get(`/payments/export${status ? `?status=${status}` : ''}`, { responseType: 'blob' });

// Notifications
export const getNotificationCounts = () => api.get('/notifications/counts');

// News
export const getNews        = ()           => api.get('/news');
export const createNews     = (data)       => api.post('/news', data);
export const updateNews     = (id, data)   => api.put(`/news/${id}`, data);
export const deleteNews     = (id)         => api.delete(`/news/${id}`);

// Upload
export const uploadFile = (formData) => api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
