'use client'
import { usePortfolio } from './PortfolioContext'

export default function Nav() {
  const { page, showPage } = usePortfolio()

  return (
    <nav>
      <button className="nav-logo" onClick={() => showPage('home', null)}>S.C. Thota</button>
      <ul className="nav-links">
        <li><a href="#" className={page === 'home' ? 'active' : ''} onClick={e => { e.preventDefault(); showPage('home', 'work') }}>Work</a></li>
        <li><a href="#" className={page === 'home' ? 'active' : ''} onClick={e => { e.preventDefault(); showPage('home', 'about') }}>About</a></li>
        <li><a href="#" className={page === 'home' ? 'active' : ''} onClick={e => { e.preventDefault(); showPage('home', 'locations') }}>Locations</a></li>
        <li><a href="#" className={page === 'postcards' ? 'active' : ''} onClick={e => { e.preventDefault(); showPage('postcards', null) }}>Postcards</a></li>
        <li><a href="#" className={page === 'home' ? 'active' : ''} onClick={e => { e.preventDefault(); showPage('home', 'contact') }}>Contact</a></li>
      </ul>
    </nav>
  )
}
