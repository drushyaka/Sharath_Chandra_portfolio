import Image from 'next/image'

export default function About() {
  return (
    <section className="about-section" id="about">
      <div className="about-inner">
        <div className="about-text">
          <p className="section-label">About</p>
          <h2>Chasing <em>light</em><br />across continents</h2>
          <p>A photographer who wanders — from the frozen silence of Antarctica to the warm chaos of India, the cobblestoned lanes of Porto to the punted waterways of Cambridge.</p>
          <p>Still early in the journey, but every frame is a study in patience, light, and being exactly where you need to be at exactly the right moment.</p>
          <p>Currently based in Porto, with a lens always pointed somewhere new.</p>
          <div className="about-stats">
            <div className="stat-item">
              <p className="stat-number">4+</p>
              <p className="stat-label">Countries shot</p>
            </div>
            <div className="stat-item">
              <p className="stat-number">∞</p>
              <p className="stat-label">Frames to go</p>
            </div>
          </div>
        </div>
        <div className="about-visual">
          <div className="portrait-wrap">
            <Image src="/images/portrait.jpg" alt="Sharath Chandra Thota" width={900} height={1100} style={{ width: '100%', height: 'auto', objectFit: 'cover' }} />
          </div>
          <div className="portrait-label">
            <span>Sharath Chandra Thota — Capturing the World</span>
          </div>
          <div className="detail-frames">
            <div className="detail-frame">
              <Image src="/images/swan_full.jpg" alt="Swan on the Cam" fill style={{ objectFit: 'cover', objectPosition: 'center' }} sizes="200px" />
            </div>
            <div className="detail-frame">
              <Image src="/images/swan_detail.jpg" alt="Swan neck and drops" fill style={{ objectFit: 'cover', objectPosition: 'top center' }} sizes="200px" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
