const router = require('express').Router();
const { getBlogs, getAllBlogs, getBlog, getBlogAdmin, createBlog, updateBlog, deleteBlog } = require('../controllers/blogController');
const { protect } = require('../middleware/auth');

router.get('/', getBlogs);
router.get('/admin/all', protect, getAllBlogs);
router.get('/admin/:id', protect, getBlogAdmin);
router.get('/:id', getBlog);
router.post('/', protect, createBlog);
router.put('/:id', protect, updateBlog);
router.delete('/:id', protect, deleteBlog);

module.exports = router;
