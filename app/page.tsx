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
    <div className={styles.layoutWrapper}>
      <div className={styles.widgetContainer}>
        
        {/* 1. SETTINGS BLOCK */}
        <div className={styles.controlsPanel}>
          <div className={styles.fieldGroup}>
            <label htmlFor="coefficient" className={styles.fieldLabel}>Rate/h</label>
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
            <span className={styles.fieldLabel}>Shift</span>
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
              <label htmlFor="shift-9" className={styles.radioLabel} style={{ width: '65px' }}>9h 40m</label>
              
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
            <span className={styles.fieldLabel}>Target</span>
            <div className={styles.targetDisplay}>{targetPositions}<span className={styles.targetUnit}>pcs</span></div>
          </div>
        </div>

        <div className={styles.divider}></div>

        {/* 2. TIMERS BLOCK */}
        <div className={styles.timerSection}>
          <div className={styles.buttonsColumn}>
            <button 
              type="button" 
              onClick={() => setIsRunning(!isRunning)} 
              className={`${styles.timerControlBtn} ${isRunning ? styles.btnPause : styles.btnStart}`}
            >
              {isRunning ? 'PAUSE' : 'START'}
            </button>
            <button type="button" onClick={handleGlobalReset} className={`${styles.timerControlBtn} ${styles.btnReset}`}>
              RESET
            </button>
          </div>

          <div className={styles.timeDisplay}>
            <span className={styles.timeLabel}>PACE</span>
            <span className={styles.timeNumbers}>{formatTime(timeLeft)}</span>
          </div>

          <div className={styles.stopwatchDisplay}>
            <span className={styles.stopwatchLabel}>STOPWATCH</span>
            <span className={styles.stopwatchNumbers}>{formatTime(stopwatchSeconds)}</span>
          </div>
        </div>

        <div className={styles.divider}></div>

        {/* 3. PROGRESS, STATISTICS & DONE */}
        <div className={styles.resultsSection}>
          
          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>Progress ({progressPercent}%)</span>
            <div className={styles.progressDisplayContainer}>
              <div className={styles.progressRow}><span className={styles.rowLabel}>P:</span><span className={styles.rowValue}>{formatAccumulatedTime(spentSecondsByPlan)}</span></div>
              <div className={styles.progressRow}><span className={styles.rowLabel}>F:</span><span className={styles.rowValue}>{formatAccumulatedTime(totalRealSeconds)}</span></div>
              <div className={styles.progressRow}>
                <span className={styles.rowLabel}>D:</span>
                <span className={`${styles.rowValue} ${timeDifference >= 0 ? styles.textGreen : styles.textRed}`}>
                  {timeDifference > 0 ? '+' : timeDifference < 0 ? '-' : ''}{formatAccumulatedTime(timeDifference)}
                </span>
              </div>
              
              <div className={styles.statusBarTrack}>
                <div 
                  className={`${styles.statusBarFill} ${timeDifference >= 0 ? styles.bgBarGreen : styles.bgBarRed}`}
                  style={{ width: `${barWidthPercent}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>Advanced Stats</span>
            <div className={styles.statsDisplayContainer}>
              <div className={styles.progressRow}>
                <span className={styles.rowLabel}>Left:</span>
                <span className={styles.rowValue} style={{ color: '#0f766e' }}>{pcsLeft} pcs</span>
              </div>
              <div className={styles.progressRow}>
                <span className={styles.rowLabel}>Avg R:</span>
                <span className={styles.rowValue}>{formatTime(avgRealTimeSeconds)}</span>
              </div>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>Done</span>
            <div className={styles.adjustWrapper}>
              <div className={styles.countDisplayOnly}>{processedCount}<span className={styles.targetUnit}>pcs</span></div>
              <div className={styles.adjustButtonsGrid}>
                <button type="button" onClick={() => adjustCount(-10)} className={styles.adjBtn}>-10</button>
                <button type="button" onClick={() => adjustCount(-1)} className={styles.adjBtn}>-1</button>
                <button type="button" onClick={() => adjustCount(1)} className={styles.adjBtn}>+1</button>
                <button type="button" onClick={() => adjustCount(10)} className={styles.adjBtn}>+10</button>
              </div>
            </div>
          </div>

          <button type="button" onClick={handleRealItemDone} className={styles.realDoneBtn}>
            DONE
          </button>
        </div>

      </div>
    </div>
  );
}
