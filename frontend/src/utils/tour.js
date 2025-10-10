import introJs from 'intro.js';
import 'intro.js/introjs.css';

const defaultOptions = {
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
};

export function startTour(steps = [], onExit) {
  const tour = introJs();
  // Pre-filter steps: replace missing nav-specific selectors with #nav-main fallback
  const mapped = steps.map(s => {
    try {
      if (!document.querySelector(s.element)) {
        // fallback for nav items
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
    console.warn('startTour: no step selectors matched, aborting tour');
    return null;
  }

  tour.setOptions({ ...defaultOptions, steps: available });
  tour.oncomplete(() => onExit && onExit());
  tour.onexit(() => onExit && onExit());

  // No floating counter: rely on intro.js bullets/controls for progress
  tour.start();
  return tour;
}

export default startTour;
