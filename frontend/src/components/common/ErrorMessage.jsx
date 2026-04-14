import { motion } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

const ErrorMessage = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className="flex items-start gap-3 p-4 rounded-xl bg-red-500/8 border border-red-500/20 text-red-400"
      role="alert"
    >
      <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
      <p className="flex-1 text-sm font-medium leading-relaxed">{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-red-500/15 transition-colors text-red-400"
          aria-label="Dismiss error"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </motion.div>
  );
};

export default ErrorMessage;
