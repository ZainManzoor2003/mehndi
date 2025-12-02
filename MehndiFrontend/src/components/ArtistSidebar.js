import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ArtistSidebar = ({
  activeTab,
  onTabChange,
  isOpen,
  onClose,
  unreadMessageCount = 0,
}) => {
  const sidebarItems = [
    // Dashboard (separate dashboard view)
    {
      id: "dashboard",
      title: "Dashboard",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
        </svg>
      ),
    },
    // Applications (separate applications view)
    {
      id: "applications",
      title: "Applications",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <line x1="7" y1="8" x2="17" y2="8" />
          <line x1="7" y1="12" x2="17" y2="12" />
          <line x1="7" y1="16" x2="12" y2="16" />
        </svg>
      ),
    },
    // Messages
    {
      id: "messages",
      title: "Messages",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
    // Schedule (new)
    {
      id: "schedule",
      title: "Schedule",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
    },
    // Earnings (new)
    {
      id: "earnings",
      title: "Earnings",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12h6a2 2 0 1 0 0-4H10a2 2 0 1 1 0-4h6" />
        </svg>
      ),
    },
    // Profile
    {
      id: "profile",
      title: "Profile",
      icon: (
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
    },
  ];

  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleItemClick = (itemId) => {
    if (onTabChange) {
      onTabChange(itemId);
    }
    if (onClose) {
      onClose();
    }
  };

  const handleLogoutClick = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      try {
        await logout();
      } catch {}
      localStorage.clear();
      const deleteCookieEverywhere = (name) => {
        try {
          const hostname = window.location.hostname;
          const parts = hostname.split(".");
          const domains = [];
          for (let i = 0; i < parts.length - 1; i++) {
            domains.push(parts.slice(i).join("."));
          }
          const paths = ["/", window.location.pathname];
          paths.forEach((p) => {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${p}`;
          });
          domains.forEach((d) => {
            paths.forEach((p) => {
              document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${p};domain=.${d}`;
            });
          });
        } catch {}
      };
      const clearAllCookies = () => {
        try {
          const cookies = document.cookie.split(";");
          for (const cookie of cookies) {
            const eqPos = cookie.indexOf("=");
            const name =
              eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            deleteCookieEverywhere(name);
          }
        } catch {}
      };
      ["token", "jwt", "accessToken", "authToken"].forEach(
        deleteCookieEverywhere
      );
      clearAllCookies();
      navigate("/login", { replace: true });
    } catch {}
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      {/* Sidebar */}
      <div className={`dashboard-sidebar ${isOpen ? "sidebar-open" : ""}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div
            className="sidebar-logo"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
            }}
            onClick={() => navigate("/")}
          >
            {/* <div className="logo-icon" style={{ background: 'transparent', border: 'none', boxShadow: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/assets/logo icon.png" alt="MehndiMe" style={{ width: 'auto', height: 'auto', display: 'block', borderRadius: '50%' }} />
            </div> */}
            <span className="logo-text" style={{ display: "inline-block" }}>
              <img
                src="/assets/logo text.png"
                alt="MehndiMe"
                style={{ height: 28, display: "block" }}
              />
            </span>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="sidebar-nav">
          <ul className="sidebar-menu">
            {sidebarItems.map((item) => (
              <li key={item.id} className="sidebar-item">
                <button
                  className={`sidebar-link ${
                    activeTab === item.id ? "active" : ""
                  }`}
                  onClick={() => handleItemClick(item.id)}
                  style={{ position: "relative" }}
                >
                  <span
                    className="sidebar-icon"
                    style={{ position: "relative" }}
                  >
                    {item.icon}
                    {item.id === "messages" && unreadMessageCount > 0 && (
                      <span
                        style={{
                          position: "absolute",
                          top: "-6px",
                          right: "-6px",
                          backgroundColor: "#EA7C25",
                          color: "white",
                          borderRadius: "50%",
                          minWidth: "18px",
                          height: "18px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "10px",
                          fontWeight: "700",
                          padding: "0 4px",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                          zIndex: 10,
                        }}
                      >
                        {unreadMessageCount > 99 ? "99+" : unreadMessageCount}
                      </span>
                    )}
                  </span>
                  <span className="sidebar-text">{item.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          {/* <div className="user-info">
            <div className="user-avatar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div className="user-details">
              <span className="user-name">Artist</span>
              <span className="user-role">Dashboard</span>
            </div>
          </div> */}
          <div className="sidebar-logout">
            <Link
              to="/login"
              className="sidebar-logout-btn"
              onClick={handleLogoutClick}
            >
              Logout
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default ArtistSidebar;
