import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

const DEFAULT_BRAND_MEDIA = {
  url: '/assets/logos/sriyas-emblem.png',
  alt: 'Sriyas Healthcare emblem',
  companyName: 'SRIYAS HEALTHCARE',
  companySubtitle: 'PVT LTD'
};

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
  brandMedia: DEFAULT_BRAND_MEDIA,
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
  const [brandMedia, setBrandMedia] = useState(DEFAULT_BRAND_MEDIA);

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
    if (!imgRect.width || !imgRect.height || !textRect.width || !textRect.height) return null;

    const nextRects = {
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

    setNavTargetRects((prev) => {
      if (
        prev &&
        Math.abs(prev.img.top - nextRects.img.top) < 0.5 &&
        Math.abs(prev.img.left - nextRects.img.left) < 0.5 &&
        Math.abs(prev.img.width - nextRects.img.width) < 0.5 &&
        Math.abs(prev.img.height - nextRects.img.height) < 0.5 &&
        Math.abs(prev.text.top - nextRects.text.top) < 0.5 &&
        Math.abs(prev.text.left - nextRects.text.left) < 0.5 &&
        Math.abs(prev.text.width - nextRects.text.width) < 0.5 &&
        Math.abs(prev.text.height - nextRects.text.height) < 0.5
      ) {
        return prev;
      }
      return nextRects;
    });

    return nextRects;
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

  // Observe size changes on the navbar brand elements across laptop/desktop/mobile viewports
  useEffect(() => {
    if (!isMorphEnabled || typeof ResizeObserver === 'undefined') return undefined;

    const ro = new ResizeObserver(() => {
      measureNavTargets();
    });

    if (navImgRef.current) ro.observe(navImgRef.current);
    if (navTextRef.current) ro.observe(navTextRef.current);

    return () => ro.disconnect();
  }, [isMorphEnabled, brandMedia, measureNavTargets]);

  // Reset scroll progress cleanly when navigating routes
  useEffect(() => {
    if (!isHomepage) {
      setScrollProgress(1);
      setBrandMedia(DEFAULT_BRAND_MEDIA);
      return;
    }
    if (reducedMotion) {
      setScrollProgress(1);
      return;
    }
    const y = window.scrollY || 0;
    const morphDist = Math.min(320, Math.max(180, window.innerHeight * 0.36));
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
