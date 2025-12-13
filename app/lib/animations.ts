/**
 * Scroll-triggered animation utilities
 * Similar to Enhancv's smooth scroll animations
 */

export const initScrollAnimations = () => {
  if (typeof window === 'undefined') return;

  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px',
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all elements with scroll-fade-in class
  const elements = document.querySelectorAll('.scroll-fade-in');
  elements.forEach((el) => observer.observe(el));

  return () => {
    elements.forEach((el) => observer.unobserve(el));
  };
};

/**
 * Stagger animation for lists
 */
export const staggerAnimation = (element: HTMLElement, delay: number = 100) => {
  const children = Array.from(element.children) as HTMLElement[];
  children.forEach((child, index) => {
    child.style.opacity = '0';
    child.style.transform = 'translateY(20px)';
    child.style.transition = `opacity 0.6s ease ${index * delay}ms, transform 0.6s ease ${index * delay}ms`;
    
    setTimeout(() => {
      child.style.opacity = '1';
      child.style.transform = 'translateY(0)';
    }, 50);
  });
};

/**
 * Fade in animation
 */
export const fadeIn = (element: HTMLElement, duration: number = 600) => {
  element.style.opacity = '0';
  element.style.transition = `opacity ${duration}ms ease-out`;
  
  requestAnimationFrame(() => {
    element.style.opacity = '1';
  });
};

/**
 * Slide up animation
 */
export const slideUp = (element: HTMLElement, duration: number = 800) => {
  element.style.opacity = '0';
  element.style.transform = 'translateY(30px)';
  element.style.transition = `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`;
  
  requestAnimationFrame(() => {
    element.style.opacity = '1';
    element.style.transform = 'translateY(0)';
  });
};

