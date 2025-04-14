import React, { useEffect, useState } from 'react';
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
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setUpdatedFullName(user?.user_metadata?.full_name || 'Full Name');
      setUpdatedUsername(user?.user_metadata?.username || 'username');

      const { data } = await supabase
        .from('users')
        .select('username_updated')
        .eq('id', user.id)
        .single();
      setUsernameUpdated(data?.username_updated || false);
    };
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
                setUpdatedFullName(fullname);
                setUpdatedUsername(username);
              }}>Cancel</button>
              <button className="save-btn" onClick={async () => {
                const { data: { user } } = await supabase.auth.getUser();

                if (!updatedFullName || !updatedUsername) {
                  setUsernameError('Fields cannot be empty');
                  return;
                }

                if (!usernameUpdated && updatedUsername !== user?.user_metadata?.username) {
                  const { data: existing } = await supabase
                    .from('users')
                    .select('id')
                    .eq('username', updatedUsername)
                    .single();

                  if (existing) {
                    setUsernameError('Username already taken');
                    return;
                  }
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
                  setFullname(updatedFullName);
                  setUsername(updatedUsername);
                  setEditMode(false);
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
