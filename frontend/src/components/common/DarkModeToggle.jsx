import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

const DarkModeToggle = () => {
  const { darkMode, toggleDarkMode } = useAppStore();

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={toggleDarkMode}
      className="relative w-10 h-10 rounded-xl flex items-center justify-center
        bg-white/5 hover:bg-white/8 border border-white/6 hover:border-white/10
        transition-all duration-300 group overflow-hidden"
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={darkMode ? 'moon' : 'sun'}
          initial={{ rotate: -90, opacity: 0, scale: 0.3 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.3 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          {darkMode ? (
            <Moon className="w-[18px] h-[18px] text-blue-400" />
          ) : (
            <Sun className="w-[18px] h-[18px] text-amber-400" />
          )}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
};

export default DarkModeToggle;
