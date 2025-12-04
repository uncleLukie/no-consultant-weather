import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IOSInstallPrompt } from './IOSInstallPrompt';

describe('IOSInstallPrompt', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset navigator.userAgent for each test
    Object.defineProperty(navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
      writable: true,
      configurable: true,
    });
  });

  describe('Rendering', () => {
    it('should not render when isOpen is false and not on iOS Safari', () => {
      const { container } = render(
        <IOSInstallPrompt isDarkMode={false} isOpen={false} onClose={mockOnClose} />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render when manually opened', () => {
      render(
        <IOSInstallPrompt isDarkMode={false} isOpen={true} onClose={mockOnClose} />
      );

      expect(screen.getByText('Install App')).toBeInTheDocument();
      expect(screen.getByText(/Tap the/)).toBeInTheDocument();
      expect(screen.getByText(/Add to Home Screen/)).toBeInTheDocument();
    });

    it('should render with light mode styles', () => {
      render(
        <IOSInstallPrompt isDarkMode={false} isOpen={true} onClose={mockOnClose} />
      );

      const container = screen.getByText('Install App').closest('div');
      expect(container).toHaveClass('bg-white');
      expect(container).toHaveClass('text-gray-900');
    });

    it('should render with dark mode styles', () => {
      render(
        <IOSInstallPrompt isDarkMode={true} isOpen={true} onClose={mockOnClose} />
      );

      const container = screen.getByText('Install App').closest('div');
      expect(container).toHaveClass('bg-gray-800');
      expect(container).toHaveClass('text-white');
    });
  });

  describe('iOS Detection', () => {
    it('should detect iPhone', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
        writable: true,
        configurable: true,
      });

      render(
        <IOSInstallPrompt isDarkMode={false} />
      );

      // Should show prompt on iOS Safari
      expect(screen.queryByText('Install App')).toBeInTheDocument();
    });

    it('should detect iPad', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X)',
        writable: true,
        configurable: true,
      });

      render(
        <IOSInstallPrompt isDarkMode={false} />
      );

      expect(screen.queryByText('Install App')).toBeInTheDocument();
    });

    it('should detect iPod', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPod touch; CPU iPhone OS 16_0 like Mac OS X)',
        writable: true,
        configurable: true,
      });

      render(
        <IOSInstallPrompt isDarkMode={false} />
      );

      expect(screen.queryByText('Install App')).toBeInTheDocument();
    });

    it('should not show prompt on Android', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36',
        writable: true,
        configurable: true,
      });

      const { container } = render(
        <IOSInstallPrompt isDarkMode={false} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should not show prompt on desktop', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        writable: true,
        configurable: true,
      });

      const { container } = render(
        <IOSInstallPrompt isDarkMode={false} />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Safari Detection', () => {
    it('should not show prompt when using Chrome on iOS', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/120.0.0.0',
        writable: true,
        configurable: true,
      });

      const { container } = render(
        <IOSInstallPrompt isDarkMode={false} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should not show prompt when using Firefox on iOS', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 FxiOS/120.0',
        writable: true,
        configurable: true,
      });

      const { container } = render(
        <IOSInstallPrompt isDarkMode={false} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should show prompt on iOS Safari', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1',
        writable: true,
        configurable: true,
      });

      render(
        <IOSInstallPrompt isDarkMode={false} />
      );

      expect(screen.queryByText('Install App')).toBeInTheDocument();
    });
  });

  describe('Standalone Mode Detection', () => {
    it('should not show prompt when already in standalone mode (PWA)', () => {
      // Mock matchMedia to indicate standalone mode
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === '(display-mode: standalone)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const { container } = render(
        <IOSInstallPrompt isDarkMode={false} />
      );

      expect(container.firstChild).toBeNull();
    });

    it('should not show prompt when navigator.standalone is true', () => {
      Object.defineProperty(window.navigator, 'standalone', {
        value: true,
        writable: true,
        configurable: true,
      });

      const { container } = render(
        <IOSInstallPrompt isDarkMode={false} />
      );

      expect(container.firstChild).toBeNull();

      // Cleanup
      delete (window.navigator as any).standalone;
    });
  });

  describe('User Interactions', () => {
    it('should call onClose when close button is clicked', () => {
      render(
        <IOSInstallPrompt isDarkMode={false} isOpen={true} onClose={mockOnClose} />
      );

      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should hide prompt when handleClose is called', () => {
      const { rerender } = render(
        <IOSInstallPrompt isDarkMode={false} isOpen={true} onClose={mockOnClose} />
      );

      expect(screen.queryByText('Install App')).toBeInTheDocument();

      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);

      // Rerender with isOpen=false after close
      rerender(
        <IOSInstallPrompt isDarkMode={false} isOpen={false} onClose={mockOnClose} />
      );

      expect(screen.queryByText('Install App')).not.toBeInTheDocument();
    });
  });

  describe('Instructions Content', () => {
    it('should display step 1 instruction', () => {
      render(
        <IOSInstallPrompt isDarkMode={false} isOpen={true} onClose={mockOnClose} />
      );

      expect(screen.getByText('1. Tap the')).toBeInTheDocument();
      expect(screen.getByText('Share button below')).toBeInTheDocument();
    });

    it('should display step 2 instruction', () => {
      render(
        <IOSInstallPrompt isDarkMode={false} isOpen={true} onClose={mockOnClose} />
      );

      expect(screen.getByText('2. Select')).toBeInTheDocument();
      expect(screen.getByText('Add to Home Screen')).toBeInTheDocument();
    });

    it('should display share icon SVGs', () => {
      render(
        <IOSInstallPrompt isDarkMode={false} isOpen={true} onClose={mockOnClose} />
      );

      const svgs = screen.getAllByRole('img', { hidden: true });
      expect(svgs.length).toBeGreaterThan(0);
    });
  });

  describe('Dark Mode Variations', () => {
    it('should apply dark mode to close button', () => {
      render(
        <IOSInstallPrompt isDarkMode={true} isOpen={true} onClose={mockOnClose} />
      );

      const closeButton = screen.getByLabelText('Close');
      expect(closeButton).toHaveClass('text-gray-400');
    });

    it('should apply light mode to close button', () => {
      render(
        <IOSInstallPrompt isDarkMode={false} isOpen={true} onClose={mockOnClose} />
      );

      const closeButton = screen.getByLabelText('Close');
      expect(closeButton).toHaveClass('text-gray-600');
    });

    it('should apply dark mode to Add to Home Screen badge', () => {
      render(
        <IOSInstallPrompt isDarkMode={true} isOpen={true} onClose={mockOnClose} />
      );

      const badge = screen.getByText('Add to Home Screen').closest('span');
      expect(badge).toHaveClass('bg-gray-700');
    });

    it('should apply light mode to Add to Home Screen badge', () => {
      render(
        <IOSInstallPrompt isDarkMode={false} isOpen={true} onClose={mockOnClose} />
      );

      const badge = screen.getByText('Add to Home Screen').closest('span');
      expect(badge).toHaveClass('bg-gray-50');
    });
  });

  describe('Positioning and Styling', () => {
    it('should render at the bottom of screen', () => {
      render(
        <IOSInstallPrompt isDarkMode={false} isOpen={true} onClose={mockOnClose} />
      );

      const container = screen.getByText('Install App').closest('div');
      expect(container).toHaveClass('fixed');
      expect(container).toHaveClass('bottom-0');
    });

    it('should have shadow and border', () => {
      render(
        <IOSInstallPrompt isDarkMode={false} isOpen={true} onClose={mockOnClose} />
      );

      const container = screen.getByText('Install App').closest('div');
      expect(container).toHaveClass('shadow-lg');
      expect(container).toHaveClass('border-t');
    });

    it('should have transition animation', () => {
      render(
        <IOSInstallPrompt isDarkMode={false} isOpen={true} onClose={mockOnClose} />
      );

      const container = screen.getByText('Install App').closest('div');
      expect(container).toHaveClass('transition-transform');
    });
  });
});
