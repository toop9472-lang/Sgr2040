import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage first
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    // Default to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    // Update document class for Tailwind
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);
  const setDark = () => setIsDark(true);
  const setLight = () => setIsDark(false);

  const theme = {
    isDark,
    // Colors
    bg: isDark ? 'bg-gray-900' : 'bg-gray-50',
    bgSecondary: isDark ? 'bg-gray-800' : 'bg-white',
    bgCard: isDark ? 'bg-gray-800/50' : 'bg-white',
    text: isDark ? 'text-white' : 'text-gray-900',
    textSecondary: isDark ? 'text-gray-300' : 'text-gray-600',
    textMuted: isDark ? 'text-gray-400' : 'text-gray-500',
    border: isDark ? 'border-gray-700' : 'border-gray-200',
    // Gradient backgrounds
    gradient: isDark 
      ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900'
      : 'bg-gradient-to-br from-indigo-50 via-white to-purple-50',
    // Button styles
    buttonPrimary: isDark 
      ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
      : 'bg-indigo-600 hover:bg-indigo-700 text-white',
    buttonSecondary: isDark
      ? 'bg-gray-700 hover:bg-gray-600 text-white'
      : 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    // Input styles
    input: isDark
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500',
    // Card styles
    card: isDark
      ? 'bg-gray-800/50 border-gray-700 backdrop-blur-sm'
      : 'bg-white border-gray-200 shadow-sm',
  };

  return (
    <ThemeContext.Provider value={{ ...theme, toggleTheme, setDark, setLight }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
