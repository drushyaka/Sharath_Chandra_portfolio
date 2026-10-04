'use client'
import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

type Page = 'home' | 'postcards'
interface CtxType { page: Page; showPage: (p: Page, anchor: string | null) => void }
const Ctx = createContext<CtxType>({ page: 'home', showPage: () => {} })

export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<Page>('home')

  const showPage = useCallback((p: Page, anchor: string | null) => {
    setPage(p)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    if (anchor) {
      setTimeout(() => {
        document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [])

  return <Ctx.Provider value={{ page, showPage }}>{children}</Ctx.Provider>
}

export const usePortfolio = () => useContext(Ctx)
