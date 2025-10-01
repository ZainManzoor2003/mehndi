import React, { useEffect, useState } from 'react';
import AdminSidebar from './AdminSidebar';
import { adminAPI } from '../services/api';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', userType: 'client', password: '' });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.listUsers();
      setUsers(res.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (userId) => {
    if (!window.confirm('Delete this user?')) return;
    await adminAPI.deleteUser(userId);
    await load();
  };

  const handleRoleChange = async (userId, userType) => {
    await adminAPI.updateUser(userId, { userType });
    await load();
  };

  const openEdit = (u) => {
    setEditing(u._id);
    setForm({ firstName: u.firstName || '', lastName: u.lastName || '', email: u.email || '', userType: u.userType || 'client', password: '' });
  };

  const closeEdit = () => { setEditing(null); setForm({ firstName: '', lastName: '', email: '', userType: 'client', password: '' }); };

  const submitEdit = async (e) => {
    e.preventDefault();
    const payload = { firstName: form.firstName, lastName: form.lastName, email: form.email, userType: form.userType };
    if (form.password && form.password.length >= 6) payload.password = form.password;
    await adminAPI.updateUser(editing, payload);
    closeEdit();
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
          <h2 className="bookings-title">Manage Users</h2>
          <p className="bookings-subtitle">Manage all platform users</p>
        </div>

        {/* User Stats Cards */}
        <div className="booking-stats">
          <div className="stat-card">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="stat-info">
              <h3>Total Users</h3>
              <span className="stat-number">{users.length}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                <polyline points="17 8 17 13" />
                <polyline points="14.5 10.5 19.5 10.5" />
              </svg>
            </div>
            <div className="stat-info">
              <h3>Admin Users</h3>
              <span className="stat-number">{users.filter(u => u.userType === 'admin').length}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div className="stat-info">
              <h3>Artist Users</h3>
              <span className="stat-number">{users.filter(u => u.userType === 'artist').length}</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="stat-info">
              <h3>Client Users</h3>
              <span className="stat-number">{users.filter(u => u.userType === 'client').length}</span>
            </div>
          </div>
        </div>
        {error && <p className="error">{error}</p>}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="table-responsive">
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td>{u.firstName} {u.lastName}</td>
                    <td>{u.email}</td>
                    <td>
                      <select className="styled-select" value={u.userType} onChange={(e) => handleRoleChange(u._id, e.target.value)}>
                        <option value="client">client</option>
                        <option value="artist">artist</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                    <td>
                      <button className="btn btn-outline" onClick={() => openEdit(u)}>Edit</button>
                      {(() => { try { return String(u._id) !== String((JSON.parse(localStorage.getItem('user')||'{}'))._id); } catch { return true; } })() && (
                        <button onClick={() => handleDelete(u._id)} className="btn danger" style={{ marginLeft: '8px' }}>Delete</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {editing && (
          <div className="modal-overlay" onClick={closeEdit}>
            <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Edit User</h2>
                <button className="modal-close" onClick={closeEdit}>×</button>
              </div>
              <form onSubmit={submitEdit} className="form-grid" style={{ padding: '1rem' }}>
                <label>First name
                  <input type="text" placeholder="First name" value={form.firstName} onChange={(e)=>setForm({...form, firstName:e.target.value})} required />
                </label>
                <label>Last name
                  <input type="text" placeholder="Last name" value={form.lastName} onChange={(e)=>setForm({...form, lastName:e.target.value})} required />
                </label>
                <label>Email
                  <input type="email" placeholder="Email" value={form.email} onChange={(e)=>setForm({...form, email:e.target.value})} required />
                </label>
                <label>Role
                  <select className="styled-select" value={form.userType} onChange={(e)=>setForm({...form, userType:e.target.value})}>
                    <option value="client">client</option>
                    <option value="artist">artist</option>
                    <option value="admin">admin</option>
                  </select>
                </label>
                <label>New password (optional, min 6)
                  <input type="password" placeholder="New password (optional, min 6)" value={form.password} onChange={(e)=>setForm({...form, password:e.target.value})} />
                </label>
                <div style={{ display:'flex', gap:'8px', marginTop:'8px' }}>
                  <button type="button" className="btn btn-light" onClick={closeEdit}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default ManageUsers;


