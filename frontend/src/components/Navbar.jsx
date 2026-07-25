import { Link, NavLink } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Icon from './Icons';

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <header className="nav">
      <div className="nav-inner">
        <Link className="brand" to="/"><span className="brand-mark"><Icon name="shield" size={18} /></span>SecureTask</Link>
        {user && (
          <nav className="nav-links">
            <NavLink to="/"><Icon name="spark" size={16} />Dashboard</NavLink>
            <NavLink to="/tasks"><Icon name="list" size={16} />Tasks</NavLink>
            <NavLink to="/profile"><Icon name="user" size={16} />Profile</NavLink>
            {user.role === 'admin' && <NavLink to="/admin"><Icon name="users" size={16} />Admin</NavLink>}
            <span className="user-chip">{user.profile?.name || user.email?.split('@')[0]}</span>
            <button className="secondary nav-logout" onClick={logout}><Icon name="logOut" size={16} />Logout</button>
          </nav>
        )}
      </div>
    </header>
  );
}
