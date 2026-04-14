import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MessageSquare, Trash2, X, Brain, Clock, Hash } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

const Sidebar = () => {
  const {
    sidebarOpen,
    setSidebarOpen,
    conversations,
    activeConversationId,
    createNewChat,
    setActiveConversation,
    deleteConversation,
    clearChat,
  } = useAppStore();

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-40 lg:hidden"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        transition={{ type: 'spring', stiffness: 340, damping: 34 }}
        className="fixed lg:relative left-0 top-0 h-full z-50 lg:z-auto flex flex-col overflow-hidden"
        style={{
          width: 272,
          background: 'rgba(10,14,26,0.97)',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '4px 0 40px rgba(0,0,0,0.5)',
          willChange: 'transform',
          fontFamily: "'Inter', system-ui, sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 11,
              background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(59,130,246,0.35)',
            }}>
              <Brain style={{ width: 18, height: 18, stroke: 'white', fill: 'none' }} />
            </div>
            <div>
              <span style={{ display: 'block', fontWeight: 800, color: '#F1F5F9', fontSize: 15, lineHeight: 1.2, letterSpacing: '-0.02em' }}>OfflineAI</span>
              <span style={{ display: 'block', fontSize: 10, color: '#334155', fontWeight: 600, marginTop: 1, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Assistant</span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
            aria-label="Close sidebar"
            style={{ padding: 8, borderRadius: 10, background: 'transparent', border: 'none', cursor: 'pointer', color: '#475569', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = '#94A3B8'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* New Chat Button */}
        <div style={{ padding: '14px 14px 8px' }}>
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={createNewChat}
            id="new-chat-btn"
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 10, padding: '13px 16px', borderRadius: 13, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
              color: 'white', fontSize: 14, fontWeight: 700,
              fontFamily: "'Inter', system-ui, sans-serif",
              boxShadow: '0 4px 24px rgba(59,130,246,0.35)',
              letterSpacing: '-0.01em',
              transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            <Plus style={{ width: 18, height: 18, strokeWidth: 2.5 }} />
            New Chat
          </motion.button>
        </div>

        {/* Section label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px 6px' }}>
          <Clock style={{ width: 11, height: 11, stroke: '#334155', fill: 'none' }} />
          <p style={{ fontSize: 10, fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.14em' }}>Recent Chats</p>
        </div>

        {/* Chat History */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 10px 8px' }}>
          <AnimatePresence mode="popLayout">
            {conversations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                <Hash style={{ width: 28, height: 28, stroke: '#1E293B', fill: 'none', margin: '0 auto 10px' }} />
                <p style={{ fontSize: 12, color: '#334155', lineHeight: 1.6 }}>No conversations yet.<br />Start a new chat above.</p>
              </div>
            ) : (
              conversations.map((convo) => {
                const isActive = activeConversationId === convo.id;
                return (
                  <motion.div
                    key={convo.id}
                    layout
                    initial={{ opacity: 0, x: -18 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -18, scale: 0.95 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    onClick={() => {
                      setActiveConversation(convo.id);
                      if (window.innerWidth < 1024) setSidebarOpen(false);
                    }}
                    className="group"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '10px 12px', borderRadius: 12, cursor: 'pointer', marginBottom: 3,
                      transition: 'all 0.2s cubic-bezier(0.4,0,0.2,1)',
                      ...(isActive
                        ? {
                            background: 'linear-gradient(135deg, rgba(59,130,246,0.14), rgba(139,92,246,0.09))',
                            border: '1px solid rgba(59,130,246,0.22)',
                            boxShadow: '0 4px 16px rgba(59,130,246,0.1)',
                          }
                        : { background: 'transparent', border: '1px solid transparent' }
                      ),
                    }}
                    onMouseEnter={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.borderColor = 'transparent';
                      }
                    }}
                  >
                    <div style={{
                      flexShrink: 0, width: 30, height: 30, borderRadius: 9,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isActive ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.04)',
                      border: isActive ? '1px solid rgba(59,130,246,0.25)' : '1px solid transparent',
                    }}>
                      <MessageSquare style={{ width: 13, height: 13, stroke: isActive ? '#60A5FA' : '#475569', fill: 'none' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{
                        display: 'block', fontSize: 13, fontWeight: 500,
                        color: isActive ? '#93C5FD' : '#94A3B8',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        lineHeight: 1.3,
                      }}>
                        {convo.title}
                      </span>
                      <span style={{ display: 'block', fontSize: 10, color: '#334155', marginTop: 2 }}>
                        {formatDate(convo.createdAt)}
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteConversation(convo.id); }}
                      aria-label={`Delete: ${convo.title}`}
                      style={{
                        flexShrink: 0, padding: 6, borderRadius: 8,
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        opacity: 0, transition: 'opacity 0.2s, background 0.2s',
                      }}
                      className="group-hover:opacity-100"
                      onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <Trash2 style={{ width: 13, height: 13, stroke: '#F87171', fill: 'none' }} />
                    </button>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button
            onClick={clearChat}
            id="clear-chat-btn"
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, padding: '10px 16px', borderRadius: 11,
              background: 'transparent', border: '1px solid transparent',
              cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#475569',
              fontFamily: "'Inter', system-ui, sans-serif",
              transition: 'all 0.25s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'; e.currentTarget.style.color = '#F87171'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.color = '#475569'; }}
          >
            <Trash2 style={{ width: 13, height: 13 }} />
            Clear Current Chat
          </button>
        </div>
      </motion.aside>
    </>
  );
};

export default Sidebar;
