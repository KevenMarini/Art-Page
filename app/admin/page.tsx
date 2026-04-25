'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Artwork, Comment } from '@/lib/db';

export default function AdminPage() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Pro');
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');
  const [expandedComments, setExpandedComments] = useState<number[]>([]);
  const [commentsData, setCommentsData] = useState<Record<number, Comment[]>>({});
  const router = useRouter();

  useEffect(() => {
    fetchArtworks();
  }, []);

  const fetchArtworks = async () => {
    try {
      const res = await fetch('/api/artwork');
      if (res.ok) {
        const data = await res.json();
        setArtworks(data);
      }
    } catch (error) {
      console.error('Failed to fetch artworks:', error);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'itsonlyart' && password === '1bro23&*') {
      setIsAuthorized(true);
    } else {
      alert('Incorrect username or password.');
    }
  };

  const toggleComments = async (artworkId: number) => {
    if (expandedComments.includes(artworkId)) {
      setExpandedComments(prev => prev.filter(id => id !== artworkId));
    } else {
      setExpandedComments(prev => [...prev, artworkId]);
      try {
        const res = await fetch(`/api/comment?artworkId=${artworkId}`);
        if (res.ok) {
          const data = await res.json();
          setCommentsData(prev => ({ ...prev, [artworkId]: data }));
        }
      } catch (error) {
        console.error('Failed to fetch comments', error);
      }
    }
  };

  const handleDeleteComment = async (commentId: number, artworkId: number) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      const res = await fetch(`/api/comment?id=${commentId}`, { method: 'DELETE' });
      if (res.ok) {
        setCommentsData(prev => ({
          ...prev,
          [artworkId]: prev[artworkId].filter(c => c.id !== commentId)
        }));
      }
    } catch (error) {
      console.error('Failed to delete comment', error);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;

    setLoading(true);
    setMessage('Uploading...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('category', category);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setMessage('Success! Artwork added.');
        setTitle('');
        setFile(null);
        fetchArtworks();
        (e.target as HTMLFormElement).reset();
      } else {
        const err = await response.json();
        setMessage(`Error: ${err.error || 'Failed to upload'}`);
      }
    } catch (error) {
      setMessage('An error occurred during upload.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, url: string) => {
    if (!confirm('Are you sure you want to delete this artwork?')) return;

    setDeletingId(id);
    try {
      const response = await fetch(`/api/artwork?id=${id}&url=${url}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage('Artwork deleted.');
        fetchArtworks();
      } else {
        setMessage('Failed to delete artwork.');
      }
    } catch (error) {
      setMessage('An error occurred during deletion.');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="admin-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <form onSubmit={handleLogin} className="admin-form" style={{ width: '100%', maxWidth: '400px' }}>
          <h3 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Admin Login</h3>
          <input 
            type="text" 
            className="box" 
            placeholder="Enter Username" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
            style={{ marginBottom: '1rem' }}
          />
          <input 
            type="password" 
            className="box" 
            placeholder="Enter Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          <button type="submit" className="submit-btn">Login</button>
        </form>
      </div>
    );
  }

  const filteredArtworks = artworks.filter(art => 
    filterCategory === 'All' || art.category === filterCategory
  );

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2>Admin Dashboard</h2>
        <p className="desc" style={{ marginBottom: 0 }}>Manage your portfolio artwork.</p>
        <button onClick={() => router.push('/')} className="insta-link" style={{ fontSize: '0.9rem', cursor: 'pointer', background: 'none', border: 'none', padding: '10px 0' }}>
          ← Back to Site
        </button>
      </div>

      <section style={{ marginBottom: '4rem' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>Upload New Artwork</h3>
        <form className="admin-form" onSubmit={handleUpload}>
          <div className="form-group">
            <label>Artwork Image</label>
            <input type="file" className="box" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
          </div>
          <div className="form-group">
            <label>Artwork Title</label>
            <input type="text" className="box" placeholder="e.g., Majestic Stag" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select className="box" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="Featured">Featured</option>
              <option value="Initial">Initial Works</option>
              <option value="Pro">Professional Works</option>
              <option value="Elite">Masterpieces</option>
            </select>
          </div>
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Processing...' : 'Upload Artwork'}
          </button>
          {message && (
            <p style={{ marginTop: '1rem', color: message.includes('Error') || message.includes('Failed') ? '#ef4444' : 'var(--accent)', textAlign: 'center', fontWeight: '600' }}>
              {message}
            </p>
          )}
        </form>
      </section>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>Existing Artworks</h3>
          <select 
            value={filterCategory} 
            onChange={(e) => setFilterCategory(e.target.value)}
            style={{ padding: '8px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid var(--glass-border)' }}
          >
            <option value="All">All Categories</option>
            <option value="Featured">Featured</option>
            <option value="Initial">Initial Works</option>
            <option value="Pro">Professional Works</option>
            <option value="Elite">Masterpieces</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredArtworks.length === 0 ? (
            <p className="desc">No artworks found in this category.</p>
          ) : (
            filteredArtworks.map((art) => (
              <div key={art.id} style={{ 
                display: 'flex', 
                flexDirection: 'column',
                gap: '1rem', 
                background: 'rgba(255,255,255,0.02)', 
                padding: '1rem', 
                borderRadius: '15px',
                border: '1px solid var(--glass-border)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <img src={art.url} alt={art.title} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '1rem' }}>{art.title}</h4>
                    <span style={{ fontSize: '0.8rem', color: 'var(--accent)', marginRight: '1rem' }}>{art.category}</span>
                    <span style={{ fontSize: '0.8rem', color: 'white' }}>❤️ {art.likes_count || 0} Likes</span>
                  </div>
                  <button 
                    onClick={() => art.id && toggleComments(art.id)}
                    style={{ 
                      background: 'rgba(255, 255, 255, 0.1)', 
                      color: 'white', 
                      border: '1px solid rgba(255, 255, 255, 0.2)', 
                      padding: '0.5rem 1rem', 
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      marginRight: '0.5rem'
                    }}
                  >
                    {art.id && expandedComments.includes(art.id) ? 'Hide Comments' : 'View Comments'}
                  </button>
                  <button 
                    onClick={() => art.id && handleDelete(art.id, art.url)}
                    disabled={deletingId === art.id}
                    style={{ 
                      background: 'rgba(239, 68, 68, 0.1)', 
                      color: '#ef4444', 
                      border: '1px solid rgba(239, 68, 68, 0.2)', 
                      padding: '0.5rem 1rem', 
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: '600'
                    }}
                  >
                    {deletingId === art.id ? '...' : 'Delete Artwork'}
                  </button>
                </div>
                
                {art.id && expandedComments.includes(art.id) && (
                  <div style={{ paddingLeft: '76px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <h5 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Comments</h5>
                    {(!commentsData[art.id] || commentsData[art.id].length === 0) ? (
                      <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>No comments yet.</p>
                    ) : (
                      commentsData[art.id].map(comment => (
                        <div key={comment.id} style={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: 'rgba(0,0,0,0.2)',
                          padding: '0.5rem',
                          borderRadius: '8px'
                        }}>
                          <div>
                            <strong style={{ fontSize: '0.8rem', color: 'var(--accent)' }}>{comment.name}</strong>
                            <p style={{ fontSize: '0.8rem', margin: 0 }}>{comment.text}</p>
                          </div>
                          <button 
                            onClick={() => art.id && handleDeleteComment(comment.id, art.id)}
                            style={{ 
                              background: 'transparent', 
                              color: '#ef4444', 
                              border: 'none', 
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              fontWeight: '600'
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
