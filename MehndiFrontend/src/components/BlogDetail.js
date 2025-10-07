import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';

const BlogDetail = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.blogsAPI.getById(id).then(res => {
      if (!mounted) return;
      if (res.success) setBlog(res.data);
    }).finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [id]);

  if (loading) return <section style={{ paddingTop: '7rem' }} className="container">Loading...</section>;
  if (!blog) return <section style={{ paddingTop: '7rem' }} className="container">Not found</section>;

  return (
    <article className="blog-detail" style={{ paddingTop: '6rem' }}>
      <header className="blog-detail__hero" style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
        <h1 className="home__title" style={{ marginBottom: '0.75rem', fontSize: 'clamp(2rem, 4vw, 3rem)' }}>{blog.title}</h1>
      </header>
      {blog.imageUrl ? (
        <div style={{ width: '100%', height: '80vh', maxHeight: '860px', background: `url(${blog.imageUrl}) center/cover`, borderRadius: 0 }} />
      ) : (
        <div style={{ width: '100%', height: '80vh', maxHeight: '860px', background: 'linear-gradient(135deg,#f0d5bf,#e4bfa0)' }} />
      )}
      <section className="container" style={{ maxWidth: 900, margin: '0 auto', padding: '1.5rem 1rem 3rem' }}>
        <p style={{ whiteSpace: 'pre-wrap', color: '#3f2f22', lineHeight: 1.9 }}>{blog.description}</p>
      </section>
    </article>
  );
};

export default BlogDetail;


