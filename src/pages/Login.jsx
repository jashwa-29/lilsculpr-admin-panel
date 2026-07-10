import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Please try again.';
      setError(msg);
      setPassword(''); // clear password field on error
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-violet-900 to-purple-900 flex items-center justify-center p-4">

      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">

        {/* Logo + header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl mb-4 border border-white/20 shadow-xl">
            <img
              src="https://www.lilsculpr.com/assets/img/logo.webp"
              alt="Lil Sculpr"
              className="h-12 w-auto"
            />
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Lil Sculpr</h1>
          <p className="text-white/50 text-sm mt-1 font-medium">Admin Dashboard</p>
        </div>

        {/* Card */}
        <div className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl p-8 transition-transform ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
          style={shake ? { animation: 'shake 0.5s ease-in-out' } : {}}>
          <h2 className="text-xl font-bold text-white mb-1">Welcome back</h2>
          <p className="text-white/50 text-sm mb-6">Sign in to continue to the admin panel</p>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div>
              <label className="block text-white/70 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Email address
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@lilsculpr.com"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-white/70 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 bg-white/10 border rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all pr-11 ${
                    error
                      ? 'border-red-400/70 focus:ring-red-400'
                      : 'border-white/20 focus:ring-violet-400'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors text-lg"
                  tabIndex={-1}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Error alert */}
            {error && (
              <div
                role="alert"
                className="bg-red-500/20 border border-red-400/50 rounded-xl px-4 py-3 text-red-200 text-sm flex items-start gap-2.5"
                style={{ animation: 'fadeIn 0.25s ease-out' }}
              >
                <span className="text-base flex-shrink-0">⚠️</span>
                <div>
                  <p className="font-semibold text-red-100 leading-tight">Login Failed</p>
                  <p className="text-red-200/80 text-xs mt-0.5 leading-relaxed">{error}</p>
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-400 hover:to-indigo-400 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed text-sm tracking-wide mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : (
                '🔐 Sign In'
              )}
            </button>
          </form>

          <p className="text-center text-white/30 text-xs mt-6">
            Unauthorized access is strictly prohibited and monitored.
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-white/25 text-xs mt-6">
          © {new Date().getFullYear()} Lil Sculpr Clay Modelling Academy
        </p>
      </div>
    </div>
  );
}
