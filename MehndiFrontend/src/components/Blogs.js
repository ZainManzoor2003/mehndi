import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const Blogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Scroll to top on mount
  useEffect(() => {
    try {
      window.scrollTo({ top: 0, behavior: "instant" });
    } catch {
      window.scrollTo(0, 0);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    api.blogsAPI
      .list()
      .then((res) => {
        if (!mounted) return;
        if (res.success) setBlogs(res.data || []);
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const filteredBlogs = useMemo(() => {
    let filtered = blogs;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((b) => b.category === selectedCategory);
    }

    // Filter by search term
    const term = search.trim().toLowerCase();
    if (term) {
      filtered = filtered.filter((b) =>
        (b.title || "").toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [blogs, search, selectedCategory]);

  const highlightTitle = (title) => {
    const term = search.trim();
    if (!term) return title;
    const parts = title.split(
      new RegExp(`(${term.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")})`, "ig")
    );
    return parts.map((part, i) =>
      part.toLowerCase() === term.toLowerCase() ? (
        <span key={i} style={{ color: "var(--first-color)", fontWeight: 700 }}>
          {part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  };

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <section className="blogs" id="blogs" style={{ paddingTop: "6.5rem" }}>
      {/* Full-width hero header */}
      <header
        className="blogs__hero"
        style={{
          width: "100%",
          margin: "0 auto 2.5rem",
          padding: "3.2rem 1.2rem",
          // background: "#DEB887",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "1.25fr 1fr",
            gap: "2rem",
            alignItems: "center",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                color: "#8B4513",
                fontSize: "clamp(28px, 3.6vw, 44px)",
                lineHeight: 1.15,
                fontWeight: 800,
                marginBottom: ".65rem",
              }}
            >
              The Mehndi Me Journal
            </h1>
            <p
              style={{
                margin: 0,
                color: "#8B4513",
                fontSize: "clamp(15px, 1.6vw, 18px)",
                lineHeight: 1.55,
                maxWidth: 560,
              }}
            >
              Trends, tips, and ideas for everyone in the mehndi circle — from
              clients booking to artists creating.
            </p>
            {/* Pills row */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
                marginTop: "1rem",
              }}
            >
              {[
                "Client Tips",
                "Artist Tips",
                "Success Stories",
                "Platform Updates",
              ].map((label) => {
                const isSelected = selectedCategory === label;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(isSelected ? null : label);
                    }}
                    style={{
                      background: isSelected ? "#cf7f3a" : "transparent",
                      color: isSelected ? "#fff" : "#8B4513",
                      border: "1px solid #cf7f3a",
                      borderRadius: 999,
                      padding: "8px 14px",
                      fontSize: 14,
                      fontWeight: isSelected ? 600 : 400,
                      boxShadow: isSelected
                        ? "0 2px 10px rgba(207,127,58,0.3)"
                        : "0 2px 10px rgba(0,0,0,0.08)",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background =
                          "rgba(207,127,58,0.1)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <div
              className="home__actions"
              style={{ justifyContent: "flex-start", marginTop: "1.25rem" }}
            >
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="blogs__search"
                placeholder="Search by keyword or topic (e.g., bridal, artist tips)"
                style={{
                  maxWidth: 520,
                  width: "100%",
                  padding: "0.9rem 1.15rem",
                  borderRadius: 999,
                  border: "1px solid rgba(139,115,85,0.25)",
                  background: "#f0dcc6",
                  color: "#4a3f35",
                  boxShadow: "0 8px 26px rgba(139,115,85,0.08)",
                  outline: "none",
                }}
              />
            </div>
          </div>
          <div>
            <div
              style={{
                height: 360,
                width: "100%",
                objectFit: "cover",
                borderRadius: 18,
                boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,255,255,0.15)",
                overflow: "hidden",
                background: `url(https://images.unsplash.com/photo-1680490964820-7afb13f2e35c?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0) center/cover`,
              }}
              aria-label="Mehndi artist working"
            />
          </div>
        </div>
      </header>

      <div className="container">
        <div
          className="blogs__grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          {loading ? (
            <div>Loading...</div>
          ) : filteredBlogs.length === 0 ? (
            <div style={{ textAlign: "center", gridColumn: "1 / -1" }}>
              {selectedCategory || search
                ? "No blogs found matching your filters"
                : "No blogs yet"}
            </div>
          ) : (
            filteredBlogs.map((b) => (
              <div
                key={b._id}
                className="blog-card"
                style={{
                  background: "transparent",
                  borderRadius: 16,
                  overflow: "hidden",
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.21)",
                  border: "1px solid var(--first-color)",
                  transition: "transform .2s ease, box-shadow .2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 30px rgba(0,0,0,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 20px rgba(0,0,0,0.08)";
                }}
              >
                {/* Image Section */}
                {b.imageUrl ? (
                  <div
                    style={{
                      height: 200,
                      background: `url(${b.imageUrl}) center/cover`,
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        background: "rgba(255,255,255,0.9)",
                        padding: "4px 12px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#8B4513",
                        textTransform: "uppercase",
                      }}
                    >
                      {b.category || "PLATFORM UPDATES"}
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      height: 200,
                      background: "linear-gradient(135deg,#f0f0f0,#e0e0e0)",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        background: "rgba(255,255,255,0.9)",
                        padding: "4px 12px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#8B4513",
                        textTransform: "uppercase",
                      }}
                    >
                      {b.category || "PLATFORM UPDATES"}
                    </div>
                  </div>
                )}

                {/* Content Section */}
                <div style={{ paddingTop: "1.25rem" }}>
                  <h3
                    style={{
                      margin: 0,
                      marginBottom: "0.5rem",
                      color: "#8B4513",
                      fontSize: "1.15rem",
                      fontWeight: 700,
                      lineHeight: 1.3,
                    }}
                  >
                    {highlightTitle(b.title)}
                  </h3>
                  <p
                    style={{
                      margin: 0,
                      marginBottom: "1rem",
                      color: "#8B4513",
                      fontSize: "0.9rem",
                      lineHeight: 1.35,
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      lineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {b.description}
                  </p>

                  {/* Bottom Row */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.85rem",
                        color: "#888888",
                        fontWeight: 500,
                      }}
                    >
                      {formatDate(b.createdAt)}
                    </span>
                    <Link
                      to={`/blogs/${b._id}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "8px 16px",
                        borderRadius: 20,
                        border: "1px solid var(--first-color)",
                        color: "#8B4513",
                        textDecoration: "none",
                        fontSize: "0.9rem",
                        fontWeight: 500,
                        background: "transparent",
                        transition: "all 0.2s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#cf7f3a";
                        e.currentTarget.style.color = "#cf7f3a";
                        e.currentTarget.style.background =
                          "rgba(207,127,58,0.05)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor =
                          "var(--first-color)";
                        e.currentTarget.style.color = "#8B4513";
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      Read article
                      <span style={{ fontSize: "0.8rem" }}>→</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default Blogs;
