import { useEffect, useState } from 'preact/hooks';

import { gameEventBus } from '../../game/events';

export const useIntrusivePopupCount = (): number => {
  const [popupCount, setPopupCount] = useState(0);

  useEffect(() => {
    const unsubscribeCountChanged = gameEventBus.on(
      'popup:count_changed',
      ({ count }) => {
        setPopupCount(Math.max(0, count));
      }
    );
    const unsubscribeRebooted = gameEventBus.on('game:rebooted', () => {
      setPopupCount(0);
    });
    return () => {
      unsubscribeCountChanged();
      unsubscribeRebooted();
    };
  }, []);

  return popupCount;
};
