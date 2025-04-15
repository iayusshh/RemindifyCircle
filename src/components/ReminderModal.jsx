import { supabase } from '../supabaseClient';

const onSendReminder = async () => {
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase.from('reminders').insert([
    {
      sender_id: user.id,
      recipient_id: selectedRecipientId, // This should be taken from the modal state
      subject: reminderSubject,
      body: reminderBody,
      scheduled_at: reminderDateTime,
      status: 'pending',
      read: false
    }
  ]);

  if (!error) {
    setReminderSubject('');
    setReminderBody('');
    setReminderDateTime(null);
    setShowReminderModal(false); // or equivalent modal closing logic
  } else {
    console.error('Reminder insert error:', error.message);
  }
};
