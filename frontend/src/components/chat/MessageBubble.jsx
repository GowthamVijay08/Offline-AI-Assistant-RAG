import { motion } from 'framer-motion';
import { User, Bot, Copy, Check } from 'lucide-react';
import { useState } from 'react';

const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) { /* unavailable */ }
  };

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{ display: 'flex', gap: 12, justifyContent: isUser ? 'flex-end' : 'flex-start', fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* AI Avatar */}
      {!isUser && (
        <div style={{
          flexShrink: 0, width: 36, height: 36, borderRadius: 11,
          background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginTop: 2,
          boxShadow: '0 4px 16px rgba(59,130,246,0.3)',
        }}>
          <Bot style={{ width: 18, height: 18, stroke: 'white', fill: 'none' }} />
        </div>
      )}

      {/* Content bubble */}
      <div style={{ maxWidth: '74%', order: isUser ? -1 : 0 }} className="group">
        <div style={{
          padding: '13px 18px',
          borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          ...(isUser
            ? {
                background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                boxShadow: '0 4px 24px rgba(59,130,246,0.28)',
                color: 'white',
              }
            : {
                background: 'rgba(30,41,59,0.8)',
                border: '1px solid rgba(255,255,255,0.07)',
                color: '#CBD5E1',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                backdropFilter: 'blur(8px)',
              }
          ),
        }}>
          {isUser
            ? <p style={{ fontSize: 15, lineHeight: 1.75, whiteSpace: 'pre-wrap', color: 'white', fontWeight: 400 }}>{message.content}</p>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {(() => {
                  const answer = message.content;
                  if (!answer) return <p className="text-gray-400 italic">No response received</p>;
                  const paragraphs = answer.split('. ').filter(p => p.trim().length > 0);
                  return paragraphs.map((p, i) => (
                    <p key={i} className="mb-2 leading-relaxed text-gray-200" style={{ fontSize: 14 }}>
                      {p}{p.endsWith('.') ? '' : '.'}
                    </p>
                  ));
                })()}
              </div>
          }
        </div>

        {/* Meta row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          marginTop: 5, paddingLeft: 4, paddingRight: 4,
          justifyContent: isUser ? 'flex-end' : 'flex-start',
        }}>
          <span style={{ fontSize: 10, color: '#334155', fontWeight: 500 }}>{formatTime(message.timestamp)}</span>
          {!isUser && (
            <button
              onClick={handleCopy}
              aria-label="Copy message"
              style={{
                opacity: 0, padding: '5px 7px', borderRadius: 8,
                background: 'transparent', border: 'none', cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              className="group-hover:opacity-100"
              onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '0'; e.currentTarget.style.background = 'transparent'; }}
            >
              {copied
                ? <Check style={{ width: 12, height: 12, stroke: '#34D399', fill: 'none' }} />
                : <Copy style={{ width: 12, height: 12, stroke: '#64748B', fill: 'none' }} />
              }
            </button>
          )}
        </div>

        {/* Sources Box (EXPLAINABLE AI 🔥) */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-4 p-3 border border-gray-700/50 rounded-lg bg-gray-800/40 backdrop-blur-sm">
            <p className="text-xs font-semibold text-gray-300 mb-2 flex items-center gap-1.5">
              <span className="text-blue-400">📄</span> Sources
            </p>
            <div className="space-y-1.5">
              {message.sources.slice(0, 3).map((src, index) => {
                const text = typeof src === 'string' ? src : (src.page_content || src.text || JSON.stringify(src));
                return (
                  <p key={index} className="text-[11px] text-gray-400 leading-normal line-clamp-2 hover:line-clamp-none transition-all duration-300 cursor-help">
                    • {text}
                  </p>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div style={{
          flexShrink: 0, width: 36, height: 36, borderRadius: 11,
          background: 'rgba(30,41,59,0.9)',
          border: '1px solid rgba(255,255,255,0.09)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginTop: 2,
          boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
        }}>
          <User style={{ width: 18, height: 18, stroke: '#94A3B8', fill: 'none' }} />
        </div>
      )}
    </motion.div>
  );
};

export default MessageBubble;
