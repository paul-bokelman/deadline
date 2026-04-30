import { h, FunctionComponent } from 'preact';
import { useContext, useMemo, useState } from 'preact/hooks';

import OpenWindowsContext from '../../context/OpenWindowsContext';
import { AppProps } from '../../types/App';
import { useGameState } from '../../game/state';
import { useIntrusivePopupCount } from '../../system/intrusivePopups/useIntrusivePopupCount';
import {
  calculateUsedRamMb,
  MAX_RAM_MB,
  RAM_PER_WINDOW_MB,
  STARTING_RAM_MB,
} from '../../system/performance/ramUsage';
import style from './SystemPerformanceApp.module.css';

const formatMb = (value: number): string => `${value.toFixed(1)} MB`;

const SystemPerformanceApp: FunctionComponent<AppProps> = ({
  closeWindow,
}: AppProps) => {
  const { windows } = useContext(OpenWindowsContext);
  const { rebootGame } = useGameState();
  const popupCount = useIntrusivePopupCount();
  const [isApplyingPatch, setIsApplyingPatch] = useState(false);

  const windowCount = windows.length + popupCount;
  const usedRamMb = useMemo(() => calculateUsedRamMb(windowCount), [windowCount]);
  const usagePercent = useMemo(
    () => (usedRamMb / MAX_RAM_MB) * 100,
    [usedRamMb]
  );
  const freeRamMb = Math.max(0, MAX_RAM_MB - usedRamMb);
  const usedRatio = Math.min(100, usagePercent);
  const freeRatio = Math.max(0, 100 - usedRatio);

  const handleFixLagTrap = () => {
    if (isApplyingPatch) return;
    setIsApplyingPatch(true);
    const delayMs = 1000 + Math.floor(Math.random() * 1001);
    window.setTimeout(() => {
      rebootGame();
    }, delayMs);
  };

  return (
    <div className={style.app}>
      <div className={style.hero}>
        <div className={style.heroTitle}>System Performance Monitor</div>
        <div className={style.heroSubtitle}>
          Live memory pressure based on open windows.
        </div>
      </div>

      <div className={style.metricsGrid}>
        <div className={style.metricCard}>
          <div className={style.metricLabel}>RAM Usage</div>
          <div className={style.metricValue}>
            {formatMb(usedRamMb)} / {formatMb(MAX_RAM_MB)}
          </div>
          <div className={style.metricNote}>
            Starts at {formatMb(STARTING_RAM_MB)} + {windowCount} active window
            {windowCount === 1 ? '' : 's'} x {formatMb(RAM_PER_WINDOW_MB)}
          </div>
        </div>
        <div className={style.metricCard}>
          <div className={style.metricLabel}>Open Windows</div>
          <div className={style.metricValue}>{windowCount}</div>
          <div className={style.metricNote}>
            {windows.length} app windows + {popupCount} popups.
          </div>
        </div>
      </div>

      <div className={style.panel}>
        <div className={style.panelTitle}>Memory Composition</div>
        <div className={style.memoryBar}>
          <div
            className={style.memoryBase}
            style={{ width: `${usedRatio}%` }}
          />
          <div
            className={style.memoryWindowLoad}
            style={{ width: `${freeRatio}%` }}
          />
        </div>
        <div className={style.legend}>
          <span>
            <i className={style.legendBase} /> Used RAM
          </span>
          <span>
            <i className={style.legendWindow} /> Free RAM
          </span>
          <span>{usagePercent.toFixed(1)}% used</span>
        </div>
      </div>

      <div className={style.panel}>
        <div className={style.panelTitle}>Process Breakdown</div>
        <div className={style.list}>
          <div className={style.row}>
            <span>Window Overhead ({windowCount} total)</span>
            <span>{formatMb(usedRamMb)}</span>
          </div>
          <div className={style.row}>
            <span>Available RAM</span>
            <span>{formatMb(freeRamMb)}</span>
          </div>
          <div className={style.row}>
            <span>Maximum Capacity</span>
            <span>{formatMb(MAX_RAM_MB)}</span>
          </div>
        </div>
      </div>

      <div className={style.actions}>
        <button
          className={style.btn}
          disabled={isApplyingPatch}
          onClick={handleFixLagTrap}
          type="button"
        >
          {isApplyingPatch ? 'Applying patch...' : 'Optimize System'}
        </button>
        <button className={style.btn} onClick={closeWindow} type="button">
          Close
        </button>
      </div>
    </div>
  );
};

export default SystemPerformanceApp;
