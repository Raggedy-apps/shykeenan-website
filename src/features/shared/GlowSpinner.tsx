import { useGlowTheme } from '@/contexts/GlowThemeContext';
import { cn } from '@/phoenix/lib/utils';

interface GlowSpinnerProps {
  /** Size of the spinner - affects both visual size and padding */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Optional loading text to display below spinner */
  text?: string;
  /** Additional CSS classes */
  className?: string;
  /** Show full screen overlay */
  overlay?: boolean;
  /** Accessibility label for spinner */
  ariaLabel?: string;
}

const sizeConfig = {
  sm: {
    spinner: 'w-6 h-6 border-2',
    container: 'gap-2 p-2',
    text: 'text-xs',
  },
  md: {
    spinner: 'w-8 h-8 border-3',
    container: 'gap-3 p-4',
    text: 'text-sm',
  },
  lg: {
    spinner: 'w-12 h-12 border-4',
    container: 'gap-4 p-6',
    text: 'text-base',
  },
  xl: {
    spinner: 'w-16 h-16 border-4',
    container: 'gap-6 p-8',
    text: 'text-lg',
  },
} as const;

/**
 * GlowSpinner - Themed loading spinner component with glow effects
 * 
 * Features:
 * - Integrates with GlowThemeContext for consistent theming
 * - Respects reduced motion preferences
 * - Multiple size variants
 * - Optional text and overlay modes
 * - WCAG compliant with proper ARIA labels
 */
export function GlowSpinner({
  size = 'md',
  text,
  className,
  overlay = false,
  ariaLabel = 'Loading content'
}: GlowSpinnerProps) {
  const glowTheme = useGlowTheme();
  const reducedMotion = glowTheme?.reducedMotion ?? false;
  const config = sizeConfig[size];

  const spinnerElement = (
    <div
      className={cn(
        // Base spinner styles
        'relative rounded-full border-solid',
        'border-gray-300 dark:border-gray-600',
        // Top border with theme colors
        'border-t-pink-400 dark:border-t-cyan-400',
        // Size configuration
        config.spinner,
        // Animation (respect reduced motion)
        reducedMotion ? '' : 'animate-spin',
        // Glow effects
        'shadow-lg',
        'drop-shadow-[0_0_8px_rgba(255,183,197,0.5)] dark:drop-shadow-[0_0_8px_rgba(0,255,213,0.5)]'
      )}
      role="status"
      aria-label={ariaLabel}
      data-testid="glow-spinner"
    >
      {/* Inner glow ring for enhanced visual effect */}
      <div
        className={cn(
          'absolute inset-1 rounded-full border-2',
          'border-transparent border-t-pink-200 dark:border-t-cyan-200',
          reducedMotion ? '' : 'animate-spin',
          '[animation-duration:2s] [animation-direction:reverse]'
        )}
      />
      <span className="sr-only">{ariaLabel}</span>
    </div>
  );

  const content = (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        config.container,
        className
      )}
    >
      {spinnerElement}
      {text && (
        <p
          className={cn(
            'text-gray-600 dark:text-gray-300 font-medium',
            config.text
          )}
        >
          {text}
        </p>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div
        className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center"
        data-testid="glow-spinner-overlay"
      >
        {content}
      </div>
    );
  }

  return content;
}

/**
 * RouteGlowSpinner - Optimized spinner for route-level lazy loading
 * Provides consistent styling and behavior for Suspense fallbacks
 */
export function RouteGlowSpinner({ text = 'Loading page...' }: { text?: string }) {
  return (
    <GlowSpinner
      size="lg"
      text={text}
      className="min-h-[200px]"
      ariaLabel={`Loading: ${text}`}
    />
  );
}

export default GlowSpinner;
