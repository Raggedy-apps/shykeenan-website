import { GlowThemeProvider } from '@/contexts/GlowThemeContext';
import { GlowSpinner, RouteGlowSpinner } from '@/features/shared/GlowSpinner';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock the useTheme hook
vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
    systemTheme: 'light',
  }),
}));

// Mock matchMedia for reduced motion detection
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: query === '(prefers-reduced-motion: reduce)',
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

const renderWithGlowTheme = (ui: React.ReactElement) => {
  return render(
    <GlowThemeProvider>
      {ui}
    </GlowThemeProvider>
  );
};

describe('GlowSpinner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default props', () => {
    renderWithGlowTheme(<GlowSpinner />);
    
    const spinner = screen.getByTestId('glow-spinner');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('role', 'status');
    expect(spinner).toHaveAttribute('aria-label', 'Loading content');
  });

  it('renders with custom text', () => {
    const testText = 'Loading awesome content...';
    renderWithGlowTheme(<GlowSpinner text={testText} />);
    
    expect(screen.getByText(testText)).toBeInTheDocument();
  });

  it('renders with custom aria label', () => {
    const customLabel = 'Loading user profile';
    renderWithGlowTheme(<GlowSpinner ariaLabel={customLabel} />);
    
    const spinner = screen.getByTestId('glow-spinner');
    expect(spinner).toHaveAttribute('aria-label', customLabel);
  });

  it('renders different sizes correctly', () => {
    const { rerender } = renderWithGlowTheme(<GlowSpinner size="sm" />);
    let spinner = screen.getByTestId('glow-spinner');
    expect(spinner).toHaveClass('w-6', 'h-6', 'border-2');

    rerender(
      <GlowThemeProvider>
        <GlowSpinner size="lg" />
      </GlowThemeProvider>
    );
    spinner = screen.getByTestId('glow-spinner');
    expect(spinner).toHaveClass('w-12', 'h-12', 'border-4');
  });

  it('renders overlay mode', () => {
    renderWithGlowTheme(<GlowSpinner overlay />);
    
    const overlay = screen.getByTestId('glow-spinner-overlay');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveClass('fixed', 'inset-0', 'z-50');
  });

  it('applies custom className', () => {
    const customClass = 'custom-spinner-class';
    renderWithGlowTheme(<GlowSpinner className={customClass} />);
    
    const container = screen.getByTestId('glow-spinner').parentElement;
    expect(container).toHaveClass(customClass);
  });

  it('includes screen reader text', () => {
    renderWithGlowTheme(<GlowSpinner />);
    
    const srText = screen.getByText('Loading content');
    expect(srText).toHaveClass('sr-only');
  });

  it('has proper animation classes by default', () => {
    renderWithGlowTheme(<GlowSpinner />);
    
    const spinner = screen.getByTestId('glow-spinner');
    expect(spinner).toHaveClass('animate-spin');
  });

  it('renders theme-appropriate colors', () => {
    renderWithGlowTheme(<GlowSpinner />);
    
    const spinner = screen.getByTestId('glow-spinner');
    // Check for light theme colors
    expect(spinner).toHaveClass('border-t-pink-400');
    expect(spinner).toHaveClass('dark:border-t-cyan-400');
  });

  it('has glow effects applied', () => {
    renderWithGlowTheme(<GlowSpinner />);
    
    const spinner = screen.getByTestId('glow-spinner');
    expect(spinner).toHaveClass('shadow-lg');
    expect(spinner).toHaveClass('drop-shadow-[0_0_8px_rgba(255,183,197,0.5)]');
    expect(spinner).toHaveClass('dark:drop-shadow-[0_0_8px_rgba(0,255,213,0.5)]');
  });
});

describe('RouteGlowSpinner', () => {
  it('renders with default route loading text', () => {
    renderWithGlowTheme(<RouteGlowSpinner />);
    
    expect(screen.getByText('Loading page...')).toBeInTheDocument();
    const spinner = screen.getByTestId('glow-spinner');
    expect(spinner).toHaveAttribute('aria-label', 'Loading: Loading page...');
  });

  it('renders with custom text', () => {
    const customText = 'Loading memories...';
    renderWithGlowTheme(<RouteGlowSpinner text={customText} />);
    
    expect(screen.getByText(customText)).toBeInTheDocument();
    const spinner = screen.getByTestId('glow-spinner');
    expect(spinner).toHaveAttribute('aria-label', `Loading: ${customText}`);
  });

  it('uses large size by default', () => {
    renderWithGlowTheme(<RouteGlowSpinner />);
    
    const spinner = screen.getByTestId('glow-spinner');
    expect(spinner).toHaveClass('w-12', 'h-12', 'border-4');
  });

  it('has minimum height for route loading', () => {
    renderWithGlowTheme(<RouteGlowSpinner />);
    
    const container = screen.getByTestId('glow-spinner').parentElement;
    expect(container).toHaveClass('min-h-[200px]');
  });
});

describe('GlowSpinner Accessibility', () => {
  it('meets accessibility requirements', () => {
    renderWithGlowTheme(<GlowSpinner text="Loading content" />);
    
    // Check ARIA attributes
    const spinner = screen.getByTestId('glow-spinner');
    expect(spinner).toHaveAttribute('role', 'status');
    expect(spinner).toHaveAttribute('aria-label');
    
    // Check screen reader text
    expect(screen.getByText('Loading content', { selector: '.sr-only' })).toBeInTheDocument();
    
    // Verify visible text is also present
    expect(screen.getByText('Loading content', { selector: 'p' })).toBeInTheDocument();
  });

  it('provides meaningful labels for different contexts', () => {
    const { rerender } = renderWithGlowTheme(<GlowSpinner ariaLabel="Loading user dashboard" />);
    expect(screen.getByLabelText('Loading user dashboard')).toBeInTheDocument();

    rerender(
      <GlowThemeProvider>
        <RouteGlowSpinner text="Loading about page..." />
      </GlowThemeProvider>
    );
    expect(screen.getByLabelText('Loading: Loading about page...')).toBeInTheDocument();
  });
});

describe('GlowSpinner Integration', () => {
  it('integrates with Suspense fallback pattern', () => {
    // This test ensures the component structure works for React.Suspense
    renderWithGlowTheme(<RouteGlowSpinner />);
    
    // Component should render without errors
    const spinner = screen.getByTestId('glow-spinner');
    expect(spinner).toBeVisible();
    
    // Should have proper loading semantics
    expect(spinner).toHaveAttribute('role', 'status');
  });

  it('works with different theme contexts', () => {
    // Test that component renders regardless of theme state
    renderWithGlowTheme(<GlowSpinner size="md" text="Theme test" />);
    
    expect(screen.getByText('Theme test')).toBeInTheDocument();
    const spinner = screen.getByTestId('glow-spinner');
    expect(spinner).toBeInTheDocument();
  });
});
