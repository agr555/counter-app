'use client';
import { useState, useEffect } from 'react';

export default function Timer() {
  const [timeLeft, setTimeLeft] = useState<number>(60); // Время в секундах
  const [isRunning, setIsRunning] = useState<boolean>(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(60); // Сброс на 1 минуту
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-8">Мой Таймер</h1>
        <div className="text-6xl font-mono mb-8">{formatTime(timeLeft)}</div>
        <div className="space-x-4">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-6 py-2 rounded-lg font-semibold ${
              isRunning ? 'bg-yellow-500' : 'bg-green-500'
            } text-black hover:opacity-90 transition`}
          >
            {isRunning ? 'Пауза' : 'Старт'}
          </button>
          <button
            onClick={resetTimer}
            className="px-6 py-2 rounded-lg font-semibold bg-red-500 text-white hover:opacity-90 transition"
          >
            Сброс
          </button>
        </div>
      </div>
    </main>
  );
}
