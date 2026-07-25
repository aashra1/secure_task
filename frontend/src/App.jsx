import { Route, Routes } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import Admin from './pages/Admin';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import MFAVerification from './pages/MFAVerification';
import Profile from './pages/Profile';
import Register from './pages/Register';
import TaskDetails from './pages/TaskDetails';
import Tasks from './pages/Tasks';

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <div className="app-shell">
          <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/mfa/verify" element={<MFAVerification />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/tasks/:id" element={<TaskDetails />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
            <Route element={<ProtectedRoute roles={['admin']} />}>
              <Route path="/admin" element={<Admin />} />
            </Route>
          </Routes>
        </div>
      </AuthProvider>
    </ErrorBoundary>
  );
}
