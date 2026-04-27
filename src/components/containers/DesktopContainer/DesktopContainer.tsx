import { h, FunctionComponent } from 'preact';
import { useContext, useEffect } from 'preact/hooks';

import OpenWindowsContext from '../../../context/OpenWindowsContext';
import { gameEventBus } from '../../../game/events';
import Desktop from '../../shared/Desktop/Desktop';

const DesktopContainer: FunctionComponent = () => {
  const { openApp } = useContext(OpenWindowsContext);

  useEffect(() => {
    gameEventBus.emit('boot:complete', { at: Date.now() });
  }, []);

  return <Desktop openApp={openApp} />;
};

export default DesktopContainer;
