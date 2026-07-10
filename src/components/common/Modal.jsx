import React, { useEffect, useRef } from 'react';

export const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  headerGradient = 'from-secondary to-indigo-600',
  maxWidth = 'max-w-md',
}) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(15,10,40,0.55)] backdrop-blur-sm"
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className={`bg-white rounded-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col overflow-hidden shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`bg-gradient-to-r ${headerGradient} px-6 py-5 text-white flex-shrink-0 relative`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 rounded-full w-8 h-8 flex items-center justify-center text-white transition-colors"
          >
            ✕
          </button>
          <h3 className="font-nunito text-lg font-extrabold">{title}</h3>
          {subtitle && <p className="text-sm opacity-75 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {footer && (
          <div className="flex-shrink-0 px-6 py-4 border-t border-[#e8e4f0] bg-white">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
