import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Results from './pages/Results';
import { getStatus } from './api/client';

export const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
});

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } },
};

export default function App() {
  const location = useLocation();
  const [trainingStatus, setTrainingStatus] = useState('idle');
  
  // Theme state
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const pollStatus = useCallback(async () => {
    try {
      const res = await getStatus();
      setTrainingStatus(res.data.status || 'idle');
    } catch {
      setTrainingStatus('idle');
    }
  }, []);

  useEffect(() => {
    pollStatus();
    const interval = setInterval(pollStatus, 5000);
    return () => clearInterval(interval);
  }, [pollStatus]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 transition-colors duration-300">
        
        {/* Network Pattern Background */}
        <div className="fixed inset-0 pointer-events-none bg-network-pattern dark:bg-network-pattern-dark bg-[length:100px_100px] opacity-70 mix-blend-multiply dark:mix-blend-screen transition-all duration-300" />

        {/* Sidebar */}
        <Sidebar trainingStatus={trainingStatus} />

        {/* Main Content */}
        <main className="ml-64 min-h-screen relative z-10">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <Routes location={location}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/clients" element={<Clients />} />
                  <Route path="/results" element={<Results />} />
                </Routes>
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </ThemeContext.Provider>
  );
}
