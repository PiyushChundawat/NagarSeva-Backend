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

  // update small step counter element on step change
  tour.onafterchange(function(targetElement) {
    try {
      const current = this._currentStep + 1;
      const total = this._introItems.length;
      let el = document.getElementById('intro-step-counter');
      if (!el) {
        el = document.createElement('div');
        el.id = 'intro-step-counter';
        document.body.appendChild(el);
      }
      el.textContent = `${current} / ${total}`;
      el.style.display = 'block';

      // position the counter near the tooltip if possible
      const tooltip = document.querySelector('.introjs-tooltip');
      if (tooltip) {
        const rect = tooltip.getBoundingClientRect();
        // place counter at top-right of tooltip
        el.style.position = 'absolute';
        el.style.top = (rect.top + window.scrollY + 8) + 'px';
        el.style.left = (rect.right + window.scrollX + 8) + 'px';
        el.style.zIndex = 99999;
      } else {
        // fallback to fixed position
        el.style.position = 'fixed';
        el.style.top = '90px';
        el.style.right = '20px';
      }

    } catch (e) {
      // ignore
    }
  });
  // hide counter on exit
  tour.onexit(function() {
    const el = document.getElementById('intro-step-counter');
    if (el) el.style.display = 'none';
  });
  tour.start();
  return tour;
}

export default startTour;
