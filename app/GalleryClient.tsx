'use client';

import { useEffect, useState } from 'react';
import { Artwork } from '@/lib/db';

export default function GalleryClient({ artworks }: { artworks: Artwork[] }) {
  const [selectedImage, setSelectedImage] = useState<{ src: string; title: string } | null>(null);

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
    reveal(); // Run once on mount

    return () => window.removeEventListener('scroll', reveal);
  }, [artworks]);

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
            <div 
              key={art.url} 
              className="card" 
              onClick={() => setSelectedImage({ src: art.url, title: art.title })}
            >
              <img src={art.url} alt={art.title} loading="lazy" />
              <div className="overlay">
                <span>{art.category}</span>
                <h3>{art.title}</h3>
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

      {selectedImage && (
        <div className="lightbox active" onClick={() => setSelectedImage(null)}>
          <button className="lightbox-close" onClick={() => setSelectedImage(null)}>&times;</button>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img className="lightbox-img" src={selectedImage.src} alt={selectedImage.title} />
            <h3 style={{ marginTop: '1rem', textAlign: 'center' }}>{selectedImage.title}</h3>
          </div>
        </div>
      )}
    </>
  );
}
