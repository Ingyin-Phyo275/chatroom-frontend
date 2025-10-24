import './App.css';
import Dashboard from './features/dashboard/dashboard';
import Login from './features/Login/login';
import useAuthStore from './store/authStore';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  // const isAuthenticated = true;
  localStorage.removeItem('theme');

  return (
    <>
          {isAuthenticated ? <Dashboard /> : <Login />}
    </>
  );
}

export default App;

