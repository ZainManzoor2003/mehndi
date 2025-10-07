import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const Blogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let mounted = true;
    api.blogsAPI.list().then(res => {
      if (!mounted) return;
      if (res.success) setBlogs(res.data || []);
    }).finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  const filteredBlogs = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return blogs;
    return blogs.filter(b => (b.title || '').toLowerCase().includes(term));
  }, [blogs, search]);

  const highlightTitle = (title) => {
    const term = search.trim();
    if (!term) return title;
    const parts = title.split(new RegExp(`(${term.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')})`, 'ig'));
    return parts.map((part, i) => (
      part.toLowerCase() === term.toLowerCase()
        ? <span key={i} style={{ color: 'var(--first-color)', fontWeight: 700 }}>{part}</span>
        : <span key={i}>{part}</span>
    ));
  };


  const formatDate = (iso) => {
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        day: 'numeric', month: 'short', year: 'numeric'
      });
    } catch {
      return '';
    }
  };

  return (
    <section className="blogs" id="blogs" style={{ paddingTop: '6rem' }}>
      <div className="container">
        <header className="blogs__hero" style={{ textAlign: 'center', marginBottom: '2.5rem', padding: '3rem 1rem 2rem', borderRadius: 24, background: 'linear-gradient(135deg,#f6e7da,#ecd4bd)', boxShadow: '0 10px 30px rgba(139,115,85,0.06)', border: '1px solid rgba(139,115,85,0.12)' }}>
          <h1 className="home__title" style={{ marginBottom: '0.5rem' }}>Our blog</h1>
          <p className="home__subtitle" style={{ color: '#8B7355', marginBottom: '1.25rem' }}>Insights, stories, and updates from the Mehndi Me team</p>
          <div className="home__actions" style={{ justifyContent: 'center' }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="blogs__search" placeholder="Search by title" style={{ maxWidth: 560, width: '100%', padding: '0.95rem 1.15rem', borderRadius: 999, border: '1px solid rgba(139,115,85,0.25)', background: '#f0dcc6', color: '#4a3f35', boxShadow: '0 8px 26px rgba(139,115,85,0.08)', outline: 'none' }} />
          </div>
        </header>

        <div className="blogs__grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {loading ? (
            <div>Loading...</div>
          ) : filteredBlogs.length === 0 ? (
            <div style={{ textAlign: 'center', gridColumn: '1 / -1' }}>No blogs yet</div>
          ) : (
            filteredBlogs.map(b => (
              <div key={b._id} className="blog-card" style={{ background: 'transparent', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.21)', border: '1px solid var(--first-color)', transition: 'transform .2s ease, box-shadow .2s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.12)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; }}
              >
                {/* Image Section */}
                {b.imageUrl ? (
                  <div style={{ height: 200, background: `url(${b.imageUrl}) center/cover`, position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(255,255,255,0.9)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, color: '#3f2c1e' }}>
                      PLATFORM UPDATES
                    </div>
                  </div>
                ) : (
                  <div style={{ height: 200, background: 'linear-gradient(135deg,#f0f0f0,#e0e0e0)', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(255,255,255,0.9)', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, color: '#3f2c1e' }}>
                      PLATFORM UPDATES
                    </div>
                  </div>
                )}
                
                {/* Content Section */}
                <div style={{ paddingTop: '1.25rem' }}>
                  <h3 style={{ margin: 0, marginBottom: '0.5rem', color: '#1a1a1a', fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.3 }}>
                    {highlightTitle(b.title)}
                  </h3>
                  <p style={{ 
                    margin: 0, 
                    marginBottom: '1rem', 
                    color: '#666666', 
                    fontSize: '0.9rem',
                    lineHeight: 1.35,
                    display: '-webkit-box', 
                    WebkitLineClamp: 3, 
                    lineClamp: 3, 
                    WebkitBoxOrient: 'vertical', 
                    overflow: 'hidden' 
                  }}>
                    {b.description}
                  </p>
                  
                  {/* Bottom Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: '#888888', fontWeight: 500 }}>
                      {formatDate(b.createdAt)}
                    </span>
                    <Link 
                      to={`/blogs/${b._id}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        borderRadius: 20,
                        border: '1px solid var(--first-color)',
                        color: '#1a1a1a',
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        background: 'transparent',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#cf7f3a';
                        e.currentTarget.style.color = '#cf7f3a';
                        e.currentTarget.style.background = 'rgba(207,127,58,0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--first-color)';
                        e.currentTarget.style.color = '#1a1a1a';
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      Read article
                      <span style={{ fontSize: '0.8rem' }}>→</span>
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


