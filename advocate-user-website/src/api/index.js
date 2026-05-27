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
export const bookAppointment = (data) => api.post('/appointments', data);
export const sendContact = (data) => api.post('/contacts', data);
