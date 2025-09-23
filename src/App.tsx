import './App.css';
import { ThemeProvider } from './components/theme-provider';
import Dashboard from './features/dashboard/dashboard';
import Login from './features/Login/login';
import useAuthStore from './store/authStore';

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  // const isAuthenticated = true;

  return (
    <>

      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          {isAuthenticated ? <Dashboard /> : <Login />}
      </ThemeProvider>

    </>
  );
}

export default App;
