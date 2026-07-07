'use client';

import { useState, useEffect } from 'react';
import styles from './widget.module.css';

type ShiftType = '8h' | '9h40m';

export default function PomodoroWidget() {
  // Настройки пользователя и счетчики
  const [coefficient, setCoefficient] = useState<number>(21);
  const [shift, setShift] = useState<ShiftType>('9h40m');
  const [processedCount, setProcessedCount] = useState<number>(0);

  // Состояния времени
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(0);

  // Математические расчеты плана и темпа
  const totalShiftMinutes = shift === '9h40m' ? (9 * 60 + 40) : (8 * 60);
  const netWorkingMinutes = totalShiftMinutes - 45; // Чистое время с учетом 45 мин простоя
  const decimalHours = totalShiftMinutes / 60;
  const targetPositions = Math.round(coefficient * decimalHours); // План на день (например, 203)

  // Сколько секунд заложено на 1 деталь по плану
  const totalTimerSeconds = targetPositions > 0 
    ? Math.round((netWorkingMinutes * 60) / targetPositions) 
    : 25 * 60;

  const [timeLeft, setTimeLeft] = useState<number>(totalTimerSeconds);

  // Загрузка настроек из localStorage при старте
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

  // Синхронизация основного таймера темпа НА ПАУЗЕ
  useEffect(() => {
    if (!isRunning && timeLeft !== 0) {
      setTimeLeft(totalTimerSeconds);
    }
  }, [totalTimerSeconds, isRunning]);

  // ЕДИНЫЙ ИНТЕРВАЛ: Синхронно управляет и таймером темпа, и секундомером
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setStopwatchSeconds((prev) => prev + 1);

      setTimeLeft((prev) => {
        if (prev <= 1) {
          return totalTimerSeconds; // На следующий круг по плану
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, totalTimerSeconds]);

  // Функция форматирования времени (ММ:СС)
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ИСПРАВЛЕННЫЙ СБРОС: Спрашивает подтверждение и обнуляет абсолютно всё
  const handleGlobalReset = () => {
    // Временно ставим на паузу, чтобы таймер не тикал во время вопроса
    const wasRunning = isRunning;
    setIsRunning(false);

    if (confirm('Хотите сбросить весь прогресс за смену? (Обнулятся таймеры, готовые детали и прогресс)')) {
      setProcessedCount(0);
      setStopwatchSeconds(0);
      setTimeLeft(0);
      localStorage.removeItem('p_processedCount');
    } else {
      // Если пользователь передумал, возвращаем прежнее состояние активности
      setIsRunning(wasRunning);
    }
  };

  // КНОПКА: Реально готово (+1 деталь и чистый сброс секундомера)
  const handleRealItemDone = () => {
    setProcessedCount((prev) => prev + 1);
    setStopwatchSeconds(0);
    if (timeLeft === 0 && isRunning) {
      setTimeLeft(totalTimerSeconds);
    }
  };

  // КНОПКИ: Ручная корректировка готовых штук
  const adjustCount = (amount: number) => {
    setProcessedCount((prev) => Math.max(0, prev + amount));
  };

  // Расчеты для прямоугольника прогресса
  const spentSecondsByPlan = processedCount * totalTimerSeconds;

  const formatSpentTime = (totalSecs: number) => {
    const totalMinutes = Math.floor(totalSecs / 60);
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hrs > 0) return `${hrs}ч ${mins.toString().padStart(2, '0')}м`;
    return `${mins} мин`;
  };

  const progressPercent = targetPositions > 0 
    ? Math.round((processedCount / targetPositions) * 100)
    : 0;

  return (
    <div className={styles.widgetContainer}>
      
      {/* 1 БЛОК (СЛЕВА): НАСТРОЙКИ (Норма, Смена, План) */}
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
      </div>

      <div className={styles.divider}></div>

      {/* 2 БЛОК (ЦЕНТР): УПРАВЛЕНИЕ И ТАЙМЕРЫ */}
      <div className={styles.timerSection}>
        <button 
          type="button" 
          onClick={() => {
            if (!isRunning && timeLeft === 0) setTimeLeft(totalTimerSeconds);
            setIsRunning(!isRunning);
          }} 
          className={`${styles.timerControlBtn} ${isRunning ? styles.btnPause : styles.btnStart}`}
        >
          {isRunning ? 'ПАУЗА' : 'СТАРТ'}
        </button>

        <button 
          type="button" 
          onClick={handleGlobalReset} 
          className={`${styles.timerControlBtn} ${styles.btnReset}`}
        >
          СБРОС
        </button>

        {/* Табло ТЕМП */}
        <div className={styles.timeDisplay}>
          <span className={styles.timeLabel}>ТЕМП</span>
          <span className={styles.timeNumbers}>{formatTime(timeLeft)}</span>
        </div>

        {/* Табло СЕКУНДОМЕР */}
        <div className={styles.stopwatchDisplay}>
          <span className={styles.stopwatchLabel}>СЕКУНДОМЕР</span>
          <span className={styles.stopwatchNumbers}>{formatTime(stopwatchSeconds)}</span>
        </div>
      </div>

      <div className={styles.divider}></div>

      {/* 3 БЛОК (СПРАВА): РЕЗУЛЬТАТЫ И САМАЯ ПРАВАЯ КНОПКА ГОТОВО */}
      <div className={styles.resultsSection}>
        {/* Прогресс */}
        <div className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>Прогресс:</span>
          <div className={styles.progressDisplay}>
            <span className={styles.progressTime}>{formatSpentTime(spentSecondsByPlan)}</span>
            <span className={styles.progressPercent}>{progressPercent}%</span>
          </div>
        </div>

        {/* Готово со стрелками подгонки */}
        <div className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>Готово:</span>
          <div className={styles.adjustWrapper}>
            <div className={styles.countDisplayOnly}>
              {processedCount} <span className={styles.targetUnit}>шт.</span>
            </div>
            
            <div className={styles.adjustButtonsGrid}>
              <button type="button" onClick={() => adjustCount(-10)} className={styles.adjBtn}>-10</button>
              <button type="button" onClick={() => adjustCount(-1)} className={styles.adjBtn}>-1</button>
              <button type="button" onClick={() => adjustCount(1)} className={styles.adjBtn}>+1</button>
              <button type="button" onClick={() => adjustCount(10)} className={styles.adjBtn}>+10</button>
            </div>
          </div>
        </div>

        {/* САМАЯ ПРАВАЯ КНОПКА ФИКСАЦИИ ДЕТАЛИ */}
        <button 
          type="button" 
          onClick={handleRealItemDone} 
          className={styles.realDoneBtn}
        >
          ГОТОВО
        </button>
      </div>

    </div>
  );
}
