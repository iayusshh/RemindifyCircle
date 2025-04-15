import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import './Account.css';

const Account = () => {
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [updatedFullName, setUpdatedFullName] = useState('');
  const [updatedUsername, setUpdatedUsername] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [usernameUpdated, setUsernameUpdated] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [initialFullName, setInitialFullName] = useState('');
  const [initialUsername, setInitialUsername] = useState('');
  const navigate = useNavigate();
  const usernameInputRef = useRef(null);

  const getUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    
    const { data: userRow } = await supabase
      .from('users')
      .select('username, username_updated, full_name')
      .eq('id', user.id)
      .single();

    setUpdatedUsername(userRow?.username || 'username');
    setInitialUsername(userRow?.username || 'username');
    setUpdatedFullName(userRow?.full_name || 'Full Name');
    setInitialFullName(userRow?.full_name || 'Full Name');
    setUsernameUpdated(userRow?.username_updated || false);

    if (!userRow?.username) {
      alert('Please set your unique username. This can only be changed once.');
      setEditMode(true);
      setTimeout(() => {
        usernameInputRef.current?.focus();
      }, 100);
    }
  };

  useEffect(() => {
    getUser();
  }, []);

  return (
    <div className="account-page">
      <h2>Account Settings</h2>
      <div className="account-profile">
        <div className="avatar-circle">{updatedUsername?.charAt(0).toUpperCase() || '?'}</div>
        <div className="username">@{updatedUsername || 'username'}</div>
        <button className="edit-profile" onClick={() => setEditMode(true)}>Edit Profile</button>
      </div>
      <div className="logout-button">
        <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/'; }}>Logout</button>
      </div>
      {editMode && (
        <div className="edit-profile-dialog">
          <div className="dialog-box">
            <h3>Edit Profile</h3>
            <input
              type="text"
              value={updatedUsername}
              onChange={(e) => setUpdatedUsername(e.target.value)}
              placeholder="Username"
              ref={usernameInputRef}
              disabled={usernameUpdated}
            />
            <input
              type="text"
              value={updatedFullName}
              onChange={(e) => setUpdatedFullName(e.target.value)}
              placeholder="Full Name"
            />
            {usernameError && <p className="error-text">{usernameError}</p>}
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => {
                setEditMode(false);
                setUpdatedFullName(initialFullName);
                setUpdatedUsername(initialUsername);
              }}>Cancel</button>
              <button className="save-btn" disabled={
                (updatedFullName === initialFullName && updatedUsername === initialUsername) ||
                updatedUsername.trim().length < 3 ||
                updatedFullName.trim().length < 3
              } onClick={async () => {
                const { data: { user } } = await supabase.auth.getUser();

                if (!updatedFullName.trim() || !updatedUsername.trim()) {
                  setUsernameError('All fields are required.');
                  return;
                }

                if (updatedUsername.length < 3) {
                  setUsernameError('Username should be at least 3 characters.');
                  return;
                }

                if (updatedFullName.length < 3) {
                  setUsernameError('Full name should be at least 3 characters.');
                  return;
                }

                const { data: existingUser, error: userCheckError } = await supabase
                  .from('users')
                  .select('id')
                  .eq('username', updatedUsername)
                  .single();

                if (!usernameUpdated && existingUser && existingUser.id !== user.id) {
                  setUsernameError('Username already taken');
                  return;
                }

                const updateData = { full_name: updatedFullName };
                if (!usernameUpdated && updatedUsername !== user?.user_metadata?.username) {
                  updateData.username = updatedUsername;
                  updateData.username_updated = true;
                }

                const { error } = await supabase
                  .from('users')
                  .update(updateData)
                  .eq('id', user.id);

                if (!error) {
                  setInitialFullName(updatedFullName);
                  setInitialUsername(updatedUsername);
                  setEditMode(false);
                  await getUser();
                  setShowToast(true);
                  setTimeout(() => setShowToast(false), 3000);
                  setUsernameError('');
                } else {
                  alert('Error updating profile');
                  console.error(error);
                }
              }}>Save</button>
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
