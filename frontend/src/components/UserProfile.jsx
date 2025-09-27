import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const UserProfile = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="flex items-center space-x-3">
      {user.avatar && (
        <img 
          src={user.avatar} 
          alt={user.name}
          className="w-8 h-8 rounded-full"
        />
      )}
      <div className="flex flex-col">
        <span className="text-sm font-medium text-slate-700">{user.name}</span>
        <span className="text-xs text-slate-500">{user.email}</span>
      </div>
      <button
        onClick={logout}
        className="ml-2 px-3 py-1 text-xs font-medium text-slate-600 hover:text-slate-800 border border-slate-300 rounded-md hover:bg-slate-50"
      >
        Logout
      </button>
    </div>
  );
};

export default UserProfile;
