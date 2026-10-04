import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Sharath Chandra Thota — Photography',
  description: 'Photography portfolio — Cambridge · Antarctica · Porto · India · Beyond',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
