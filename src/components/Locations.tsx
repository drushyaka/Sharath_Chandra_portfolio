import { locations } from '@/data/content'

export default function Locations() {
  return (
    <section className="locations-section" id="locations">
      <p className="section-label">Where I&apos;ve Shot</p>
      <div className="locations-grid">
        {locations.map((loc) => (
          <div className="location-item" key={loc.number}>
            <p className="location-number">{loc.number}</p>
            <p className="location-name">{loc.name}</p>
            <p className="location-desc">{loc.desc}</p>
            <span className="location-tag">{loc.tag}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
