import React, { useEffect, useRef } from 'react';
import { useAppDispatch } from '../../hooks/useAppSelector';
import { setCredentials, clearCredentials, setLoading } from '../../store/authSlice';
import { authApi } from '../../lib/axios';
import { FullPageSpinner } from '../ui/Spinner';
import { useAuth } from '../../hooks/useAuth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { isLoading } = useAuth();
  const initialized = useRef(false);

  useEffect(() => {
    // Run only once — prevent double-init from React StrictMode
    if (initialized.current) return;
    initialized.current = true;

    async function init() {
      try {
        // Step 1: try to get a new access token via the httpOnly refresh token cookie
        const refreshRes = await authApi.post('/auth/refresh-token', {});
        const accessToken: string = refreshRes.data.data.accessToken;

        // Step 2: fetch the user profile with the new token
        const meRes = await authApi.get('/auth/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        dispatch(setCredentials({ user: meRes.data.data, accessToken }));
      } catch {
        // No valid session — user needs to log in
        dispatch(clearCredentials());
      } finally {
        dispatch(setLoading(false));
      }
    }

    init();
  }, [dispatch]);

  if (isLoading) return <FullPageSpinner />;
  return <>{children}</>;
}
