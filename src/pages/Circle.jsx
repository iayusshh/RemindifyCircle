import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import './Circle.css';

export default function Circle() {
  const [circle, setCircle] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
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
  const [showSentModal, setShowSentModal] = useState(false);

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

      const { data: raw } = await supabase
        .from('circle')
        .select(`
          id,
          sender_id,
          recipient_id,
          relationship,
          status,
          created_at,
          sender:sender_id (
            username,
            full_name
          ),
          recipient:recipient_id (
            username,
            full_name
          )
        `)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`);

      const circleMembers = raw.filter(c =>
        c.status === 'accepted' &&
        (c.sender_id === user.id || c.recipient_id === user.id)
      ).map(c => ({
        ...(c.sender_id === user.id ? {
          member_id: c.recipient_id,
          username: c.recipient?.username,
          full_name: c.recipient?.full_name
        } : {
          member_id: c.sender_id,
          username: c.sender?.username,
          full_name: c.sender?.full_name
        }),
        relationship: c.relationship || 'Friend',
        status: c.status
      }));

      const pendingRequests = raw.filter(c =>
        c.status === 'pending' && c.recipient_id === user.id
      );

      const sentRequests = raw.filter(c =>
        c.status === 'pending' && c.sender_id === user.id
      );
      setCircle(circleMembers);
      setRequests(pendingRequests);
      setSentRequests(sentRequests);
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
  const confirm = window.confirm(
    "Are you sure you want to remove this contact from your circle?\n\nThis action cannot be undone. You both will be removed from each other's circle and must send a new request to reconnect."
  );

    if (!confirm) return;

    const { data: { user } } = await supabase.auth.getUser();

    await supabase
      .from('circle')
      .delete()
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${memberId}),and(sender_id.eq.${memberId},recipient_id.eq.${user.id})`);

  setCircle(prev => prev.filter(c => c.member_id !== memberId));
  alert("Contact has been removed from your circle.");
  };

  return (
    <div className="app-wrapper-full">
      <div className="circle-page page-content">
        <div className="circle-header spaced-between">
          <h2>Your Circle</h2>
          <button className="invite-btn" onClick={() => setShowAddDialog(true)}>+ Add Contact</button>
        </div>

        <input type="text" className="search compact-search" placeholder="Search your circle" onChange={(e) => setSearchUsername(e.target.value)} />
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
          <button className="pending-btn" onClick={() => setShowSentModal(true)}>Requests Sent</button>
          <button className="pending-btn" onClick={() => setShowPendingModal(true)}>View Pending Requests</button>
        </div>

        {requests.length > 0 && (
          <div className="pending-request">
            <strong>Pending Contact Requests</strong>
            {requests.map((r) => (
              <div className="request-item" key={r.id}>
                <span>{r.sender?.username || r.sender_id} <em style={{ fontSize: '0.85em', color: '#888' }}>⏳ Pending</em></span>
                <div>
                  <button
                    className="reject-btn"
                    onClick={async () => {
                      const confirmReject = window.confirm("Are you sure you want to reject this request?");
                      if (!confirmReject) return;
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

        {showSentModal && (
          <div className="modal-overlay">
            <div className="modal-content fade-in scale-up" style={{ backgroundColor: '#fff', color: '#000', maxHeight: '70vh', overflowY: 'auto' }}>
              <h3>Requests Sent</h3>
              {sentRequests.length === 0 ? (
                <p>No outgoing requests</p>
              ) : (
                sentRequests.map((r) => (
                  <div className="request-item" key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span>
                      To: <strong>{r.recipient?.username || r.recipient_id}</strong><br />
                      <small>{new Date(r.created_at).toLocaleString()}</small>
                    </span>
                    <button
                      style={{ backgroundColor: '#fee2e2', color: '#b91c1c' }}
                      onClick={async () => {
                        const confirmCancel = window.confirm("Are you sure you want to cancel this request?");
                        if (!confirmCancel) return;
                        await supabase.from('circle').delete().eq('id', r.id);
                        setSentRequests(prev => prev.filter(req => req.id !== r.id));
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                ))
              )}
              <div style={{ textAlign: 'right', marginTop: '10px' }}>
                <button onClick={() => setShowSentModal(false)} style={{ backgroundColor: '#eee' }}>Close</button>
              </div>
            </div>
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
                      <span>
                        {m.full_name || m.username || m.member_id}
                        {m.username && (
                          <span style={{ fontStyle: 'italic', fontSize: '0.85em', marginLeft: '6px', color: '#555' }}>
                            @{m.username}
                          </span>
                        )}
                        {m.relationship && <span className="relationship-tag"> ({m.relationship})</span>}
                      </span>
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
                    <span>{r.sender?.username || r.sender_id} <em style={{ fontSize: '0.85em', color: '#888' }}>⏳ Pending</em></span>
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
