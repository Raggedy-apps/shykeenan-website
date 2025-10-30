/**
 * Lightweight motion wrapper to replace framer-motion
 * Provides similar API but uses CSS transitions instead
 * Saves ~110kB bundle size
 */

import {
    createElement,
    CSSProperties,
    ForwardedRef,
    forwardRef,
    MutableRefObject,
    ReactNode,
    useEffect,
    useRef,
} from 'react';

export interface MotionProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  initial?: Record<string, any> | boolean;
  animate?: Record<string, any>;
  exit?: Record<string, any>;
  transition?: { 
    duration?: number; 
    delay?: number; 
    ease?: string;
    type?: string;
    damping?: number;
    stiffness?: number;
  };
  whileHover?: Record<string, any>;
  whileTap?: Record<string, any>;
  onClick?: (e?: React.MouseEvent) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  layout?: boolean;
  layoutId?: string;
  id?: string;
  role?: string;
  tabIndex?: number;
  'aria-modal'?: string;
  'aria-orientation'?: string;
  'aria-expanded'?: boolean;
  'aria-controls'?: string;
  'aria-pressed'?: boolean;
  'aria-label'?: string;
  [key: string]: any;
}

const convertToCSSTransform = (values: Record<string, any>): CSSProperties => {
  const style: CSSProperties = {};
  let transforms: string[] = [];

  Object.entries(values || {}).forEach(([key, value]) => {
    switch (key) {
      case 'x':
        transforms.push(`translateX(${typeof value === 'number' ? value + 'px' : value})`);
        break;
      case 'y':
        transforms.push(`translateY(${typeof value === 'number' ? value + 'px' : value})`);
        break;
      case 'scale':
        transforms.push(`scale(${value})`);
        break;
      case 'rotate':
        transforms.push(`rotate(${typeof value === 'number' ? value + 'deg' : value})`);
        break;
      case 'opacity':
        style.opacity = value;
        break;
      case 'backgroundColor':
        style.backgroundColor = value;
        break;
      case 'color':
        style.color = value;
        break;
      default:
        // Pass through other CSS properties
        (style as any)[key] = value;
    }
  });

  if (transforms.length > 0) {
    style.transform = transforms.join(' ');
  }

  return style;
};

const createMotionComponent = (element: string) =>
  forwardRef<HTMLElement, MotionProps>((props, ref) => (
    <LightMotion element={element} {...props} forwardedRef={ref} />
  ));

export const motion = {
  div: createMotionComponent('div'),
  button: createMotionComponent('button'),
  section: createMotionComponent('section'),
  nav: createMotionComponent('nav'),
  aside: createMotionComponent('aside'),
  article: createMotionComponent('article'),
  span: createMotionComponent('span'),
  li: createMotionComponent('li'),
  ul: createMotionComponent('ul'),
  header: createMotionComponent('header'),
  footer: createMotionComponent('footer'),
} as const;

interface LightMotionProps extends MotionProps {
  element: string;
  forwardedRef?: ForwardedRef<HTMLElement>;
}

function LightMotion({
  element: Element,
  children, 
  className = '', 
  style = {},
  initial,
  animate,
  exit,
  transition,
  whileHover,
  whileTap,
  onClick,
  onKeyDown,
  onMouseEnter,
  onMouseLeave,
  layout,
  layoutId,
  id,
  role,
  tabIndex,
  'aria-modal': ariaModal,
  'aria-orientation': ariaOrientation,
  'aria-expanded': ariaExpanded,
  'aria-controls': ariaControls,
  'aria-pressed': ariaPressed,
  'aria-label': ariaLabel,
  forwardedRef,
  ...rest
}: LightMotionProps) {
  const internalRef = useRef<HTMLElement | null>(null);
  const setRef = (node: HTMLElement | null) => {
    internalRef.current = node;
    if (!forwardedRef) return;
    if (typeof forwardedRef === 'function') {
      forwardedRef(node);
    } else {
      (forwardedRef as MutableRefObject<HTMLElement | null>).current = node;
    }
  };

  const isReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const duration = transition?.duration ?? 0.3;
  const delay = transition?.delay ?? 0;
  
  useEffect(() => {
    const element = internalRef.current;
    if (!element || isReducedMotion) return;

    // Apply initial styles immediately (skip if initial is false - used for AnimatePresence)
    if (initial && typeof initial !== 'boolean') {
      const initialStyles = convertToCSSTransform(initial);
      Object.assign(element.style, initialStyles);
    }

    // Apply animate styles with transition
    if (animate) {
      const animateStyles = convertToCSSTransform(animate);
      
      // Set transition
      element.style.transition = `all ${duration}s ease-in-out ${delay}s`;
      
      // Apply animation after a brief delay to ensure initial styles are set
      requestAnimationFrame(() => {
        Object.assign(element.style, animateStyles);
      });
    }

    // Cleanup transition when done
    const cleanup = setTimeout(() => {
      if (element) {
        element.style.transition = '';
      }
    }, (duration + delay) * 1000 + 100);

    return () => clearTimeout(cleanup);
  }, [initial, animate, duration, delay, isReducedMotion]);

  const handleMouseEnter = () => {
    if (whileHover && internalRef.current && !isReducedMotion) {
      const hoverStyles = convertToCSSTransform(whileHover);
      internalRef.current.style.transition = 'all 0.2s ease-in-out';
      Object.assign(internalRef.current.style, hoverStyles);
    }
  };

  const handleMouseLeave = () => {
    if (whileHover && internalRef.current && !isReducedMotion) {
      const baseStyles = convertToCSSTransform(animate || {});
      Object.assign(internalRef.current.style, baseStyles);
    }
  };

  const handleMouseDown = () => {
    if (whileTap && internalRef.current && !isReducedMotion) {
      const tapStyles = convertToCSSTransform(whileTap);
      internalRef.current.style.transition = 'all 0.1s ease-in-out';
      Object.assign(internalRef.current.style, tapStyles);
    }
  };

  const handleMouseUp = () => {
    if (whileTap && internalRef.current && !isReducedMotion) {
      const baseStyles = convertToCSSTransform(whileHover || animate || {});
      Object.assign(internalRef.current.style, baseStyles);
    }
  };

  const combinedClassName = `${className} ${layout ? 'layout-motion' : ''}`.trim();

  return createElement(
    Element,
    {
      ref: setRef,
      id,
      className: combinedClassName,
      role,
      tabIndex,
      'aria-modal': ariaModal,
      'aria-orientation': ariaOrientation,
      'aria-expanded': ariaExpanded?.toString(),
      'aria-controls': ariaControls,
      'aria-pressed': ariaPressed?.toString(),
      'aria-label': ariaLabel,
      style: {
        ...style,
        ...(layoutId ? { '--layout-id': layoutId } : {}),
      },
      onMouseEnter: onMouseEnter || (whileHover ? handleMouseEnter : undefined),
      onMouseLeave: onMouseLeave || (whileHover ? handleMouseLeave : undefined),
      onMouseDown: whileTap ? handleMouseDown : undefined,
      onMouseUp: whileTap ? handleMouseUp : undefined,
      onClick,
      onKeyDown,
      ...rest,
    },
    children
  );
}

// Simple AnimatePresence replacement
interface AnimatePresenceProps {
  children: ReactNode;
  mode?: 'wait' | 'sync';
}

export function AnimatePresence({ children, mode }: AnimatePresenceProps) {
  // For now, just render children directly
  // In a full implementation, this would handle enter/exit transitions
  return <>{children}</>;
}

// Add layout motion CSS to support layout animations
const layoutMotionCSS = `
.layout-motion {
  transition: transform 0.3s ease-in-out, width 0.3s ease-in-out, height 0.3s ease-in-out;
}

@media (prefers-reduced-motion: reduce) {
  .layout-motion {
    transition: none;
  }
}
`;

// Inject CSS for layout animations
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = layoutMotionCSS;
  document.head.appendChild(style);
}
