import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../services/api";

const BlogDetail = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [more, setMore] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.blogsAPI
      .getById(id)
      .then((res) => {
        if (!mounted) return;
        if (res.success) setBlog(res.data);
      })
      .finally(() => mounted && setLoading(false));
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      window.scrollTo(0, 0);
    }
    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    let mounted = true;
    api.blogsAPI.list().then((res) => {
      if (!mounted) return;
      if (res.success) {
        const arr = (res.data || [])
          .filter((b) => String(b._id) !== String(id))
          .slice(0, 3);
        setMore(arr);
      }
    });
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading)
    return (
      <section style={{ paddingTop: "7rem" }} className="container">
        Loading...
      </section>
    );
  if (!blog)
    return (
      <section style={{ paddingTop: "7rem" }} className="container">
        Not found
      </section>
    );

  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString("en-GB", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "";
    }
  };

  return (
    <article className="blog-detail" style={{ paddingTop: "8rem" }}>
      <ToastContainer position="top-right" autoClose={2000} />
      <div
        className="container"
        style={{ maxWidth: 980, margin: "0 auto", padding: "0 14px" }}
      >
        <div style={{ marginBottom: 12 }}>
          <Link
            to="/blogs"
            style={{ color: "#8B4513", textDecoration: "none" }}
          >
            ← Back to Journal
          </Link>
        </div>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              color: "#8B4513",
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: 1.5,
              marginBottom: 8,
            }}
          >
            ARTIST TIPS
          </div>
          <h1
            className="home__title"
            style={{
              marginBottom: 8,
              fontSize: "clamp(2rem, 4vw, 3rem)",
              color: "#8B4513",
            }}
          >
            {blog.title}
          </h1>
          <div style={{ color: "#8B4513", fontSize: 14, marginBottom: 10 }}>
            By Mehndi Me Team • {formatDate(blog.createdAt)}
            {blog.minutesToRead ? ` • ${blog.minutesToRead} min read` : ""}
          </div>
        </div>
      </div>

      {blog.imageUrl ? (
        <div style={{ maxWidth: 1024, margin: "0 auto", padding: "0" }}>
          <img
            src={blog.imageUrl}
            alt={blog.title}
            style={{
              display: "block",
              width: "100%",
              margin: "0",
              height: "100%",
              objectFit: "cover",
              boxShadow: "inset 0 -60px 120px rgba(0,0,0,0.12)",
              borderRadius: 12,
            }}
          />
        </div>
      ) : (
        <div
          style={{
            width: "calc(100% - 60px)",
            margin: "0 30px",
            height: "56vh",
            maxHeight: 520,
            background: "linear-gradient(135deg,#f0d5bf,#e4bfa0)",
          }}
        />
      )}

      <section
        className="container"
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "1.5rem 1rem 2.5rem",
        }}
      >
        <p
          style={{ whiteSpace: "pre-wrap", color: "#8B4513", lineHeight: 1.9 }}
        >
          {blog.description}
        </p>

        {Array.isArray(blog.sections) &&
          blog.sections.map((s, i) => (
            <section key={i} style={{ marginTop: "1.8rem" }}>
              {s.subtitle ? (
                <h2 style={{ color: "#8B4513", margin: "0 0 8px" }}>
                  {s.subtitle}
                </h2>
              ) : null}
              {s.description ? (
                <p
                  style={{
                    whiteSpace: "pre-wrap",
                    color: "#8B4513",
                    lineHeight: 1.9,
                  }}
                >
                  {s.description}
                </p>
              ) : null}
              {s.imageUrl ? (
                <div
                  style={{
                    margin: "10px 0 0",
                    borderRadius: 10,
                    overflow: "hidden",
                    boxShadow: "0 8px 16px rgba(0,0,0,0.08)",
                    border: "1px solid #e8d6c4",
                  }}
                >
                  <img
                    src={s.imageUrl}
                    alt={s.subtitle || "Blog section"}
                    style={{ width: "100%", display: "block" }}
                  />
                </div>
              ) : null}
              {s.quote ? (
                <blockquote
                  style={{
                    margin: "12px 0 0",
                    padding: "10px 14px",
                    borderLeft: "4px solid #7a4a2d",
                    color: "#8B4513",
                    background: "transparent",
                    borderRadius: 6,
                    fontStyle: "italic",
                  }}
                >
                  “{s.quote}”
                </blockquote>
              ) : null}
            </section>
          ))}

        {/* Share */}
        <div
          style={{
            marginTop: "24px",
            paddingTop: "26px",
            borderTop: "1px solid #ecd8bf",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ color: "#8B4513", fontWeight: 700 }}>
            Share this article
          </div>
          <div style={{ display: "flex", gap: 14, color: "#8B4513" }}>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                window.location.href
              )}`}
              target="_blank"
              rel="noreferrer"
              style={{ color: "inherit" }}
              aria-label="Share on Facebook"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#5a3d29"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3.64L18 10h-4V7a1 1 0 0 1 1-1h3V2z" />
              </svg>
            </a>
            <a
              href={`https://www.instagram.com/`}
              target="_blank"
              rel="noreferrer"
              style={{ color: "inherit" }}
              aria-label="Open Instagram"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#5a3d29"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.5" y2="6.5" />
              </svg>
            </a>
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(window.location.href);
                  toast.success("URL copied successfully");
                } catch {
                  try {
                    const ta = document.createElement("textarea");
                    ta.value = window.location.href;
                    document.body.appendChild(ta);
                    ta.select();
                    document.execCommand("copy");
                    document.body.removeChild(ta);
                    toast.success("URL copied successfully");
                  } catch {}
                }
              }}
              aria-label="Copy article link"
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#5a3d29"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="18" cy="5" r="3" />
                <circle cx="6" cy="12" r="3" />
                <circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
            </button>
          </div>
        </div>

        {/* Author */}
        <div
          style={{
            marginTop: 16,
            background: "#f6eadb",
            border: "1px solid #ecd7c1",
            borderRadius: 12,
            padding: "14px",
          }}
        >
          <div style={{ fontWeight: 700, color: "#8B4513", marginBottom: 6 }}>
            About the Author
          </div>
          <div style={{ color: "#8B4513" }}>
            The Mehndi Me Team celebrates the creativity and talent of mehndi
            artists across the UK, sharing tips, stories, and inspiration from
            both artists and clients within our growing community.
          </div>
        </div>
      </section>

      {/* You Might Also Like */}
      <section
        className="container"
        style={{ maxWidth: 1100, margin: "0 auto", padding: "0 1rem 3rem" }}
      >
        <h3
          style={{
            color: "#8B4513",
            fontSize: "1.5rem",
            fontWeight: 800,
            textAlign: "center",
          }}
        >
          You Might Also Like
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1.5rem",
            marginTop: "2rem",
          }}
        >
          {more.map((m) => (
            <div
              key={m._id}
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
                e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.08)";
              }}
            >
              {m.imageUrl ? (
                <div
                  style={{
                    height: 200,
                    background: `url(${m.imageUrl}) center/cover`,
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
                    }}
                  >
                    PLATFORM UPDATES
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
                    }}
                  >
                    PLATFORM UPDATES
                  </div>
                </div>
              )}
              <div style={{ paddingTop: "1.25rem" }}>
                <div
                  style={{
                    margin: 0,
                    marginBottom: "0.5rem",
                    color: "#8B4513",
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    lineHeight: 1.3,
                  }}
                >
                  {m.title}
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0 12px 12px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.85rem",
                      color: "#888888",
                      fontWeight: 500,
                    }}
                  >
                    {formatDate(m.createdAt)}
                  </span>
                  <Link
                    to={`/blogs/${m._id}`}
                    onClick={() => {
                      try {
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      } catch {
                        window.scrollTo(0, 0);
                      }
                    }}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "6px 12px",
                      borderRadius: 20,
                      border: "1px solid var(--first-color)",
                      color: "#8B4513",
                      textDecoration: "none",
                      fontSize: "0.85rem",
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
                      e.currentTarget.style.borderColor = "var(--first-color)";
                      e.currentTarget.style.color = "#8B4513";
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    Read
                    <span style={{ fontSize: "0.8rem" }}>→</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </article>
  );
};

export default BlogDetail;
