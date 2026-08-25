'use client'
import { SessionProvider } from "next-auth/react"
import { Analytics } from "@vercel/analytics/next"

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#0b0e14' }}>
        <SessionProvider refetchInterval={60 * 60} refetchOnWindowFocus={true}>
          {children}
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  )
}
