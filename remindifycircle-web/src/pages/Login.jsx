import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import './Login.css'; // ⬅️ Add this line to import the custom styles

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
    } else if (!data.user?.confirmed_at) {
      alert('Please verify your email before logging in.');
      } else {
          const { data: userData } = await supabase
            .from('users')
            .select('username')
            .eq('id', data.user.id)
            .single();

          if (!userData?.username) {
            alert('Welcome! Please choose your unique username (cannot be changed later).');
            navigate('/account');
          } else {
            navigate('/home');
          }
      }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1 className="app-title">RemindifyCircle</h1>
          <p className="subtitle">Welcome back 👋</p>
        </div>
        <form className="login-form" onSubmit={handleLogin}>
          <label>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label>Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="error-text">{error}</p>}
          <button type="submit" className="login-button">Log In</button>
        </form>
        <p className="signup-link">
          Don’t have an account? <a href="/signup">Sign Up</a>
        </p>
      </div>
    </div>
  );
}