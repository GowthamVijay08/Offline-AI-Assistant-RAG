import { motion } from 'framer-motion';

const Loader = ({ text = 'AI is thinking', size = 'md' }) => {
  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2.5 h-2.5',
    lg: 'w-3.5 h-3.5',
  };

  return (
    <div className="flex items-center gap-3" role="status" aria-label="Loading">
      <div className="flex items-center gap-1.5">
        <span className={`typing-dot ${dotSizes[size]} rounded-full bg-blue-500`} />
        <span className={`typing-dot ${dotSizes[size]} rounded-full bg-purple-400`} />
        <span className={`typing-dot ${dotSizes[size]} rounded-full bg-blue-400`} />
      </div>
      {text && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-gray-500 font-medium"
        >
          {text}...
        </motion.span>
      )}
    </div>
  );
};

export default Loader;
