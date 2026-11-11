import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

const HomepageScrollContext = createContext({
  isHomepage: false,
  isMorphEnabled: false,
  reducedMotion: false,
  scrollProgress: 1,
  setScrollProgress: () => {},
  navTargetRects: null,
  registerNavImgRef: () => {},
  registerNavTextRef: () => {},
  measureNavTargets: () => null,
  brandMedia: { url: '/assets/logos/sriyas-emblem.png', alt: 'Sriyas Healthcare emblem' },
  setBrandMedia: () => {}
});

export function HomepageScrollProvider({ children }) {
  const location = useLocation();
  const isHomepage = location.pathname === '/';

  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const [scrollProgress, setScrollProgress] = useState(() => (isHomepage && !reducedMotion ? 0 : 1));
  const [navTargetRects, setNavTargetRects] = useState(null);
  const [brandMedia, setBrandMedia] = useState({
    url: '/assets/logos/sriyas-emblem.png',
    alt: 'Sriyas Healthcare emblem'
  });

  const navImgRef = useRef(null);
  const navTextRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setReducedMotion(mq.matches);
    mq.addEventListener('change', handleChange);
    return () => mq.removeEventListener('change', handleChange);
  }, []);

  const isMorphEnabled = isHomepage && !reducedMotion;

  const measureNavTargets = useCallback(() => {
    if (!navImgRef.current || !navTextRef.current) return null;
    const imgRect = navImgRef.current.getBoundingClientRect();
    const textRect = navTextRef.current.getBoundingClientRect();
    if (!imgRect.width || !imgRect.height || !textRect.width) return null;

    const rects = {
      img: {
        top: imgRect.top,
        left: imgRect.left,
        width: imgRect.width,
        height: imgRect.height
      },
      text: {
        top: textRect.top,
        left: textRect.left,
        width: textRect.width,
        height: textRect.height
      }
    };
    setNavTargetRects(rects);
    return rects;
  }, []);

  const registerNavImgRef = useCallback(
    (node) => {
      navImgRef.current = node;
      if (node && navTextRef.current) {
        measureNavTargets();
      }
    },
    [measureNavTargets]
  );

  const registerNavTextRef = useCallback(
    (node) => {
      navTextRef.current = node;
      if (node && navImgRef.current) {
        measureNavTargets();
      }
    },
    [measureNavTargets]
  );

  useEffect(() => {
    if (!isHomepage) {
      setScrollProgress(1);
      setBrandMedia({ url: '/assets/logos/sriyas-emblem.png', alt: 'Sriyas Healthcare emblem' });
      return;
    }
    if (reducedMotion) {
      setScrollProgress(1);
      return;
    }
    const y = window.scrollY || 0;
    const morphDist = Math.min(340, Math.max(220, window.innerHeight * 0.42));
    setScrollProgress(Math.min(1, Math.max(0, y / morphDist)));
  }, [isHomepage, reducedMotion]);

  return (
    <HomepageScrollContext.Provider
      value={{
        isHomepage,
        isMorphEnabled,
        reducedMotion,
        scrollProgress,
        setScrollProgress,
        navTargetRects,
        registerNavImgRef,
        registerNavTextRef,
        measureNavTargets,
        brandMedia,
        setBrandMedia
      }}
    >
      {children}
    </HomepageScrollContext.Provider>
  );
}

export function useHomepageScroll() {
  return useContext(HomepageScrollContext);
}
