import React, { useEffect, useRef, useState } from 'react';
import './CustomCursor.css';

const CustomCursor: React.FC = () => {
  const dotRef = useRef<HTMLDivElement>(null);
  const outlineRef = useRef<HTMLDivElement>(null);
  
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Position state for outline lagging
  const cursorInfo = useRef({
    dotX: 0,
    dotY: 0,
    outlineX: 0,
    outlineY: 0
  });

  const requestRef = useRef<number>();

  const updateCursor = () => {
    // Smoothen outline position towards dot position
    cursorInfo.current.outlineX += (cursorInfo.current.dotX - cursorInfo.current.outlineX) * 0.2;
    cursorInfo.current.outlineY += (cursorInfo.current.dotY - cursorInfo.current.outlineY) * 0.2;

    if (dotRef.current) {
      dotRef.current.style.transform = `translate3d(${cursorInfo.current.dotX}px, ${cursorInfo.current.dotY}px, 0) translate3d(-50%, -50%, 0)`;
    }

    if (outlineRef.current) {
      outlineRef.current.style.transform = `translate3d(${cursorInfo.current.outlineX}px, ${cursorInfo.current.outlineY}px, 0) translate3d(-50%, -50%, 0)`;
    }

    requestRef.current = requestAnimationFrame(updateCursor);
  };

  useEffect(() => {
    // Only init on desktop
    if (window.innerWidth <= 768) return;

    requestRef.current = requestAnimationFrame(updateCursor);

    const onMouseMove = (e: MouseEvent) => {
      if (!isVisible) setIsVisible(true);
      cursorInfo.current.dotX = e.clientX;
      cursorInfo.current.dotY = e.clientY;
    };

    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isClickable = 
        target.tagName.toLowerCase() === 'a' || 
        target.tagName.toLowerCase() === 'button' || 
        target.closest('a') !== null || 
        target.closest('button') !== null ||
        window.getComputedStyle(target).cursor === 'pointer';
        
      setIsHovering(isClickable);
    };

    const onMouseLeave = () => {
      setIsVisible(false);
    };
    
    const onMouseEnter = () => {
      setIsVisible(true);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseover', onMouseOver);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseover', onMouseOver);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
    };
  }, [isVisible]);

  // Handle resizing to disable on mobile
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!isDesktop) return null;

  return (
    <div style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 0.3s ease' }}>
      <div 
        ref={dotRef}
        className={`custom-cursor-dot ${isHovering ? 'hovering' : ''}`} 
      />
      <div 
        ref={outlineRef}
        className={`custom-cursor-outline ${isHovering ? 'hovering' : ''}`} 
      />
    </div>
  );
};

export default CustomCursor;
