interface Props { location: string; series: string; name: string }

export default function PostcardComing({ location, series, name }: Props) {
  return (
    <div>
      <div className="postcard-coming">
        <p className="coming-location">{location}</p>
        <div className="coming-dot" />
        <p className="coming-label">Coming soon</p>
      </div>
      <div className="postcard-info">
        <div>
          <p className="postcard-series">◈ {series}</p>
          <p className="postcard-name">{name}</p>
        </div>
        <div className="postcard-edition">
          {location}<br />2026 Collection
        </div>
      </div>
    </div>
  )
}
