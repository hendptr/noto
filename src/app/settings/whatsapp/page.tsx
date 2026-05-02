'use client';
import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function WhatsAppSettings() {
  const [settings, setSettings] = useState<any>(null);
  const [number, setNumber] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
    const interval = setInterval(fetchSettings, 5000); // Poll for QR updates
    return () => clearInterval(interval);
  }, []);

  const fetchSettings = async () => {
    const res = await fetch('/api/settings/whatsapp');
    const data = await res.json();
    if (data) {
      if (!settings || settings.whatsappStatus !== data.whatsappStatus || settings.whatsappQr !== data.whatsappQr) {
        setSettings(data);
      }
      if (!number && data.whatsappNumber) {
        setNumber(data.whatsappNumber);
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await fetch('/api/settings/whatsapp', {
      method: 'POST',
      body: JSON.stringify({ whatsappNumber: number })
    });
    setSaving(false);
    fetchSettings();
  };

  if (!settings) return <div className="p-10 text-[#8C7A6B]">Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto py-20 px-8">
      <h1 className="text-3xl font-serif text-[#2c2c2c] mb-2">WhatsApp Bot Configuration</h1>
      <p className="text-[#8C7A6B] mb-10">Scan the QR code below to connect the Noto AI bot to your WhatsApp account.</p>

      <div className="bg-white/50 backdrop-blur-xl border border-white/40 p-8 rounded-2xl shadow-xl mb-8">
        <h2 className="text-xl font-serif text-[#2c2c2c] mb-4">Connection Status</h2>
        <div className="flex items-center space-x-3 mb-6">
          <div className={`w-3 h-3 rounded-full ${settings.whatsappStatus === 'connected' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
          <span className="text-[#2c2c2c] font-medium uppercase tracking-wider text-sm">
            {settings.whatsappStatus}
          </span>
        </div>

        {settings.whatsappStatus !== 'connected' && settings.whatsappQr && (
          <div className="bg-white p-4 rounded-xl inline-block shadow-sm">
            <QRCodeSVG value={settings.whatsappQr} size={200} />
          </div>
        )}

        {settings.whatsappStatus !== 'connected' && !settings.whatsappQr && (
          <p className="text-[#8C7A6B] text-sm">Waiting for QR Code... (Make sure whatsapp-bot.js is running on your server)</p>
        )}
      </div>

      <div className="bg-white/50 backdrop-blur-xl border border-white/40 p-8 rounded-2xl shadow-xl">
        <h2 className="text-xl font-serif text-[#2c2c2c] mb-4">Target Phone Number</h2>
        <p className="text-[#8C7A6B] text-sm mb-4">
          Enter your WhatsApp number with the country code (e.g., 628123456789). The bot will ONLY listen to messages from this number, and will send all reminders here.
        </p>
        <div className="flex space-x-4">
          <input
            type="text"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="628..."
            className="flex-1 bg-white/60 border-none rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#EBE5DA] text-[#2c2c2c]"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-[#2c2c2c] text-[#EBE5DA] px-6 py-3 rounded-xl hover:bg-[#1a1a1a] transition-colors"
          >
            {saving ? 'Saving...' : 'Save Number'}
          </button>
        </div>
      </div>
    </div>
  );
}
