import { useState, useContext } from 'react';
import { MyContext } from './MyContext.jsx';
import './Login.css';

function Login({ onLoginSuccess }) {
  const [isSignUp, setIsSignUp] = useState(false);

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const { setTheme } = useContext(MyContext);

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError(null);
    setSuccess(null);
    setEmail('');
    setPassword('');
    setName('');
    setUsername('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (isSignUp && (!email || !password || !username || !name)) {
      setError('Please fill in all registration fields!');
      return;
    }
    if (!isSignUp && (!email || !password)) {
      setError('Please fill in all login fields!');
      return;
    }

    setLoading(true);

    const endpoint = isSignUp
      ? 'http://localhost:8080/api/register'
      : 'http://localhost:8080/api/login';

    const payload = isSignUp
      ? { name, username, email, password }
      : { email, password };

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
      setLoading(false);
    }
  };

  return (
    <div className="loginContainer">
      <div className="loginBox">
        <div className="loginHeader">
          <img
            src="src/assets/blacklogo.png"
            alt="GPT Logo"
            className="loginLogo"
          />
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
