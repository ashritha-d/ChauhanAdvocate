import api from './axios';

export const getSiteSettings = () => api.get('/site-settings');
export const getServices = () => api.get('/services');
export const getTestimonials = () => api.get('/testimonials');
export const getBlogs = (page = 1, limit = 6) => api.get(`/blogs?page=${page}&limit=${limit}`);
export const getBlogById = (id) => api.get(`/blogs/${id}`);
export const getFAQs = () => api.get('/faqs');
export const getHeroBanners = () => api.get('/hero-banners');
export const bookAppointment = (data) => api.post('/appointments', data);
export const sendContact = (data) => api.post('/contacts', data);
