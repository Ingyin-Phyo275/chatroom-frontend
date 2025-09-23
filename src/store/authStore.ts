// store/authStore.ts
import { create } from 'zustand';

interface UserDetails {
  name: string;
  email: string;
  avatar?: string;
  phone_no?: string;
  status?: boolean;
}

interface User {
  user: UserDetails;
  token: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loginStore: (userData: User) => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>((set) => {
  const initialUserStr = localStorage.getItem('user');
  const initialUser: User | null = initialUserStr ? JSON.parse(initialUserStr) : null;

  window.addEventListener('storage', (event) => {
    if (event.key === 'user') {
      const newUser = event.newValue ? JSON.parse(event.newValue) : null;
      set({
        user: newUser,
        isAuthenticated: !!newUser,
      });
    }
  });

  return {
    user: initialUser,
    isAuthenticated: !!initialUser,
    loginStore: (userData: User) => {
      localStorage.setItem('user', JSON.stringify(userData));
      set({
        user: userData,
        isAuthenticated: true,
      });
    },
    logout: () => {
      localStorage.removeItem('user');
      set({
        user: null,
        isAuthenticated: false,
      });
    },
  };
});

export default useAuthStore;
