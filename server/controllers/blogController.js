const Blog = require('../schemas/Blog');

// GET /api/blogs
const listBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: blogs });
  } catch (error) {
    console.error('List blogs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch blogs' });
  }
};

// GET /api/blogs/:id
const getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });
    res.status(200).json({ success: true, data: blog });
  } catch (error) {
    console.error('Get blog error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch blog' });
  }
};

module.exports = { listBlogs, getBlogById };


