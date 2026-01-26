import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';

export const Register: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [step, setStep] = useState(1);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) throw new Error('Registration failed');

      const data = await response.json();
      setSecret(data.secret);
      const qrUrl = await QRCode.toDataURL(data.otpAuthTotpURL);
      setQrCodeUrl(qrUrl);
      setStep(2);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-900">
      <div className="bg-amber-50 p-8 rounded-lg shadow-2xl w-96 border-4 border-double border-amber-700">
        <h2 className="text-3xl mb-6 font-serif font-bold text-center text-amber-900">Gringotts Registry</h2>
        {step === 1 ? (
          <form onSubmit={handleRegister}>
            <div className="mb-4">
              <label className="block mb-2 font-serif text-amber-900">Username</label>
              <input
                type="text"
                className="w-full p-2 border-b-2 border-amber-300 bg-amber-50 focus:border-amber-600 outline-none transition-colors font-serif"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="mb-6">
              <label className="block mb-2 font-serif text-amber-900">Password</label>
              <input
                type="password"
                className="w-full p-2 border-b-2 border-amber-300 bg-amber-50 focus:border-amber-600 outline-none transition-colors font-serif"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-amber-700 text-amber-50 p-2 rounded font-serif font-bold hover:bg-amber-800 transition-colors shadow-md"
            >
              Next
            </button>
          </form>
        ) : (
          <div className="text-center">
            <p className="mb-4 font-serif text-amber-900">Scan this rune with your magical device:</p>
            <img src={qrCodeUrl} alt="2FA QR Code" className="mx-auto mb-4 border-4 border-amber-200 rounded-lg" />
            <p className="mb-4 text-sm text-amber-800 font-mono bg-amber-100 p-2 rounded">Secret: {secret}</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-emerald-700 text-emerald-50 p-2 rounded font-serif font-bold hover:bg-emerald-800 transition-colors shadow-md"
            >
              Proceed to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
