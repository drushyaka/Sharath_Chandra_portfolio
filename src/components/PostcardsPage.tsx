import PostcardCard from './PostcardCard'
import PostcardComing from './PostcardComing'
import Contact from './Contact'
import { antarcticaPostcards, portoPostcards, comingSoon } from '@/data/content'

export default function PostcardsPage() {
  return (
    <>
      <div className="postcards-hero">
        <p className="section-label">Limited Editions</p>
        <h1>Field<br /><em>Postcards</em></h1>
        <p>Photographs printed as postcards — one destination at a time. Hover to flip.</p>
      </div>

      <div className="series-divider">
        <p className="series-subtitle">◈ Series 01</p>
        <h2 className="series-title">Antarctica</h2>
      </div>
      <section className="postcards-grid-section">
        <div className="postcards-grid">
          {antarcticaPostcards.map((pc, i) => (
            <PostcardCard key={i} {...pc} />
          ))}
          <PostcardComing {...comingSoon[0]} />
        </div>
      </section>

      <div className="series-divider" style={{ marginTop: '2rem' }}>
        <p className="series-subtitle">◈ Series 02</p>
        <h2 className="series-title">Porto &amp; Portugal</h2>
      </div>
      <section className="postcards-grid-section">
        <div className="postcards-grid">
          {portoPostcards.map((pc, i) => (
            <PostcardCard key={i} {...pc} />
          ))}
          <PostcardComing {...comingSoon[1]} />
        </div>
      </section>

      <Contact />
    </>
  )
}
