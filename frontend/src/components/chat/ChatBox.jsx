import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import Loader from '../common/Loader';
import EmptyState from '../common/EmptyState';
import ErrorMessage from '../common/ErrorMessage';
import useAppStore from '../../store/useAppStore';
import { sendQuery } from '../../services/api';
import { Bot, Cpu } from 'lucide-react';

const ChatBox = () => {
  const {
    messages,
    isLoading,
    error,
    addMessage,
    setLoading,
    setError,
    clearError,
    uploadedFile,
    fileId,
  } = useAppStore();

  const chatEndRef = useRef(null);
  
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (content) => {
    if (!fileId) {
      setError('Please upload a file first');
      return;
    }

    addMessage({ role: 'user', content });
    setLoading(true);
    clearError();

    try {
      const result = await sendQuery(content, fileId);
      addMessage({ role: 'assistant', content: result.answer, sources: result.sources });
    } catch (err) {
      setError(err.message || 'Failed to get response. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        background: 'rgba(13,17,30,0.95)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 20,
        boxShadow: '0 8px 40px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2)',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* Chat Header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(17,24,39,0.6)',
          backdropFilter: 'blur(12px)',
          borderRadius: '20px 20px 0 0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 11,
            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(59,130,246,0.35)',
          }}>
            <Bot style={{ width: 18, height: 18, stroke: 'white', fill: 'none' }} />
          </div>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9', lineHeight: 1.2, letterSpacing: '-0.01em' }}>AI Assistant</h2>
            <p style={{ fontSize: 11, color: '#475569', fontWeight: 500, marginTop: 1 }}>
              {uploadedFile ? `Analyzing: ${uploadedFile.name}` : 'Ready to help'}
            </p>
          </div>
        </div>

        {/* Status indicator */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '6px 14px', borderRadius: 9999,
          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
        }}>
          <span className="relative flex" style={{ width: 8, height: 8 }}>
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full" style={{ background: '#34D399', opacity: 0.7 }} />
            <span style={{ position: 'relative', display: 'flex', width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
          </span>
          <span style={{ fontSize: 10, color: '#34D399', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Online</span>
        </div>
      </div>

      {/* Messages Area */}
      <div
        className="flex-1 overflow-y-auto chat-scroll"
        style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }} // Using gap-4 (16px) as requested
        id="chat-messages"
      >
        {!fileId ? (
          <div className="flex items-center justify-center h-full text-gray-400 font-medium">
            <div className="text-center">
              <p className="text-3xl mb-4">📄</p>
              <p>Upload a document to start asking questions</p>
            </div>
          </div>
        ) : (
          <>
            {messages.length === 0 && <EmptyState type="chat" />}
            
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex items-start gap-3"
              >
                <div style={{ width: 36, height: 36, borderRadius: 11, background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 4 }}>
                  <Cpu style={{ width: 16, height: 16, stroke: 'white', fill: 'none' }} />
                </div>
                <div className="animate-pulse text-gray-400" style={{ padding: '12px 18px', borderRadius: '18px 18px 18px 4px', background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>AI is thinking...</span>
                </div>
              </motion.div>
            )}

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-sm mt-2 px-4 py-2 bg-red-400/10 border border-red-400/20 rounded-lg flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                {error}
              </motion.div>
            )}
          </>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} />
    </div>
  );
};

export default ChatBox;
