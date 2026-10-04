import Image from 'next/image'
import { gridPhotos } from '@/data/content'

export default function PhotoGrid() {
  return (
    <section className="grid-section" id="work">
      <p className="section-label">Selected Work</p>
      <div className="photo-grid">
        {gridPhotos.map((photo, i) => (
          <div className="photo-card" key={i}>
            <div className="photo-placeholder">
              <Image src={photo.src} alt={photo.alt} fill style={{ objectFit: 'cover' }} sizes="(max-width:768px) 100vw, 50vw" />
              <div className="photo-meta">
                <p className="photo-location">{photo.location}</p>
                <p className="photo-title">{photo.title}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
