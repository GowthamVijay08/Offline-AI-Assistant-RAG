import { motion } from 'framer-motion';
import { MessageSquarePlus, Upload, Sparkles, ArrowRight } from 'lucide-react';

const EmptyState = ({ type = 'chat' }) => {
  const states = {
    chat: {
      icon: MessageSquarePlus,
      title: 'Start a Conversation',
      description: 'Upload a file and ask questions about it, or simply start chatting with the AI assistant.',
      gradient: 'from-blue-500 to-purple-600',
      glowColor: 'rgba(59,130,246,0.15)',
      suggestions: [
        'Summarize the uploaded document',
        'What are the key points?',
        'Explain the main concepts',
      ],
    },
    upload: {
      icon: Upload,
      title: 'No File Uploaded',
      description: 'Drag and drop a PDF or image file to get started with document analysis.',
      gradient: 'from-emerald-500 to-cyan-500',
      glowColor: 'rgba(16,185,129,0.15)',
      suggestions: [],
    },
  };

  const state = states[type] || states.chat;
  const Icon = state.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex flex-col items-center justify-center py-12 md:py-16 px-6 text-center"
    >
      {/* Animated icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
        className="relative mb-6"
      >
        <div
          className={`absolute inset-0 w-20 h-20 rounded-2xl bg-gradient-to-br ${state.gradient} opacity-20 blur-xl`}
        />
        <div className={`relative w-20 h-20 rounded-2xl bg-gradient-to-br ${state.gradient} flex items-center justify-center shadow-xl float`}>
          <Icon className="w-9 h-9 text-white" />
        </div>
      </motion.div>

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="text-xl font-bold text-white mb-2"
      >
        {state.title}
      </motion.h3>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="text-gray-500 max-w-sm text-sm leading-relaxed mb-6"
      >
        {state.description}
      </motion.p>

      {/* Quick suggestions for chat */}
      {state.suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
          className="flex flex-col gap-2 w-full max-w-xs"
        >
          <p className="text-[10px] font-bold text-gray-700 uppercase tracking-[0.15em] mb-1">
            <Sparkles className="w-3 h-3 inline mr-1.5 -mt-0.5 text-blue-500" />
            Try asking
          </p>
          {state.suggestions.map((suggestion, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/3 border border-white/6 text-xs text-gray-500 font-medium cursor-default hover:bg-white/5 hover:border-blue-500/20 hover:text-gray-300 transition-all duration-200"
            >
              <ArrowRight className="w-3 h-3 text-blue-400 flex-shrink-0" />
              <span className="truncate">{suggestion}</span>
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
};

export default EmptyState;
