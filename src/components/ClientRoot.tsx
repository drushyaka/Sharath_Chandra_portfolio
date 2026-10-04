'use client'
import { PortfolioProvider, usePortfolio } from './PortfolioContext'
import Nav from './Nav'
import Footer from './Footer'
import HomePage from './HomePage'
import PostcardsPage from './PostcardsPage'

function Pages() {
  const { page } = usePortfolio()
  return (
    <>
      <Nav />
      <main>
        {page === 'home' && <HomePage />}
        {page === 'postcards' && <PostcardsPage />}
      </main>
      <Footer />
    </>
  )
}

export default function ClientRoot() {
  return (
    <PortfolioProvider>
      <Pages />
    </PortfolioProvider>
  )
}
