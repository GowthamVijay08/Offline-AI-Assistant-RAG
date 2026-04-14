import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Image, X, CheckCircle, AlertCircle, Loader2, CloudUpload } from 'lucide-react';
import useAppStore from '../../store/useAppStore';
import { uploadFile } from '../../services/api';

const UploadBox = () => {
  const {
    uploadedFile,
    uploadStatus,
    uploadError,
    setUploadedFile,
    setUploadStatus,
    setUploadError,
    setFileId,
    clearUpload,
    clearChat,
  } = useAppStore();

  const [preview, setPreview] = useState(null);

  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      const error = rejectedFiles[0].errors[0];
      if (error.code === 'file-too-large') {
        setUploadError('File is too large. Maximum size is 50MB.');
      } else {
        setUploadError('Invalid file type. Please upload a PDF or image file (PNG, JPG, WEBP).');
      }
      return;
    }

    const file = acceptedFiles[0];
    if (!file) return;

    clearChat();
    setUploadedFile(file);
    setUploadStatus('uploading');

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }

    try {
      const response = await uploadFile(file);
      setFileId(response.file_id);
      setUploadStatus('success');
    } catch (err) {
      setUploadError(err.message || 'Upload failed. Please try again.');
    }
  }, [setUploadedFile, setUploadStatus, setUploadError, setFileId]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
  });

  const getFileIcon = (file) => {
    if (!file) return CloudUpload;
    if (file.type === 'application/pdf') return FileText;
    if (file.type.startsWith('image/')) return Image;
    return FileText;
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const FileIcon = getFileIcon(uploadedFile);

  return (
    <div className="w-full" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <AnimatePresence mode="wait">
        {!uploadedFile || uploadStatus === 'error' ? (
          /* ─── Dropzone ─── */
          <motion.div
            key="dropzone"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            {...getRootProps()}
            style={{
              position: 'relative', borderRadius: 18, textAlign: 'center',
              cursor: 'pointer', overflow: 'hidden',
              transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)',
              ...(isDragActive
                ? {
                    border: '2px solid rgba(59,130,246,0.6)',
                    background: 'rgba(59,130,246,0.06)',
                    boxShadow: '0 8px 40px rgba(59,130,246,0.15), 0 0 0 4px rgba(59,130,246,0.06)',
                    transform: 'scale(1.01)',
                  }
                : {
                    border: '2px dashed rgba(255,255,255,0.09)',
                    background: 'rgba(17,24,39,0.4)',
                    boxShadow: 'none',
                  }
              ),
            }}
            role="button"
            aria-label="Upload file dropzone"
            onMouseEnter={e => {
              if (!isDragActive) {
                e.currentTarget.style.borderColor = 'rgba(59,130,246,0.35)';
                e.currentTarget.style.background = 'rgba(59,130,246,0.03)';
                e.currentTarget.style.boxShadow = '0 4px 24px rgba(59,130,246,0.08)';
              }
            }}
            onMouseLeave={e => {
              if (!isDragActive) {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)';
                e.currentTarget.style.background = 'rgba(17,24,39,0.4)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            <input {...getInputProps()} aria-label="File upload input" />

            <motion.div
              animate={isDragActive ? { scale: 1.04 } : { scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '28px 24px' }}
            >
              <motion.div
                animate={isDragActive ? { y: -10, rotate: -6 } : { y: 0, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300 }}
                style={{
                  width: 64, height: 64, borderRadius: 18,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.3s',
                  ...(isDragActive
                    ? { background: 'rgba(59,130,246,0.2)', boxShadow: '0 8px 32px rgba(59,130,246,0.2)' }
                    : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }
                  ),
                }}
              >
                <CloudUpload style={{ width: 30, height: 30, stroke: isDragActive ? '#60A5FA' : '#475569', fill: 'none', transition: 'stroke 0.3s' }} />
              </motion.div>

              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#CBD5E1', marginBottom: 4 }}>
                  {isDragActive ? 'Drop your file here!' : 'Drag & drop your file'}
                </p>
                <p style={{ fontSize: 12, color: '#475569' }}>
                  or <span style={{ color: '#60A5FA', fontWeight: 600, cursor: 'pointer' }}>browse to choose</span>
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                {['PDF', 'PNG', 'JPG', 'WEBP'].map((ext) => (
                  <span key={ext} style={{
                    padding: '3px 10px', borderRadius: 8,
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                    fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em',
                  }}>
                    {ext}
                  </span>
                ))}
              </div>
              <p style={{ fontSize: 10, color: '#334155', marginTop: 2 }}>Maximum file size: 50MB</p>
            </motion.div>

            {/* Error inside dropzone */}
            {uploadError && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  margin: '0 20px 16px',
                  padding: '10px 14px', borderRadius: 12,
                  background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                }}
              >
                <AlertCircle style={{ width: 15, height: 15, stroke: '#F87171', fill: 'none', flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: '#F87171', fontWeight: 600 }}>{uploadError}</p>
              </motion.div>
            )}
          </motion.div>
        ) : (
          /* ─── File Preview Card ─── */
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{
              borderRadius: 18, border: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(17,24,39,0.7)', padding: '14px 16px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
              transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(59,130,246,0.25)';
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(59,130,246,0.1)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
              e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.25)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* Thumbnail / Icon */}
              <div style={{ flexShrink: 0 }}>
                {preview ? (
                  <img src={preview} alt="File preview" style={{ width: 52, height: 52, borderRadius: 12, objectFit: 'cover', border: '2px solid rgba(255,255,255,0.1)' }} />
                ) : (
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,rgba(59,130,246,0.15),rgba(139,92,246,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(59,130,246,0.2)' }}>
                    <FileIcon style={{ width: 26, height: 26, stroke: '#60A5FA', fill: 'none' }} />
                  </div>
                )}
              </div>

              {/* File Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#E2E8F0', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {uploadedFile.name}
                </p>
                <p style={{ fontSize: 11, color: '#475569', fontWeight: 500 }}>
                  {formatFileSize(uploadedFile.size)} · {uploadedFile.type.split('/')[1]?.toUpperCase()}
                </p>

                {/* Status Badges */}
                <div style={{ marginTop: 8 }}>
                  {uploadStatus === 'uploading' && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 9999, background: 'rgba(245,158,11,0.1)', color: '#FCD34D', fontSize: 11, fontWeight: 700, border: '1px solid rgba(245,158,11,0.2)' }}
                    >
                      <Loader2 style={{ width: 11, height: 11 }} className="animate-spin" />
                      Uploading...
                    </motion.span>
                  )}
                  {uploadStatus === 'success' && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 9999, background: 'rgba(16,185,129,0.1)', color: '#34D399', fontSize: 11, fontWeight: 700, border: '1px solid rgba(16,185,129,0.2)' }}
                    >
                      <CheckCircle style={{ width: 11, height: 11 }} />
                      File uploaded successfully
                    </motion.span>
                  )}
                </div>
              </div>

              {/* Remove button */}
              <button
                onClick={() => { clearUpload(); setPreview(null); }}
                aria-label="Remove uploaded file"
                style={{ flexShrink: 0, padding: 8, borderRadius: 10, background: 'transparent', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <X style={{ width: 16, height: 16, stroke: '#475569' }} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UploadBox;
