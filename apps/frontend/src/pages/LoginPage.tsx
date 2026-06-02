import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useLogin, useRegister } from '@/lib/api/hooks';
import { useAuthStore } from '@/store/auth.store';

export function LoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const { setUser } = useAuthStore();

  const login = useLogin();
  const register = useRegister();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const mutation = tab === 'login' ? login : register;
      const payload = tab === 'login' ? { email: form.email, password: form.password } : form;
      const res = await (mutation as any).mutateAsync(payload);
      setUser(res.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg ?? 'Something went wrong'));
    }
  };

  const isPending = login.isPending || register.isPending;

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="w-full max-w-[380px] animate-fade-in">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center mb-4">
            <div className="w-3 h-3 rounded-full bg-accent shadow-[0_0_12px_#6366f1]" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Visual API Builder</h1>
          <p className="text-sm text-text-muted mt-1">Build REST APIs visually</p>
        </div>

        {/* Card */}
        <div className="bg-bg-2 border border-border rounded-xl p-6">
          {/* Tabs */}
          <div className="flex gap-1 bg-bg-3 rounded-lg p-1 mb-6">
            {(['login', 'register'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
                  tab === t ? 'bg-bg-4 text-text shadow-sm' : 'text-text-muted hover:text-text'
                }`}
              >
                {t === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {tab === 'register' && (
              <div>
                <label className="label">Name</label>
                <input
                  className="input"
                  placeholder="John Doe"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
            )}

            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>

            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                placeholder={tab === 'register' ? 'min 8 characters' : '••••••••'}
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
                minLength={tab === 'register' ? 8 : 1}
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="btn btn-primary w-full justify-center py-2 mt-2 disabled:opacity-50"
            >
              {isPending ? 'Please wait…' : tab === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          {/* Demo hint */}
          {tab === 'login' && (
            <button
              type="button"
              onClick={() => setForm({ email: 'demo@vab.dev', password: 'password123', name: '' })}
              className="w-full mt-3 text-[11px] text-text-muted hover:text-text transition-colors"
            >
              Use demo account →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
