import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import NewReminder from './pages/NewReminder';
import Signup from './pages/Signup';
import SignupSuccess from './pages/SignupSuccess';
import Circle from './pages/Circle';
import Account from './pages/Account';


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/new-reminder" element={<NewReminder />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/signup-success" element={<SignupSuccess />} />
        <Route path="/circle" element={<Circle />} />
        <Route path="/account" element={<Account />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;