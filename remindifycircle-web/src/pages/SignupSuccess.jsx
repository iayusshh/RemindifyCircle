import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SignupSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto-redirect after 2.5s
    const timer = setTimeout(() => {
      navigate('/home');
    }, 2500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="login-page">
      <div className="login-card text-center">
        <div className="login-header">
          <h1 className="app-title">✅ Welcome!</h1>
          <p className="subtitle">You’ve successfully joined RemindifyCircle</p>
        </div>
        <p className="text-gray-600 mt-6 mb-4">Redirecting to your dashboard...</p>
        <button
          onClick={() => navigate('/home')}
          className="login-button mt-2"
        >
          Go to Home
        </button>
      </div>
    </div>
  );
}