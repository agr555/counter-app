'use client';

import { useState, useEffect } from 'react';
import styles from './widget.module.css';

type ShiftType = '8h' | '9h40m';

export default function PomodoroWidget() {
  const [coefficient, setCoefficient] = useState<number>(21);
  const [shift, setShift] = useState<ShiftType>('9h40m');
  const [processedCount, setProcessedCount] = useState<number>(0);

  const [lockedCoefficient, setLockedCoefficient] = useState<number>(21);
  const [lockedShift, setLockedShift] = useState<ShiftType>('9h40m');
  const [lockedTarget, setLockedTarget] = useState<number>(203);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(0);
  const [totalRealSeconds, setTotalRealSeconds] = useState<number>(0);

  const totalShiftMinutes = lockedShift === '9h40m' ? (9 * 60 + 40) : (8 * 60);
  const netWorkingMinutes = totalShiftMinutes - 45; 
  const decimalHours = totalShiftMinutes / 60;
  
  const totalTimerSeconds = lockedTarget > 0 
    ? Math.round((netWorkingMinutes * 60) / lockedTarget) 
    : 25 * 60;

  const [timeLeft, setTimeLeft] = useState<number>(totalTimerSeconds);

  const currentShiftMinutes = shift === '9h40m' ? (9 * 60 + 40) : (8 * 60);
  const currentTargetPositions = Math.round(coefficient * (currentShiftMinutes / 60));

  useEffect(() => {
    const savedCoefficient = localStorage.getItem('p_coefficient');
    const savedShift = localStorage.getItem('p_shift') as ShiftType;
    const savedProcessedCount = localStorage.getItem('p_processedCount');
    const savedRealSeconds = localStorage.getItem('p_totalRealSeconds');

    if (savedCoefficient) {
      setCoefficient(parseInt(savedCoefficient, 10));
      setLockedCoefficient(parseInt(savedCoefficient, 10));
    }
    if (savedShift) {
      setShift(savedShift);
      setLockedShift(savedShift);
    }
    if (savedProcessedCount) setProcessedCount(parseInt(savedProcessedCount, 10));
    if (savedRealSeconds) setTotalRealSeconds(parseInt(savedRealSeconds, 10));
  }, []);

  useEffect(() => {
    if (!isRunning) {
      setLockedCoefficient(coefficient);
      setLockedShift(shift);
      setLockedTarget(currentTargetPositions);
    }
  }, [coefficient, shift, isRunning, currentTargetPositions]);

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
      setTimeLeft(totalTimerSeconds);
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
  const progressPercent = lockedTarget > 0 
    ? Math.round((processedCount / lockedTarget) * 100)
    : 0;

  const pcsLeft = Math.max(0, lockedTarget - processedCount);
  const avgRealTimeSeconds = processedCount > 0 ? Math.round(totalRealSeconds / processedCount) : 0;

  // Расчет прогресс-бара отклонения (100% при разнице в 5 деталей)
  const maxDiffThreshold = totalTimerSeconds * 5; 
  const barWidthPercent = spentSecondsByPlan > 0 
    ? Math.min(100, Math.round((Math.abs(timeDifference) / maxDiffThreshold) * 100))
    : 0;

  const handleStartToggle = () => {
    if (!isRunning && timeLeft === totalTimerSeconds) {
      setLockedCoefficient(coefficient);
      setLockedShift(shift);
      setLockedTarget(currentTargetPositions);
    }
    setIsRunning(!isRunning);
  };

  const isSettingsDisabled = timeLeft !== totalTimerSeconds || isRunning;

  return (
    <div className={styles.layoutWrapper}>
      <div className={styles.widgetContainer}>
        
        {/* BLOCK 1: SETTINGS (Rate, Shift, Target) */}
        <div className={styles.concaveBlock}>
          <div className={styles.fieldGroup}>
            <label htmlFor="coefficient" className={styles.fieldLabel}>Rate/h</label>
            <input
              id="coefficient"
              type="number"
              step="1"
              min="1"
              max="999999"
              value={isSettingsDisabled ? lockedCoefficient : coefficient}
              onChange={(e) => setCoefficient(parseInt(e.target.value) || 0)}
              disabled={isSettingsDisabled}
              className={styles.inputNumberWide}
            />
          </div>

          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>Shift</span>
            <div className={styles.toggleContainer} style={{ opacity: isSettingsDisabled ? 0.7 : 1 }}>
              <input
                type="radio"
                id="shift-8"
                name="shiftValue"
                value="8h"
                checked={(isSettingsDisabled ? lockedShift : shift) === '8h'}
                onChange={() => setShift('8h')}
                disabled={isSettingsDisabled}
                className={styles.radioInput}
              />
              <label htmlFor="shift-8" className={styles.radioLabel}>8h</label>

              <input
                type="radio"
                id="shift-9"
                name="shiftValue"
                value="9h40m"
                checked={(isSettingsDisabled ? lockedShift : shift) === '9h40m'}
                onChange={() => setShift('9h40m')}
                disabled={isSettingsDisabled}
                className={styles.radioInput}
              />
              <label htmlFor="shift-9" className={styles.radioLabel}>9:40</label>
              
              <div 
                className={styles.slider} 
                style={{ 
                  transform: (isSettingsDisabled ? lockedShift : shift) === '9h40m' ? 'translateX(45px)' : 'translateX(0px)'
                }}
              ></div>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>Target</span>
            <div className={styles.targetDisplayDisabled}>
              {isSettingsDisabled ? lockedTarget : currentTargetPositions} <span className={styles.unitText}>pcs</span>
            </div>
          </div>
        </div>

        {/* BLOCK 2: CONTROLS & ADJUSTMENTS */}
        <div className={styles.concaveBlock}>
          <div className={styles.controlAndAdjustColumn}>
            <div className={styles.gridRow}>
              <button 
                type="button" 
                onClick={handleStartToggle} 
                className={`${styles.shadowBtn} ${isRunning ? styles.btnPause : styles.btnStart}`}
                title={isRunning ? 'Pause' : 'Start'}
              >
                {isRunning ? '||' : '▶ START'}
              </button>
              <button 
                type="button" 
                onClick={handleGlobalReset} 
                className={`${styles.shadowBtn} ${styles.btnReset}`}
                title="Reset Shift"
              >
                ✖ STOP
              </button>
            </div>

            <div className={styles.gridRow}>
              <button type="button" onClick={() => adjustCount(-10)} className={styles.adjBtn}>-10</button>
              <button type="button" onClick={() => adjustCount(-1)} className={styles.adjBtn}>-1</button>
              <button type="button" onClick={() => adjustCount(1)} className={styles.adjBtn}>+1</button>
              <button type="button" onClick={() => adjustCount(10)} className={styles.adjBtn}>+10</button>
            </div>
          </div>
        </div>

        {/* BLOCK 3: TIMERS & LIVE PACE */}
        <div className={styles.concaveBlock}>
          <div className={styles.timeDisplay}>
            <span className={styles.timeLabel}>PACE</span>
            <span className={styles.timeNumbers}>{formatTime(timeLeft)}</span>
          </div>

          <div className={styles.stopwatchDisplay}>
            <span className={styles.stopwatchLabel}>STOPWATCH</span>
            <span className={styles.stopwatchNumbers}>{formatTime(stopwatchSeconds)}</span>
          </div>
        </div>

        {/* BLOCK 4: ANALYTICS, PROCESSED & ACTION DONE BUTTON */}
        <div className={styles.concaveBlock} style={{ paddingRight: '0', gap: '8px' }}>
          
          <div className={styles.compactStatsBox}>
            <div className={styles.statLine}>
              <span>Prg:</span>
              <span className={styles.boldVal}>{progressPercent}%</span>
            </div>
            <div className={styles.statLine}>
              <span>Dif:</span>
              <span className={`${styles.boldVal} ${timeDifference >= 0 ? styles.textGreen : styles.textRed}`}>
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

          <div className={styles.compactStatsBox}>
            <div className={styles.statLine}>
              <span>Left:</span>
              <span className={styles.boldVal}>{pcsLeft}</span>
            </div>
            <div className={styles.statLine}>
              <span>Avg:</span>
              <span className={styles.boldVal}>{formatTime(avgRealTimeSeconds)}</span>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>Done</span>
            <div className={styles.countDisplayOnly}>{processedCount}</div>
          </div>

          {/* Имя класса заменено на валидное .dDoneBtn */}
          <button type="button" onClick={handleRealItemDone} className={styles.dDoneBtn}>
            DONE
          </button>

        </div>

      </div>
    </div>
  );
}
