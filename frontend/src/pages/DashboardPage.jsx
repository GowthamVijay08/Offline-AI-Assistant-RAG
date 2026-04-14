import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import UploadBox from '../components/upload/UploadBox';
import ChatBox from '../components/chat/ChatBox';
import useAppStore from '../store/useAppStore';

const DashboardPage = () => {
  const { sidebarOpen, setSidebarOpen } = useAppStore();

  // Auto-manage sidebar based on viewport
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarOpen]);

  return (
    <div className="h-screen flex flex-col bg-dark-900 overflow-hidden">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <motion.main
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="flex-1 flex flex-col overflow-hidden"
        >
          {/* Scrollable content wrapper */}
          <div className="flex-1 flex flex-col overflow-hidden p-3 sm:p-4 md:p-5 lg:p-6 gap-3 sm:gap-4">
            {/* Upload Section — compact, collapsible feel */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2, ease: 'easeOut' }}
              className="flex-shrink-0"
            >
              <UploadBox />
            </motion.div>

            {/* Chat Section — fills remaining vertical space */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut' }}
              className="flex-1 min-h-0"
            >
              <ChatBox />
            </motion.div>
          </div>
        </motion.main>
      </div>
    </div>
  );
};

export default DashboardPage;
