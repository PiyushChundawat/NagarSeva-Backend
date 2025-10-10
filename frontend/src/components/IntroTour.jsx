import React, { useEffect } from 'react';
import introJs from 'intro.js';
import 'intro.js/introjs.css';

export default function IntroTour({ steps = [], start = false, onExit } ) {
  useEffect(() => {
    if (!start) return;

    // Pre-filter steps to only those whose selectors exist on the page
    const mapped = steps.map(s => {
      try {
        if (!document.querySelector(s.element)) {
          if (s.element.includes('nav') && document.querySelector('#nav-main')) {
            return { ...s, element: '#nav-main' };
          }
        }
      } catch (e) {}
      return s;
    });

    const available = mapped.filter(s => {
      try { return !!document.querySelector(s.element); } catch (e) { return false; }
    });

    if (!available.length) {
      // nothing to show on this page
      return;
    }

    const tour = introJs();

    // sensible defaults; disable automatic scroll so we control when scrolling happens
    tour.setOptions({
      steps: available,
      nextLabel: 'Next',
      prevLabel: 'Back',
      doneLabel: 'Done',
      skipLabel: 'Skip',
      showProgress: false,
      showBullets: true,
      exitOnEsc: true,
      exitOnOverlayClick: false,
      positionPrecedence: ['bottom','top','right','left'],
      scrollToElement: false,
      scrollPadding: 80,
      tooltipClass: 'intro-custom-tooltip',
      highlightClass: 'intro-custom-highlight',
    });

    // Prevent page scroll while tour is active
    const prevBodyOverflow = document.body.style.overflow;
    try { document.body.style.overflow = 'hidden'; } catch (e) {}

    let attached = false;
    const attachControls = (targetElement) => {
      if (attached) return;
      attached = true;
      const nextBtn = document.querySelector('.introjs-nextbutton');
      const prevBtn = document.querySelector('.introjs-prevbutton');
      const doneBtn = document.querySelector('.introjs-donebutton');
      const skipBtn = document.querySelector('.introjs-skipbutton');

      const safeScrollTo = (el) => {
        try {
          if (!el) return;
          const rect = el.getBoundingClientRect();
          const top = rect.top + window.scrollY - 80;
          window.scrollTo({ top, behavior: 'smooth' });
        } catch (e) {}
      };

      const handler = () => safeScrollTo(targetElement);

      if (nextBtn) { nextBtn.addEventListener('click', handler); }
      if (prevBtn) { prevBtn.addEventListener('click', handler); }
      if (doneBtn) { doneBtn.addEventListener('click', handler); }
      if (skipBtn) { skipBtn.addEventListener('click', () => { /* skip: do not scroll */ }); }

      // store references so we can remove later
      tour._intro_attach_refs = { nextBtn, prevBtn, doneBtn, skipBtn, handler };
    };

    const detachControls = () => {
      try {
        const refs = tour._intro_attach_refs;
        if (refs) {
          if (refs.nextBtn) refs.nextBtn.removeEventListener('click', refs.handler);
          if (refs.prevBtn) refs.prevBtn.removeEventListener('click', refs.handler);
          if (refs.doneBtn) refs.doneBtn.removeEventListener('click', refs.handler);
          // skipBtn had no handler that we need to remove
        }
      } catch (e) {}
      attached = false;
    };

    tour.onafterchange(function(targetElement) {
      // attach control listeners the first time tooltip renders
      try { attachControls(targetElement); } catch (e) {}
    });

    // on complete/exit restore overflow and run onExit
    const finish = () => {
      try { document.body.style.overflow = prevBodyOverflow || ''; } catch (e) {}
      try { detachControls(); } catch (e) {}
      onExit && onExit();
    };

    tour.oncomplete(finish);
    tour.onexit(finish);

    // small delay to ensure DOM is painted and elements are present
    const timer = setTimeout(() => {
      try { tour.start(); } catch (e) { /* ignore */ }
    }, 300);

    return () => {
      clearTimeout(timer);
      try { tour.exit(); } catch (e) {}
      try { document.body.style.overflow = prevBodyOverflow || ''; } catch (e) {}
      try { detachControls(); } catch (e) {}
    };
  }, [start, steps, onExit]);

  return null;
}
