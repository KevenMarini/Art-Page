import { getArtworks, incrementVisitorCount, getVisitorCount } from '@/lib/db';
import GalleryClient from './GalleryClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  await incrementVisitorCount();
  const artworks = await getArtworks();
  const visitorCount = await getVisitorCount();

  return (
    <main>
      <nav>
        <a href="#" className="logo">ItzOnlyArt</a>
        <div className="nav-links">
          <a href="#about">About</a>
          <a href="#gallery">Gallery</a>
          <a href="#contact">Contact</a>
          <a href="https://instagram.com/m.keven_art" target="_blank" style={{ color: 'var(--accent)' }}>Instagram</a>
        </div>
      </nav>

      <section className="hero">
        <h1>Itz Only Art</h1>
        <p>Exploring the depths of emotion through charcoal, shading, and creative visual storytelling.</p>
      </section>

      <section id="about" className="about reveal">
        <h2>About My Work</h2>
        <p className="desc">
          This portfolio represents my artistic journey — from my earliest sketches to refined professional
          compositions.
          Each piece reflects my growth, discipline, and passion for capturing life's textures.
        </p>
      </section>

      <GalleryClient artworks={artworks} visitorCount={visitorCount} />

      <section id="contact" className="contact reveal">
        <h2>Share Your Thoughts</h2>
        <p className="desc">Have a suggestion or a question? I'd love to hear from you.</p>

        <a href="https://instagram.com/m.keven_art" target="_blank" className="insta-link"
          style={{ marginTop: 0, marginBottom: '2rem' }}>
          Follow on Instagram @m.keven_art
        </a>

        <div className="suggestion-box">
          <form action="https://formspree.io/f/xblokoye" method="POST">
            <div className="form-group">
              <label htmlFor="name">Your Name</label>
              <input type="text" id="name" name="name" className="box" placeholder="Enter your name" required />
            </div>

            <div className="form-group">
              <label htmlFor="suggestion">Your Suggestion / Question</label>
              <textarea id="suggestion" name="suggestion" className="box" rows={5}
                placeholder="Type your suggestion here..." required></textarea>
            </div>

            <button type="submit" className="submit-btn">Send Message</button>
          </form>
        </div>
      </section>
    </main>
  );
}
