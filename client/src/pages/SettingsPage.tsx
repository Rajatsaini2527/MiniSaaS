import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Save, Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { userService } from '../services/user.service';
import { useAppDispatch } from '../hooks/useAppSelector';
import { setUser } from '../store/authSlice';
import { extractError } from '../utils/format';
import toast from 'react-hot-toast';
import { cn } from '../utils/cn';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(8, 'At least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const dispatch = useAppDispatch();
  const [profileLoading, setProfileLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const {
    register: regProfile,
    handleSubmit: hProfile,
    formState: { errors: eProfile },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '' },
  });

  const {
    register: regPw,
    handleSubmit: hPw,
    reset: resetPw,
    formState: { errors: ePw },
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  async function onProfileSubmit(data: ProfileForm) {
    setProfileLoading(true);
    try {
      const res = await userService.updateProfile({ name: data.name });
      dispatch(setUser(res.data));
      toast.success('Profile updated');
    } catch (e) {
      toast.error(extractError(e));
    } finally {
      setProfileLoading(false);
    }
  }

  async function onPasswordSubmit(data: PasswordForm) {
    setPwLoading(true);
    try {
      await userService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password changed');
      resetPw();
    } catch (e) {
      toast.error(extractError(e));
    } finally {
      setPwLoading(false);
    }
  }

  const themeOptions: { id: 'light' | 'dark' | 'system'; label: string; icon: React.ElementType }[] = [
    { id: 'light', label: 'Light', icon: Sun },
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your account settings and preferences.</p>
      </div>

      {/* Profile */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Profile</h2>
        <div className="text-sm text-gray-500">
          Email: <span className="text-gray-700 dark:text-gray-300 font-medium">{user?.email}</span>
        </div>
        <form onSubmit={hProfile(onProfileSubmit)} className="space-y-4">
          <Input
            label="Full name"
            error={eProfile.name?.message}
            {...regProfile('name')}
          />
          <Button type="submit" icon={<Save size={15} />} loading={profileLoading} size="sm">
            Save changes
          </Button>
        </form>
      </section>

      {/* Password */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Password</h2>
        <form onSubmit={hPw(onPasswordSubmit)} className="space-y-4">
          <Input
            label="Current password"
            type="password"
            error={ePw.currentPassword?.message}
            {...regPw('currentPassword')}
          />
          <Input
            label="New password"
            type="password"
            error={ePw.newPassword?.message}
            helperText="At least 8 characters"
            {...regPw('newPassword')}
          />
          <Input
            label="Confirm new password"
            type="password"
            error={ePw.confirmPassword?.message}
            {...regPw('confirmPassword')}
          />
          <Button type="submit" loading={pwLoading} size="sm">
            Change password
          </Button>
        </form>
      </section>

      {/* Theme */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Appearance</h2>
        <div className="flex gap-3">
          {themeOptions.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTheme(id)}
              className={cn(
                'flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all',
                theme === id
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              )}
              aria-pressed={theme === id}
            >
              <Icon
                size={20}
                className={theme === id ? 'text-primary-600' : 'text-gray-400'}
              />
              <span
                className={cn(
                  'text-sm font-medium',
                  theme === id ? 'text-primary-600' : 'text-gray-600 dark:text-gray-400'
                )}
              >
                {label}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
