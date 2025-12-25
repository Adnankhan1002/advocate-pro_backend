const Article = require('../models/Article');

// @desc    Get all articles
// @route   GET /api/articles
// @access  Private
exports.getAllArticles = async (req, res) => {
  try {
    const articles = await Article.find({})
    .select('article_number title simplified_explanation part')
    .sort({ article_number: 1 });

    res.status(200).json({
      success: true,
      count: articles.length,
      data: articles
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching articles',
      error: error.message
    });
  }
};

// @desc    Get article by article number
// @route   GET /api/articles/:articleNo
// @access  Private
exports.getArticleByNumber = async (req, res) => {
  try {
    const { articleNo } = req.params;

    const article = await Article.findOne({ 
      article_number: articleNo
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        message: `Article ${articleNo} not found`
      });
    }

    res.status(200).json({
      success: true,
      data: article
    });
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching article',
      error: error.message
    });
  }
};

// @desc    Search articles
// @route   GET /api/articles/search?q=searchTerm
// @access  Private
exports.searchArticles = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const articles = await Article.find({
      $or: [
        { article_number: { $regex: q, $options: 'i' } },
        { title: { $regex: q, $options: 'i' } },
        { simplified_explanation: { $regex: q, $options: 'i' } },
        { original_text: { $regex: q, $options: 'i' } },
        { keywords: { $regex: q, $options: 'i' } }
      ]
    })
    .select('article_number title simplified_explanation part')
    .sort({ article_number: 1 })
    .limit(20);

    res.status(200).json({
      success: true,
      count: articles.length,
      data: articles
    });
  } catch (error) {
    console.error('Error searching articles:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching articles',
      error: error.message
    });
  }
};

// @desc    Create a new article
// @route   POST /api/articles
// @access  Private (Admin only)
exports.createArticle = async (req, res) => {
  try {
    const { articleNo, title, content, description, category } = req.body;

    // Check if article already exists
    const existingArticle = await Article.findOne({
      tenantId: req.user.tenantId,
      articleNo: articleNo
    });

    if (existingArticle) {
      return res.status(400).json({
        success: false,
        message: `Article ${articleNo} already exists`
      });
    }

    const article = await Article.create({
      tenantId: req.user.tenantId,
      articleNo,
      title,
      content,
      description,
      category,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: article
    });
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating article',
      error: error.message
    });
  }
};

// @desc    Update article
// @route   PUT /api/articles/:id
// @access  Private (Admin only)
exports.updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const { articleNo, title, content, description, category, isActive } = req.body;

    const article = await Article.findOne({
      _id: id,
      tenantId: req.user.tenantId
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    // Update fields
    if (articleNo !== undefined) article.articleNo = articleNo;
    if (title !== undefined) article.title = title;
    if (content !== undefined) article.content = content;
    if (description !== undefined) article.description = description;
    if (category !== undefined) article.category = category;
    if (isActive !== undefined) article.isActive = isActive;
    article.updatedBy = req.user._id;

    await article.save();

    res.status(200).json({
      success: true,
      data: article
    });
  } catch (error) {
    console.error('Error updating article:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating article',
      error: error.message
    });
  }
};

// @desc    Delete article
// @route   DELETE /api/articles/:id
// @access  Private (Admin only)
exports.deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;

    const article = await Article.findOneAndDelete({
      _id: id,
      tenantId: req.user.tenantId
    });

    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Article deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting article:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting article',
      error: error.message
    });
  }
};

// @desc    Get articles by category
// @route   GET /api/articles/category/:category
// @access  Private
exports.getArticlesByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const articles = await Article.find({
      category: category
    })
    .select('articleNo title description')
    .sort({ articleNo: 1 });

    res.status(200).json({
      success: true,
      count: articles.length,
      data: articles
    });
  } catch (error) {
    console.error('Error fetching articles by category:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching articles by category',
      error: error.message
    });
  }
};
