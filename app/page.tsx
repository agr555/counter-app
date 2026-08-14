"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./widget.module.css";

type ShiftType = "8h" | "9h40m";

type DoneLogItem = {
  timestamp: string;
  duration: string;
  planPcs: number;
  factCount: number;
};

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

const formatTimeNoSeconds = (totalSecs: number) => {
  const absoluteSecs = Math.abs(totalSecs);
  const hrs = Math.floor(absoluteSecs / 3600);
  const mins = Math.floor((absoluteSecs % 3600) / 60);
  if (hrs > 0) return `${hrs}h ${mins}m`;
  return `${mins}m`;
};

export default function PomodoroWidget() {
  const [coefficient, setCoefficient] = useState<number>(21);
  const [shift, setShift] = useState<ShiftType>("9h40m");
  const [processedCount, setProcessedCount] = useState<number>(0);

  const [lockedCoefficient, setLockedCoefficient] = useState<number>(21);
  const [lockedShift, setLockedShift] = useState<ShiftType>("9h40m");
  const [lockedTarget, setLockedTarget] = useState<number>(203);

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [stopwatchSeconds, setStopwatchSeconds] = useState<number>(0);
  const [totalRealSeconds, setTotalRealSeconds] = useState<number>(0);
  const [shiftElapsedSeconds, setShiftAdjustmentSeconds] = useState<number>(0);

  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const [startTimeText, setStartTimeText] = useState<string>("--:--");
  const [actualStartObject, setActualStartObject] = useState<Date | null>(null);

  const totalShiftMinutes = lockedShift === "9h40m" ? 9 * 60 + 40 : 8 * 60;
  const netWorkingMinutes = totalShiftMinutes - 45;

  const totalTimerSeconds = lockedTarget > 0 ? Math.round((netWorkingMinutes * 60) / lockedTarget) : 25 * 60;
  const [timeLeft, setTimeLeft] = useState<number>(totalTimerSeconds);

  const currentShiftMinutes = shift === "9h40m" ? 9 * 60 + 40 : 8 * 60;
  const currentTargetPositions = Math.round(coefficient * (currentShiftMinutes / 60));

  const [doneLogs, setDoneLogs] = useState<DoneLogItem[]>([]);
  const [showReport, setShowReport] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedCoefficient = localStorage.getItem("p_coefficient");
      const savedShift = localStorage.getItem("p_shift") as ShiftType;
      const savedProcessedCount = localStorage.getItem("p_processedCount");
      const savedRealSeconds = localStorage.getItem("p_totalRealSeconds");
      const savedElapsed = localStorage.getItem("p_shiftElapsedSeconds");
      const savedSound = localStorage.getItem("p_isSoundEnabled");

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
      if (savedSound) setIsSoundEnabled(savedSound === "true");

      const savedLogs = localStorage.getItem("p_doneLogs");
      if (savedLogs) {
        try { setDoneLogs(JSON.parse(savedLogs)); } catch (e) { console.error(e); }
      }
    }
  }, []);

  useEffect(() => {
    if (!isRunning && timeLeft === totalTimerSeconds) {
      setLockedCoefficient(coefficient);
      setLockedShift(shift);
      setLockedTarget(currentTargetPositions);
    }
  }, [coefficient, shift, isRunning, currentTargetPositions, timeLeft, totalTimerSeconds]);

  useEffect(() => {
    localStorage.setItem("p_coefficient", coefficient.toString());
    localStorage.setItem("p_shift", shift);
    localStorage.setItem("p_processedCount", processedCount.toString());
    localStorage.setItem("p_totalRealSeconds", totalRealSeconds.toString());
    localStorage.setItem("p_shiftElapsedSeconds", shiftElapsedSeconds.toString());
    localStorage.setItem("p_isSoundEnabled", isSoundEnabled.toString());
  }, [coefficient, shift, processedCount, totalRealSeconds, shiftElapsedSeconds, isSoundEnabled]);

  useEffect(() => {
    if (!isRunning && timeLeft !== 0) {
      setTimeLeft(totalTimerSeconds);
    }
  }, [totalTimerSeconds, isRunning, timeLeft]);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setStopwatchSeconds((prev) => prev + 1);
      setShiftAdjustmentSeconds((prev) => prev + 1);

      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (isSoundEnabled) playQuietPeep();
          return totalTimerSeconds;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, totalTimerSeconds, isSoundEnabled]);

  const playQuietPeep = () => {
    if (typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(650, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) { console.warn(e); }
  };

  const exactCurrentPlanPcs = totalTimerSeconds > 0 ? shiftElapsedSeconds / totalTimerSeconds : 0;
  const planPercent = lockedTarget > 0 ? Math.round((exactCurrentPlanPcs / lockedTarget) * 100) : 0;
  const planPcsRounded = Math.round(exactCurrentPlanPcs);
  const factPercent = lockedTarget > 0 ? Math.round((processedCount / lockedTarget) * 100) : 0;
  const diffPercent = factPercent - planPercent;
  const diffPcs = processedCount - planPcsRounded;
  const pcsLeft = Math.max(0, lockedTarget - processedCount);
  const avgRealTimeSeconds = processedCount > 0 ? Math.round(totalRealSeconds / processedCount) : 0;

  const maxDiffThreshold = 5;
  const barWidthPercent = exactCurrentPlanPcs > 0 ? Math.min(100, Math.round((Math.abs(diffPcs) / maxDiffThreshold) * 100)) : 0;
  const paceRatio = totalTimerSeconds > 0 ? timeLeft / totalTimerSeconds : 1;
  
  let paceColorClass = styles.paceGreen;
  if (paceRatio <= 0.5 && paceRatio > 0.2) paceColorClass = styles.paceBlack;
  else if (paceRatio <= 0.2) paceColorClass = styles.paceRed;

  const paceBarWidth = Math.round((1 - paceRatio) * 100);
  const isSettingsDisabled = timeLeft !== totalTimerSeconds || isRunning;
  const isDoneDisabled = !isRunning && processedCount === 0;

  const handleRealItemDone = useCallback(() => {
    const nextProcessedCount = processedCount + 1;
    const now = new Date();
    const timestampStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;

    const newLogItem: DoneLogItem = {
      timestamp: timestampStr,
      duration: formatTime(stopwatchSeconds),
      planPcs: planPcsRounded,
      factCount: nextProcessedCount,
    };

    setDoneLogs((prev) => {
      const updatedLogs = [...prev, newLogItem];
      localStorage.setItem("p_doneLogs", JSON.stringify(updatedLogs));
      return updatedLogs;
    });

    setProcessedCount(nextProcessedCount);
    setTotalRealSeconds((prev) => prev + stopwatchSeconds);
    setStopwatchSeconds(0);
    
    setShiftAdjustmentSeconds(nextProcessedCount * totalTimerSeconds);
    setTimeLeft(totalTimerSeconds);
  }, [stopwatchSeconds, totalTimerSeconds, processedCount, planPcsRounded]);

  const currentNormsElapsed = totalTimerSeconds > 0 ? Math.floor(shiftElapsedSeconds / totalTimerSeconds) : 0;
  let doneButtonColorClass = styles.doneGreen;

  if (currentNormsElapsed > processedCount) {
    const overdueCount = currentNormsElapsed - processedCount;
    if (overdueCount === 1) {
      doneButtonColorClass = styles.doneRed;
    } else if (overdueCount >= 2) {
      doneButtonColorClass = styles.doneBlackBlink;
    }
  }

  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === "A" || e.key === "a" || e.key === "ф" || e.key === "Ф")) {
        if (document.activeElement?.tagName !== "INPUT" && isRunning) {
          e.preventDefault();
          handleRealItemDone();
        }
      }
    };
    window.addEventListener("keydown", handleGlobalKey);
    return () => window.removeEventListener("keydown", handleGlobalKey);
  }, [isRunning, handleRealItemDone]);

  const handleGlobalReset = () => {
    const wasActive = isRunning;
    setIsRunning(false);
    if (confirm("Reset all shift progress and configuration?")) {
      setProcessedCount(0);
      setStopwatchSeconds(0);
      setTotalRealSeconds(0);
      setShiftAdjustmentSeconds(0);
      setTimeLeft(totalTimerSeconds);
      setStartTimeText("--:--");
      setActualStartObject(null);
      localStorage.removeItem("p_processedCount");
      localStorage.removeItem("p_totalRealSeconds");
      localStorage.removeItem("p_shiftElapsedSeconds");
      setDoneLogs([]);
      localStorage.removeItem("p_doneLogs");
    } else {
      setIsRunning(wasActive);
    }
  };

  const adjustCount = (amount: number) => { setProcessedCount((prev) => Math.max(0, prev + amount)); };

  const adjustShiftTime = (minutesAmount: number) => {
    if (actualStartObject) {
      const timeShiftMs = minutesAmount * 60 * 1000;
      const updatedDate = new Date(actualStartObject.getTime() + timeShiftMs);
      setActualStartObject(updatedDate);
      setStartTimeText(`${updatedDate.getHours().toString().padStart(2, "0")}:${updatedDate.getMinutes().toString().padStart(2, "0")}`);
    }

    setShiftAdjustmentSeconds((prev) => {
      const newValue = prev - minutesAmount * 60;
      return newValue < 0 ? 0 : newValue;
    });

    const currentShiftMins = shift === "9h40m" ? 9 * 60 + 40 : 8 * 60;
    const currentTargetPcs = Math.round(coefficient * (currentShiftMins / 60));

    setLockedCoefficient(coefficient);
    setLockedShift(shift);
    setLockedTarget(currentTargetPcs);

    const netMinutes = currentShiftMins - 45;
    const computedTimerSeconds = currentTargetPcs > 0 ? Math.round((netMinutes * 60) / currentTargetPcs) : 25 * 60;
    setTimeLeft(computedTimerSeconds);
    setIsRunning(true);
  };

  const handleStartToggle = () => {
    if (!isRunning && timeLeft === totalTimerSeconds) {
      setLockedCoefficient(coefficient);
      setLockedShift(shift);
      setLockedTarget(currentTargetPositions);
      if (!actualStartObject) {
        const now = new Date();
        setActualStartObject(now);
        setStartTimeText(`${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`);
      }
    }
    setIsRunning(!isRunning);
  };

  return (
    <div className={styles.layoutWrapper}>
      <div className={styles.widgetContainer}>
        
                {/* BLOCK A: CONFIGURATION (Блок настроек с измененной структурой колонок) */}
                <div className={`${styles.concaveBlock} ${styles.blockConfig}`}>
          <div className={styles.configGrid}>
            
            {/* ЛЕВАЯ КОЛОНКА: Выбор смены, START и WORKED */}
            <div className={styles.cfgTime}>
              <span className={styles.fieldLabel}>Time</span>
              <div className={styles.toggleContainer} style={{ opacity: isSettingsDisabled ? 0.7 : 1 }}>
                <input type="radio" id="shift-8" name="shiftValue" value="8h" checked={(isSettingsDisabled ? lockedShift : shift) === "8h"} onChange={() => setShift("8h")} disabled={isSettingsDisabled} className={styles.radioInput} />
                <label htmlFor="shift-8" className={`${styles.radioLabel} ${(isSettingsDisabled ? lockedShift : shift) === "8h" ? styles.radioLabelActive : ""}`}>8h</label>
                <input type="radio" id="shift-9" name="shiftValue" value="9h40m" checked={(isSettingsDisabled ? lockedShift : shift) === "9h40m"} onChange={() => setShift("9h40m")} disabled={isSettingsDisabled} className={styles.radioInput} />
                <label htmlFor="shift-9" className={`${styles.radioLabel} ${(isSettingsDisabled ? lockedShift : shift) === "9h40m" ? styles.radioLabelActive : ""}`}>9:40</label>
                <div className={styles.slider} style={{ transform: (isSettingsDisabled ? lockedShift : shift) === "9h40m" ? "translateX(45px)" : "translateX(0px)" }}></div>
              </div>
              <div className={styles.timeInfoLine}>
                <span className={styles.timeAlertText}>START: {startTimeText}</span>
                <span className={styles.timeAlertText}>WORKED: {formatTimeNoSeconds(shiftElapsedSeconds)}</span>
              </div>
            </div>

            {/* ПРАВАЯ КОЛОНКА: Настройка Rate/Hour и Target ниже */}
            <div className={styles.cfgRate}>
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
              
              <div className={styles.cfgTarget}>
                <span className={styles.fieldLabel}>Target</span>
                <div className={styles.targetDisplayDisabled}>
                  {isSettingsDisabled ? lockedTarget : currentTargetPositions}
                  <span className={styles.unitText}>pcs</span>
                </div>
              </div>
            </div>

          </div>
        </div>


        {/* BLOCK B: CONTROLS & MANUAL ADJUSTMENTS (Управление и ровная сетка) */}
        <div className={`${styles.concaveBlock} ${styles.blockControls}`}>
          <div className={styles.controlAndAdjustColumn}>
            
            <div className={styles.gridRowMain}>
              <button type="button" onClick={handleStartToggle} className={`${styles.shadowBtn} ${isRunning ? styles.btnPause : styles.btnStart}`}>
                {isRunning ? "|| PAUSE" : "▶ START"}
              </button>
              <button type="button" onClick={handleGlobalReset} className={`${styles.shadowBtn} ${styles.btnReset}`}>
                ✖ STOP
              </button>
            </div>

            <div className={styles.gridRowFullWidthLabel}>
              <span className={styles.adjustPrefixLabel}>PCS:</span>
              <div className={styles.adjustButtonsSubGrid}>
                <button type="button" onClick={() => adjustCount(-1)} className={styles.adjBtnWide}>-1</button>
                <button type="button" onClick={() => adjustCount(-10)} className={styles.adjBtnWide}>-10</button>
                <button type="button" onClick={() => adjustCount(10)} className={styles.adjBtnWide}>+10</button>
                <button type="button" onClick={() => adjustCount(1)} className={styles.adjBtnWide}>+1</button>
              </div>
            </div>

            <div className={styles.gridRowFullWidthLabel}>
              <span className={styles.adjustPrefixLabel}>TIME:</span>
              <div className={styles.adjustButtonsSubGrid}>
                <button type="button" onClick={() => adjustShiftTime(-1)} className={styles.adjBtnWide}>-1m</button>
                <button type="button" onClick={() => adjustShiftTime(-10)} className={styles.adjBtnWide}>-10m</button>
                <button type="button" onClick={() => adjustShiftTime(10)} className={styles.adjBtnWide}>+10m</button>
                <button type="button" onClick={() => adjustShiftTime(1)} className={styles.adjBtnWide}>+1m</button>
              </div>
            </div>

          </div>
        </div>

                {/* BLOCK C: PROGRESS WITH LOG & SOUND (Блок статистики с логом и звуком) */}
                <div className={`${styles.concaveBlock} ${styles.blockStats}`}>
          <div className={styles.compactStatsBox}>
            <div className={styles.progressRow}>
              <span className={styles.rowLabel}>Plan:</span>
              <span className={styles.rowValue}>{planPercent}% ({planPcsRounded} pcs)</span>
            </div>
            <div className={styles.progressRow}>
              <span className={styles.rowLabel}>Fact:</span>
              <span className={styles.rowValue}>{processedCount} pcs ({factPercent}%)</span>
            </div>
            
            {/* Ряд с кнопками звука и лога */}
            <div className={styles.gridRow} style={{ marginTop: "4px", width: "100%", justifyContent: "space-between" }}>
              <button type="button" onClick={() => setIsSoundEnabled(!isSoundEnabled)} className={`${styles.shadowBtn} ${isSoundEnabled ? styles.btnSoundOn : styles.btnSoundOff}`} style={{ height: "20px", padding: "0 6px" }}>
                {isSoundEnabled ? "🔊" : "🔇"}
              </button>
              <button type="button" onClick={() => setShowReport(!showReport)} className={`${styles.shadowBtn} ${showReport ? styles.btnReportActive : styles.btnReport}`} style={{ height: "20px", padding: "0 6px" }}>
                📋 LOG
              </button>
              <div className={styles.rowValue} style={{ fontWeight: "700" }}>
                <span className={diffPcs >= 0 ? styles.textGreen : styles.textRed}>
                  {diffPercent >= 0 ? "+" : ""}{diffPercent}% ({diffPcs >= 0 ? "+" : ""}{diffPcs} pcs)
                </span>
              </div>
            </div>

            <div className={styles.statusBarTrack}>
              <div className={`${styles.statusBarFill} ${diffPcs >= 0 ? styles.bgBarGreen : styles.bgBarRed}`} style={{ width: `${barWidthPercent}%` }}></div>
            </div>
          </div>
        </div>

        {/* BLOCK D: ACTION DONE BUTTON & TIMERS (Блок с кнопкой DONE) */}
        <div className={`${styles.concaveBlock} ${styles.blockAction}`}>
          <div className={styles.gridRow} style={{ width: "100%", justifyContent: "space-between", height: "auto" }}>
            
            <div className={styles.fieldGroup} style={{ alignItems: "flex-start", gap: "1px" }}>
              <div style={{ fontSize: "0.5rem", fontWeight: "800", color: "#94a3b8" }}>LEFT: <span style={{ fontFamily: "monospace", color: "#1e293b", fontSize: "0.65rem" }}>{pcsLeft}</span></div>
              <div style={{ fontSize: "0.5rem", fontWeight: "800", color: "#94a3b8" }}>AVG P: <span style={{ fontFamily: "monospace", color: "#1e293b", fontSize: "0.65rem" }}>{formatTime(totalTimerSeconds)}</span></div>
              <div style={{ fontSize: "0.5rem", fontWeight: "800", color: "#94a3b8" }}>AVG R: <span style={{ fontFamily: "monospace", color: "#1e293b", fontSize: "0.65rem" }}>{formatTime(avgRealTimeSeconds)}</span></div>
            </div>

            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel} style={{ fontSize: "0.5rem" }}>Done</span>
              <div className={styles.countDisplayOnly}>{processedCount}</div>
            </div>

            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel} style={{ fontSize: "0.5rem" }}>STOPWATCH</span>
              <span className={styles.stopwatchNumbers}>{formatTime(stopwatchSeconds)}</span>
            </div>

            <div className={styles.fieldGroup}>
              <span className={styles.fieldLabel} style={{ fontSize: "0.5rem" }}>PACE</span>
              <span className={`${styles.timeNumbers} ${paceColorClass}`}>{formatTime(timeLeft)}</span>
            </div>

            <button
              type="button"
              onClick={handleRealItemDone}
              disabled={isDoneDisabled}
              className={`${styles.dDoneBtn} ${doneButtonColorClass}`}
            >
              DONE
            </button>

          </div>

          <div className={styles.extendedPaceTrack} style={{ marginTop: "4px" }}>
            <div
              className={`${styles.extendedPaceFill} ${
                paceColorClass === styles.paceGreen ? styles.bgPaceGreen : paceColorClass === styles.paceBlack ? styles.bgPaceBlack : styles.bgPaceRed
              }`}
              style={{ width: `${paceBarWidth}%` }}
            />
            <span className={styles.extendedPaceText}>Time Elapsed</span>
          </div>

          <div className={styles.bottomProgressBarTrack} style={{ marginTop: "4px" }}>
            <div className={styles.bottomProgressBarFill} style={{ width: `${Math.min(100, Math.max(0, factPercent))}%` }} />
            <span className={styles.bottomProgressBarText}>Progress: {factPercent}%</span>
          </div>
        </div>

      </div> {/* Конец widgetContainer */}

      {/* HISTORICAL REPORT */}
      {showReport && (
        <div className={styles.reportSection}>
          <div className={styles.reportHeader}>
            <h3>Shift Production Log</h3>
            <button 
              type="button" 
              onClick={() => { if(confirm("Clear history?")) { setDoneLogs([]); localStorage.removeItem("p_doneLogs"); } }} 
              className={styles.clearLogBtn}
            >
              Clear
            </button>
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.reportTable}>
              <thead>
                <tr>
                  <th>Time Done</th>
                  <th>Last Unit Duration</th>
                  <th>Current Plan</th>
                  <th style={{ textAlign: "right", paddingRight: "16px" }}># Fact</th>
                </tr>
              </thead>
              <tbody>
                {doneLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", color: "#94a3b8", padding: "16px", fontStyle: "italic" }}>
                      No items processed yet.
                    </td>
                  </tr>
                ) : (
                  doneLogs.toReversed().map((item, index) => (
                    <tr key={index}>
                      <td>{item.timestamp}</td>
                      <td>{item.duration}</td>
                      <td>{item.planPcs} pcs</td>
                      <td className={styles.factCell}><strong>{item.factCount} pcs</strong></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

