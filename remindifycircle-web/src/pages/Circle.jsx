import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import './Circle.css';

export default function Circle() {
  const [circle, setCircle] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchUsername, setSearchUsername] = useState('');
  const [searchError, setSearchError] = useState('');
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState({ largeText: false });  
  useEffect(() => {
    const applyPreferences = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('users')
        .select('preferences')
        .eq('id', user.id)
        .single();
  
      if (profile?.preferences) {
        setPreferences(profile.preferences);
        document.querySelector('.app-wrapper-full')?.classList.toggle('dark-mode', profile.preferences.darkMode);
        document.querySelector('.circle-page')?.classList.toggle('large-text', profile.preferences.largeText);
      }
    };
  
    applyPreferences();
  }, []);

  useEffect(() => {
    const fetchCircle = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: members } = await supabase
        .from('circle')
        .select('member_id, relationship')
        .eq('owner_id', user.id);

      const { data: reqs } = await supabase
        .from('circle_requests')
        .select('id, from_user_id, to_user_email, status')
        .eq('to_user_email', user.email)
        .eq('status', 'pending');

      if (members) setCircle(members);
      if (reqs) setRequests(reqs);
      setLoading(false);
    };

    fetchCircle();
  }, []);

  const acceptRequest = async (request) => {
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('circle').insert([
      { owner_id: request.from_user_id, member_id: user.id, relationship: 'Friend' },
      { owner_id: user.id, member_id: request.from_user_id, relationship: 'Friend' },
    ]);

    await supabase
      .from('circle_requests')
      .update({ status: 'accepted' })
      .eq('id', request.id);

    setRequests(prev => prev.filter(r => r.id !== request.id));
  };

  const removeMember = async (memberId) => {
    const { data: { user } } = await supabase.auth.getUser();

    await supabase
      .from('circle')
      .delete()
      .match({ owner_id: user.id, member_id: memberId });

    setCircle(prev => prev.filter(c => c.member_id !== memberId));
  };

  return (
    <div className="app-wrapper-full">
      <div className="circle-page page-content">
        <h2>Your Circle</h2>

        <input type="text" className="search" placeholder="Search your circle" />

        {requests.length > 0 && (
          <div className="pending-request">
            <strong>Pending Contact Requests</strong>
            {requests.map((r) => (
              <div className="request-item" key={r.id}>
                <span>{r.to_user_email}</span>
                <div>
                  <button className="reject-btn">✖</button>
                  <button className="accept-btn" onClick={() => acceptRequest(r)}>Accept</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <h3>Your Circle</h3>
        {loading ? <p>Loading...</p> : (
          <ul className="circle-list">
            {circle.map((m, idx) => (
              <li key={idx} className="circle-item">
                <span>{m.relationship}</span>
                <button className="reject-btn" onClick={() => removeMember(m.member_id)}>✖</button>
              </li>
            ))}
          </ul>
        )}

        <div className="invite-section">
          <button className="invite-btn" onClick={() => setShowAddDialog(true)}>+ Add Contact</button>
        </div>

        {showAddDialog && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Add Contact</h3>

              <input
                type="text"
                placeholder="Enter username"
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
              />

              {searchError && <p style={{ color: 'red' }}>{searchError}</p>}

              <div className="modal-actions">
                <button onClick={() => setShowAddDialog(false)}>Cancel</button>
                <button
                  className="primary-button"
                  onClick={async () => {
                    const { data: { user } } = await supabase.auth.getUser();
                    const { data: match } = await supabase
                      .from('users')
                      .select('id, email')
                      .eq('username', searchUsername)
                      .single();

                    if (!match) {
                      setSearchError('User not found');
                    } else if (match.id === user.id) {
                      setSearchError('You cannot add yourself');
                    } else {
                      await supabase.from('circle_requests').insert([
                        { from_user_id: user.id, to_user_email: match.email }
                      ]);
                      setShowAddDialog(false);
                      setSearchUsername('');
                      setSearchError('');
                    }
                  }}
                >
                  Send Request
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="footer-nav">
          <div className="nav-item" onClick={() => navigate('/home')}>🏠 Home</div>
          <div className="nav-item active" onClick={() => navigate('/circle')}>👥 Circle</div>
          <div className="nav-item" onClick={() => navigate('/account')}>⚙️ Account</div>
        </div>
      </div>
    </div>
  );
}
