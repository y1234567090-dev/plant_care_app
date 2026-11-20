import React, { useState } from 'react';
import {
  ArrowRight,
  CalendarClock,
  CloudUpload,
  Droplets,
  Eye,
  EyeOff,
  Leaf,
  Lock,
  Mail,
  User,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import {
  AuthUser,
  DEMO_USER,
  createAccount,
  signIn,
  validateEmail,
  validatePassword,
} from '../auth';

interface LoginPageProps {
  onLogin: (user: AuthUser) => void;
}

type Mode = 'signin' | 'signup';

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
}

const BENEFITS = [
  {
    icon: Droplets,
    title: 'Never miss a watering',
    text: 'See exactly which plants are thirsty today, tomorrow and this week.',
  },
  {
    icon: CalendarClock,
    title: 'A schedule that adapts',
    text: 'Every plant keeps its own rhythm, from daily ferns to fortnightly succulents.',
  },
  {
    icon: CloudUpload,
    title: 'Backed up to Azure',
    text: 'Snapshot your collection to Blob Storage and restore it in one click.',
  },
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setErrors({});
    setFormError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const nextErrors: FieldErrors = {};
    if (mode === 'signup' && name.trim().length < 2) {
      nextErrors.name = 'Tell us what to call you.';
    }
    const emailProblem = validateEmail(email);
    if (emailProblem) nextErrors.email = emailProblem;
    const passwordProblem = validatePassword(password);
    if (passwordProblem) nextErrors.password = passwordProblem;
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setBusy(true);
    try {
      const user =
        mode === 'signup'
          ? await createAccount(name, email, password)
          : await signIn(email, password);
      onLogin(user);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Something went wrong. Try again.');
      setBusy(false);
    }
  };

  const inputClass = (hasError: boolean) =>
    `block w-full rounded-xl border bg-white py-3 pl-11 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:ring-4 ${
      hasError
        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-100'
        : 'border-slate-200 focus:border-emerald-500 focus:ring-emerald-100'
    }`;

  return (
    <div className="grid min-h-screen bg-slate-50 lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <aside className="scale-light relative hidden overflow-hidden bg-linear-to-br from-emerald-900 via-emerald-800 to-emerald-600 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-emerald-400/30 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-amber-300/25 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
            <Leaf className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold tracking-tight">Plant Care Tracker</span>
        </div>

        <div className="relative max-w-lg space-y-10">
          <div className="space-y-4">
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-balance">
              Keep every plant thriving, one watering at a time.
            </h1>
            <p className="text-base leading-relaxed text-emerald-50/85">
              Track your collection, get a clear daily care list and keep your data safe in the cloud.
            </p>
          </div>

          <ul className="space-y-5">
            {BENEFITS.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.title} className="flex gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/12 ring-1 ring-white/20">
                    <Icon className="h-5 w-5 text-amber-200" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{item.title}</span>
                    <span className="block text-sm leading-relaxed text-emerald-50/75">
                      {item.text}
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="relative rounded-2xl bg-white/10 p-4 ring-1 ring-white/20 backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-100/80">
            Today's care
          </p>
          <div className="mt-3 space-y-2.5">
            <div className="flex items-center justify-between rounded-xl bg-white px-3.5 py-2.5 text-slate-900">
              <span className="text-sm font-medium">Monstera Deliciosa</span>
              <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-semibold text-rose-700">
                2 days overdue
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-white px-3.5 py-2.5 text-slate-900">
              <span className="text-sm font-medium">Fiddle Leaf Fig</span>
              <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-700">
                Water today
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Form panel */}
      <main className="relative flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="absolute right-4 top-4 sm:right-8 sm:top-6">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Leaf className="h-4.5 w-4.5" />
            </div>
            <span className="font-display text-base font-bold tracking-tight text-slate-900">
              Plant Care Tracker
            </span>
          </div>

          <div className="space-y-1.5">
            <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900">
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-sm text-slate-500">
              {mode === 'signin'
                ? 'Sign in to see what your plants need today.'
                : 'Start tracking your plants in under a minute.'}
            </p>
          </div>

          <div
            className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1"
            role="tablist"
            aria-label="Sign in or create account"
          >
            {(['signin', 'signup'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => switchMode(m)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  mode === m
                    ? 'bg-white text-emerald-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
            {mode === 'signup' && (
              <div>
                <label htmlFor="auth-name" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Your name
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="auth-name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alex Green"
                    className={inputClass(Boolean(errors.name))}
                  />
                </div>
                {errors.name && <p className="mt-1.5 text-xs text-rose-600">{errors.name}</p>}
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="mb-1.5 block text-sm font-medium text-slate-700">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass(Boolean(errors.email))}
                />
              </div>
              {errors.email && <p className="mt-1.5 text-xs text-rose-600">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="auth-password" className="mb-1.5 block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className={`${inputClass(Boolean(errors.password))} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1.5 text-xs text-rose-600">{errors.password}</p>}
            </div>

            {formError && (
              <p
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              >
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-emerald-600/25 transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {busy ? 'One moment…' : mode === 'signin' ? 'Sign in' : 'Create account'}
              {!busy && <ArrowRight className="h-4 w-4" />}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            or
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            type="button"
            onClick={() => onLogin(DEMO_USER)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 transition-colors hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-100"
          >
            <Droplets className="h-4 w-4 text-amber-600" />
            Explore with a demo account
          </button>

          <p className="mt-6 text-center text-xs leading-relaxed text-slate-400">
            Accounts are saved in this browser only, so they are not shared between devices.
          </p>
        </div>
      </main>
    </div>
  );
};
