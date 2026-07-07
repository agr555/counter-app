'use client';

import { useState, useEffect } from 'react';
import styles from './widget.module.css';

type ShiftType = '8h' | '9h40m';

export default function PomodoroWidget() {
  // 1. Настройки пользователя и счетчики
  const [coefficient, setCoefficient] = useState<number>(21);
  const [shift, setShift] = useState<ShiftType>('9h40m');
  const [processedCount, setProcessedCount] = useState<number>(0);

  // 2. Состояния времени
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(0);
  const [totalRealSeconds, setTotalRealSeconds] = useState<number>(0);

  // 3. Математические расчеты плана и темпа
  const totalShiftMinutes = shift === '9h40m' ? (9 * 60 + 40) : (8 * 60);
  const netWorkingMinutes = totalShiftMinutes - 45; 
  const decimalHours = totalShiftMinutes / 60;
  const targetPositions = Math.round(coefficient * decimalHours); 

  // Сколько секунд заложено на 1 деталь по плану
  const totalTimerSeconds = targetPositions > 0 
    ? Math.round((netWorkingMinutes * 60) / targetPositions) 
    : 25 * 60;

  const [timeLeft, setTimeLeft] = useState<number>(totalTimerSeconds);

  // 4. Загрузка настроек из localStorage при старте страницы
  useEffect(() => {
    const savedCoefficient = localStorage.getItem('p_coefficient');
    const savedShift = localStorage.getItem('p_shift') as ShiftType;
    const savedProcessedCount = localStorage.getItem('p_processedCount');
    const savedRealSeconds = localStorage.getItem('p_totalRealSeconds');

    if (savedCoefficient) setCoefficient(parseInt(savedCoefficient, 10));
    if (savedShift) setShift(savedShift);
    if (savedProcessedCount) setProcessedCount(parseInt(savedProcessedCount, 10));
    if (savedRealSeconds) setTotalRealSeconds(parseInt(savedRealSeconds, 10));
  }, []);

  // 5. Автосохранение настроек
  useEffect(() => {
    localStorage.setItem('p_coefficient', coefficient.toString());
  }, [coefficient]);

  useEffect(() => {
    localStorage.setItem('p_shift', shift);
  }, [shift]);

  useEffect(() => {
    localStorage.setItem('p_processedCount', processedCount.toString());
  }, [processedCount]);

  useEffect(() => {
    localStorage.setItem('p_totalRealSeconds', totalRealSeconds.toString());
  }, [totalRealSeconds]);

  // 6. Synchronizácia časovača tempa pri pauze
  useEffect(() => {
    if (!isRunning && timeLeft !== 0) {
      setTimeLeft(totalTimerSeconds);
    }
  }, [totalTimerSeconds, isRunning, timeLeft]);

  // 7. Jednotný interval pre odpočet Tempu a prírastok Stopiek
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setStopwatchSeconds((prev) => prev + 1);

      setTimeLeft((prev) => {
        if (prev <= 1) return totalTimerSeconds;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, totalTimerSeconds]);

  // 8. Pomocné funkcie pre prácu s časom
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatAccumulatedTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    
    if (hrs > 0) return `${hrs}ч ${mins}м ${secs}с`;
    if (mins > 0) return `${mins}м ${secs}с`;
    return `${secs}с`;
  };

  // Funkcia pre globálny reštart s potvrdením
  const handleGlobalReset = () => {
    const wasRunning = isRunning;
    setIsRunning(false);

    if (confirm('Хотите сбросить весь прогресс за смену?')) {
      setProcessedCount(0);
      setStopwatchSeconds(0);
      setTotalRealSeconds(0);
      setTimeLeft(0);
      localStorage.removeItem('p_processedCount');
      localStorage.removeItem('p_totalRealSeconds');
    } else {
      setIsRunning(wasRunning);
    }
  };

  // Kliknutie на кнопку HOTOVO (najvpravo)
  const handleRealItemDone = () => {
    setProcessedCount((prev) => prev + 1);
    setTotalRealSeconds((prev) => prev + stopwatchSeconds);
    setStopwatchSeconds(0);
    
    if (timeLeft === 0 && isRunning) {
      setTimeLeft(totalTimerSeconds);
    }
  };

  // Korekčné tlačidlá (+1, -10 atď.)
  const adjustCount = (amount: number) => {
    setProcessedCount((prev) => Math.max(0, prev + amount));
  };

  // 9. Analytické výpočty pre Progress Box
  const spentSecondsByPlan = processedCount * totalTimerSeconds;
  const timeDifference = spentSecondsByPlan - totalRealSeconds;
  const progressPercent = targetPositions > 0 
    ? Math.round((processedCount / targetPositions) * 100)
    : 0;

  // 10. Сама разметка интерфейса (JSX)
  return (
    <div className={styles.widgetContainer}>
      
      {/* 1 БЛОК (СЛЕВА): НАСТРОЙКИ */}
      <div className={styles.controlsPanel}>
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

        <div className={styles.fieldGroup}>
          <span className={styles.fieldLabel}>План:</span>
          <div className={styles.targetDisplay}>
            {targetPositions} <span className={styles.targetUnit}>поз.</span>
          </div>
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

        <div className={styles.timeDisplay}>
          <span className={styles.timeLabel}>ТЕМП</span>
          <span className={styles.timeNumbers}>{formatTime(timeLeft)}</span>
        </div>

        <div className={styles.stopwatchDisplay}>
          <span className={styles.stopwatchLabel}>СЕКУНДОМЕР</span>
          <span className={styles.stopwatchNumbers}>{formatTime(stopwatchSeconds)}</span>
        </div>
      </div>

      <div className={styles.divider}></div>

      {/* 3 БЛОК (СПРАВА): РЕЗУЛЬТАТЫ С КОРРЕКЦИЕЙ */}
      {/* 3 БЛОК (СПРАВА): РЕЗУЛЬТАТЫ С КОРРЕКЦИЕЙ */}
<div className={styles.resultsSection}>
  
  {/* Окошко прогресса */}
  <div className={styles.fieldGroup}>
    <span className={styles.fieldLabel}>Прогресс ({progressPercent}%):</span>
    <div className={styles.progressDisplayContainer}>
      <div className={styles.progressRow}>
        <span className={styles.rowLabel}>План:</span>
        <span className={styles.rowValue}>{formatAccumulatedTime(spentSecondsByPlan)}</span>
      </div>
      <div className={styles.progressRow}>
        <span className={styles.rowLabel}>Fact:</span>
        <span className={styles.rowValue}>{formatAccumulatedTime(totalRealSeconds)}</span>
      </div>
      <div className={styles.progressRow}>
        <span className={styles.rowLabel}>Итог:</span>
        <span className={`${styles.rowValue} ${timeDifference >= 0 ? styles.textGreen : styles.textRed}`}>
          {timeDifference >= 0 ? '+' : ''}{formatAccumulatedTime(timeDifference)}
        </span>
      </div>
    </div>
  </div>

  {/* Количество готовых деталей с кнопками ручной подгонки */}
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

        {/* Кнопка ГОТОВО на самом правом краю */}
        <button 
          type="button" 
          onClick={handleRealItemDone} 
          className={styles.realDoneBtn}
        >
          ГОТОВО
        </button>

      </div> {/* <-- Закрываем тег <div className={styles.resultsSection}> */}

    </div> 
  ); 
} 
