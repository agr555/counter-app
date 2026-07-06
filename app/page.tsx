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

  // Сброс таймера по двойному клику
  const handleDoubleClick = () => {
    setIsRunning(false);
    setMode('work');
    setTimeLeft(25 * 60);
  };

  return (
    // Прижато к правому нижнему углу (bottom-4 right-4)
    <div 
      onClick={() => setIsRunning(!isRunning)}
      onDoubleClick={handleDoubleClick}
      className={`fixed bottom-4 right-4 z-50 w-[100px] h-[100px] rounded-2xl flex flex-col items-center justify-center cursor-pointer select-none transition-all duration-300 active:scale-95 shadow-2xl ${
        mode === 'work' 
          ? 'bg-red-600 hover:bg-red-500' 
          : 'bg-green-600 hover:bg-green-500'
      } ${isRunning ? 'animate-pulse' : ''}`}
      title="1 клик: Старт/Пауза | 2 клика: Сброс"
    >
      {/* Название режима */}
      <span className="text-[10px] uppercase tracking-wider font-bold text-white/80">
        {mode === 'work' ? 'Work' : 'Break'}
      </span>
      
      {/* Цифры */}
      <span className="text-xl font-mono font-bold text-white mt-1">
        {formatTime(timeLeft)}
      </span>

      {/* Инструкция мелким шрифтом */}
      <span className="text-[8px] text-white/60 mt-1 text-center leading-none">
        {isRunning ? '● pause' : '▶ start'}
        <br />
        <span className="text-[7px] text-white/40">2x click: reset</span>
      </span>
    </div>
  );
}
