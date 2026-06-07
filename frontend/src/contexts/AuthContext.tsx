import React, { createContext, useContext, useEffect, useState } from "react"
import Keycloak from "keycloak-js"

interface AuthContextType {
  isAuthenticated: boolean
  token: string | null
  login: () => void
  logout: () => void
  userId: string | null
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  token: null,
  login: () => {},
  logout: () => {},
  userId: null,
})

export const useAuth = () => useContext(AuthContext)

const keycloak = new Keycloak({
  url: "http://localhost:8080",
  realm: "crash-game",
  clientId: "crash-game-client",
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  const [token, setToken] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [isInitialized, setIsInitialized] = useState<boolean>(false)

  useEffect(() => {
    keycloak
      .init({
        onLoad: "check-sso",
        silentCheckSsoRedirectUri: window.location.origin + "/silent-check-sso.html",
        pkceMethod: "S256",
      })
      .then((authenticated) => {
        setIsAuthenticated(authenticated)
        if (authenticated && keycloak.token) {
          setToken(keycloak.token)
          setUserId(keycloak.subject || null)
        }
        setIsInitialized(true)
      })
      .catch((error) => {
        console.error("Keycloak init failed", error)
        setIsInitialized(true)
      })

    keycloak.onTokenExpired = () => {
      keycloak.updateToken(30).then((refreshed) => {
        if (refreshed) {
          setToken(keycloak.token ?? null)
        }
      })
    }
  }, [])

  const login = () => {
    keycloak.login()
  }

  const logout = () => {
    keycloak.logout()
  }

  if (!isInitialized) {
    return <div>Carregando autenticação...</div>
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, login, logout, userId }}>
      {children}
    </AuthContext.Provider>
  )
}
