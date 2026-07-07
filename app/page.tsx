'use client';

import { useState, useEffect } from 'react';
import styles from './widget.module.css';

type ShiftType = '8h' | '9h40m';

export default function PomodoroWidget() {
  // 1. Таймер темпа (из прошлых шагов)
  const [timeLeft, setTimeLeft] = useState<number>(158);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);

  // 2. СЕКУНДОМЕР (Stopwatch) для замера реального времени детали
  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(0);
  const [isStopwatchRunning, setIsStopwatchRunning] = useState<boolean>(false);

  // Настройки и счетчики
  const [coefficient, setCoefficient] = useState<number>(21);
  const [shift, setShift] = useState<ShiftType>('9h40m');
  const [processedCount, setProcessedCount] = useState<number>(0);

  // Загрузка из localStorage при старте
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

  // Математические расчеты плана и темпа
  const totalShiftMinutes = shift === '9h40m' ? (9 * 60 + 40) : (8 * 60);
  const netWorkingMinutes = totalShiftMinutes - 45;
  const decimalHours = totalShiftMinutes / 60;
  const targetPositions = Math.round(coefficient * decimalHours);

  const totalTimerSeconds = targetPositions > 0 
    ? Math.round((netWorkingMinutes * 60) / targetPositions) 
    : 25 * 60;

  // Синхронизация основного таймера темпа на паузе
  useEffect(() => {
    if (!isTimerRunning) {
      setTimeLeft(totalTimerSeconds);
    }
  }, [totalTimerSeconds, isTimerRunning]);

  // ИНТЕРВАЛ 1: Работа основного таймера темпа (обратный отсчет)
  useEffect(() => {
    if (!isTimerRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Когда таймер темпа доходит до нуля, он просто идет по кругу
          return totalTimerSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, totalTimerSeconds]);

  // ИНТЕРВАЛ 2: Работа секундомера (прямой отсчет секунд на деталь)
  useEffect(() => {
    if (!isStopwatchRunning) return;

    const interval = setInterval(() => {
      setStopwatchSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isStopwatchRunning]);

  // Функция форматирования времени (ММ:СС)
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // КНОПКА: Реально готово (фиксация детали + перезапуск секундомера)
  const handleRealItemDone = () => {
    // 1. Прибавляем деталь в поле готово
    setProcessedCount((prev) => prev + 1);
    
    // 2. Логику сохранения реального времени stopwatchSeconds для аналитики мы решим позже отдельно.
    // Сейчас просто сбрасываем секундомер в 0 и принудительно запускаем на следующую деталь.
    setStopwatchSeconds(0);
    setIsStopwatchRunning(true);
  };

  // КНОПКИ: Ручная корректировка без влияния на секундомер
  const adjustCount = (amount: number) => {
    setProcessedCount((prev) => Math.max(0, prev + amount)); // Не даем уйти в минус
  };

  // Расчет прогресса (от средних значений)
  const spentSeconds = processedCount * totalTimerSeconds;
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
      
      {/* ================= ЛЕВАЯ ЗОНА: УПРАВЛЕНИЕ ТАЙМЕРОМ ТЕМПА ================= */}
      <div className={styles.timerSection}>
        <button 
          type="button" 
          onClick={() => setIsTimerRunning(!isTimerRunning)} 
          className={`${styles.timerControlBtn} ${isTimerRunning ? styles.btnPause : styles.btnStart}`}
        >
          {isTimerRunning ? 'ПАУЗА' : 'СТАРТ'}
        </button>

        <div className={styles.timeDisplay}>
          <span className={styles.timeLabel}>ТЕМП</span>
          <span className={styles.timeNumbers}>{formatTime(timeLeft)}</span>
        </div>

        <button 
          type="button" 
          onClick={() => { setIsTimerRunning(false); setTimeLeft(totalTimerSeconds); }} 
          className={`${styles.timerControlBtn} ${styles.btnReset}`}
        >
          СБРОС
        </button>
      </div>

      <div className={styles.divider}></div>

      {/* ================= НОВАЯ ЗОНА: СЕКУНДОМЕР (STOPWATCH) И КНОПКА ФИКСАЦИИ ================= */}
      <div className={styles.stopwatchSection}>
        
        {/* Табло секундомера */}
        <div className={styles.stopwatchDisplay}>
          <span className={styles.stopwatchLabel}>СЕКУНДОМЕР</span>
          <span className={styles.stopwatchNumbers}>{formatTime(stopwatchSeconds)}</span>
        </div>

        {/* Главная кнопка фиксации детали */}
        <button 
          type="button" 
          onClick={handleRealItemDone} 
          className={styles.realDoneBtn}
        >
          ГОТОВО
        </button>

      </div>

      <div className={styles.divider}></div>

      {/* ================= ПРАВАЯ ЗОНА: НАСТРОЙКИ И КОРРЕКТИРОВКА ================= */}
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

        {/* Выбор смены */}
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
            
            <div 
              className={styles.slider} 
              style={{ 
                width: shift === '9h40m' ? '65px' : '45px',
                transform: shift === '9h40m' ? 'translateX(45px)' : 'translateX(0px)'
              }}
            ></div>
          </div>
        </div>

        {/* Дневной План */}
        <div className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>План:</span>
          <div className={styles.targetDisplay}>{targetPositions} <span className={styles.targetUnit}>поз.</span></div>
        </div>

        {/* ПОЛЕ ГОТОВО С КНОПКАМИ ПОДГОНКИ ЗНАЧЕНИЙ (+ - +10 -10) */}
        <div className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>Готово:</span>
          <div className={styles.adjustWrapper}>
            {/* Сама цифра */}
            <div className={styles.countDisplayOnly}>
              {processedCount} <span className={styles.targetUnit}>шт.</span>
            </div>
            
            {/* Сетка кнопок подгонки под цифрой */}
            <div className={styles.adjustButtonsGrid}>
              <button type="button" onClick={() => adjustCount(-10)} className={styles.adjBtn}>-10</button>
              <button type="button" onClick={() => adjustCount(-1)} className={styles.adjBtn}>-1</button>
              <button type="button" onClick={() => adjustCount(1)} className={styles.adjBtn}>+1</button>
              <button type="button" onClick={() => adjustCount(10)} className={styles.adjBtn}>+10</button>
            </div>
          </div>
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
}
