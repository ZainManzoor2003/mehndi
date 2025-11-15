import React, { useEffect, useState } from "react";
import {
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaLock,
  FaSave,
  FaUser,
} from "react-icons/fa";
import { authAPI } from "../services/api";
import "./admin-styles.css";
import AdminSidebar from "./AdminSidebar";

const AdminUpdateProfile = () => {
  const [isEditing, setIsEditing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await authAPI.getProfile();
        const u = res.data.user;
        setForm((f) => ({
          ...f,
          firstName: u.firstName || "",
          lastName: u.lastName || "",
          email: u.email || "",
        }));
      } catch {}
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);
    try {
      if (form.newPassword && form.newPassword.length < 6) {
        setError("New password must be at least 6 characters");
        setIsLoading(false);
        return;
      }
      if (form.newPassword && form.newPassword !== form.confirmPassword) {
        setError("New password and confirm password do not match");
        setIsLoading(false);
        return;
      }
      const { currentPassword, newPassword, confirmPassword, ...rest } = form;
      const payload = { ...rest };
      if (currentPassword && newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }
      const res = await authAPI.updateProfile(payload);
      if (res.success) {
        setSuccess("Profile updated successfully");
        setForm((f) => ({
          ...f,
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        }));
      } else {
        setError(res.message || "Failed to update profile");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin_dashboard-layout">
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
            <div
              className="admin_profile-header"
              style={{ marginBottom: "1rem" }}
            >
              <div className="profile-main">
                <div className="profile-info">
                  <h2 className="admin_profile-name">
                    {form.firstName} {form.lastName}
                  </h2>
                  <p className="admin_profile-role">Admin Account</p>
                  <p className="admin_profile-email">{form.email}</p>
                </div>
              </div>
            </div>

            {error && <div className="admin_alert-message error">{error}</div>}
            {success && (
              <div className="admin_alert-message success">{success}</div>
            )}

            <form className="admin_profile-form" onSubmit={handleSubmit}>
              <div className="admin_form-section">
                <h3 className="admin_form-section-title">
                  <FaUser className="section-icon" /> Profile Information
                </h3>
                <div className="form-grid">
                  <div className="admin_form-group">
                    <label className="admin_form-label">First Name</label>
                    <input
                      className="admin_form-input"
                      type="text"
                      value={form.firstName}
                      onChange={(e) =>
                        setForm({ ...form, firstName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="admin_form-group">
                    <label className="admin_form-label">Last Name</label>
                    <input
                      className="admin_form-input"
                      type="text"
                      value={form.lastName}
                      onChange={(e) =>
                        setForm({ ...form, lastName: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="form-group full-width">
                    <label className="admin_form-label">
                      <FaEnvelope className="input-icon" /> Email Address
                    </label>
                    <input
                      className="admin_form-input"
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                      required
                      disabled
                      title="This field is locked and cannot be edited"
                      style={{
                        background: "#F3F4F6",
                        color: "#9CA3AF",
                        cursor: "not-allowed",
                        borderColor: "#e5e7eb",
                      }}
                    />
                  </div>
                </div>

                <div className="admin_password-section">
                  <h4 className="admin_password-title">
                    <FaLock className="section-icon" /> Change Password
                    (Optional)
                  </h4>
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label className="admin_form-label">
                        Current Password
                      </label>
                      <div className="admin_password-input-wrapper">
                        <input
                          className="admin_form-input"
                          type={showPassword ? "text" : "password"}
                          value={form.currentPassword}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              currentPassword: e.target.value,
                            })
                          }
                          placeholder="Enter current password"
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          className="admin_password-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>
                    <div className="admin_form-group">
                      <label className="admin_form-label">New Password</label>
                      <div className="admin_password-input-wrapper">
                        <input
                          className="admin_form-input"
                          type={showNewPassword ? "text" : "password"}
                          value={form.newPassword}
                          onChange={(e) =>
                            setForm({ ...form, newPassword: e.target.value })
                          }
                          placeholder="Enter new password"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="admin_password-toggle"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                    </div>
                    <div className="admin_form-group">
                      <label className="admin_form-label">
                        Confirm New Password
                      </label>
                      <input
                        className="admin_form-input"
                        type="password"
                        value={form.confirmPassword}
                        onChange={(e) =>
                          setForm({ ...form, confirmPassword: e.target.value })
                        }
                        placeholder="Confirm new password"
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                </div>

                <div className="admin_form-actions">
                  <button
                    type="submit"
                    className="admin_btn admin_btn-primary"
                    disabled={isLoading}
                    style={{
                      padding: "0.75rem 2rem",
                      fontSize: "1rem",
                      gap: "0.5rem",
                      alignItems: "center",
                    }}
                  >
                    {isLoading ? (
                      <>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          style={{ animation: "spin 1s linear infinite" }}
                        >
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                        Updating...
                      </>
                    ) : (
                      <>
                        <FaSave />
                        Update Profile
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUpdateProfile;
