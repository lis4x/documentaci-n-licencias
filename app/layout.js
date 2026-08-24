'use client'
import { SessionProvider } from "next-auth/react"
import { Analytics } from "@vercel/analytics/next"

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, padding: 0, backgroundColor: '#0b0e14' }}>
        {/* refetchInterval en segundos: cada 1 hora vuelve a pedir la sesión
            automáticamente (sin depender de que el usuario recargue o
            cambie de pestaña), lo que dispara la revalidación de roles
            en el callback jwt de route.js. Coincide con el maxAge de la
            sesión*/}
        <SessionProvider refetchInterval={60 * 60} refetchOnWindowFocus={true}>
          {children}
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  )
}
