'use client';

import { useEffect, useState } from 'react';
import { Artwork, Comment, Category } from '@/lib/db';
import { Heart, MessageSquare, Send, User, X, Share2 } from 'lucide-react';

export default function GalleryClient({ 
  artworks, 
  categories,
  visitorCount,
  initialUserLikes = []
}: { 
  artworks: Artwork[], 
  categories: Category[],
  visitorCount: number,
  initialUserLikes?: number[]
}) {
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [likes, setLikes] = useState<{ [key: number]: number }>(
    Object.fromEntries(artworks.map(a => [a.id!, a.likes_count || 0]))
  );
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentName, setCommentName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isLiking, setIsLiking] = useState(false);
  const [isCommenting, setIsCommenting] = useState(false);
  const [userLikes, setUserLikes] = useState<number[]>(initialUserLikes);
  const [currentVisitorCount, setCurrentVisitorCount] = useState(visitorCount);

  useEffect(() => {
    // Only increment visitor count once per session
    if (!sessionStorage.getItem('itz_only_art_visited')) {
      sessionStorage.setItem('itz_only_art_visited', 'true');
      fetch('/api/visit', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.count) {
            setCurrentVisitorCount(data.count);
          }
        })
        .catch(err => console.error('Error tracking visit:', err));
    }
  }, []);

  useEffect(() => {
    // Load user's previous likes from localStorage and merge with DB likes
    const savedLikes = localStorage.getItem('itz_only_art_likes');
    if (savedLikes) {
      const localLikes = JSON.parse(savedLikes);
      const merged = Array.from(new Set([...initialUserLikes, ...localLikes]));
      setUserLikes(merged);
    }
  }, [initialUserLikes]);

  // Deep-linking: check URL for ?artwork=ID to auto-open lightbox
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const artworkId = searchParams.get('artwork');
    if (artworkId && artworks.length > 0) {
      const art = artworks.find(a => a.id === Number(artworkId));
      if (art) {
        setSelectedArtwork(art);
      }
    }
  }, [artworks]);

  useEffect(() => {
    const reveal = () => {
      const reveals = document.querySelectorAll('.reveal');
      reveals.forEach((element) => {
        const windowHeight = window.innerHeight;
        const elementTop = element.getBoundingClientRect().top;
        const elementVisible = 150;
        if (elementTop < windowHeight - elementVisible) {
          element.classList.add('active');
        }
      });
    };

    window.addEventListener('scroll', reveal);
    reveal();

    return () => window.removeEventListener('scroll', reveal);
  }, [artworks]);

  useEffect(() => {
    if (selectedArtwork) {
      fetch(`/api/comment?artworkId=${selectedArtwork.id}`)
        .then(res => res.json())
        .then(data => setComments(data))
        .catch(err => console.error('Error fetching comments:', err));
    }
  }, [selectedArtwork]);

  const handleShare = async (e: React.MouseEvent, artwork: Artwork) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}?artwork=${artwork.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: artwork.title,
          text: `Check out "${artwork.title}" by Keven Marini!`,
          url: shareUrl,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
      } catch (err) {
        console.error('Error copying link:', err);
      }
    }
  };

  const handleLike = async (e: React.MouseEvent, artworkId: number) => {
    e.stopPropagation();
    if (isLiking || userLikes.includes(artworkId)) return;
    setIsLiking(true);
    try {
      const res = await fetch('/api/like', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artworkId }),
      });
      const data = await res.json();
      if (data.success) {
        setLikes(prev => ({ ...prev, [artworkId]: (prev[artworkId] || 0) + 1 }));
        const newLikes = [...userLikes, artworkId];
        setUserLikes(newLikes);
        localStorage.setItem('itz_only_art_likes', JSON.stringify(newLikes));
      }
    } catch (err) {
      console.error('Like failed:', err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArtwork || !commentName || !commentText || isCommenting) return;
    setIsCommenting(true);
    try {
      const res = await fetch('/api/comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          artworkId: selectedArtwork.id, 
          name: commentName, 
          text: commentText 
        }),
      });
      if (res.ok) {
        const newComment: Comment = {
          id: Math.random(), // Temporary ID for UI
          artwork_id: selectedArtwork.id!,
          name: commentName,
          text: commentText,
          created_at: new Date()
        };
        setComments(prev => [newComment, ...prev]);
        setCommentText('');
      }
    } catch (err) {
      console.error('Comment failed:', err);
    } finally {
      setIsCommenting(false);
    }
  };

  const renderSection = (title: string, desc: string | null, items: Artwork[]) => {
    if (items.length === 0) return null;
    return (
      <section style={{ opacity: 1 }}>
        <h2>{title}</h2>
        {desc && <p className="desc">{desc}</p>}
        <div className="grid">
          {items.map((art) => (
            <div key={art.id} className="card-container">
              <div 
                className="card" 
                onClick={() => setSelectedArtwork(art)}
              >
                <img src={art.url} alt={art.title} loading="lazy" />
                <div className="overlay">
                  <span>{art.category}</span>
                  <h3>{art.title}</h3>
                </div>
              </div>
              <div className="card-social-bar">
                <button 
                  className={`card-like-btn ${isLiking ? 'loading' : ''} ${userLikes.includes(art.id!) ? 'liked' : ''}`}
                  onClick={(e) => handleLike(e, art.id!)}
                >
                  <Heart size={18} />
                  <span>{likes[art.id!] || 0}</span>
                </button>
                <button className="card-comment-btn" onClick={() => setSelectedArtwork(art)}>
                  <MessageSquare size={18} />
                </button>
                <button className="card-share-btn" onClick={(e) => handleShare(e, art)}>
                  <Share2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };

  return (
    <>
      <section id="gallery">
        {categories.map((cat, idx) => {
          const catArtworks = artworks.filter(a => a.category === cat.name);
          
          let desc: string | null = null;
          if (cat.name === 'Initial') desc = 'These works represent my early learning phase and experimentation with form and shadow.';
          else if (cat.name === 'Pro') desc = 'Artworks showcasing refined techniques, improved detailing, and professional composition.';
          else if (cat.name === 'Elite') desc = 'My most refined and impactful works, representing the peak of my current technique.';

          const sectionTitle = cat.name;

          return (
            <div key={cat.id}>
              {renderSection(sectionTitle, desc, catArtworks)}
              {idx === 0 && <><br /><br /><br /></>}
            </div>
          );
        })}
      </section>

      {selectedArtwork && (
        <div className="lightbox active" onClick={() => setSelectedArtwork(null)}>
          <button className="lightbox-close desktop-only" onClick={() => setSelectedArtwork(null)}>
            <X size={32} />
          </button>
          
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            {/* Mobile Header */}
            <div className="mobile-lightbox-header">
              <button className="back-btn" onClick={() => setSelectedArtwork(null)}>
                <X size={24} />
                <span>Back</span>
              </button>
              <div className="mobile-header-title">{selectedArtwork.title}</div>
            </div>

            <div className="lightbox-main">
              <img className="lightbox-img" src={selectedArtwork.url} alt={selectedArtwork.title} />
              <div className="lightbox-info">
                <div className="lightbox-header desktop-only">
                  <h3>{selectedArtwork.title}</h3>
                  <div className="social-actions">
                    <button 
                      className={`like-btn ${isLiking ? 'loading' : ''} ${userLikes.includes(selectedArtwork.id!) ? 'liked' : ''}`}
                      onClick={(e) => handleLike(e, selectedArtwork.id!)}
                    >
                      <Heart size={20} />
                      <span>{likes[selectedArtwork.id!] || 0}</span>
                    </button>
                    <div className="comment-count">
                      <MessageSquare size={20} />
                      <span>{comments.length}</span>
                    </div>
                    <button className="like-btn" onClick={(e) => handleShare(e, selectedArtwork)}>
                      <Share2 size={20} />
                      <span>Share</span>
                    </button>
                  </div>
                </div>

                {/* Mobile Title & Actions (Integrated) */}
                <div className="mobile-info-bar">
                  <div className="social-actions">
                    <button 
                      className={`like-btn ${isLiking ? 'loading' : ''} ${userLikes.includes(selectedArtwork.id!) ? 'liked' : ''}`}
                      onClick={(e) => handleLike(e, selectedArtwork.id!)}
                    >
                      <Heart size={20} />
                      <span>{likes[selectedArtwork.id!] || 0}</span>
                    </button>
                    <div className="comment-count">
                      <MessageSquare size={20} />
                      <span>{comments.length}</span>
                    </div>
                    <button className="like-btn" onClick={(e) => handleShare(e, selectedArtwork)}>
                      <Share2 size={20} />
                    </button>
                  </div>
                </div>

                <div className="comment-section">
                  <h4>Comments</h4>
                  <div className="comments-list">
                    {comments.length === 0 ? (
                      <p className="no-comments">No comments yet. Be the first!</p>
                    ) : (
                      comments.map(c => (
                        <div key={c.id} className="comment-item">
                          <div className="comment-user">
                            <User size={14} />
                            <strong>{c.name}</strong>
                            <span className="comment-date">
                              {new Date(c.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p>{c.text}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <form className="comment-form" onSubmit={handleComment}>
                    <div className="input-group">
                      <input 
                        type="text" 
                        placeholder="Your Name" 
                        value={commentName}
                        onChange={(e) => setCommentName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="input-group">
                      <textarea 
                        placeholder="Add a comment..." 
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        required
                      ></textarea>
                      <button type="submit" disabled={isCommenting}>
                        <Send size={18} />
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="visitor-footer">
        <div className="visitor-count">
          <span>Total Visitors:</span>
          <strong>{currentVisitorCount.toLocaleString()}</strong>
        </div>
        <p>&copy; {new Date().getFullYear()} Keven Marini. All Rights Reserved.</p>
      </footer>
    </>
  );
}
