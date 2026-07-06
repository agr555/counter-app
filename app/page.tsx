'use client';
import { useState, useEffect } from 'react';

type Mode = 'work' | 'shortBreak';

export default function PomodoroWidget() {
  const [mode, setMode] = useState<Mode>('work');
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Константы времени для расчета прогресса
  const totalSeconds = mode === 'work' ? 25 * 60 : 5 * 60;

  // Функция генерации звука (бип) встроенными средствами браузера
  const playSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine'; // Тип звуковой волны
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // Частота (нота Ля)
      gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime); // Громкость

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3); // Длительность звука 0.3 секунды
    } catch (e) {
      console.error('AudioContext не поддерживается браузером', e);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (isRunning && timeLeft === 0) {
      playSound(); // Воспроизведение звука при завершении

      if (mode === 'work') {
        setMode('shortBreak');
        setTimeLeft(5 * 60);
      } else {
        setMode('work');
        setTimeLeft(25 * 60);
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

  const handleDoubleClick = () => {
    setIsRunning(false);
    setMode('work');
    setTimeLeft(25 * 60);
  };

  // Расчет параметров круговой полосы прогресса
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft / totalSeconds) * circumference;

  return (
    <div 
      onClick={() => setIsRunning(!isRunning)}
      onDoubleClick={handleDoubleClick}
      className={`fixed bottom-4 right-4 z-50 w-[100px] h-[100px] rounded-2xl flex items-center justify-center cursor-pointer select-none transition-all duration-300 active:scale-95 shadow-2xl ${
        mode === 'work' ? 'bg-red-600 hover:bg-red-500' : 'bg-green-600 hover:bg-green-500'
      }`}
      title="1 клик: Старт/Пауза | 2 клика: Сброс"
    >
      {/* SVG Круговая полоса прогресса */}
      <svg className="absolute w-full h-full transform -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={radius}
          className="stroke-white/10"
          strokeWidth="4"
          fill="transparent"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          className="stroke-white transition-all duration-1000 ease-linear"
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>

      {/* Контент внутри круга */}
      <div className="z-10 flex flex-col items-center justify-center text-center">
        <span className="text-[9px] uppercase tracking-wider font-bold text-white/80">
          {mode === 'work' ? 'Work' : 'Break'}
        </span>
        
        <span className="text-lg font-mono font-bold text-white leading-tight">
          {formatTime(timeLeft)}
        </span>

        <span className="text-[7px] text-white/60 font-medium">
          {isRunning ? 'pause' : 'start'}
        </span>
      </div>
    </div>
  );
}
