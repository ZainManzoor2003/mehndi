import React, { useEffect, useRef, useState } from "react";
import { adminAPI } from "../services/api";
import "./admin-styles.css";
import AdminSidebar from "./AdminSidebar";
import ConfirmActionModal from "./modals/ConfirmActionModal";

const ManageBlogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    imageUrl: "",
    minutesToRead: "",
    category: "",
  });
  const [sections, setSections] = useState([]);
  const sectionEndRef = useRef(null);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

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

  useEffect(() => {
    load();
  }, []);

  const uploadToCloudinary = async (file, resourceType = "image") => {
    const url = `https://api.cloudinary.com/v1_1/dfoetpdk9/${resourceType}/upload`;
    const fd = new FormData();
    fd.append("file", file);
    // IMPORTANT: replace with your actual unsigned preset name created in Cloudinary settings
    fd.append("upload_preset", "mehndi");
    const res = await fetch(url, { method: "POST", body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Upload failed");
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
      // Frontend validations
      const minutesInt = Number(String(form.minutesToRead || "").trim());
      if (
        !form.title.trim() ||
        !form.description.trim() ||
        !minutesInt ||
        minutesInt < 1 ||
        !Number.isInteger(minutesInt)
      ) {
        setError(
          "Please fill Title, Description and valid Minutes to read (integer > 0)."
        );
        setUploading(false);
        return;
      }
      if (!form.category) {
        setError("Please select a category.");
        setUploading(false);
        return;
      }
      const hasImage = !!(imageFile || imagePreview || form.imageUrl);
      if (!hasImage) {
        setError("Please upload a blog image.");
        setUploading(false);
        return;
      }
      let imageUrl = form.imageUrl;

      // Upload image to Cloudinary if a new file is selected
      if (imageFile) {
        imageUrl = await uploadToCloudinary(imageFile, "image");
      }

      // Upload section images if any File objects present
      const preparedSections = [];
      for (const s of sections) {
        let secImage = s.imageUrl;
        if (s._file instanceof File) {
          secImage = await uploadToCloudinary(s._file, "image");
        }
        preparedSections.push({
          subtitle: s.subtitle || "",
          description: s.description || "",
          imageUrl: secImage || "",
          quote: s.quote || "",
        });
      }

      const minutes = String(form.minutesToRead || "").trim();
      const blogData = {
        title: form.title,
        description: form.description,
        imageUrl: imageUrl,
        minutesToRead: Number(minutes),
        category: form.category,
        sections: preparedSections,
      };

      if (editingId) {
        await adminAPI.updateBlog(editingId, blogData);
        setEditingId(null);
      } else {
        await adminAPI.createBlog(blogData);
      }

      setForm({
        title: "",
        description: "",
        imageUrl: "",
        minutesToRead: "",
        category: "",
      });
      setImageFile(null);
      setImagePreview("");
      setSections([]);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (b) => {
    setEditingId(b._id);
    setForm({
      title: b.title,
      description: b.description,
      imageUrl: b.imageUrl || "",
      minutesToRead: b.minutesToRead || "",
      category: b.category || "",
    });
    setImageFile(null);
    setImagePreview(b.imageUrl || "");
    setSections(
      Array.isArray(b.sections)
        ? b.sections.map((s) => ({
            subtitle: s.subtitle || "",
            description: s.description || "",
            imageUrl: s.imageUrl || "",
            quote: s.quote || "",
          }))
        : []
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;
    await adminAPI.deleteBlog(deleteTargetId);
    setDeleteTargetId(null);
    setDeleteModalOpen(false);
    await load();
  };

  const openDeleteModal = (blogId) => {
    setDeleteTargetId(blogId);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setDeleteTargetId(null);
  };

  return (
    <div className="admin_dashboard-layout">
      <ConfirmActionModal
        isOpen={deleteModalOpen}
        title="Delete this blog?"
        message="This will permanently remove this blog post from your site. This action cannot be undone."
        confirmLabel="Delete blog"
        cancelLabel="Keep blog"
        onConfirm={handleDelete}
        onCancel={closeDeleteModal}
      />
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="admin_dashboard-main-content">
        <button
          className="sidebar-toggle-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="admin_dashboard-container">
          <div className="admin_dashboard-content">
            <div className="admin_bookings-header">
              <h2 className="admin_bookings-title">Manage Blogs</h2>
              <p className="admin_bookings-subtitle">
                Create and manage blog posts
              </p>
            </div>

            {/* Blog Stats Cards */}
            {!loading && (
              <div className="admin_booking-stats">
                <div className="admin_stat-card">
                  <div className="admin_stat-icon">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </div>
                  <div className="admin_stat-info">
                    <h3>Total Blogs</h3>
                    <span className="admin_stat-number">{blogs.length}</span>
                  </div>
                </div>
              </div>
            )}

            {error && <p className="admin_error">{error}</p>}

            <form onSubmit={handleSubmit} className="admin_blog-form">
              <input
                type="text"
                className="admin_form-input"
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
              {/* Minutes to read */}
              <input
                type="number"
                className="admin_form-input"
                placeholder="Minutes to read "
                value={form.minutesToRead}
                min={1}
                step={1}
                onChange={(e) => {
                  const v = e.target.value;
                  // allow empty for optional, else only positive integers
                  if (v === "" || (/^\d+$/.test(v) && Number(v) > 0))
                    setForm({ ...form, minutesToRead: v });
                }}
              />

              {/* Category */}
              <select
                className="admin_form-input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  border: "1px solid #e5e7eb",
                  fontSize: "1rem",
                  backgroundColor: "#fff",
                  color: "#1f2937",
                }}
              >
                <option value="">Select Category</option>
                <option value="Client Tips">Client Tips</option>
                <option value="Artist Tips">Artist Tips</option>
                <option value="Success Stories">Success Stories</option>
                <option value="Platform Updates">Platform Updates</option>
              </select>

              {/* Image Upload Section */}
              <div
                className="image-upload-section"
                style={{ marginBottom: "1rem" }}
              >
                <label
                  htmlFor="blog-image-upload"
                  className="admin_upload-label"
                  style={{
                    display: "block",
                    padding: "20px",
                    border: "2px dashed #eab308",
                    borderRadius: "8px",
                    textAlign: "center",
                    cursor: "pointer",
                    backgroundColor: "#f8fafc",
                    transition: "all 0.3s ease",
                  }}
                >
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#eab308"
                    strokeWidth="2"
                    style={{ margin: "0 auto 10px" }}
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <p
                    style={{ margin: "0", color: "#eab308", fontWeight: "600" }}
                  >
                    Click to upload blog image
                  </p>
                  <small style={{ color: "#6b7280" }}>
                    PNG, JPG, WEBP up to 10MB
                  </small>
                </label>
                <input
                  type="file"
                  id="blog-image-upload"
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: "none" }}
                />

                {/* Image Preview */}
                {imagePreview && (
                  <div style={{ marginTop: "15px", position: "relative" }}>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{
                        width: "100%",
                        maxHeight: "200px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        border: "2px solid #eab308",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview("");
                        setForm({ ...form, imageUrl: "" });
                      }}
                      style={{
                        position: "absolute",
                        top: "10px",
                        right: "10px",
                        background: "#e74c3c",
                        color: "white",
                        border: "none",
                        borderRadius: "50%",
                        width: "30px",
                        height: "30px",
                        cursor: "pointer",
                        fontSize: "18px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              <textarea
                className="admin_form-textarea"
                placeholder="Description"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={4}
                required
              />

              {/* Dynamic Sections */}
              <div style={{ marginTop: "1rem" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: ".5rem",
                  }}
                >
                  <h4 style={{ margin: 0 }}>Sections</h4>
                </div>
                {sections.map((s, idx) => (
                  <div
                    key={idx}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 8,
                      padding: "12px",
                      marginBottom: "10px",
                      background: "#ffffff",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 8,
                      }}
                    >
                      <strong style={{ color: "#0f172a" }}>
                        {s.subtitle?.trim() || `Section ${idx + 1}`}
                      </strong>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          type="button"
                          className="admin_btn admin_btn-outline"
                          onClick={() => {
                            const n = [...sections];
                            n[idx] = {
                              ...n[idx],
                              collapsed: !n[idx]?.collapsed,
                            };
                            setSections(n);
                          }}
                        >
                          {s.collapsed ? "Expand" : "Collapse"}
                        </button>
                        <button
                          type="button"
                          className="admin_btn admin_btn-light"
                          onClick={() => {
                            const n = [...sections];
                            n.splice(idx, 1);
                            setSections(n);
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    {!s.collapsed && (
                      <div style={{ display: "grid", gap: "10px" }}>
                        <input
                          type="text"
                          className="admin_form-input"
                          placeholder="Section subtitle (required)"
                          value={s.subtitle}
                          onChange={(e) => {
                            const n = [...sections];
                            n[idx] = { ...n[idx], subtitle: e.target.value };
                            setSections(n);
                          }}
                          required
                        />
                        <textarea
                          className="admin_form-textarea"
                          placeholder="Section description (required)"
                          value={s.description}
                          rows={3}
                          onChange={(e) => {
                            const n = [...sections];
                            n[idx] = { ...n[idx], description: e.target.value };
                            setSections(n);
                          }}
                          required
                        />
                        <input
                          type="text"
                          className="admin_form-input"
                          placeholder="Section quote (optional)"
                          value={s.quote || ""}
                          onChange={(e) => {
                            const n = [...sections];
                            n[idx] = { ...n[idx], quote: e.target.value };
                            setSections(n);
                          }}
                        />
                        <div>
                          <label
                            className="admin_upload-label"
                            style={{
                              display: "inline-block",
                              padding: "10px",
                              border: "1px dashed #eab308",
                              borderRadius: 8,
                              cursor: "pointer",
                            }}
                          >
                            Upload section image
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: "none" }}
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  const n = [...sections];
                                  n[idx] = {
                                    ...n[idx],
                                    imageUrl: reader.result,
                                    _file: file,
                                  };
                                  setSections(n);
                                };
                                reader.readAsDataURL(file);
                              }}
                            />
                          </label>
                          {s.imageUrl && (
                            <div style={{ marginTop: 8 }}>
                              <img
                                src={s.imageUrl}
                                alt="Section"
                                style={{
                                  maxWidth: "100%",
                                  maxHeight: 180,
                                  borderRadius: 8,
                                  border: "2px solid #eab308",
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={sectionEndRef} />
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: 12,
                  }}
                >
                  <button
                    type="button"
                    className="admin_btn admin_btn-outline"
                    onClick={() => {
                      setSections([
                        ...sections,
                        {
                          subtitle: "",
                          description: "",
                          imageUrl: "",
                          quote: "",
                          collapsed: false,
                        },
                      ]);
                      setTimeout(() => {
                        try {
                          sectionEndRef.current?.scrollIntoView({
                            behavior: "smooth",
                            block: "end",
                          });
                        } catch {}
                      }, 0);
                    }}
                  >
                    Add Section
                  </button>
                </div>
              </div>
              <div className="admin_form-actions">
                <button
                  type="submit"
                  className="admin_btn admin_btn-primary"
                  disabled={uploading}
                  style={{
                    padding: "0.75rem 1.5rem",
                    fontSize: "1rem",
                  }}
                >
                  {uploading
                    ? "Uploading..."
                    : editingId
                    ? "Update Blog"
                    : "Create Blog"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    className="admin_btn admin_btn-light"
                    onClick={() => {
                      setEditingId(null);
                      setForm({
                        title: "",
                        description: "",
                        imageUrl: "",
                        minutesToRead: "",
                        category: "",
                      });
                      setImageFile(null);
                      setImagePreview("");
                      setSections([]);
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {loading ? (
              <p>Loading...</p>
            ) : (
              <div className="admin_blogs-grid">
                {blogs.map((b) => (
                  <div className="admin_blog-card" key={b._id}>
                    {b.imageUrl && (
                      <div style={{ marginBottom: ".5rem" }}>
                        <img
                          src={b.imageUrl}
                          alt={b.title}
                          style={{
                            width: "100%",
                            borderRadius: "8px",
                            maxHeight: "180px",
                            objectFit: "cover",
                          }}
                        />
                      </div>
                    )}
                    <h3 className="admin_blog-title">{b.title}</h3>
                    <p
                      className="admin_blog-desc"
                      style={{
                        margin: 0,
                        color: "#0f172a",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {b.description}
                    </p>
                    <div
                      className="admin_blog-actions"
                      style={{
                        display: "flex",
                        gap: "10px",
                        marginTop: ".6rem",
                      }}
                    >
                      <button
                        className="admin_btn admin_btn-outline"
                        onClick={() => handleEdit(b)}
                      >
                        Edit
                      </button>
                      <button
                        className="admin_btn danger"
                        onClick={() => openDeleteModal(b._id)}
                      >
                        Delete
                      </button>
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
