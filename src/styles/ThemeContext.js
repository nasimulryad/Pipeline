import { createContext, useContext, useState } from 'react'
import { themes, themeKeys } from './theme'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [currentThemeKey, setCurrentThemeKey] = useState('aurora')

  // Cycle through built-in themes — available for future use
  const cycleTheme = () => {
    const currentIndex = themeKeys.indexOf(currentThemeKey)
    const nextIndex = (currentIndex + 1) % themeKeys.length
    setCurrentThemeKey(themeKeys[nextIndex])
  }

  // Set a specific theme by key — available for future use
  const setTheme = (key) => {
    if (themes[key]) setCurrentThemeKey(key)
  }

  // Allow end users to import their own custom color theme — available for future use
  // Expected format: object matching the theme structure in theme.js
  const setCustomTheme = (customTheme) => {
    themes['custom'] = { name: 'Custom', ...customTheme }
    setCurrentThemeKey('custom')
  }

  return (
    <ThemeContext.Provider value={{
      theme: themes[currentThemeKey],
      currentThemeKey,
      cycleTheme,
      setTheme,
      setCustomTheme,
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}