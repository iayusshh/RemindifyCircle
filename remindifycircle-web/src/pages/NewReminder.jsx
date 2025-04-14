import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function NewReminder() {
  const navigate = useNavigate();
  const [contentText, setContentText] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [status, setStatus] = useState('pending');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const { error } = await supabase.from('reminders').insert([
      {
        content_text: contentText,
        scheduled_time: scheduledTime,
        status,
      },
    ]);

    if (error) {
      setError(error.message);
    } else {
      navigate('/home');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold text-blue-600 mb-4">New Reminder</h2>

        <input
          type="text"
          placeholder="Reminder text"
          className="w-full mb-3 p-2 border rounded"
          value={contentText}
          onChange={(e) => setContentText(e.target.value)}
          required
        />

        <input
          type="datetime-local"
          className="w-full mb-3 p-2 border rounded"
          value={scheduledTime}
          onChange={(e) => setScheduledTime(e.target.value)}
          required
        />

        <select
          className="w-full mb-4 p-2 border rounded"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="pending">Pending</option>
          <option value="snoozed">Snoozed</option>
          <option value="completed">Completed</option>
        </select>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Save Reminder
        </button>
      </form>
    </div>
  );
}