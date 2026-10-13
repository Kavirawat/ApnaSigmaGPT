import { useState, useContext, useEffect } from 'react';
import { MyContext } from './MyContext.jsx';
import './login.css';
import blackLogo from './assets/blacklogo.png';
import { API_BASE_URL } from './config.js';

function Login({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSlowNotice, setIsSlowNotice] = useState(false);

  const { setTheme } = useContext(MyContext);

  useEffect(() => {
    // Pre-warm the backend server on component mount (prevents cold start delays)
    fetch(`${API_BASE_URL}/api/ping`).catch(() => {});
  }, []);

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError(null);
    setSuccess(null);
    setEmail('');
    setPassword('');
    setName('');
    setUsername('');
    setIsSlowNotice(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedEmail = email.trim();
    const trimmedUsername = username.trim();
    const trimmedName = name.trim();

    if (isSignUp && (!trimmedEmail || !password || !trimmedUsername || !trimmedName)) {
      setError('Please fill in all registration fields!');
      return;
    }
    if (!isSignUp && (!trimmedEmail || !password)) {
      setError('Please fill in all login fields!');
      return;
    }

    setLoading(true);
    setIsSlowNotice(false);

    // If server takes longer than 2.5s (e.g., Render free tier spinning up), notify the user
    const slowTimer = setTimeout(() => {
      setIsSlowNotice(true);
    }, 2500);

    const endpoint = isSignUp
      ? `${API_BASE_URL}/api/register`
      : `${API_BASE_URL}/api/login`;

    const payload = isSignUp
      ? { name: trimmedName, username: trimmedUsername, email: trimmedEmail, password }
      : { email: trimmedEmail, password };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Operation failed on server!');
      }

      if (isSignUp) {
        setSuccess('Account created successfully! Proceeding to log in...');
        setTimeout(() => {
          setIsSignUp(false);
          setSuccess(null);
          setPassword('');
        }, 2000);
      } else {
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));

        if (typeof onLoginSuccess === 'function') {
          onLoginSuccess();
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      clearTimeout(slowTimer);
      setIsSlowNotice(false);
      setLoading(false);
    }
  };

  return (
    <div className="loginContainer">
      <div className="loginBox">
        <div className="loginHeader">
          <img src={blackLogo} alt="GPT Logo" className="loginLogo" />
          <h2>{isSignUp ? 'Create an Account' : 'Welcome Back'}</h2>
          <p>
            {isSignUp
              ? 'Sign up to start using SignGPT'
              : 'Log in to your SignGPT account to continue'}
          </p>
        </div>

        {error && (
          <div className="loginError">
            <i className="fa-solid fa-circle-exclamation"></i> {error}
          </div>
        )}

        {success && (
          <div
            className="loginSuccess"
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid #10b981',
              color: '#10b981',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <i className="fa-solid fa-circle-check"></i> {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="loginForm">
          {isSignUp && (
            <>
              <div className="formGroup">
                <label>Full Name</label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="formGroup">
                <label>Username</label>
                <input
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                />
              </div>
            </>
          )}

          <div className="formGroup">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="formGroup">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className="passwordInput"
            />
          </div>

          <button type="submit" className="loginBtn" disabled={loading}>
            {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Continue'}
          </button>
          {isSlowNotice && loading && (
            <p
              style={{
                fontSize: '0.8rem',
                color: '#8e8ea0',
                marginTop: '10px',
                textAlign: 'center',
              }}
            >
              ⏳ Server se connect ho raha hai, kripya thoda intezar karein...
            </p>
          )}
        </form>

        <p className="signupRedirect">
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <span className="underlineLink" onClick={toggleMode}>
            {isSignUp ? 'Log In' : 'Sign Up'}
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;
