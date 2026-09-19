import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FolderKanban } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAppDispatch } from '../hooks/useAppSelector';
import { setCredentials } from '../store/authSlice';
import { authService } from '../services/auth.service';
import { extractError } from '../utils/format';
import toast from 'react-hot-toast';
import { useState } from 'react';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});
type Form = z.infer<typeof schema>;

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard';
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) });

  async function onSubmit(data: Form) {
    setLoading(true);
    try {
      const res = await authService.login(data);
      dispatch(setCredentials({ user: res.data.user, accessToken: res.data.accessToken }));
      navigate(from, { replace: true });
    } catch (e) {
      toast.error(extractError(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 items-center justify-center p-12">
        <div className="text-white space-y-4 max-w-sm">
          <div className="flex items-center gap-3 text-2xl font-bold">
            <FolderKanban size={32} />
            <span>MiniSaaS</span>
          </div>
          <p className="text-xl font-semibold text-primary-100">Manage projects, tasks, and teams — all in one place.</p>
          <p className="text-primary-200 text-sm">Inspired by Notion, Trello, and Slack.</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center lg:text-left">
            <div className="flex items-center gap-2 font-bold text-primary-600 text-xl mb-6 lg:hidden justify-center">
              <FolderKanban size={24} />
              <span>MiniSaaS</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Welcome back</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sign in to your account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
            <Input label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
            <Button type="submit" className="w-full" loading={loading} size="md">Sign in</Button>
          </form>

          <p className="text-sm text-center text-gray-500 dark:text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 hover:underline font-medium">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
