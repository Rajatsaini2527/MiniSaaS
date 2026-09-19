import { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from './useAppSelector';
import { setTheme, applyTheme } from '../store/uiSlice';

export function useTheme() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((s) => s.ui.theme);

  useEffect(() => {
    applyTheme(theme);
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => { if (theme === 'system') applyTheme('system'); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  return { theme, setTheme: (t: 'light' | 'dark' | 'system') => dispatch(setTheme(t)) };
}
