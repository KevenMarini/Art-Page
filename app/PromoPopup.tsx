'use client';

import { useState, useEffect } from 'react';
import { X, Instagram, Linkedin, Code } from 'lucide-react';

export default function PromoPopup() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show popup after 3 seconds
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="promo-popup">
      <button className="promo-close" onClick={handleClose} aria-label="Close notification">
        <X size={16} />
      </button>
      
      <div className="promo-content">
        <div className="promo-header">
          <Code size={18} className="promo-icon" />
          <h4>Want a website like this?</h4>
        </div>
        
        <p>I build custom web applications and portfolios. Contact me to discuss your next project!</p>
        
        <div className="promo-links">
          <a href="https://www.instagram.com/_itz_only_art_?igsh=cjkyaWdzc2JwOGpt&utm_source=qr" target="_blank" rel="noopener noreferrer" className="promo-btn instagram">
            <Instagram size={14} />
            Instagram
          </a>
          <a href="https://www.linkedin.com/in/kevenmarini/" target="_blank" rel="noopener noreferrer" className="promo-btn linkedin">
            <Linkedin size={14} />
            LinkedIn
          </a>
        </div>
      </div>
    </div>
  );
}
