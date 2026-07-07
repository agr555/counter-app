'use client';

import { useState, useEffect, startTransition } from 'react';
import styles from './widget.module.css';

type Mode = 'work' | 'shortBreak';

export default function PomodoroWidget() {
  const [mode, setMode] = useState<Mode>('work');
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Настройки пользователя
  const [coefficient, setCoefficient] = useState<number>(21);
  const [switchValue, setSwitchValue] = useState<string>('9.67');
  const [processedCount, setProcessedCount] = useState<number>(0);

  // Загрузка настроек из localStorage при старте
  useEffect(() => {
    const savedCoefficient = localStorage.getItem('pomodoro_coefficient');
    const savedSwitchValue = localStorage.getItem('pomodoro_switchValue');
    const savedProcessedCount = localStorage.getItem('pomodoro_processedCount');

    if (savedCoefficient) setCoefficient(parseFloat(savedCoefficient));
    if (savedSwitchValue) setSwitchValue(savedSwitchValue);
    if (savedProcessedCount) setProcessedCount(parseInt(savedProcessedCount, 10));
  }, []);

  // Автосохранение настроек
  useEffect(() => {
    localStorage.setItem('pomodoro_coefficient', coefficient.toString());
  }, [coefficient]);

  useEffect(() => {
    localStorage.setItem('pomodoro_switchValue', switchValue);
  }, [switchValue]);

  useEffect(() => {
    localStorage.setItem('pomodoro_processedCount', processedCount.toString());
  }, [processedCount]);

  // Математические расчеты времени на 1 деталь
  const hours = parseFloat(switchValue);
  const targetPositions = Math.round(coefficient * hours);
  const netWorkingMinutes = (hours * 60) - 45;
  
  const computedSecondsPerPosition = targetPositions > 0 
    ? Math.round((netWorkingMinutes * 60) / targetPositions)
    : 25 * 60;

  const totalSeconds = mode === 'work' ? computedSecondsPerPosition : 5 * 60;

  // Обновление таймера на паузе при смене настроек
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(totalSeconds);
    }
  }, [totalSeconds, isRunning]);

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

  // Интервал обратного отсчета
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
              setProcessedCount((prevCount) => prevCount + 1);
              setMode('shortBreak');
              setTimeLeft(5 * 60); 
            } else {
              setMode('work');
              setTimeLeft(computedSecondsPerPosition);
            }
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, mode, computedSecondsPerPosition]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Управление таймером через отдельные кнопки
  const handleStartStop = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setMode('work');
    setTimeLeft(computedSecondsPerPosition);
  };

  // Расчет прогресса
  const spentSeconds = processedCount * computedSecondsPerPosition;
  const formatSpentTime = (totalSecs: number) => {
    const totalMinutes = Math.floor(totalSecs / 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hrs > 0) return `${hrs}ч ${mins.toString().padStart(2, '0')}м`;
    return `${mins} мин`;
  };

  const progressPercent = targetPositions > 0 
    ? Math.min(Math.round((processedCount / targetPositions) * 100), 100)
    : 0;

  return (
    <div className={styles.widgetContainer}>
      
      {/* ================= ЛЕВАЯ ЗОНА: ТАЙМЕР И УПРАВЛЕНИЕ ================= */}
      <div className={styles.timerSection}>
        
        {/* Кнопка Старт / Пауза */}
        <button 
          type="button" 
          onClick={handleStartStop} 
          className={`${styles.timerControlBtn} ${isRunning ? styles.btnPause : styles.btnStart}`}
        >
          {isRunning ? 'ПАУЗА' : 'СТАРТ'}
        </button>

        {/* Цифровое табло со временем */}
        <div className={`${styles.timeDisplay} ${mode === 'shortBreak' ? styles.timeBreak : ''}`}>
          <span className={styles.timeLabel}>
            {mode === 'work' ? '1 ДЕТАЛЬ' : 'ОТДЫХ'}
          </span>
          <span className={styles.timeNumbers}>
            {formatTime(timeLeft)}
          </span>
        </div>

        {/* Кнопка Сброс */}
        <button 
          type="button" 
          onClick={handleReset} 
          className={`${styles.timerControlBtn} styles.btnReset`}
        >
          СБРОС
        </button>

      </div>

      {/* Разделительная линия между блоками */}
      <div className={styles.divider}></div>

      {/* ================= ПРАВАЯ ЗОНА: ПАНЕЛЬ НАСТРОЕК И РАСЧЕТОВ ================= */}
      <div className={styles.controlsPanel}>
        
        {/* Норма в час */}
        <div className={styles.fieldGroup}>
          <label htmlFor="coefficient" className={styles.fieldLabel}>Норма/ч:</label>
          <input
            id="coefficient"
            type="number"
            step="1"
            min="1"
            value={coefficient}
            onChange={(e) => setCoefficient(parseInt(e.target.value) || 0)}
            className={styles.inputNumber}
          />
        </div>

        {/* Часы смены */}
        <div className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>Часы:</span>
          <div className={styles.toggleContainer}>
            <input
              type="radio"
              id="val-8"
              name="switchValue"
              value="8.0"
              checked={switchValue === '8.0'}
              onChange={() => setSwitchValue('8.0')}
              className={styles.radioInput}
            />
            <label htmlFor="val-8" className={styles.radioLabel}>8.0</label>

            <input
              type="radio"
              id="val-9"
              name="switchValue"
              value="9.67"
              checked={switchValue === '9.67'}
              onChange={() => setSwitchValue('9.67')}
              className={styles.radioInput}
            />
            <label htmlFor="val-9" className={styles.radioLabel}>9.67</label>

            <div className={styles.slider} style={{ width: switchValue === '9.67' ? '50px' : '45px' }}></div>
          </div>
        </div>

        {/* План на день */}
        <div className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>План:</span>
          <div className={styles.targetDisplay}>
            {targetPositions} <span className={styles.targetUnit}>поз.</span>
          </div>
        </div>

        {/* Количество готовых деталей */}
        <div className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>Готово:</span>
          <button 
            type="button"
            onClick={handleCountClick}
            onContextMenu={handleCountContextMenu}
            className={styles.countDisplay}
            title="ЛКМ: +1 деталь | ПКМ: Сброс"
          >
            {processedCount} <span className={styles.targetUnit}>шт.</span>
          </button>
        </div>

        {/* Прогресс выполнения плана */}
        <div className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>Прогресс:</span>
          <div className={styles.progressDisplay}>
            <span className={styles.progressTime}>{formatSpentTime(spentSeconds)}</span>
            <span className={styles.progressPercent}>{progressPercent}%</span>
          </div>
        </div>

      </div>

    </div>
  );

  // Вспомогательные функции для кликов по счетчику «Готово»
  function handleCountClick(e: React.MouseEvent) {
    e.stopPropagation();
    setProcessedCount((prev) => prev + 1);
  }

  function handleCountContextMenu(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Сбросить количество обработанных деталей?')) {
      setProcessedCount(0);
    }
  }
}
