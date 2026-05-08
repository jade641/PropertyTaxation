import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from './ui/button.tsx';

interface ThemeToggleProps {
  isDark?: boolean;
  onToggle?: () => void;
}

export function ThemeToggle({ isDark: propIsDark, onToggle }: ThemeToggleProps = {}) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (propIsDark !== undefined) {
      setIsDark(propIsDark);
      return;
    }
    
    const isDarkMode = localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    setIsDark(isDarkMode);
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [propIsDark]);

  const toggleTheme = () => {
    if (onToggle) {
      onToggle();
      return;
    }
    
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-yellow-500" />
      ) : (
        <Moon className="w-4 h-4 text-gray-600" />
      )}
    </Button>
  );
}