import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_API || "http://localhost:4000/api";

// Auth Context
export const AuthContext = React.createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Check if user is authenticated
  useEffect(() => {
    if (token) {
      // Verify token with backend
      axios.get(`${API}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        if (res.data.success) {
          setUser(res.data.user);
        } else {
          logout();
        }
      })
      .catch(() => logout())
      .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  // Google OAuth login
  const loginWithGoogle = () => {
    // Calculate center position for popup
    const width = 500;
    const height = 600;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;
    
    const popup = window.open(
      `${API}/auth/google`,
      'google-auth',
      `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,resizable=yes,status=yes,toolbar=no,menubar=no,location=no`
    );

    // Listen for token from popup
    const messageListener = (event) => {
      console.log('Received message:', event.origin, event.data);
      
      // Allow messages from backend origin
      if (event.origin !== 'http://localhost:4000' && event.origin !== window.location.origin) {
        console.log('Origin not allowed:', event.origin);
        return;
      }
      
      if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        console.log('Auth success received:', event.data);
        const { token: newToken, user: userData } = event.data;
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('token', newToken);
        popup.close();
        window.removeEventListener('message', messageListener);
      }
    };

    window.addEventListener('message', messageListener);
    
    // Check if popup is closed manually
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageListener);
      }
    }, 1000);
  };

  // Logout
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  // Get auth headers for API calls
  const getAuthHeaders = () => {
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      loginWithGoogle,
      logout,
      getAuthHeaders,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
