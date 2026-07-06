'use client';
import { useState, useEffect, startTransition } from 'react';
import styles from './widget.module.css'; // ПОДКЛЮЧЕНИЕ ФАЙЛА СТИЛЕЙ

type Mode = 'work' | 'shortBreak';

export default function PomodoroWidget() {
  const [mode, setMode] = useState<Mode>('work');
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const totalSeconds = mode === 'work' ? 25 * 60 : 5 * 60;

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
      className={styles.widgetButton}
      // Оставляем динамический цвет фона, зависящий от режима работы/отдыха
      style={{ backgroundColor: mode === 'work' ? '#e11d48' : '#16a34a' }}
      title="1 клик: Старт | 2 клика: Сброс"
    >
      <svg className={styles.widgetSvg}>
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
          className={styles.circleProgress}
        />
      </svg>

      <div className={styles.textContent}>
        <span className={styles.modeText}>
          {mode === 'work' ? 'WORK' : 'BREAK'}
        </span>
        <span className={styles.timeText}>
          {formatTime(timeLeft)}
        </span>
        <span className={styles.statusText}>
          {isRunning ? 'PAUSE' : 'START'}
        </span>
      </div>
    </button>
  );
}
