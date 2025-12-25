const express = require('express');
const router = express.Router();
const {
  getAllArticles,
  getArticleByNumber,
  searchArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  getArticlesByCategory
} = require('../controllers/articleController');
const { authMiddleware, tenantMiddleware } = require('../middleware/auth');

// All routes require authentication and tenant middleware
router.use(authMiddleware);
router.use(tenantMiddleware);

// Search articles
router.get('/search', searchArticles);

// Get articles by category
router.get('/category/:category', getArticlesByCategory);

// Get all articles
router.get('/', getAllArticles);

// Get article by article number
router.get('/:articleNo', getArticleByNumber);

// Create article (admin only - add admin middleware if needed)
router.post('/', createArticle);

// Update article (admin only - add admin middleware if needed)
router.put('/:id', updateArticle);

// Delete article (admin only - add admin middleware if needed)
router.delete('/:id', deleteArticle);

module.exports = router;
