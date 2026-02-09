import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, authError, isLoadingAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      navigate(returnTo, { replace: true });
    } catch {
      // Error set in context
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/30" dir="rtl">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-4" dir="rtl">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-900 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">CreatorHub</h1>
          <p className="text-slate-500 text-sm">התחבר לחשבון שלך</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {authError?.type === 'login_failed' && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              {authError.message}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="login-email">אימייל</Label>
            <Input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="login-password">סיסמה</Label>
            <Input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full"
            />
          </div>
          <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
            התחבר
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500">
          אין לך חשבון?{' '}
          <Link to="/signup" className="text-indigo-600 hover:text-indigo-700 font-medium">
            צור חשבון
          </Link>
        </p>
      </div>
    </div>
  );
}
