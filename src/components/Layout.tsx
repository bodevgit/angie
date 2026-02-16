import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Calendar, Heart, Home, List, Map, CalendarRange, Settings } from 'lucide-react';
import { cn } from '../lib/utils';
import { useUser } from '../lib/user-context';
import { motion } from 'framer-motion';

export function Layout() {
  const { theme, isDarkMode, userData } = useUser();

  const themeStyles = {
    '--theme-primary': theme.values.primary,
    '--theme-secondary': theme.values.secondary,
    '--theme-accent': theme.values.accent,
    '--theme-background': theme.values.background,
    '--theme-text': theme.values.text,
    '--theme-card-bg': theme.values.cardBg,
  } as React.CSSProperties;

  const backgroundStyle = userData?.backgroundImage ? {
    backgroundImage: `url(${userData.backgroundImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundAttachment: 'fixed',
    ...themeStyles
  } : themeStyles;

  return (
    <div 
      style={backgroundStyle}
      className={`flex flex-col h-screen font-sans ${!userData?.backgroundImage ? theme.gradient : ''} transition-colors duration-500 relative overflow-hidden text-theme-text`}
    >
      {/* Overlay for readability if background image is present */}
      {userData?.backgroundImage && (
        <div className={`absolute inset-0 ${isDarkMode ? 'bg-black/40' : 'bg-white/20'} pointer-events-none z-0`} />
      )}
      
      <main className="flex-1 overflow-y-auto pb-24 px-4 pt-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          <Outlet />
        </motion.div>
      </main>
      
      <nav className={`fixed bottom-0 left-0 right-0 ${isDarkMode ? 'bg-gray-900/90 border-gray-800' : 'bg-white/80 border-white/20'} backdrop-blur-md border-t px-4 py-3 flex justify-around items-center z-50 shadow-lg pb-safe`}>
        <NavItem to="/" icon={<Home size={22} />} label="Home" />
        <NavItem to="/dates" icon={<Calendar size={22} />} label="Dates" />
        <NavItem to="/schedule" icon={<CalendarRange size={22} />} label="Roster" />
        <NavItem to="/plans" icon={<Map size={22} />} label="Plans" />
        <NavItem to="/itinerary" icon={<List size={22} />} label="Itinerary" />
        <NavItem to="/anniversaries" icon={<Heart size={22} />} label="Love" />
        <NavItem to="/settings" icon={<Settings size={22} />} label="Settings" />
      </nav>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  const { theme, isDarkMode } = useUser();
  
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "relative flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all duration-300",
          isActive 
            ? `${theme.colors.background} ${theme.colors.accent} shadow-sm scale-110` 
            : isDarkMode ? "text-gray-500 hover:text-gray-300 hover:bg-white/10" : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.div
              layoutId="nav-indicator"
              className={`absolute inset-0 rounded-xl ${theme.colors.background} -z-10`}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
          )}
          {icon}
          {isActive && <span className="text-[10px] font-bold">{label}</span>}
        </>
      )}
    </NavLink>
  );
}
