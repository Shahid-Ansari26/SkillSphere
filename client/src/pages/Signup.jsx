
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UserRound,
  Mail,
  Lock,
  GraduationCap,
  Eye,
  EyeOff,
} from 'lucide-react';
import './Auth.css';

const API_URL = 'http://localhost:5000/api/auth';

function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (event) => {
    setFormData({
      ...formData,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    if (formData.name.trim().length < 2) {
      setError('Please enter your full name (at least 2 characters).');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must contain at least 8 characters.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          name: formData.name.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed.');
      }

      setMessage(
        'Account created successfully! Redirecting to login...'
      );

      setTimeout(() => {
        navigate('/login');
      }, 1200);
    } catch (err) {
      setError(err.message || 'Unable to create your account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-card">
        <Link to="/" className="auth-brand">
          <span className="auth-brand-icon">S</span>
          SkillSphere
        </Link>

        <div className="auth-heading-icon">
          <GraduationCap size={30} />
        </div>

        <h1>Create your account</h1>

        <p className="auth-subtitle">
          Start your learning journey with SkillSphere.
        </p>

        {error && (
          <div className="auth-message auth-error" role="alert">
            {error}
          </div>
        )}

        {message && (
          <div className="auth-message auth-success" role="status">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="signup-name">Full name</label>

          <div className="auth-input-wrap">
            <UserRound size={19} aria-hidden="true" />

            <input
              id="signup-name"
              name="name"
              type="text"
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleChange}
              minLength={2}
              maxLength={50}
              autoComplete="name"
              required
            />
          </div>

          <label htmlFor="signup-email">Email address</label>

          <div className="auth-input-wrap">
            <Mail size={19} aria-hidden="true" />

            <input
              id="signup-email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>

          <label htmlFor="signup-password">Password</label>

          <div className="auth-input-wrap password-input-wrap">
            <Lock size={19} aria-hidden="true" />

            <input
              id="signup-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 8 characters"
              value={formData.password}
              onChange={handleChange}
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              required
            />

            <button
              className="password-toggle"
              type="button"
              onClick={() =>
                setShowPassword((previous) => !previous)
              }
              aria-label={
                showPassword ? 'Hide password' : 'Show password'
              }
              aria-pressed={showPassword}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff size={19} aria-hidden="true" />
              ) : (
                <Eye size={19} aria-hidden="true" />
              )}
            </button>
          </div>

          <button
            className="auth-submit"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>

        <Link to="/" className="auth-back-home">
          ← Back to SkillSphere
        </Link>
      </section>
    </main>
  );
}

export default Signup;
