'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './widget.module.css';

type ShiftType = '8h' | '9h40m';

export default function PomodoroWidget() {
  // Настройки пользователя и счетчики
  const [coefficient, setCoefficient] = useState<number>(21);
  const [shift, setShift] = useState<ShiftType>('9h40m');
  const [processedCount, setProcessedCount] = useState<number>(0);

  // Замороженные настройки смены (фиксируются строго при нажатии START)
  const [lockedCoefficient, setLockedCoefficient] = useState<number>(21);
  const [lockedShift, setLockedShift] = useState<ShiftType>('9h40m');
  const [lockedTarget, setLockedTarget] = useState<number>(203);

  // Состояния активности, времени и звука
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(0);
  const [totalRealSeconds, setTotalRealSeconds] = useState<number>(0);
  const [shiftElapsedSeconds, setShiftAdjustmentSeconds] = useState<number>(0);
  
  // Включение/выключение звукового сигнала (по умолчанию true)
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);

  // Математическая база на основе замороженных данных
  const totalShiftMinutes = lockedShift === '9h40m' ? (9 * 60 + 40) : (8 * 60);
  const netWorkingMinutes = totalShiftMinutes - 45; 
  const decimalHours = totalShiftMinutes / 60;
  
  // Секунд на одну деталь по норме
  const totalTimerSeconds = lockedTarget > 0 
    ? Math.round((netWorkingMinutes * 60) / lockedTarget) 
    : 25 * 60;

  const [timeLeft, setTimeLeft] = useState<number>(totalTimerSeconds);

  // Визуальный текущий план для полей ввода до нажатия СТАРТ
  const currentShiftMinutes = shift === '9h40m' ? (9 * 60 + 40) : (8 * 60);
  const currentTargetPositions = Math.round(coefficient * (currentShiftMinutes / 60));

  // Загрузка данных из памяти браузера при старте страницы
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCoefficient = localStorage.getItem('p_coefficient');
      const savedShift = localStorage.getItem('p_shift') as ShiftType;
      const savedProcessedCount = localStorage.getItem('p_processedCount');
      const savedRealSeconds = localStorage.getItem('p_totalRealSeconds');
      const savedElapsed = localStorage.getItem('p_shiftElapsedSeconds');
      const savedSound = localStorage.getItem('p_isSoundEnabled');

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
      if (savedElapsed) setShiftAdjustmentSeconds(parseInt(savedElapsed, 10));
      if (savedSound) setIsSoundEnabled(savedSound === 'true');
    }
  }, []);
  // Синхронизация замороженных параметров, пока кнопка СТАРТ не нажата
  useEffect(() => {
    if (!isRunning && timeLeft === totalTimerSeconds) {
      setLockedCoefficient(coefficient);
      setLockedShift(shift);
      setLockedTarget(currentTargetPositions);
    }
  }, [coefficient, shift, isRunning, currentTargetPositions, timeLeft, totalTimerSeconds]);

  // Автосохранение состояний в localStorage
  useEffect(() => {
    localStorage.setItem('p_coefficient', coefficient.toString());
    localStorage.setItem('p_shift', shift);
    localStorage.setItem('p_processedCount', processedCount.toString());
    localStorage.setItem('p_totalRealSeconds', totalRealSeconds.toString());
    localStorage.setItem('p_shiftElapsedSeconds', shiftElapsedSeconds.toString());
    localStorage.setItem('p_isSoundEnabled', isSoundEnabled.toString());
  }, [coefficient, shift, processedCount, totalRealSeconds, shiftElapsedSeconds, isSoundEnabled]);

  // Восстановление времени темпа на паузе
  useEffect(() => {
    if (!isRunning && timeLeft !== 0) {
      setTimeLeft(totalTimerSeconds);
    }
  }, [totalTimerSeconds, isRunning, timeLeft]);

  // Единый главный интервал времени
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setStopwatchSeconds((prev) => prev + 1);
      setShiftAdjustmentSeconds((prev) => prev + 1);

      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Воспроизводим звук, только если переключатель звука активен
          if (isSoundEnabled) {
            playQuietPeep();
          }
          return totalTimerSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, totalTimerSeconds, isSoundEnabled]);

  // Функция воспроизведения тихого короткого пика (Quiet Peep)
  const playQuietPeep = () => {
    if (typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(650, ctx.currentTime); 
      gain.gain.setValueAtTime(0.06, ctx.currentTime); 
      
      osc.start();
      osc.stop(ctx.currentTime + 0.10); 
    } catch (e) {
      console.warn('Audio contextual block:', e);
    }
  };

  // По нажатию кнопки DONE или Shift+A оба секундомера сбрасываются в 0 без сигнала
  const handleRealItemDone = useCallback(() => {
    setProcessedCount((prev) => prev + 1);
    setTotalRealSeconds((prev) => prev + stopwatchSeconds);
    
    setStopwatchSeconds(0);
    setTimeLeft(totalTimerSeconds); 
  }, [stopwatchSeconds, totalTimerSeconds]);

  // Слушатель глобальной горячей клавиши Shift + A для DONE
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === 'A' || e.key === 'a' || e.key === 'ф' || e.key === 'Ф')) {
        if (document.activeElement?.tagName !== 'INPUT' && isRunning) {
          e.preventDefault();
          handleRealItemDone();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [isRunning, handleRealItemDone]);
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
    const wasActive = isRunning;
    setIsRunning(false);

    if (confirm('Reset all shift progress and configuration?')) {
      setProcessedCount(0);
      setStopwatchSeconds(0);
      setTotalRealSeconds(0);
      setShiftAdjustmentSeconds(0);
      setTimeLeft(totalTimerSeconds);
      localStorage.removeItem('p_processedCount');
      localStorage.removeItem('p_totalRealSeconds');
      localStorage.removeItem('p_shiftElapsedSeconds');
    } else {
      setIsRunning(wasActive);
    }
  };

  const adjustCount = (amount: number) => {
    setProcessedCount((prev) => Math.max(0, prev + amount));
  };

  // Výpočet ideálneho plánu na sekundy
  const exactCurrentPlanPcs = totalTimerSeconds > 0 
    ? shiftElapsedSeconds / totalTimerSeconds 
    : 0;

  const planPercent = lockedTarget > 0 
    ? Math.round((exactCurrentPlanPcs / lockedTarget) * 100) 
    : 0;
  const planPcsRounded = Math.round(exactCurrentPlanPcs);

  const factPercent = lockedTarget > 0 
    ? Math.round((processedCount / lockedTarget) * 100) 
    : 0;

  const diffPercent = factPercent - planPercent;
  const diffPcs = processedCount - planPcsRounded;

  const pcsLeft = Math.max(0, lockedTarget - processedCount);
  const avgRealTimeSeconds = processedCount > 0 ? Math.round(totalRealSeconds / processedCount) : 0;

  // Škála odchýlky (100% pri rozdiele 5 kusov)
  const maxDiffThreshold = 5; 
  const barWidthPercent = exactCurrentPlanPcs > 0 
    ? Math.min(100, Math.round((Math.abs(diffPcs) / maxDiffThreshold) * 100))
    : 0;

  // Zmena farieb pre PACE (Zelená -> Čierna -> Červená)
  const paceRatio = totalTimerSeconds > 0 ? timeLeft / totalTimerSeconds : 1;
  let paceColorClass = styles.paceGreen;

  if (paceRatio <= 0.5 && paceRatio > 0.2) {
    paceColorClass = styles.paceBlack; 
  } else if (paceRatio <= 0.2) {
    paceColorClass = styles.paceRed;   
  }

  const paceBarWidth = Math.round(paceRatio * 100);
  const isSettingsDisabled = timeLeft !== totalTimerSeconds || isRunning;
  const isDoneDisabled = shiftElapsedSeconds === 0;

  const handleStartToggle = () => {
    if (!isRunning && timeLeft === totalTimerSeconds) {
      setLockedCoefficient(coefficient);
      setLockedShift(shift);
      setLockedTarget(currentTargetPositions);
    }
    setIsRunning(!isRunning);
  };

  return (
    <div className={styles.layoutWrapper}>
      <div className={styles.widgetContainer}>
        
        {/* BLOCK 1: CONFIGURATION (Concave Border) */}
        <div className={styles.concaveBlock}>
          <div className={styles.fieldGroup}>
            <label htmlFor="coefficient" className={styles.fieldLabel}>Rate / Hour</label>
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
            <span className={styles.fieldLabel}>Shift Time</span>
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
              <label htmlFor="shift-9" className={styles.radioLabel} style={{ width: '56px' }}>9:40</label>
              
              <div 
                className={styles.slider} 
                style={{ 
                  transform: (isSettingsDisabled ? lockedShift : shift) === '9h40m' ? 'translateX(45px)' : 'translateX(0px)'
                }}
              ></div>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <span className={styles.fieldLabel}>Shift Target</span>
            <div className={styles.targetDisplayDisabled}>
              {isSettingsDisabled ? lockedTarget : currentTargetPositions}
              <span className={styles.unitText}>pcs</span>
            </div>
          </div>
        </div>

        {/* BLOCK 2: CURRENT PROGRESS & TIME VARIANCE (Concave Border) */}
        <div className={styles.concaveBlock}>
          <div className={styles.compactStatsBox}>
            <div className={styles.progressRow}>
              <span className={styles.rowLabel}>Plan:</span>
              <span className={styles.rowValue}>{planPercent}% ({planPcsRounded} pcs)</span>
            </div>
            <div className={styles.progressRow}>
              <span className={styles.rowLabel}>Fact:</span>
              <span className={styles.rowValue}>{factPercent}% ({processedCount} pcs)</span>
            </div>
            <div className={styles.progressRow}>
              <span className={styles.rowLabel}>Diff:</span>
              <span className={`${styles.rowValue} ${diffPcs >= 0 ? styles.textGreen : styles.textRed}`}>
                {diffPercent >= 0 ? '+' : ''}{diffPercent}% ({diffPcs >= 0 ? '+' : ''}{diffPcs} pcs)
              </span>
            </div>
            <div className={styles.statusBarTrack}>
              <div 
                className={`${styles.statusBarFill} ${diffPcs >= 0 ? styles.bgBarGreen : styles.bgBarRed}`}
                style={{ width: `${barWidthPercent}%` }}
              ></div>
            </div>
          </div>
        </div>
        {/* BLOCK 3: CONTROLS & MANUAL ADJUSTMENTS (Concave Border) */}
        <div className={styles.concaveBlock}>
          <div className={styles.controlAndAdjustColumn}>
            <div className={styles.gridRow}>
              <button 
                type="button" 
                onClick={handleStartToggle} 
                className={`${styles.shadowBtn} ${isRunning ? styles.btnPause : styles.btnStart}`}
              >
                {isRunning ? '|| PAUSE' : '▶ START'}
              </button>

              {/* КНОПКА ЗВУКА ДЛЯ ВКЛЮЧЕНИЯ/ОТКЛЮЧЕНИЯ СИГНАЛА КОНЦА PACE */}
              <button 
                type="button" 
                onClick={() => setIsSoundEnabled(!isSoundEnabled)} 
                className={`${styles.shadowBtn} ${isSoundEnabled ? styles.btnSoundOn : styles.btnSoundOff}`}
              >
                {isSoundEnabled ? '🔊 BEEP' : '🔇 MUTE'}
              </button>

              <button 
                type="button" 
                onClick={handleGlobalReset} 
                className={`${styles.shadowBtn} ${styles.btnReset}`}
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

       {/* BLOCK 4: STATS, TIMERS & ACTION DONE BUTTON */}
       <div 
          className={styles.concaveBlock} 
          style={{ paddingRight: '0', gap: '6px', flexDirection: 'column', alignItems: 'stretch' }}
        >
          {/* Верхняя строка элементов внутри Блока 4 */}
          <div style={{ display: 'flex', width: '100%', alignItems: 'center', gap: '6px', justifyContent: 'space-between' }}>
            
            <div className={styles.compactStatsBox} style={{ minWidth: '78px' }}>
              <div className={styles.progressRow}>
                <span className={styles.rowLabel}>Left:</span>
                <span className={styles.rowValue}>{pcsLeft}</span>
              </div>
              <div className={styles.progressRow}>
                <span className={styles.rowLabel}>Avg P:</span>
                <span className={styles.rowValue}>{formatTime(totalTimerSeconds)}</span>
              </div>
              <div className={styles.progressRow}>
                <span className={styles.rowLabel}>Avg R:</span>
                <span className={styles.rowValue}>{formatTime(avgRealTimeSeconds)}</span>
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel}>Done</span>
              <div className={styles.countDisplayOnly}>{processedCount}</div>
            </div>

            <div className={styles.stopwatchDisplay}>
              <span className={styles.stopwatchLabel}>STOPWATCH</span>
              <span className={styles.stopwatchNumbers}>{formatTime(stopwatchSeconds)}</span>
            </div>

            {/* Обновленный блок PACE (теперь без микро-полоски внутри) */}
            <div className={styles.timeDisplay}>
              <span className={styles.timeLabel}>PACE</span>
              <span className={`${styles.timeNumbers} ${paceColorClass}`}>{formatTime(timeLeft)}</span>
            </div>

            {/* Оригинальная кнопка DONE */}
            <button 
              type="button" 
              onClick={handleRealItemDone} 
              disabled={isDoneDisabled}
              className={styles.dDoneBtn}
              style={{ marginRight: '12px' }}
            >
              DONE
            </button>
          </div>

          {/* 1. ДОРАБОТАННЫЙ ПРОГРЕСС-БАР ТЕМПА (PACE) — Теперь длинный, под контентом, меняет цвет */}
          <div className={styles.extendedPaceTrack} style={{ marginRight: '12px', marginTop: '6px' }}>
            <div 
              className={`${styles.extendedPaceFill} ${
                paceColorClass === styles.paceGreen ? styles.bgPaceGreen :
                paceColorClass === styles.paceBlack ? styles.bgPaceBlack : styles.bgPaceRed
              }`} 
              style={{ width: `${paceBarWidth}%` }}
            />
            <span className={styles.extendedPaceText}>Time Left</span>
          </div>

          {/* 2. СТРОКА ПРОГРЕССА СМЕНЫ — Идет самым нижним слоем */}
          <div className={styles.bottomProgressBarTrack} style={{ marginRight: '12px', marginTop: '4px' }}>
            <div 
              className={styles.bottomProgressBarFill} 
              style={{ width: `${Math.min(100, Math.max(0, factPercent))}%` }}
            />
            <span className={styles.bottomProgressBarText}>
              Shift Progress: {factPercent}%
            </span>
          </div>

        </div>

      </div>
    </div>
  );
}
