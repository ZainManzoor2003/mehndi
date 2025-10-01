import React, { useEffect, useState } from 'react';
import AdminSidebar from './AdminSidebar';
import { adminAPI } from '../services/api';

const ManageBlogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', imageUrl: '' });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.listBlogs();
      setBlogs(res.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const uploadToCloudinary = async (file, resourceType = 'image') => {
    const url = `https://api.cloudinary.com/v1_1/dfoetpdk9/${resourceType}/upload`;
    const fd = new FormData();
    fd.append('file', file);
    // IMPORTANT: replace with your actual unsigned preset name created in Cloudinary settings
    fd.append('upload_preset', 'mehndi');
    const res = await fetch(url, { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Upload failed');
    return data.secure_url || data.url;
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setUploading(true);
      let imageUrl = form.imageUrl;
      
      // Upload image to Cloudinary if a new file is selected
      if (imageFile) {
        imageUrl = await uploadToCloudinary(imageFile, 'image');
      }

      const blogData = {
        title: form.title,
        description: form.description,
        imageUrl: imageUrl
      };

      if (editingId) {
        await adminAPI.updateBlog(editingId, blogData);
        setEditingId(null);
      } else {
        await adminAPI.createBlog(blogData);
      }
      
      setForm({ title: '', description: '', imageUrl: '' });
      setImageFile(null);
      setImagePreview('');
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (b) => {
    setEditingId(b._id);
    setForm({ title: b.title, description: b.description, imageUrl: b.imageUrl || '' });
    setImageFile(null);
    setImagePreview(b.imageUrl || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (blogId) => {
    if (!window.confirm('Delete this blog?')) return;
    await adminAPI.deleteBlog(blogId);
    await load();
  };

  return (
    <div className="dashboard-layout">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="dashboard-main-content">
        <button
          className="sidebar-toggle-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="dashboard-container">
          <div className="dashboard-content">
            <div className="bookings-header">
              <h2 className="bookings-title">Manage Blogs</h2>
              <p className="bookings-subtitle">Create and manage blog posts</p>
            </div>

            {/* Blog Stats Cards */}
            {!loading && (
              <div className="booking-stats">
                <div className="stat-card">
                  <div className="stat-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                    </svg>
                  </div>
                  <div className="stat-info">
                    <h3>Total Blogs</h3>
                    <span className="stat-number">{blogs.length}</span>
                  </div>
                </div>
              </div>
            )}

            {error && <p className="error">{error}</p>}

            <form onSubmit={handleSubmit} className="blog-form">
              <input
                type="text"
                className="form-input"
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              
              {/* Image Upload Section */}
              <div className="image-upload-section" style={{ marginBottom: '1rem' }}>
                <label htmlFor="blog-image-upload" className="upload-label" style={{ 
                  display: 'block',
                  padding: '20px',
                  border: '2px dashed #d4a574',
                  borderRadius: '8px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: '#faf8f5',
                  transition: 'all 0.3s ease'
                }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d4a574" strokeWidth="2" style={{ margin: '0 auto 10px' }}>
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <p style={{ margin: '0', color: '#d4a574', fontWeight: '600' }}>
                    Click to upload blog image
                  </p>
                  <small style={{ color: '#888' }}>PNG, JPG, WEBP up to 10MB</small>
                </label>
                <input
                  type="file"
                  id="blog-image-upload"
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />
                
                {/* Image Preview */}
                {imagePreview && (
                  <div style={{ marginTop: '15px', position: 'relative' }}>
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      style={{ 
                        width: '100%', 
                        maxHeight: '200px', 
                        objectFit: 'cover', 
                        borderRadius: '8px',
                        border: '2px solid #d4a574'
                      }} 
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview('');
                        setForm({ ...form, imageUrl: '' });
                      }}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '30px',
                        height: '30px',
                        cursor: 'pointer',
                        fontSize: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              <textarea
                className="form-textarea"
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4}
                required
              />
              <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={uploading}>
                  {uploading ? 'Uploading...' : editingId ? 'Update Blog' : 'Create Blog'}
                </button>
                {editingId && (
                  <button type="button" className="btn btn-light" onClick={() => { 
                    setEditingId(null); 
                    setForm({ title:'', description:'', imageUrl:'' }); 
                    setImageFile(null);
                    setImagePreview('');
                  }}>Cancel</button>
                )}
              </div>
            </form>

            {loading ? (
              <p>Loading...</p>
            ) : (
              <div className="blogs-grid">
                {blogs.map(b => (
                  <div className="blog-card" key={b._id}>
                    {b.imageUrl && (
                      <div style={{ marginBottom: '.5rem' }}>
                        <img src={b.imageUrl} alt={b.title} style={{ width: '100%', borderRadius: '8px', maxHeight: '180px', objectFit: 'cover' }} />
                      </div>
                    )}
                    <h3 className="blog-title">{b.title}</h3>
                    <p className="blog-desc">{b.description}</p>
                    <div className="blog-actions">
                      <button className="btn btn-outline" onClick={() => handleEdit(b)}>Edit</button>
                      <button className="btn danger" onClick={() => handleDelete(b._id)}>Delete</button>
                    </div>
                  </div>
                ))}
                {!blogs.length && <p>No blogs yet.</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageBlogs;


