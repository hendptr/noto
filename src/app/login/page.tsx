'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight, Delete } from 'lucide-react';
import clsx from 'clsx';

export default function LoginPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + num);
      setError('');
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleSubmit = async () => {
    if (pin.length !== 4) return;
    
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      if (res.ok) {
        router.push('/');
      } else {
        setError('Incorrect PIN');
        setPin('');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] flex flex-col items-center justify-center p-4 text-[#2C2C2C]">
      <div className="w-full max-w-sm space-y-12">
        <div className="flex flex-col items-center space-y-6">
          <div className="w-16 h-16 flex items-center justify-center">
            <Lock className="w-8 h-8 text-[#8C7A6B]" strokeWidth={1.5} />
          </div>
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-serif tracking-tight text-[#1a1a1a]">
              Noto
            </h1>
            <p className="text-sm text-[#8C7A6B] uppercase tracking-widest">
              Personal Diary
            </p>
          </div>
          <div className="h-4">
            {error && <p className="text-[#e74c3c] text-sm tracking-wide">{error}</p>}
          </div>
        </div>

        {/* PIN Dots */}
        <div className="flex justify-center space-x-6">
          {[0, 1, 2, 3].map((index) => (
            <div
              key={index}
              className={clsx(
                "w-3 h-3 rounded-full transition-all duration-300 ease-out",
                pin.length > index
                  ? "bg-[#2C2C2C] scale-125"
                  : "bg-[#EBE5DA]"
              )}
            />
          ))}
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-6 max-w-[280px] mx-auto pt-8 border-t border-[#EBE5DA]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => handleKeyPress(num.toString())}
              disabled={pin.length >= 4 || loading}
              className="w-full aspect-square flex items-center justify-center text-2xl font-light text-[#2C2C2C] hover:bg-[#EBE5DA] rounded-full active:scale-90 transition-all duration-200"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleDelete}
            disabled={pin.length === 0 || loading}
            className="w-full aspect-square flex items-center justify-center text-[#8C7A6B] hover:bg-[#EBE5DA] rounded-full active:scale-90 transition-all duration-200"
          >
            <Delete className="w-6 h-6" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => handleKeyPress('0')}
            disabled={pin.length >= 4 || loading}
            className="w-full aspect-square flex items-center justify-center text-2xl font-light text-[#2C2C2C] hover:bg-[#EBE5DA] rounded-full active:scale-90 transition-all duration-200"
          >
            0
          </button>
          <button
            onClick={handleSubmit}
            disabled={pin.length !== 4 || loading}
            className="w-full aspect-square flex items-center justify-center text-[#FDFCF8] bg-[#2C2C2C] hover:bg-[#1a1a1a] rounded-full active:scale-90 transition-all duration-200 disabled:opacity-30 disabled:hover:bg-[#2C2C2C]"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-[#FDFCF8]/30 border-t-[#FDFCF8] rounded-full animate-spin" />
            ) : (
              <ArrowRight className="w-6 h-6" strokeWidth={1.5} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
