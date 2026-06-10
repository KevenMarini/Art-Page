'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Artwork, Category, Comment } from '@/lib/db';
import { ChevronUp, ChevronDown, Trash2, Plus, ArrowLeft } from 'lucide-react';

export default function AdminPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  const [expandedComments, setExpandedComments] = useState<number[]>([]);
  const [commentsData, setCommentsData] = useState<Record<number, Comment[]>>({});
  
  const router = useRouter();

  useEffect(() => {
    fetchCategories();
    fetchArtworks();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
        if (data.length > 0 && !selectedCategory) {
          setSelectedCategory(data[0].name);
        }
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

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

  // CATEGORY ACTIONS
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName })
      });
      if (res.ok) {
        setNewCategoryName('');
        fetchCategories();
      }
    } catch (error) {
      console.error('Failed to add category:', error);
    }
  };

  const handleDeleteCategory = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete the category "${name}"?`)) return;
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (selectedCategory === name) {
          setSelectedCategory('');
        }
        fetchCategories();
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const handleReorderCategory = async (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === categories.length - 1)
    ) return;

    const newCats = [...categories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap positions
    const tempPos = newCats[index].position;
    newCats[index].position = newCats[targetIndex].position;
    newCats[targetIndex].position = tempPos;
    
    // Swap array order for optimistic UI
    const temp = newCats[index];
    newCats[index] = newCats[targetIndex];
    newCats[targetIndex] = temp;
    
    setCategories(newCats);

    try {
      await fetch('/api/categories/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            { id: newCats[index].id, position: newCats[index].position },
            { id: newCats[targetIndex].id, position: newCats[targetIndex].position }
          ]
        })
      });
    } catch (error) {
      console.error('Failed to reorder categories:', error);
    }
  };

  // ARTWORK ACTIONS
  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title || !selectedCategory) return;

    setLoading(true);
    setMessage('Uploading...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('category', selectedCategory);

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
        setTimeout(() => setMessage(''), 3000);
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

  const handleDeleteArtwork = async (id: number, url: string) => {
    if (!confirm('Are you sure you want to delete this artwork?')) return;

    setDeletingId(id);
    try {
      const response = await fetch(`/api/artwork?id=${id}&url=${url}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchArtworks();
      } else {
        alert('Failed to delete artwork.');
      }
    } catch (error) {
      console.error('An error occurred during deletion.', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleReorderArtwork = async (index: number, direction: 'up' | 'down') => {
    const categoryArtworks = artworks.filter(a => a.category === selectedCategory);
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === categoryArtworks.length - 1)
    ) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    const art1 = categoryArtworks[index];
    const art2 = categoryArtworks[targetIndex];
    
    // Calculate fallback positions if undefined
    const pos1 = art1.position ?? index;
    const pos2 = art2.position ?? targetIndex;
    
    try {
      // Optimitic update
      const newArtworks = [...artworks];
      const fullIdx1 = newArtworks.findIndex(a => a.id === art1.id);
      const fullIdx2 = newArtworks.findIndex(a => a.id === art2.id);
      
      newArtworks[fullIdx1].position = pos2;
      newArtworks[fullIdx2].position = pos1;
      
      // Re-sort locally
      newArtworks.sort((a, b) => {
        if (a.category !== b.category) return 0;
        return (a.position ?? 0) - (b.position ?? 0);
      });
      
      setArtworks(newArtworks);

      await fetch('/api/artwork/reorder', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            { id: art1.id, position: pos2 },
            { id: art2.id, position: pos1 }
          ]
        })
      });
    } catch (error) {
      console.error('Failed to reorder artworks:', error);
    }
  };

  // COMMENTS
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

  // RENDER LOGIN
  if (!isAuthorized) {
    return (
      <div className="admin-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', border: 'none', background: 'none' }}>
        <form onSubmit={handleLogin} className="admin-form" style={{ width: '100%', maxWidth: '400px', background: 'var(--surface)', padding: '2rem', borderRadius: '30px', border: '1px solid var(--glass-border)' }}>
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
          <button type="submit" className="submit-btn" style={{ marginTop: '1rem' }}>Login</button>
        </form>
      </div>
    );
  }

  const currentCategoryArtworks = artworks.filter(art => art.category === selectedCategory);

  return (
    <div className="admin-layout">
      {/* SIDEBAR */}
      <div className="admin-sidebar">
        <button onClick={() => router.push('/')} className="insta-link" style={{ fontSize: '0.9rem', cursor: 'pointer', background: 'none', border: 'none', padding: '0 1rem 1rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <ArrowLeft size={16} /> Back to Site
        </button>
        <h3>Categories</h3>
        <div className="admin-category-list">
          {categories.map((cat, idx) => (
            <div 
              key={cat.id} 
              className={`admin-category-item ${selectedCategory === cat.name ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.name)}
            >
              <span style={{ fontWeight: 600 }}>{cat.name}</span>
              <div className="admin-category-actions" onClick={e => e.stopPropagation()}>
                <button className="icon-btn" onClick={() => handleReorderCategory(idx, 'up')} disabled={idx === 0}>
                  <ChevronUp size={18} />
                </button>
                <button className="icon-btn" onClick={() => handleReorderCategory(idx, 'down')} disabled={idx === categories.length - 1}>
                  <ChevronDown size={18} />
                </button>
                <button className="icon-btn danger" onClick={() => handleDeleteCategory(cat.id, cat.name)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="admin-add-category">
          <form onSubmit={handleAddCategory}>
            <input 
              type="text" 
              className="box" 
              placeholder="New Category..." 
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
            />
            <button type="submit" className="icon-btn" style={{ background: 'var(--accent)', color: 'white', padding: '0 10px', borderRadius: '8px' }}>
              <Plus size={20} />
            </button>
          </form>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="admin-main">
        {selectedCategory ? (
          <>
            <div className="admin-main-header">
              <h2>{selectedCategory}</h2>
            </div>
            
            <section style={{ marginBottom: '3rem', background: 'rgba(255,255,255,0.02)', padding: '2rem', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
              <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Upload New Artwork</h3>
              <form onSubmit={handleUpload} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Artwork Image</label>
                  <input type="file" className="box" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Artwork Title</label>
                  <input type="text" className="box" placeholder="e.g., Majestic Stag" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </div>
                <button type="submit" className="submit-btn" disabled={loading} style={{ padding: '1rem 2rem' }}>
                  {loading ? 'Uploading...' : 'Upload'}
                </button>
              </form>
              {message && (
                <p style={{ marginTop: '1rem', color: message.includes('Error') ? '#ef4444' : 'var(--accent)', fontWeight: '600' }}>
                  {message}
                </p>
              )}
            </section>

            <section>
              <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>Artworks in {selectedCategory}</h3>
              <div className="admin-artwork-list">
                {currentCategoryArtworks.length === 0 ? (
                  <p className="desc" style={{ fontStyle: 'italic' }}>No artworks found in this category.</p>
                ) : (
                  currentCategoryArtworks.map((art, idx) => (
                    <div key={art.id} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '15px', border: '1px solid var(--glass-border)' }}>
                      <div className="admin-artwork-item" style={{ border: 'none', padding: 0, background: 'none' }}>
                        <img src={art.url} alt={art.title} />
                        <div className="admin-artwork-info">
                          <h4 style={{ fontSize: '1.1rem' }}>{art.title}</h4>
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>❤️ {art.likes_count || 0} Likes</span>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                          <button 
                            onClick={() => art.id && toggleComments(art.id)}
                            style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}
                          >
                            {art.id && expandedComments.includes(art.id) ? 'Hide Comments' : 'View Comments'}
                          </button>
                          
                          <div className="admin-artwork-actions">
                            <button className="icon-btn" onClick={() => handleReorderArtwork(idx, 'up')} disabled={idx === 0}>
                              <ChevronUp size={20} />
                            </button>
                            <button className="icon-btn" onClick={() => handleReorderArtwork(idx, 'down')} disabled={idx === currentCategoryArtworks.length - 1}>
                              <ChevronDown size={20} />
                            </button>
                          </div>
                          
                          <button 
                            className="icon-btn danger" 
                            onClick={() => art.id && handleDeleteArtwork(art.id, art.url)}
                            disabled={deletingId === art.id}
                            style={{ marginLeft: '0.5rem', background: 'rgba(239, 68, 68, 0.1)', padding: '0.6rem', borderRadius: '8px' }}
                          >
                            <Trash2 size={20} />
                          </button>
                        </div>
                      </div>

                      {/* COMMENTS EXPANDED VIEW */}
                      {art.id && expandedComments.includes(art.id) && (
                        <div style={{ paddingLeft: '90px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <h5 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Comments</h5>
                          {(!commentsData[art.id] || commentsData[art.id].length === 0) ? (
                            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>No comments yet.</p>
                          ) : (
                            commentsData[art.id].map(comment => (
                              <div key={comment.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '0.8rem 1rem', borderRadius: '8px' }}>
                                <div>
                                  <strong style={{ fontSize: '0.85rem', color: 'var(--accent)' }}>{comment.name}</strong>
                                  <p style={{ fontSize: '0.9rem', margin: 0, marginTop: '4px' }}>{comment.text}</p>
                                </div>
                                <button 
                                  onClick={() => art.id && handleDeleteComment(comment.id, art.id)}
                                  className="icon-btn danger"
                                >
                                  <Trash2 size={16} />
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
          </>
        ) : (
          <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
            <h3>Select or create a category to get started.</h3>
          </div>
        )}
      </div>
    </div>
  );
}
