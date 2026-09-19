import { useAppSelector } from './useAppSelector';

export function useAuth() {
  const auth = useAppSelector((s) => s.auth);
  return {
    user: auth.user,
    accessToken: auth.accessToken,
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
  };
}
