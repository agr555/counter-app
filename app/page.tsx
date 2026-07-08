'use client';

import { useState, useEffect } from 'react';
import styles from './widget.module.css';

type ShiftType = '8h' | '9h40m';

export default function PomodoroWidget() {
  const [coefficient, setCoefficient] = useState<number>(21);
  const [shift, setShift] = useState<ShiftType>('9h40m');
  const [processedCount, setProcessedCount] = useState<number>(0);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(0);
  const [totalRealSeconds, setTotalRealSeconds] = useState<number>(0);

  const totalShiftMinutes = shift === '9h40m' ? (9 * 60 + 40) : (8 * 60);
  const netWorkingMinutes = totalShiftMinutes - 45; 
  const decimalHours = totalShiftMinutes / 60;
  const targetPositions = Math.round(coefficient * decimalHours); 

  const totalTimerSeconds = targetPositions > 0 
    ? Math.round((netWorkingMinutes * 60) / targetPositions) 
    : 25 * 60;

  const [timeLeft, setTimeLeft] = useState<number>(totalTimerSeconds);

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

  useEffect(() => {
    if (!isRunning && timeLeft !== 0) {
      setTimeLeft(totalTimerSeconds);
    }
  }, [totalTimerSeconds, isRunning, timeLeft]);

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

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatAccumulatedTime = (totalSecs: number) => {
    const absoluteSecs = Math.abs(totalSecs);
    const hrs = Math.floor(absoluteSecs / 3600);
    const mins = Math.floor((absoluteSecs % 3600) / 60);
    const secs = absoluteSecs % 60;
    
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m ${secs}s`;
  };

  const handleGlobalReset = () => {
    const wasRunning = isRunning;
    setIsRunning(false);

    if (confirm('Reset all progress for this shift?')) {
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

  const handleRealItemDone = () => {
    setProcessedCount((prev) => prev + 1);
    setTotalRealSeconds((prev) => prev + stopwatchSeconds);
    setStopwatchSeconds(0);
    
    if (timeLeft === 0 && isRunning) {
      setTimeLeft(totalTimerSeconds);
    }
  };

  const adjustCount = (amount: number) => {
    setProcessedCount((prev) => Math.max(0, prev + amount));
  };

  const spentSecondsByPlan = processedCount * totalTimerSeconds;
  const timeDifference = spentSecondsByPlan - totalRealSeconds;
  const progressPercent = targetPositions > 0 
    ? Math.round((processedCount / targetPositions) * 100)
    : 0;

  const pcsLeft = Math.max(0, targetPositions - processedCount);
  const avgRealTimeSeconds = processedCount > 0 ? Math.round(totalRealSeconds / processedCount) : 0;

  const maxDiffThreshold = totalTimerSeconds * 5; 
  const barWidthPercent = spentSecondsByPlan > 0 
    ? Math.min(100, Math.round((Math.abs(timeDifference) / maxDiffThreshold) * 100))
    : 0;

  return (
    <div className={styles.widgetContainer}>
      
      {/* 1. SETTINGS */}
      <div className={styles.flexRow}>
        <div className={styles.fieldGroup}>
          <input
            id="coefficient"
            type="number"
            step="1"
            min="1"
            value={coefficient}
            onChange={(e) => setCoefficient(parseInt(e.target.value) || 0)}
            className={styles.inputNumber}
            title="Rate per hour"
          />
        </div>

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
          <label htmlFor="shift-8" className={styles.radioLabel}>8h</label>

          <input
            type="radio"
            id="shift-9"
            name="shiftValue"
            value="9h40m"
            checked={shift === '9h40m'}
            onChange={() => setShift('9h40m')}
            className={styles.radioInput}
          />
          <label htmlFor="shift-9" className={styles.radioLabel} style={{ width: '42px' }}>9:40</label>
          
          <div 
            className={styles.slider} 
            style={{ 
              width: shift === '9h40m' ? '42px' : '30px',
              transform: shift === '9h40m' ? 'translateX(30px)' : 'translateX(0px)'
            }}
          ></div>
        </div>

        <div className={styles.targetDisplay} title="Target plan">{targetPositions}p</div>
      </div>

      <div className={styles.divider}></div>

      {/* 2. TIMERS & CONTROLS */}
      <div className={styles.flexRow}>
        <div className={styles.buttonsColumn}>
          <button 
            type="button" 
            onClick={() => setIsRunning(!isRunning)} 
            className={`${styles.timerControlBtn} ${isRunning ? styles.btnPause : styles.btnStart}`}
          >
            {isRunning ? '||' : '▶'}
          </button>
          <button type="button" onClick={handleGlobalReset} className={`${styles.timerControlBtn} ${styles.btnReset}`}>
            ✖
          </button>
        </div>

        <div className={styles.timeDisplay} title="Current Pace">
          <span className={styles.timeNumbers}>{formatTime(timeLeft)}</span>
        </div>

        <div className={styles.stopwatchDisplay} title="Item Stopwatch">
          <span className={styles.stopwatchNumbers}>{formatTime(stopwatchSeconds)}</span>
        </div>
      </div>

      <div className={styles.divider}></div>

      {/* 3. TWO-ROW RESULTS & BIG DONE BUTTON */}
      <div className={styles.twoRowResultsSection}>
        
        {/* ЛЕВАЯ КОЛОНКА: ДВА ЭТАЖА АНАЛИТИКИ И КОРРЕКЦИИ */}
        <div className={styles.analyticsGrid}>
          
          {/* 1 ЭТАЖ (ВЕРХНИЙ): Прогресс и Остаток деталей */}
          <div className={styles.gridRow}>
            <div className={styles.compactStatLine} title="Progress Percent">
              <span className={styles.statLabel}>Prg:</span>
              <span className={styles.statVal}>{progressPercent}%</span>
            </div>
            <div className={styles.compactStatLine} title="Pcs Left to Target">
              <span className={styles.statLabel}>Left:</span>
              <span className={styles.statVal}>{pcsLeft}</span>
            </div>
            <div className={styles.compactStatLine} title="Average Real Time">
              <span className={styles.statLabel}>Avg:</span>
              <span className={styles.statVal}>{formatTime(avgRealTimeSeconds)}</span>
            </div>
          </div>

          {/* 2 ЭТАЖ (НИЖНИЙ): Отклонение и Кнопки подгонки */}
          <div className={styles.gridRow}>
            <div className={styles.compactStatLine} title="Time Difference">
              <span className={styles.statLabel}>Dif:</span>
              <span className={`${styles.statVal} ${timeDifference >= 0 ? styles.textGreen : styles.textRed}`}>
                {timeDifference > 0 ? '+' : timeDifference < 0 ? '-' : ''}{formatAccumulatedTime(timeDifference)}
              </span>
            </div>

            {/* Поле Готово со стрелками корректировки в один ряд */}
            <div className={styles.inlineAdjustGroup}>
              <div className={styles.countDisplayOnly} title="Completed items">{processedCount}</div>
              <button type="button" onClick={() => adjustCount(1)} className={styles.microAdjBtn}>+</button>
              <button type="button" onClick={() => adjustCount(-1)} className={styles.microAdjBtn}>-</button>
              <button type="button" onClick={() => adjustCount(10)} className={styles.microAdjBtn}>+10</button>
              <button type="button" onClick={() => adjustCount(-10)} className={styles.microAdjBtn}>-10</button>
            </div>
          </div>

          {/* Шкала Time Status Bar на самом дне сетки */}
          <div className={styles.statusBarTrack}>
            <div 
              className={`${styles.statusBarFill} ${timeDifference >= 0 ? styles.bgBarGreen : styles.bgBarRed}`}
              style={{ width: `${barWidthPercent}%` }}
            ></div>
          </div>

        </div>

        {/* ПРАВАЯ КОЛОНКА: ОГРОМНАЯ КВАДРАТНАЯ КНОПКА DONE ВО ВСЮ ВЫСОТУ */}
        <button type="button" onClick={handleRealItemDone} className={styles.bigSquareDoneBtn}>
          DONE
        </button>

      </div>

    </div>
  );
}
