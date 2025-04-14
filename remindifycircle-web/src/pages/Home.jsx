import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import './Home.css';

export default function Home() {
  const [preferences, setPreferences] = useState({ largeText: false });  
  const [reminders, setReminders] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [circleMembers, setCircleMembers] = useState([]);
  const [reminderError, setReminderError] = useState('');
  const [reminderRecipient, setReminderRecipient] = useState('');
  const [reminderSubject, setReminderSubject] = useState('');
  const [reminderBody, setReminderBody] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [receivedReminders, setReceivedReminders] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReminders = async () => {
      const { data } = await supabase
        .from('reminders')
        .select('*')
        .order('scheduled_time', { ascending: true });

      if (data) setReminders(data);
    };

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

      const { data: members } = await supabase
        .from('circle')
        .select('member_id, relationship')
        .eq('owner_id', user.id);

      if (members && members.length > 0) {
        setCircleMembers(members);
        setReminderError('');
      } else {
        setReminderError('No one in your circle. Head to the Circle tab.');
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
              <span className="dot"></span>
              <span className="bell-icon">🔔</span>
              {showNotifications && (
                <div className="notification-popup">
                  <h4>Incoming Reminders</h4>
                  {receivedReminders.length === 0 ? (
                    <p>No reminders</p>
                  ) : (
                    <ul>
                      {receivedReminders.map((reminder) => (
                        <li key={reminder.id}>
                          <strong>{reminder.content_title}</strong>
                          <p>{new Date(reminder.scheduled_time).toLocaleString()}</p>
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
            <button className="edit-btn">✏️ Edit Reminders</button>

            {reminders.length === 0 ? (
              <p className="empty-text">No reminders yet.</p>
            ) : (
              reminders.map((r) => (
                <div key={r.id} className="reminder-card">
                  <div className="reminder-meta">
                    <span className="tag">
                      {Math.abs(Date.now() - new Date(r.scheduled_time).getTime()) < 5 * 60 * 1000 ? 'Now' : 'Scheduled'}
                    </span>
                    <span className="time">
                      {new Date(r.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="reminder-title">{r.content_text}</p>
                  {r.subtitle && <p className="reminder-subtitle">{r.subtitle}</p>}
                  <p className="snoozed-until">Snoozed until: {new Date(r.scheduled_time).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  <p className="reminder-from">From: <strong>{r.sender_name || 'You'}</strong></p>
                  <div className="snooze-options">
                    {[
                      { label: '5m', value: 5 },
                      { label: '10m', value: 10 },
                      { label: '30m', value: 30 },
                      { label: '1h', value: 60 },
                    ].map(({ label, value }) => (
                      <button key={label} onClick={() => handleSnooze(r.id, value)}>{label}</button>
                    ))}
                  </div>
                  {editMode && (
                    <div className="reminder-actions">
                      <button onClick={() => {
                        setReminderRecipient(r.recipient_id);
                        setReminderSubject(r.content_title);
                        setReminderBody(r.content_text);
                        setReminderTime(new Date(r.scheduled_time).toISOString().slice(0, 16));
                        setShowReminderModal(true);
                      }}>Edit</button>
                      <button onClick={async () => {
                        const { error } = await supabase
                          .from('reminders')
                          .delete()
                          .eq('id', r.id);
                        if (!error) {
                          fetchReminders();
                        }
                      }}>Delete</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </main>
        </div>
      </div>
      <footer className="bottom-nav">
        <div className="nav-item active">🏠 Home</div>
        <div className="nav-item" onClick={() => navigate('/circle')}>👥 Circle</div>
        <div className="nav-item" onClick={() => navigate('/account')}>⚙️ Account</div>
      </footer>
      {showReminderModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>New Reminder</h3>

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
                      if (!reminderRecipient || !reminderSubject || !reminderBody || !reminderTime) {
                        alert('Please fill all fields.');
                        return;
                      }

                      const { data: { user } } = await supabase.auth.getUser();

                      const { error } = await supabase.from('reminders').insert([
                        {
                          sender_id: user.id,
                          recipient_id: reminderRecipient,
                          content_text: reminderBody,
                          content_title: reminderSubject,
                          scheduled_time: reminderTime,
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