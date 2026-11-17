import { useEffect, useState, type FormEvent } from 'react';
import { Lock, User as UserIcon, AlertCircle, Loader2, Shield } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { SCHOOL_NAME } from '@/lib/noticeText';

export function AuthPage() {
  const { signIn, bootstrapAdmin } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Bootstrap admin state
  const [showBootstrap, setShowBootstrap] = useState(false);
  const [bsUsername, setBsUsername] = useState('');
  const [bsPassword, setBsPassword] = useState('');
  const [bsFullName, setBsFullName] = useState('');
  const [bsError, setBsError] = useState('');
  const [bsBusy, setBsBusy] = useState(false);

  // Check if bootstrap is available (no admin exists yet)
  useEffect(() => {
    supabase.rpc('bootstrap_check').then(({ data }) => {
      if (data === false) {
        // Admin already exists — hide bootstrap link
        setShowBootstrap(false);
      }
    });
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const { error: err } = await signIn(username.trim(), password);
    if (err) setError(err);
    setBusy(false);
  };

  const bootstrapSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBsError('');
    if (bsPassword.length < 6) { setBsError('Password must be at least 6 characters.'); return; }
    if (bsUsername.trim().length < 3) { setBsError('Username must be at least 3 characters.'); return; }
    setBsBusy(true);

    const { error: createError } = await bootstrapAdmin(
      bsUsername.trim().toLowerCase(),
      bsPassword,
      bsFullName.trim(),
    );

    if (createError) {
      setBsError(createError);
      setBsBusy(false);
      return;
    }

    // Auto sign-in after bootstrap
    const { error: signInError } = await signIn(bsUsername.trim(), bsPassword);
    if (signInError) {
      setBsError('Admin account created. Please sign in with your username and password.');
      setShowBootstrap(false);
    }
    setBsBusy(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-mark"><img src="/New_LOGO_Final.PNG" alt="SchoolDesk logo" /></div>
          <h1>{SCHOOL_NAME}</h1>
          <p>School management portal</p>
        </div>

        <form onSubmit={submit} className="auth-form">
          <label className="auth-field">
            <span>Username</span>
            <div className="auth-input-wrap">
              <UserIcon size={17} />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
                autoComplete="username"
              />
            </div>
          </label>

          <label className="auth-field">
            <span>Password</span>
            <div className="auth-input-wrap">
              <Lock size={17} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>
          </label>

          {error && (
            <div className="auth-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={busy}>
            {busy ? <Loader2 size={18} className="auth-spinner" /> : null}
            Sign in
          </button>
        </form>

        <div className="auth-divider"><span>or</span></div>

        {showBootstrap ? (
          <form onSubmit={bootstrapSubmit} className="auth-form">
            <div className="auth-bootstrap-header">
              <Shield size={18} />
              <span>Create the first administrator</span>
            </div>
            <label className="auth-field">
              <span>Admin username</span>
              <div className="auth-input-wrap">
                <UserIcon size={17} />
                <input
                  type="text"
                  value={bsUsername}
                  onChange={(e) => setBsUsername(e.target.value)}
                  placeholder="e.g. admin"
                  required
                  autoComplete="username"
                />
              </div>
            </label>
            <label className="auth-field">
              <span>Full name</span>
              <div className="auth-input-wrap">
                <UserIcon size={17} />
                <input
                  type="text"
                  value={bsFullName}
                  onChange={(e) => setBsFullName(e.target.value)}
                  placeholder="Administrator full name"
                  required
                />
              </div>
            </label>
            <label className="auth-field">
              <span>Password</span>
              <div className="auth-input-wrap">
                <Lock size={17} />
                <input
                  type="password"
                  value={bsPassword}
                  onChange={(e) => setBsPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  autoComplete="new-password"
                />
              </div>
            </label>
            {bsError && (
              <div className="auth-error"><AlertCircle size={16} /><span>{bsError}</span></div>
            )}
            <button type="submit" className="auth-submit" disabled={bsBusy}>
              {bsBusy ? <Loader2 size={18} className="auth-spinner" /> : <Shield size={16} />} Create admin account
            </button>
            <button type="button" className="auth-switch" onClick={() => { setShowBootstrap(false); setBsError(''); }}>
              Back to sign in
            </button>
          </form>
        ) : (
          <p className="auth-foot">
            No account yet?{' '}
            <button className="auth-switch" onClick={() => setShowBootstrap(true)}>
              Create the first admin
            </button>
          </p>
        )}

        <p className="auth-hint">
          Teachers and parents: contact your administrator to receive your account.
        </p>
      </div>
    </div>
  );
}
