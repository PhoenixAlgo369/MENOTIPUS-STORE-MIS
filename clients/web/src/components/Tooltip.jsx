import React, { useState, useEffect, useRef } from 'react';
import { Info } from 'lucide-react';

const Tooltip = ({ text, position = "top", children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef(null);

  const showTooltip = () => setIsVisible(true);
  const hideTooltip = () => setIsVisible(false);

  useEffect(() => {
    const handleBodyClick = () => {
      setIsVisible(false);
    };

    document.body.addEventListener('click', handleBodyClick);
    return () => {
      document.body.removeEventListener('click', handleBodyClick);
    };
  }, []);

  const getPositionClasses = () => {
    switch(position) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-2';
      default:
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-2';
    }
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onClick={(e) => {
        // Only prevent propagation if we're showing the tooltip
        // Allow clicks on interactive children (buttons, etc.) to propagate
        const isInteractive = e.target.tagName === 'BUTTON' || e.target.closest('button');
        if (!isInteractive) {
          e.stopPropagation();
          if (!isVisible) showTooltip();
        }
      }}
    >
      {children}
      {isVisible && (
        <div 
          className={`absolute z-50 bg-gray-900 text-white text-xs rounded py-1 px-2 min-w-max ${getPositionClasses()} transition-opacity duration-200`}
          ref={tooltipRef}
        >
          {text}
          <div className={`absolute w-0 h-0 border-4 border-transparent ${position === 'top' ? 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-900' : 
              position === 'bottom' ? 'bottom-full left-1/2 transform -translate-x-1/2 border-b-gray-900' :
              position === 'left' ? 'right-full top-1/2 transform -translate-y-1/2 border-l-gray-900' :
              'left-full top-1/2 transform -translate-y-1/2 border-r-gray-900'}`}></div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;