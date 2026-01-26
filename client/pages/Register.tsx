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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl mb-4 font-bold text-center">Register</h2>
        {step === 1 ? (
          <form onSubmit={handleRegister}>
            <div className="mb-4">
              <label className="block mb-2">Username</label>
              <input
                type="text"
                className="w-full p-2 border rounded"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="mb-6">
              <label className="block mb-2">Password</label>
              <input
                type="password"
                className="w-full p-2 border rounded"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              Next
            </button>
          </form>
        ) : (
          <div className="text-center">
            <p className="mb-4">Scan this QR code with Google Authenticator:</p>
            <img src={qrCodeUrl} alt="2FA QR Code" className="mx-auto mb-4" />
            <p className="mb-4 text-sm text-gray-600">Secret: {secret}</p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
            >
              Proceed to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
