import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, Mic } from 'lucide-react';
import useAppStore from '../../store/useAppStore';

const ChatInput = ({ onSend }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);
  const { isLoading, fileId } = useAppStore();

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 168) + 'px';
    }
  };

  const hasContent = input.trim().length > 0;

  return (
    <div style={{
      borderTop: '1px solid rgba(255,255,255,0.05)',
      background: 'rgba(13,17,30,0.8)',
      padding: '14px 16px',
      borderRadius: '0 0 20px 20px',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, maxWidth: 960, margin: '0 auto' }}>
        {/* Textarea wrapper */}
        <div style={{ flex: 1, position: 'relative' }}>
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder={fileId ? "Ask a question..." : "Upload a file to start"}
            disabled={isLoading || !fileId}
            rows={1}
            aria-label="Type your message"
            id="chat-input"
            style={{
              width: '100%',
              resize: 'none',
              borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(30,41,59,0.65)',
              padding: '14px 18px',
              fontSize: 15,
              color: '#E2E8F0',
              outline: 'none',
              fontFamily: "'Inter', system-ui, sans-serif",
              maxHeight: 168,
              lineHeight: 1.65,
              transition: 'border-color 0.25s, box-shadow 0.25s',
              backdropFilter: 'blur(8px)',
            }}
            onFocus={e => {
              e.target.style.borderColor = 'rgba(59,130,246,0.45)';
              e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.08), 0 4px 16px rgba(0,0,0,0.2)';
            }}
            onBlur={e => {
              e.target.style.borderColor = 'rgba(255,255,255,0.08)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Send Button */}
        <motion.button
          whileHover={input.trim() && !isLoading && !!fileId ? { scale: 1.08, y: -1 } : {}}
          whileTap={input.trim() && !isLoading && !!fileId ? { scale: 0.92 } : {}}
          onClick={handleSubmit}
          disabled={!input.trim() || isLoading || !fileId}
          aria-label="Send message"
          id="send-btn"
          style={{
            flexShrink: 0,
            width: 50,
            height: 50,
            borderRadius: 14,
            border: 'none',
            cursor: input.trim() && !isLoading && !!fileId ? 'pointer' : 'not-allowed',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
            ...(input.trim() && !isLoading && !!fileId
              ? {
                  background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                  boxShadow: '0 4px 20px rgba(59,130,246,0.4)',
                }
              : {
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }
            ),
          }}
        >
          <Send style={{ width: 18, height: 18, stroke: input.trim() && !isLoading && !!fileId ? 'white' : '#475569', fill: 'none' }} />
        </motion.button>
      </div>

      {/* Keyboard hints */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginTop: 10 }}>
        {[['Enter', 'send'], ['Shift+Enter', 'new line']].map(([key, action]) => (
          <p key={key} style={{ fontSize: 10, color: '#334155', display: 'flex', alignItems: 'center', gap: 5 }}>
            <kbd style={{ padding: '2px 7px', borderRadius: 6, background: '#1E293B', border: '1px solid rgba(255,255,255,0.07)', fontFamily: 'monospace', fontSize: 9, color: '#475569' }}>{key}</kbd>
            <span style={{ color: '#334155' }}>{action}</span>
          </p>
        ))}
      </div>
    </div>
  );
};

export default ChatInput;
