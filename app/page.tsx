'use client';
import { useState, useEffect, startTransition } from 'react';

type Mode = 'work' | 'shortBreak';

export default function PomodoroWidget() {
  const [mode, setMode] = useState<Mode>('work');
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const totalSeconds = mode === 'work' ? 25 * 60 : 5 * 60;

  // Звук встроенными средствами браузера
  const playSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          playSound();
          // Безопасное переключение состояний React в useEffect
          startTransition(() => {
            setIsRunning(false);
            if (mode === 'work') {
              setMode('shortBreak');
              setTimeLeft(5 * 60);
            } else {
              setMode('work');
              setTimeLeft(25 * 60);
            }
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, mode]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Обычная кнопка вместо клика по всему экрану/диву
  const toggleTimer = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsRunning(!isRunning);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsRunning(false);
    setMode('work');
    setTimeLeft(25 * 60);
  };

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft / totalSeconds) * circumference;

  return (
    <button 
      onClick={toggleTimer}
      onDoubleClick={handleDoubleClick}
      type="button"
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        width: '100px',
        height: '100px',
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        border: 'none',
        outline: 'none',
        padding: 0,
        backgroundColor: mode === 'work' ? '#e11d48' : '#16a34a',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
        fontFamily: 'monospace',
        transition: 'transform 0.1s ease'
      }}
      title="1 клик: Старт/Пауза | 2 клика: Сброс"
    >
      {/* SVG Круг прогресса */}
      <svg 
        style={{
          position: 'absolute',
          width: '100px',
          height: '100px',
          transform: 'rotate(-90deg)',
          pointerEvents: 'none'
        }}
      >
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="rgba(255, 255, 255, 0.15)"
          strokeWidth="4"
          fill="transparent"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="white"
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s linear' }}
        />
      </svg>

      {/* Текст */}
      <div style={{
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        pointerEvents: 'none'
      }}>
        <span style={{ fontSize: '10px', fontWeight: 'bold', letterSpacing: '1px' }}>
          {mode === 'work' ? 'WORK' : 'BREAK'}
        </span>
        
        <span style={{ fontSize: '18px', fontWeight: 'bold', margin: '2px 0' }}>
          {formatTime(timeLeft)}
        </span>

        <span style={{ fontSize: '8px', opacity: 0.7 }}>
          {isRunning ? 'PAUSE' : 'START'}
        </span>
      </div>
    </button>
  );
}
