import type { ReactNode } from 'react'
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { AuthProvider } from '../contexts/AuthContext'
import { GameProvider } from '../contexts/GameContext'
import '../index.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Crash Game - Forest Edition',
      },
    ],
  }),
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <AuthProvider>
        <GameProvider>
          <div className="app-container">
            <Outlet />
          </div>
        </GameProvider>
      </AuthProvider>
    </RootDocument>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html>
      <head>
        <HeadContent />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&family=Fira+Code:wght@400;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
