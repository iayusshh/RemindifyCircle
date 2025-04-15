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
  const [showPendingModal, setShowPendingModal] = useState(false);  
  const [relationship, setRelationship] = useState('');
  const [editingRelationshipId, setEditingRelationshipId] = useState(null);
  const [newRelationship, setNewRelationship] = useState('');

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
        .select('sender_id, recipient_id, relationship')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .eq('status', 'accepted');

      const filteredMembers = members.map((m) => ({
        member_id: m.sender_id === user.id ? m.recipient_id : m.sender_id,
        relationship: m.relationship || 'Friend'
      }));

      setCircle(filteredMembers);

      // Pending requests sent TO this user
      const { data: reqs } = await supabase
        .from('circle')
        .select(`
          id,
          sender_id,
          users!circle_sender_id_fkey (
            username
          )
        `)
        .eq('recipient_id', user.id)
        .eq('status', 'pending');

      if (reqs) setRequests(reqs);
      setLoading(false);
    };

    fetchCircle();
  }, []);

  const acceptRequest = async (request) => {
    await supabase
      .from('circle')
      .update({ status: 'accepted' })
      .eq('id', request.id);

    setRequests(prev => prev.filter(r => r.id !== request.id));
  };

  const removeMember = async (memberId) => {
    const { data: { user } } = await supabase.auth.getUser();

    await supabase
      .from('circle')
      .delete()
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${memberId}),and(sender_id.eq.${memberId},recipient_id.eq.${user.id})`);

    setCircle(prev => prev.filter(c => c.member_id !== memberId));
  };

  return (
    <div className="app-wrapper-full">
      <div className="circle-page page-content">
        <div className="circle-header spaced-between">
          <h2>Your Circle</h2>
          <button className="invite-btn" onClick={() => setShowAddDialog(true)}>+ Add Contact</button>
        </div>

        <input type="text" className="search compact-search" placeholder="Search your circle" onChange={(e) => setSearchUsername(e.target.value)} />
        <button className="pending-btn" onClick={() => setShowPendingModal(true)}>View Pending Requests</button>

        {requests.length > 0 && (
          <div className="pending-request">
            <strong>Pending Contact Requests</strong>
            {requests.map((r) => (
              <div className="request-item" key={r.id}>
                <span>{r.users?.username || r.sender_id} <em style={{ fontSize: '0.85em', color: '#888' }}>⏳ Pending</em></span>
                <div>
                  <button
                    className="reject-btn"
                    onClick={async () => {
                      await supabase
                        .from('circle')
                        .delete()
                        .eq('id', r.id);
                      setRequests(prev => prev.filter(req => req.id !== r.id));
                    }}
                  >
                    ✖
                  </button>
                  <button className="accept-btn" onClick={() => acceptRequest(r)}>Accept</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="circle-section">
          {circle.length === 0 ? (
            <div className="empty-circle-wrapper center-message">
              <p className="empty-circle-msg">Your circle is empty. Add someone!</p>
            </div>
          ) : (
            <ul className="circle-list">
              {circle.filter(m => m.relationship.toLowerCase().includes(searchUsername.toLowerCase())).map((m, idx) => (
                <li key={idx} className="circle-item">
                  {editingRelationshipId === m.member_id ? (
                    <>
                      <input
                        value={newRelationship}
                        onChange={(e) => setNewRelationship(e.target.value)}
                        style={{ marginLeft: '8px', padding: '2px 4px' }}
                      />
                      <button
                        onClick={async () => {
                          const { data: { user } } = await supabase.auth.getUser();
                          const { error } = await supabase
                            .from('circle')
                            .update({ relationship: newRelationship })
                            .or(`and(sender_id.eq.${user.id},recipient_id.eq.${m.member_id}),and(sender_id.eq.${m.member_id},recipient_id.eq.${user.id})`);

                          if (!error) {
                            setCircle(prev =>
                              prev.map(c =>
                                c.member_id === m.member_id
                                  ? { ...c, relationship: newRelationship }
                                  : c
                              )
                            );
                            setEditingRelationshipId(null);
                            setNewRelationship('');
                          }
                        }}
                      >
                        💾
                      </button>
                    </>
                  ) : (
                    <>
                      {m.relationship && <span className="relationship-tag"> ({m.relationship})</span>}
                      <button onClick={() => {
                        setEditingRelationshipId(m.member_id);
                        setNewRelationship(m.relationship);
                      }}>✏️</button>
                    </>
                  )}
                  <button className="reject-btn" onClick={() => removeMember(m.member_id)}>✖</button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {showAddDialog && (
          <div className="modal-overlay">
            <div className="modal-content fade-in scale-up" style={{ backgroundColor: '#fff', color: '#000' }}>
              <h3>Add Contact</h3>

              <input
                type="text"
                placeholder="Enter username"
                value={searchUsername}
                onChange={(e) => setSearchUsername(e.target.value)}
                style={{ backgroundColor: '#fff', color: '#000' }}
              />

              <input
                type="text"
                placeholder="Relationship (optional)"
                value={relationship}
                onChange={(e) => setRelationship(e.target.value)}
                style={{ backgroundColor: '#fff', color: '#000', marginTop: '10px' }}
              />

              {searchError && <p style={{ color: 'red' }}>{searchError}</p>}

              <div className="modal-actions">
                <button onClick={() => setShowAddDialog(false)} style={{ backgroundColor: '#fff', color: '#000' }}>Cancel</button>
                <button
                  className="primary-button"
                  onClick={async () => {
                    const { data: { user } } = await supabase.auth.getUser();
                    const { data: match, error } = await supabase
                      .from('users')
                      .select('id, email')
                      .eq('username', searchUsername)
                      .maybeSingle();

                    if (!match || error) {
                      setSearchError('User not found');
                      return;
                    } 

                    const { data: existing } = await supabase
                      .from('circle')
                      .select('id')
                      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${match.id}),and(sender_id.eq.${match.id},recipient_id.eq.${user.id})`)
                      .neq('status', 'rejected');

                    if (existing.length > 0) {
                      setSearchError('You already have a request or connection with this user.');
                      return;
                    }

                    await supabase.from('circle').insert([
                      {
                        sender_id: user.id,
                        recipient_id: match.id,
                        relationship,
                        status: 'pending'
                      }
                    ]);
                    alert('Request sent!');
                    setShowAddDialog(false);
                    setSearchUsername('');
                    setSearchError('');
                    setRelationship('');
                  }}
                >
                  Send Request
                </button>
              </div>
            </div>
          </div>
        )}

        {showPendingModal && (
          <div className="modal-overlay">
            <div className="modal-content fade-in scale-up" style={{ backgroundColor: '#fff', color: '#000', maxHeight: '70vh', overflowY: 'auto' }}>
              <h3>Pending Contact Requests</h3>
              {requests.length === 0 ? (
                <p>No pending requests</p>
              ) : (
                requests.map((r) => (
                  <div className="request-item" key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span>{r.users?.username || r.sender_id} <em style={{ fontSize: '0.85em', color: '#888' }}>⏳ Pending</em></span>
                    <div>
                      <button
                        style={{ backgroundColor: '#fdd', color: '#900', marginRight: '8px' }}
                        onClick={async () => {
                          await supabase.from('circle').delete().eq('id', r.id);
                          setRequests(prev => prev.filter(req => req.id !== r.id));
                        }}
                      >
                        Reject
                      </button>
                      <button
                        style={{ backgroundColor: '#dfd', color: '#070' }}
                        onClick={() => acceptRequest(r)}
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                ))
              )}
              <div style={{ textAlign: 'right', marginTop: '10px' }}>
                <button onClick={() => setShowPendingModal(false)} style={{ backgroundColor: '#eee' }}>Close</button>
              </div>
            </div>
          </div>
        )}

        <div className="footer-nav fixed-footer">
          <div className="nav-item" onClick={() => navigate('/home')}>🏠 Home</div>
          <div className="nav-item active" onClick={() => navigate('/circle')}>👥 Circle</div>
          <div className="nav-item" onClick={() => navigate('/account')}>⚙️ Account</div>
        </div>
      </div>
    </div>
  );
}
