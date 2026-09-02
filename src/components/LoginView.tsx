import React, { useEffect, useState } from 'react';
import { Building2, KeyRound, Loader2, ShieldCheck } from 'lucide-react';

interface DemoAccount {
  email: string;
  name: string;
  role: string;
  tenant: string;
}

interface LoginViewProps {
  onLogin: (email: string, password: string) => Promise<void>;
  error?: string | null;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, error }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([]);
  const [demoPasswordHint, setDemoPasswordHint] = useState<string | undefined>();

  useEffect(() => {
    fetch('/api/auth/demo-accounts')
      .then((r) => r.json())
      .then((data) => {
        setDemoAccounts(data.accounts || []);
        setDemoPasswordHint(data.demoPasswordHint);
      })
      .catch(() => {
        setDemoAccounts([]);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setSubmitting(true);
    try {
      await onLogin(email.trim(), password);
    } catch (err: any) {
      setLocalError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const fillAccount = (account: DemoAccount) => {
    setEmail(account.email);
    if (demoPasswordHint) setPassword(demoPasswordHint);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="flex items-center justify-center space-x-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-sky-400 flex items-center justify-center font-bold text-xl shadow-lg">
            V
          </div>
          <div>
            <div className="text-lg font-semibold tracking-tight">VANGUARD PMS OS</div>
            <div className="text-xs text-slate-400">Hotel Property Management & Channel Manager</div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur"
        >
          <div className="flex items-center space-x-2 mb-5">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <h1 className="text-sm font-semibold">Sign in to your workspace</h1>
          </div>

          {(localError || error) && (
            <div className="mb-4 text-xs text-rose-200 bg-rose-950/70 border border-rose-800 rounded-lg px-3 py-2">
              {localError || error}
            </div>
          )}

          <label className="block text-[11px] uppercase tracking-wide text-slate-400 mb-1">Email</label>
          <input
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full mb-3 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="you@hotel.com"
          />

          <label className="block text-[11px] uppercase tracking-wide text-slate-400 mb-1">Password</label>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full mb-4 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="••••••••"
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded-lg py-2.5 text-sm font-semibold cursor-pointer"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            <span>{submitting ? 'Signing in…' : 'Sign in'}</span>
          </button>
        </form>

        {demoAccounts.length > 0 && (
          <div className="mt-6 bg-slate-900/60 border border-slate-800 rounded-2xl p-4">
            <div className="text-[11px] uppercase tracking-wide text-slate-500 mb-3">Demo accounts</div>
            <div className="space-y-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => fillAccount(account)}
                  className="w-full text-left px-3 py-2 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-indigo-500/50 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-200">{account.name}</span>
                    <span className="text-[10px] font-mono text-indigo-300">{account.role.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex items-center space-x-1 mt-0.5 text-[11px] text-slate-500">
                    <Building2 className="w-3 h-3" />
                    <span>{account.tenant}</span>
                    <span className="text-slate-700">·</span>
                    <span>{account.email}</span>
                  </div>
                </button>
              ))}
            </div>
            {demoPasswordHint && (
              <p className="mt-3 text-[11px] text-slate-500">
                Shared demo password: <span className="font-mono text-slate-300">{demoPasswordHint}</span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
