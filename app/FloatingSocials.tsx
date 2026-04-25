'use client';

import { useState } from 'react';
import { Instagram, Linkedin, Link2, X } from 'lucide-react';

export default function FloatingSocials() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`fab-container ${isOpen ? 'open' : ''}`}>
      <div className="fab-menu">
        <a 
          href="https://instagram.com/m.keven_art" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="fab-item instagram" 
          title="Instagram"
        >
          <Instagram size={22} />
        </a>
        <a 
          href="https://www.linkedin.com/in/kevenmarini/" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="fab-item linkedin" 
          title="LinkedIn"
        >
          <Linkedin size={22} />
        </a>
      </div>
      <button 
        className="fab-button" 
        onClick={() => setIsOpen(!isOpen)} 
        aria-label="Toggle Social Links"
      >
        {isOpen ? <X size={26} /> : <Link2 size={26} />}
      </button>
    </div>
  );
}
