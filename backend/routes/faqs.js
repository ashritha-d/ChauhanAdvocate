const router = require('express').Router();
const { getFAQs, getAllFAQs, createFAQ, updateFAQ, deleteFAQ } = require('../controllers/faqController');
const { protect } = require('../middleware/auth');

router.get('/', getFAQs);
router.get('/admin/all', protect, getAllFAQs);
router.post('/', protect, createFAQ);
router.put('/:id', protect, updateFAQ);
router.delete('/:id', protect, deleteFAQ);

module.exports = router;
