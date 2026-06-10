import { ReactNode, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { createPortal } from 'react-dom';

type Placement = 'right' | 'left' | 'top' | 'bottom';

export function Tooltip({ children, content, placement = 'right' }: { children: ReactNode; content: ReactNode; placement?: Placement }) {
  const [isVisible, setIsVisible] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });

  const updateCoords = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setCoords({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    }
  };

  useEffect(() => {
    if (isVisible) {
      updateCoords();
      window.addEventListener('scroll', updateCoords, true);
      window.addEventListener('resize', updateCoords);
      return () => {
        window.removeEventListener('scroll', updateCoords, true);
        window.removeEventListener('resize', updateCoords);
      };
    }
  }, [isVisible]);

  const handleMouseEnter = () => {
    updateCoords();
    setIsVisible(true);
  };

  const getPlacementStyles = () => {
    switch (placement) {
      case 'left':
        return {
          style: { left: coords.left - 8, top: coords.top + coords.height / 2, position: 'fixed' as const },
          initial: { opacity: 0, x: "-100%", y: "-50%", scale: 0.95 },
          animate: { opacity: 1, x: "-100%", y: "-50%", scale: 1 },
          exit: { opacity: 0, x: "-100%", y: "-50%", scale: 0.95 },
          arrow: (
            <div className="absolute top-1/2 left-full -translate-y-1/2 -ml-[1px] border-solid border-l-[var(--border-divider)] border-l-[6px] border-y-transparent border-y-[6px] border-r-0">
              <div className="absolute top-1/2 left-[1px] -translate-y-1/2 border-solid border-l-[var(--bg-card-solid)] border-l-[5px] border-y-transparent border-y-[5px] border-r-0"></div>
            </div>
          )
        };
      case 'top':
        return {
          style: { left: coords.left + coords.width / 2, top: coords.top - 8, position: 'fixed' as const },
          initial: { opacity: 0, x: "-50%", y: "-100%", scale: 0.95 },
          animate: { opacity: 1, x: "-50%", y: "-100%", scale: 1 },
          exit: { opacity: 0, x: "-50%", y: "-100%", scale: 0.95 },
          arrow: (
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-solid border-t-[var(--border-divider)] border-t-[6px] border-x-transparent border-x-[6px] border-b-0">
              <div className="absolute bottom-[1px] left-1/2 -translate-x-1/2 border-solid border-t-[var(--bg-card-solid)] border-t-[5px] border-x-transparent border-x-[5px] border-b-0"></div>
            </div>
          )
        };
      case 'bottom':
        return {
          style: { left: coords.left + coords.width / 2, top: coords.top + coords.height + 8, position: 'fixed' as const },
          initial: { opacity: 0, x: "-50%", y: 0, scale: 0.95 },
          animate: { opacity: 1, x: "-50%", y: 0, scale: 1 },
          exit: { opacity: 0, x: "-50%", y: 0, scale: 0.95 },
          arrow: (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-[1px] border-solid border-b-[var(--border-divider)] border-b-[6px] border-x-transparent border-x-[6px] border-t-0">
              <div className="absolute top-[1px] left-1/2 -translate-x-1/2 border-solid border-b-[var(--bg-card-solid)] border-b-[5px] border-x-transparent border-x-[5px] border-t-0"></div>
            </div>
          )
        };
      case 'right':
      default:
        return {
          style: { left: coords.left + coords.width + 8, top: coords.top + coords.height / 2, position: 'fixed' as const },
          initial: { opacity: 0, x: 0, y: "-50%", scale: 0.95 },
          animate: { opacity: 1, x: 0, y: "-50%", scale: 1 },
          exit: { opacity: 0, x: 0, y: "-50%", scale: 0.95 },
          arrow: (
            <div className="absolute top-1/2 right-full -translate-y-1/2 -mr-[1px] border-solid border-r-[var(--border-divider)] border-r-[6px] border-y-transparent border-y-[6px] border-l-0">
              <div className="absolute top-1/2 right-[1px] -translate-y-1/2 border-solid border-r-[var(--bg-card-solid)] border-r-[5px] border-y-transparent border-y-[5px] border-l-0"></div>
            </div>
          )
        };
    }
  };

  const placementConfig = getPlacementStyles();

  return (
    <div 
      ref={triggerRef}
      className="relative inline-flex items-center justify-center h-full w-full min-w-0"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {isVisible && content && (
            <motion.div
              initial={placementConfig.initial}
              animate={placementConfig.animate}
              exit={placementConfig.exit}
              transition={{ duration: 0.15 }}
              className="z-[99999] pointer-events-none"
              style={placementConfig.style}
            >
              <div className="bg-[var(--bg-card-solid)] border border-[var(--border-divider)] text-[var(--text-primary)] text-[12px] px-4 py-3 rounded-xl shadow-xl whitespace-nowrap min-w-[200px] max-w-[280px] text-left leading-relaxed relative">
                {content}
                {placementConfig.arrow}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
