'use client';
import { useState, useEffect } from 'react';

type Mode = 'work' | 'shortBreak';

export default function PomodoroWidget() {
  const [mode, setMode] = useState<Mode>('work');
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      if (mode === 'work') {
        setMode('shortBreak');
        setTimeLeft(5 * 60);
        alert('Break time! ☕');
      } else {
        setMode('work');
        setTimeLeft(25 * 60);
        alert('Work time! 💻');
      }
      setIsRunning(false);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    // Фиксированное окно 100x100 в правом верхнем углу, всегда сверху (z-50)
    <div 
      onClick={() => setIsRunning(!isRunning)}
      className={`fixed top-4 right-4 z-50 w-[100px] h-[100px] rounded-2xl flex flex-col items-center justify-center cursor-pointer select-none transition-all duration-300 active:scale-95 shadow-2xl ${
        mode === 'work' 
          ? 'bg-red-600 hover:bg-red-500' 
          : 'bg-green-600 hover:bg-green-500'
      } ${isRunning ? 'animate-pulse' : ''}`}
      title={isRunning ? 'Клик для паузы' : 'Клик для старта'}
    >
      {/* Название режима мелким шрифтом */}
      <span className="text-[10px] uppercase tracking-wider font-bold text-white/80">
        {mode === 'work' ? 'Work' : 'Break'}
      </span>
      
      {/* Крупные цифры таймера */}
      <span className="text-xl font-mono font-bold text-white mt-1">
        {formatTime(timeLeft)}
      </span>

      {/* Индикатор состояния */}
      <span className="text-[9px] text-white/60 mt-1">
        {isRunning ? '● pause' : '▶ start'}
      </span>
    </div>
  );
}
