import { motion } from 'framer-motion';
import { Menu, Brain, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import DarkModeToggle from '../common/DarkModeToggle';
import useAppStore from '../../store/useAppStore';

const Navbar = () => {
  const { toggleSidebar, sidebarOpen } = useAppStore();
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboard = location.pathname === '/dashboard';

  return (
    <motion.header
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(8,12,24,0.85)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 4px 32px rgba(0,0,0,0.25)',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, padding: '0 24px', maxWidth: 1280, margin: '0 auto' }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isDashboard && (
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={toggleSidebar}
              aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
              style={{
                padding: 8, borderRadius: 10,
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: '#64748B', transition: 'all 0.2s',
                display: window.innerWidth >= 1024 ? 'none' : 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}
              className="lg:hidden"
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#E2E8F0'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748B'; }}
            >
              {sidebarOpen ? <X style={{ width: 20, height: 20 }} /> : <Menu style={{ width: 20, height: 20 }} />}
            </motion.button>
          )}
          <button
            onClick={() => navigate('/')}
            aria-label="Go to home page"
            style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
          >
            <motion.div
              whileHover={{ scale: 1.08, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              style={{
                width: 38, height: 38, borderRadius: 12,
                background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(59,130,246,0.35)',
              }}
            >
              <Brain style={{ width: 20, height: 20, stroke: 'white', fill: 'none' }} />
            </motion.div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
              <span style={{ fontSize: 17, fontWeight: 800, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                Offline<span style={{
                  background: 'linear-gradient(135deg,#60A5FA,#A78BFA)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>AI</span>
              </span>
              <span style={{ fontSize: 10, color: '#334155', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Assistant</span>
            </div>
          </button>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <DarkModeToggle />
          {!isDashboard && (
            <motion.button
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate('/dashboard')}
              style={{
                marginLeft: 4, padding: '10px 22px',
                fontSize: 14, fontWeight: 700, color: 'white',
                fontFamily: "'Inter', system-ui, sans-serif",
                background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                border: 'none', borderRadius: 12, cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(59,130,246,0.3)',
                letterSpacing: '-0.01em',
                transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
              }}
            >
              Open App →
            </motion.button>
          )}
        </div>
      </div>
    </motion.header>
  );
};

export default Navbar;
