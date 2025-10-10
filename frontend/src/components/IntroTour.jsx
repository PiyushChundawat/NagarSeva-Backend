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
    // sensible defaults for placement and scrolling
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
      scrollToElement: true,
      scrollPadding: 80,
      tooltipClass: 'intro-custom-tooltip',
      highlightClass: 'intro-custom-highlight',
    });

    tour.oncomplete(() => onExit && onExit());
    tour.onexit(() => onExit && onExit());

    // small delay to ensure DOM is painted and elements are present
    const timer = setTimeout(() => {
      try { tour.start(); } catch (e) { /* ignore */ }
    }, 300);

    return () => {
      clearTimeout(timer);
      try { tour.exit(); } catch (e) {}
    };
  }, [start, steps, onExit]);

  return null;
}
