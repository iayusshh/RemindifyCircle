import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import './Home.css';

export default function Home() {
  const [preferences, setPreferences] = useState({ largeText: false });  
  const [reminders, setReminders] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [receivedReminders, setReceivedReminders] = useState([]);
  const unreadCount = receivedReminders.length;
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [circleMembers, setCircleMembers] = useState([]);
  const [reminderError, setReminderError] = useState('');
  const [reminderRecipient, setReminderRecipient] = useState('');
  const [reminderSubject, setReminderSubject] = useState('');
  const [reminderBody, setReminderBody] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showSelectRecipient, setShowSelectRecipient] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const navigate = useNavigate();

  const fetchReminders = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('reminders')
      .select(`
        id,
        subject,
        body,
        scheduled_at,
        status,
        sender:sender_id (
          username
        )
      `)
      .eq('recipient_id', user.id)
      .order('scheduled_time', { ascending: true });

    if (data) {
      const mapped = data.map((r) => ({
        ...r,
        sender_name: r.sender?.username || 'Anonymous'
      }));
      setReminders(mapped);
    }

    if (error) console.error('Fetch reminders error:', error);
  };

  useEffect(() => {
    const fetchUserProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('email, full_name')
          .eq('id', user.id)
          .single();

        if (profile) {
          console.log('User profile:', profile);
        }
      }
    };

    const fetchCircleMembers = async () => {
      const { data: { user } } = await supabase.auth.getUser();
 
      const { data: members, error } = await supabase
        .from('circle')
        .select('sender_id, recipient_id, relationship, status')
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .eq('status', 'accepted');
 
      if (error) {
        console.error('Failed to fetch circle members:', error);
        return;
      }
 
      const circle = members.map(member => {
        const memberId = member.sender_id === user.id ? member.recipient_id : member.sender_id;
        return { member_id: memberId, relationship: member.relationship };
      });
 
      if (circle.length > 0) {
        setCircleMembers(circle);
        setReminderError('');
      } else {
        setCircleMembers([]);
        setReminderError('Your circle is empty. Please add someone first.');
      }
    };

    const fetchPreferences = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase
        .from('users')
        .select('preferences')
        .eq('id', user.id)
        .single();

      if (profile?.preferences) {
        setPreferences({ largeText: profile.preferences.largeText });
        document.querySelector('.app-wrapper-full')?.classList.toggle('large-text', profile.preferences.largeText);
      }
    };

    const fetchReceivedReminders = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('reminders')
        .select('*')
        .eq('recipient_id', user.id)
        .eq('read', false)
        .order('scheduled_time', { ascending: true });

      if (!error) {
        setReceivedReminders(data);
      }
    };

    fetchReminders();
    fetchUserProfile();
    fetchCircleMembers();
    fetchPreferences();
    fetchReceivedReminders();
  }, []);

  const handleSnooze = async (reminderId, minutes) => {
    const newTime = new Date(Date.now() + minutes * 60000).toISOString();

    const { error } = await supabase
      .from('reminders')
      .update({ scheduled_time: newTime })
      .eq('id', reminderId);

    if (!error) {
      fetchReminders(); // Refresh updated list
    } else {
      console.error('Failed to snooze reminder', error);
    }
  };

  return (
    <div className="app-wrapper-full">
      <div className="page-content">
        <header className="app-header">
          <h1 className="logo">RemindifyCircle</h1>
          <div className="header-icons">
            <div className="notification" onClick={() => setShowNotifications(!showNotifications)}>
              <span className="bell-icon">
                🔔
                {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
              </span>
              {showNotifications && (
                <div className="notification-popup">
                  <h4>Incoming Reminders</h4>
                  {receivedReminders.length === 0 ? (
                    <p>No reminders</p>
                  ) : (
                    <ul>
                      {receivedReminders.map((reminder) => (
                        <li key={reminder.id}>
                          <strong>{reminder.subject}</strong>
                          <p>{new Date(reminder.scheduled_at).toLocaleString()}</p>
                          <button
                            className="dismiss-btn"
                            onClick={async () => {
                              const { error } = await supabase
                                .from('reminders')
                                .update({ read: true })
                                .eq('id', reminder.id);
                              if (!error) {
                                setReceivedReminders((prev) => prev.filter(r => r.id !== reminder.id));
                              }
                            }}
                          >
                            Dismiss
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="content-wrapper">
          <main className="main-content">
            <div className="title-row">
              <h2>Today's reminders</h2>
              <button className="edit-btn" onClick={() => setEditMode(!editMode)}>
                {editMode ? 'Done Editing' : '✏️ Edit Reminders'}
              </button>
            </div>
            <div className="filter-tabs">
              {['all', 'pending', 'snoozed'].map(status => (
                <button
                  key={status}
                  className={`filter-btn ${statusFilter === status ? 'active-filter' : ''}`}
                  onClick={() => setStatusFilter(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {(() => {
              const filtered = reminders?.filter(r => statusFilter === 'all' || (r.status || 'pending') === statusFilter);
              if (!filtered || filtered.length === 0) {
                return (
                  <>
                    <p style={{ marginTop: '1rem', fontStyle: 'italic' }}>No {statusFilter} reminders.</p>
                  </>
                );
              }
              return filtered.map((r) => (
                <div key={r.id} className="reminder-card">
                  <div className="reminder-meta">
                    <span className="tag">
                      {Math.abs(Date.now() - new Date(r.scheduled_at).getTime()) < 5 * 60 * 1000 ? 'Now' : 'Scheduled'}
                    </span>
                    <span className="time">
                      {new Date(r.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="reminder-title">{r.body}</p>

                  {r.status === 'snoozed' && (
                    <p className="snoozed-until">
                      Snoozed until: {new Date(r.scheduled_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  )}

                  <p className="reminder-from">
                    From: <strong>{r.sender_name}</strong>
                  </p>

                  <div className="snooze-options">
                    {[
                      { label: '5m', value: 5 },
                      { label: '10m', value: 10 },
                      { label: '30m', value: 30 },
                      { label: '1h', value: 60 },
                    ].map(({ label, value }) => (
                      <button key={label} onClick={() => handleSnooze(r.id, value)}>
                        {label}
                      </button>
                    ))}
                  </div>

                  {!editMode && r.status !== 'done' && (
                    <button
                      className="done-btn"
                      onClick={async () => {
                        const { error } = await supabase
                          .from('reminders')
                          .update({ status: 'done' })
                          .eq('id', r.id);
                        if (!error) {
                          fetchReminders();
                        }
                      }}
                    >
                      Mark as Done
                    </button>
                  )}

                  {editMode && (
                    <div className="reminder-actions">
                      <button onClick={() => {
                        setReminderRecipient(r.recipient_id);
                        setReminderSubject(r.subject);
                        setReminderBody(r.body);
                        setReminderTime(new Date(r.scheduled_at).toISOString().slice(0, 16));
                        setShowReminderModal(true);
                      }}>
                        Edit
                      </button>

                      <button
                        onClick={async () => {
                          const { error } = await supabase
                            .from('reminders')
                            .delete()
                            .eq('id', r.id);

                          if (!error) {
                            fetchReminders();
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ));
            })()}
          </main>
        </div>
      </div>
      <footer className="bottom-nav">
        <div className="nav-item active">🏠 Home</div>
        <div className="nav-item" onClick={() => navigate('/circle')}>👥 Circle</div>
        <div className="nav-item" onClick={() => navigate('/account')}>⚙️ Account</div>
      </footer>
      

      {showSelectRecipient && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Select a Circle Member</h3>
            <ul>
              {circleMembers.map((member) => (
                <li key={member.member_id} style={{ marginBottom: '12px', listStyleType: 'none' }}>
                  <button
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '6px',
                      backgroundColor: '#f9f9f9',
                      border: '1px solid #ccc',
                      textAlign: 'left',
                      fontWeight: 'bold',
                      color: '#333'
                    }}
                    onClick={() => {
                      setReminderRecipient(member.member_id);
                      setSelectedRecipient(`${member.relationship}`);
                      setShowSelectRecipient(false);
                      setShowReminderModal(true);
                    }}
                  >
                    {`${member.full_name || 'Name'} - ${member.username || 'username'} - ${member.relationship}`}
                  </button>
                </li>
              ))}
            </ul>
            <button onClick={() => setShowSelectRecipient(false)}>Cancel</button>
          </div>
        </div>
      )}
      {showReminderModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create Reminder {selectedRecipient && `for ${selectedRecipient}`}</h3>

            {reminderError ? (
              <p style={{ color: 'red' }}>{reminderError}</p>
            ) : (
              <>
                <label>Send to:</label>
                <select value={reminderRecipient} onChange={(e) => setReminderRecipient(e.target.value)}>
                  {circleMembers.map((m, idx) => (
                    <option key={idx} value={m.member_id}>{m.relationship}</option>
                  ))}
                </select>
              </>
            )}

            {!reminderError && (
              <>
                <label>Subject:</label>
                <input type="text" placeholder="Reminder title" value={reminderSubject} onChange={(e) => setReminderSubject(e.target.value)} />

                <label>Body:</label>
                <textarea placeholder="Message body..." rows="3" value={reminderBody} onChange={(e) => setReminderBody(e.target.value)} />

                <label>Schedule:</label>
                <input type="datetime-local" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} />

                <div className="modal-actions">
                  <button onClick={() => setShowReminderModal(false)}>Cancel</button>
                  <button
                    className="primary-button"
                    onClick={async () => {
                      if (!reminderRecipient || !reminderSubject.trim() || !reminderBody.trim() || !reminderTime) {
                        alert('All fields are required.');
                        return;
                      }

                      if (reminderSubject.length < 3) {
                        alert('Subject should be at least 3 characters.');
                        return;
                      }

                      if (reminderBody.length < 5) {
                        alert('Body should be at least 5 characters.');
                        return;
                      }

                      const { data: { user } } = await supabase.auth.getUser();

                      const { error } = await supabase.from('reminders').insert([
                        {
                          sender_id: user.id,
                          recipient_id: reminderRecipient,
                          body: reminderBody,
                          subject: reminderSubject,
                          scheduled_at: reminderTime,
                          read: false,
                          status: 'pending'
                        }
                      ]);

                      if (!error) {
                        setShowReminderModal(false);
                        setReminderRecipient('');
                        setReminderSubject('');
                        setReminderBody('');
                        setReminderTime('');
                        fetchReminders();
                      } else {
                        alert('Error sending reminder');
                        console.error(error);
                      }
                    }}
                  >
                    Send
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}