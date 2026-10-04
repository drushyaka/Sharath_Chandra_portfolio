import Image from 'next/image'

interface PostcardCardProps {
  front: string
  back: string
  title: string
  location: string
  series: string
}

export default function PostcardCard({ front, back, title, location, series }: PostcardCardProps) {
  return (
    <div>
      <div className="postcard-wrapper">
        <div className="postcard-flip">
          <div className="postcard-face">
            <Image src={front} alt={title} fill style={{ objectFit: 'cover' }} sizes="400px" />
            <span className="postcard-hint">Hover to flip</span>
          </div>
          <div className="postcard-face postcard-back-face">
            <Image src={back} alt="Postcard back" fill style={{ objectFit: 'cover' }} sizes="400px" />
          </div>
        </div>
      </div>
      <div className="postcard-info">
        <div>
          <p className="postcard-series">◈ {series}</p>
          <p className="postcard-name">{title}</p>
        </div>
        <div className="postcard-edition">
          {location}<br />2026 Collection
        </div>
      </div>
    </div>
  )
}
