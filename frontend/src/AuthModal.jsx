import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, UserRound, X } from 'lucide-react';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

export default function AuthModal({ open, onClose, onLogin }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!open) {
      setError('');
      setMessage('');
      setLoading(false);
    }
  }, [open]);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (mode === 'signup' && !name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const payload = mode === 'login'
        ? { email: email.trim(), password }
        : { name: name.trim(), email: email.trim(), password, role };

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || data.error || `Request failed (${response.status})`);
      }

      if (mode === 'signup') {
        setMode('login');
        setPassword('');
        setMessage('Account created successfully. Please log in.');
      } else {
        if (!data.token || !data.user) {
          throw new Error('Login response is missing user or token. Check your backend response.');
        }
        onLogin(data);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="auth-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => event.target === event.currentTarget && onClose()}
        >
          <motion.section
            className="auth-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-title"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <button className="icon-button auth-close" onClick={onClose} aria-label="Close login dialog">
              <X size={19} />
            </button>

            <div className="auth-brand-mark"><span className="brand-symbol"><span /><span /><span /></span> sevora<span className="brand-dot">.</span></div>
            <p className="auth-eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'JOIN THE SEVORA COMMUNITY'}</p>
            <h2 id="auth-title">{mode === 'login' ? 'Good to see you.' : 'Let’s get you started.'}</h2>
            <p className="auth-subtitle">{mode === 'login' ? 'Log in to continue with Sevora.' : 'Create an account to get started.'}</p>

            <div className="auth-tabs">
              <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')}>Login</button>
              <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => switchMode('signup')}>Sign up</button>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              {mode === 'signup' && (
                <>
                  <label className="auth-label">Full name
                    <span className="auth-input-wrap"><UserRound size={17} /><input autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required /></span>
                  </label>
                  <label className="auth-label">I want to
                    <select className="auth-role-select" value={role} onChange={e => setRole(e.target.value)}>
                      <option value="customer">Book home services</option>
                      <option value="provider">Offer services as a provider</option>
                    </select>
                  </label>
                </>
              )}

              <label className="auth-label">Email address
                <span className="auth-input-wrap"><Mail size={17} /><input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required /></span>
              </label>

              <label className="auth-label">Password
                <span className="auth-input-wrap"><LockKeyhole size={17} /><input type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" minLength={8} required /><button type="button" className="auth-password-toggle" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span>
              </label>

              {error && <p className="auth-alert auth-error" role="alert">{error}</p>}
              {message && <p className="auth-alert auth-success" role="status">{message}</p>}

              <button type="submit" className="button button-pink button-full auth-submit" disabled={loading}>
                {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'} {!loading && <ArrowRight size={17} />}
              </button>
            </form>

            <p className="auth-terms">Your details are used to connect you with the Sevora experience.</p>
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
