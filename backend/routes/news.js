const router = require('express').Router();
const c = require('../controllers/newsController');
const { protect } = require('../middleware/auth');

// Public
router.get('/active', c.getActiveNews);
router.get('/page',   c.getNewsPage);

// Admin
router.get('/',       protect, c.getAllNews);
router.post('/',      protect, c.createNews);
router.put('/:id',    protect, c.updateNews);
router.delete('/:id', protect, c.deleteNews);

module.exports = router;
