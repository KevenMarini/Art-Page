'use client';

import { useEffect, useState } from 'react';
import { Artwork, Comment } from '@/lib/db';
import { Heart, MessageSquare, Send, User, X } from 'lucide-react';

export default function GalleryClient({ 
  artworks, 
  visitorCount,
  initialUserLikes = []
}: { 
  artworks: Artwork[], 
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

  useEffect(() => {
    // Load user's previous likes from localStorage and merge with DB likes
    const savedLikes = localStorage.getItem('itz_only_art_likes');
    if (savedLikes) {
      const localLikes = JSON.parse(savedLikes);
      const merged = Array.from(new Set([...initialUserLikes, ...localLikes]));
      setUserLikes(merged);
    }
  }, [initialUserLikes]);

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

  const featured = artworks.filter(a => a.category === 'Featured');
  const initial = artworks.filter(a => a.category === 'Initial');
  const pro = artworks.filter(a => a.category === 'Pro');
  const elite = artworks.filter(a => a.category === 'Elite');

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
        {renderSection('Featured Artwork', null, featured)}
        <br /><br /><br />
        {renderSection('Initial Works', 'These works represent my early learning phase and experimentation with form and shadow.', initial)}
      </section>

      {renderSection('Professional Works', 'Artworks showcasing refined techniques, improved detailing, and professional composition.', pro)}
      {renderSection('Masterpieces', 'My most refined and impactful works, representing the peak of my current technique.', elite)}

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
          <strong>{visitorCount.toLocaleString()}</strong>
        </div>
        <p>&copy; {new Date().getFullYear()} Keven Marini. All Rights Reserved.</p>
      </footer>
    </>
  );
}
