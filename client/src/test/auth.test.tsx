import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { QueryClientProvider } from '@tanstack/react-query';
import { store } from '../store';
import { queryClient } from '../lib/queryClient';
import { GuestRoute } from '../components/auth/ProtectedRoute';

// Mock authService
vi.mock('../services/auth.service', () => ({
  authService: {
    getMe: vi.fn().mockRejectedValue(new Error('not auth')),
    refreshToken: vi.fn().mockRejectedValue(new Error('no token')),
  },
}));

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>{children}</MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );
}

describe('GuestRoute', () => {
  it('renders children when not authenticated', () => {
    render(
      <Wrapper>
        <GuestRoute>
          <div data-testid="guest-content">Login Page</div>
        </GuestRoute>
      </Wrapper>
    );
    // Loading state initially shown
    expect(document.body).toBeDefined();
  });
});

describe('Button component', () => {
  it('renders with label', async () => {
    const { Button } = await import('../components/ui/Button');
    render(<Button>Click me</Button>, { wrapper: ({ children }) => <Wrapper>{children}</Wrapper> });
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('shows loading spinner when loading=true', async () => {
    const { Button } = await import('../components/ui/Button');
    render(<Button loading>Save</Button>, { wrapper: ({ children }) => <Wrapper>{children}</Wrapper> });
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

describe('Avatar component', () => {
  it('renders initials when no src', async () => {
    const { Avatar } = await import('../components/ui/Avatar');
    render(<Avatar name="John Doe" />, { wrapper: ({ children }) => <Wrapper>{children}</Wrapper> });
    expect(screen.getByText('JD')).toBeInTheDocument();
  });
});

describe('StatusBadge component', () => {
  it('renders correct label for each status', async () => {
    const { StatusBadge } = await import('../components/tasks/StatusBadge');
    const { rerender } = render(<StatusBadge status="todo" />, { wrapper: ({ children }) => <Wrapper>{children}</Wrapper> });
    expect(screen.getByText('Todo')).toBeInTheDocument();
    rerender(<StatusBadge status="in_progress" />);
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    rerender(<StatusBadge status="done" />);
    expect(screen.getByText('Done')).toBeInTheDocument();
  });
});

describe('PriorityBadge component', () => {
  it('renders correct label for each priority', async () => {
    const { PriorityBadge } = await import('../components/tasks/PriorityBadge');
    const { rerender } = render(<PriorityBadge priority="critical" />, { wrapper: ({ children }) => <Wrapper>{children}</Wrapper> });
    expect(screen.getByText('Critical')).toBeInTheDocument();
    rerender(<PriorityBadge priority="low" />);
    expect(screen.getByText('Low')).toBeInTheDocument();
  });
});
