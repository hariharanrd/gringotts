import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/v1/auth/authenticate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, code: parseInt(code) }),
        credentials: 'include', // Important: This tells the browser to accept the cookie
      });

      if (!response.ok) throw new Error('Authentication failed');
      onLoginSuccess();
    } catch (err) {
      setError('Invalid credentials or 2FA code');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-900">
      <div className="bg-amber-50 p-8 rounded-lg shadow-2xl w-96 border-4 border-double border-amber-700">
        <h2 className="text-3xl mb-6 font-serif font-bold text-center text-amber-900">Gringotts Vault</h2>
        {error && <div className="text-red-500 mb-4 text-center">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2 font-serif text-amber-900" htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              className="w-full p-2 border-b-2 border-amber-300 bg-amber-50 focus:border-amber-600 outline-none transition-colors font-serif"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2 font-serif text-amber-900" htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              className="w-full p-2 border-b-2 border-amber-300 bg-amber-50 focus:border-amber-600 outline-none transition-colors font-serif"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block mb-2 font-serif text-amber-900" htmlFor="totp">Magical Code (2FA)</label>
            <input
              id="totp"
              name="totp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="w-full p-2 border-b-2 border-amber-300 bg-amber-50 focus:border-amber-600 outline-none transition-colors font-serif"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-amber-700 text-amber-50 p-2 rounded font-serif font-bold hover:bg-amber-800 transition-colors shadow-md mb-4"
          >
            Open Vault
          </button>
        </form>
      </div>
    </div>
  );
};
