import {
  createContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react'

export type Theme = 'light'

const STORAGE_KEY = 'dost-eval-theme'

type ThemeContextValue = {
  theme: Theme
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function applyLightTheme() {
  document.documentElement.classList.remove('dark')
  document.documentElement.style.colorScheme = 'light'
  localStorage.setItem(STORAGE_KEY, 'light')
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    applyLightTheme()
  }, [])

  const value = useMemo(() => ({ theme: 'light' as const }), [])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
