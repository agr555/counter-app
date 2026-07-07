'use client';

import { useState, useEffect, startTransition } from 'react';
import styles from './widget.module.css';

// Тип для хранения выбранной смены
type ShiftType = '8h' | '9h40m';

export default function PomodoroWidget() {
  const [timeLeft, setTimeLeft] = useState<number>(158);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Настройки пользователя
  const [coefficient, setCoefficient] = useState<number>(21);
  const [shift, setShift] = useState<ShiftType>('9h40m'); // По умолчанию длинная смена
  const [processedCount, setProcessedCount] = useState<number>(0);

  // Загрузка настроек из localStorage
  useEffect(() => {
    const savedCoefficient = localStorage.getItem('p_coefficient');
    const savedShift = localStorage.getItem('p_shift') as ShiftType;
    const savedProcessedCount = localStorage.getItem('p_processedCount');

    if (savedCoefficient) setCoefficient(parseInt(savedCoefficient, 10));
    if (savedShift) setShift(savedShift);
    if (savedProcessedCount) setProcessedCount(parseInt(savedProcessedCount, 10));
  }, []);

  // Автосохранение настроек
  useEffect(() => {
    localStorage.setItem('p_coefficient', coefficient.toString());
  }, [coefficient]);

  useEffect(() => {
    localStorage.setItem('p_shift', shift);
  }, [shift]);

  useEffect(() => {
    localStorage.setItem('p_processedCount', processedCount.toString());
  }, [processedCount]);

  // ================= ОБЩЕЕ ИСЧИСЛЕНИЕ В МИНУТАХ =================
  // 1. Переводим выбранную смену в чистые минуты
  const totalShiftMinutes = shift === '9h40m' ? (9 * 60 + 40) : (8 * 60); // 580 или 480 минут

  // 2. Вычитаем 45 минут простоя (получаем чистое рабочее время в минутах)
  const netWorkingMinutes = totalShiftMinutes - 45; // 535 или 435 минут

  // 3. Вычисляем план деталей (используя точный коэффициент часов: 8 или 9.6666...)
  const decimalHours = totalShiftMinutes / 60;
  const targetPositions = Math.round(coefficient * decimalHours); // Получаем ровно 203 или 168

  // 4. Вычисляем точный темп на 1 деталь в секундах
  const totalSeconds = targetPositions > 0 
    ? Math.round((netWorkingMinutes * 60) / targetPositions) 
    : 25 * 60;

  // Синхронизация табло на паузе
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(totalSeconds);
    }
  }, [totalSeconds, isRunning]);

  // Звуковое оповещение
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

  // Работа таймера по кругу
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          playSound();
          setProcessedCount((prevCount) => prevCount + 1);
          return totalSeconds; // Сброс на расчетный темп для следующей детали
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, totalSeconds]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Расчет прогресса (затраченное время)
  const spentSeconds = processedCount * totalSeconds;
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
      
      {/* ЛЕВАЯ ЗОНА: УПРАВЛЕНИЕ ТАЙМЕРОМ */}
      <div className={styles.timerSection}>
        <button 
          type="button" 
          onClick={() => setIsRunning(!isRunning)} 
          className={`${styles.timerControlBtn} ${isRunning ? styles.btnPause : styles.btnStart}`}
        >
          {isRunning ? 'ПАУЗА' : 'СТАРТ'}
        </button>

        <div className={styles.timeDisplay}>
          <span className={styles.timeLabel}>ТЕМП</span>
          <span className={styles.timeNumbers}>{formatTime(timeLeft)}</span>
        </div>

        <button 
          type="button" 
          onClick={() => { setIsRunning(false); setTimeLeft(totalSeconds); }} 
          className={`${styles.timerControlBtn} ${styles.btnReset}`}
        >
          СБРОС
        </button>
      </div>

      <div className={styles.divider}></div>

      {/* ПРАВАЯ ЗОНА: НАСТРОЙКИ В ОБЩЕМ ИСЧИСЛЕНИИ */}
      <div className={styles.controlsPanel}>
        
        {/* Поле коэффициента нормы */}
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

        {/* Переключатель смены (Текстовые значения без дробей) */}
        <div className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>Смена:</span>
          <div className={styles.toggleContainer}>
            <input
              type="radio"
              id="shift-8"
              name="shiftValue"
              value="8h"
              checked={shift === '8h'}
              onChange={() => setShift('8h')}
              className={styles.radioInput}
            />
            <label htmlFor="shift-8" className={styles.radioLabel}>8ч</label>

            <input
              type="radio"
              id="shift-9"
              name="shiftValue"
              value="9h40m"
              checked={shift === '9h40m'}
              onChange={() => setShift('9h40m')}
              className={styles.radioInput}
            />
            <label htmlFor="shift-9" className={styles.radioLabel} style={{ width: '65px' }}>9ч 40м</label>
            
            {/* Анимированный слайдер */}
            <div 
              className={styles.slider} 
              style={{ 
                width: shift === '9h40m' ? '65px' : '45px',
                transform: shift === '9h40m' ? 'translateX(45px)' : 'translateX(0px)'
              }}
            ></div>
          </div>
        </div>

        {/* Расчитанный план */}
        <div className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>План:</span>
          <div className={styles.targetDisplay}>{targetPositions} <span className={styles.targetUnit}>поз.</span></div>
        </div>

        {/* Счетчик обработанных деталей */}
        <div className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>Готово:</span>
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); setProcessedCount(p => p + 1); }}
            onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); if (confirm('Сбросить количество?')) setProcessedCount(0); }}
            className={styles.countDisplay}
          >
            {processedCount} <span className={styles.targetUnit}>шт.</span>
          </button>
        </div>

        {/* Время работы и % прогресса */}
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
}
