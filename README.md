# RemindifyCircle

RemindifyCircle is a smart, circle-based reminder web application designed to help users stay connected and productive by sending and receiving scheduled reminders from trusted contacts.

## 📌 Features

- 🔔 Send and receive reminders (immediate or scheduled)
- 💤 Snooze reminders for later
- ✅ Mark as done or undo reminders
- 👥 Add people to your Circle via unique usernames
- 🔄 Accept or reject Circle requests
- 🗂️ Filter reminders: All, Pending, Snoozed, Done
- 🔐 User authentication via Supabase (email/password)
- ⚙️ Account management with one-time username setup
- 📱 Progressive Web App support (installable, mobile-friendly)
- 🚀 Deployed on Vercel

## 🔧 Tech Stack

- **Frontend**: React + Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Deployment**: Vercel
- **State Management**: React Hooks

## 📁 Project Structure

```
📦 remindifycircle-web
├── public/
│   ├── favicon.ico
│   ├── index.html
├── src/
│   ├── pages/
│   ├── components/
│   ├── App.jsx
│   ├── supabaseClient.js
├── .gitignore
├── package.json
├── tailwind.config.js
```

## 🚀 Live Demo

🌐 Vercel: http://remindify-circle.vercel.app/
## 🛠️ Run Locally

1. Clone the repository:
```bash
git clone https://github.com/your-username/remindifycircle.git
```

2. Install dependencies:
```bash
npm install
```

3. Add your environment variables in `.env`:
```
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

4. Start the development server:
```bash
npm run dev
```

## 🙋‍♂️ Author

**Ayush Anand**

---

© 2025 RemindifyCircle. All rights reserved.
