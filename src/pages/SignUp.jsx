import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Sparkles } from 'lucide-react';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [emailConfirmMessage, setEmailConfirmMessage] = useState(false);
  const { signUp, authError, isLoadingAuth } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setEmailConfirmMessage(false);
    try {
      const { data } = await signUp(email, password, { full_name: fullName || undefined });
      if (data?.session) {
        navigate('/', { replace: true });
      } else {
        setEmailConfirmMessage(true);
      }
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
          <p className="text-slate-500 text-sm">צור חשבון חדש</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {authError?.type === 'signup_failed' && (
            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              {authError.message}
            </div>
          )}
          {emailConfirmMessage && (
            <div className="p-3 rounded-lg bg-indigo-50 text-indigo-700 text-sm">
              נא לאמת את המייל שלך לפני ההתחברות.
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="signup-email">אימייל</Label>
            <Input
              id="signup-email"
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
            <Label htmlFor="signup-password">סיסמה</Label>
            <Input
              id="signup-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signup-fullname">שם מלא (אופציונלי)</Label>
            <Input
              id="signup-fullname"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="השם שלך"
              className="w-full"
            />
          </div>
          <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800" disabled={submitting}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : null}
            צור חשבון
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500">
          כבר יש לך חשבון?{' '}
          <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
            התחבר
          </Link>
        </p>
      </div>
    </div>
  );
}
