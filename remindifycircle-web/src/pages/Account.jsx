import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import './Account.css';

const Account = () => {
  const [user, setUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [username, setUsername] = useState('username');
  const [fullname, setFullname] = useState('Full Name');
  const [showToast, setShowToast] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setUsername(user?.user_metadata?.username || 'username');
      setFullname(user?.user_metadata?.full_name || 'Full Name');
    };
    getUser();
  }, []);

  return (
    <div className="account-page">
      <h2>Account Settings</h2>
      <div className="account-profile">
        <div className="avatar-circle">{username?.charAt(0).toUpperCase() || '?'}</div>
        <div className="username">@{username || 'username'}</div>
        <button className="edit-profile" onClick={() => setShowModal(true)}>Edit Profile</button>
      </div>
      <div className="logout-button">
        <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/'; }}>Logout</button>
      </div>
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Edit Profile</h3>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
            <input type="text" value={fullname} onChange={(e) => setFullname(e.target.value)} placeholder="Full Name" />
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowModal(false)}>Cancel</button>
              <button
                className="save-btn"
                onClick={async () => {
                  const { data: { user } } = await supabase.auth.getUser();
                  await supabase
                    .from('users')
                    .update({ username, full_name: fullname })
                    .eq('id', user.id);
                  setShowModal(false);
                  setShowToast(true);
                  setTimeout(() => setShowToast(false), 3000);
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {showToast && <div className="toast-success">Profile updated successfully!</div>}
      <div className="footer-nav">
        <div className="nav-item" onClick={() => navigate('/home')}>🏠 Home</div>
        <div className="nav-item" onClick={() => navigate('/circle')}>👥 Circle</div>
        <div className="nav-item active" onClick={() => navigate('/account')}>⚙️ Account</div>
      </div>
    </div>
  );
};

export default Account;
