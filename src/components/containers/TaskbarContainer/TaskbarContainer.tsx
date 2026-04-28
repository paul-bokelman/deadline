import { h, FunctionComponent } from 'preact';
import { useContext, useEffect, useState } from 'preact/hooks';

import OpenWindowsContext from '../../../context/OpenWindowsContext';
import Taskbar from '../../shared/Taskbar/Taskbar';
import { gameEventBus } from '../../../game/events';

interface DeadlineTabState {
  isActive: boolean;
  isVisible: boolean;
  label: string;
}

const TaskbarContainer: FunctionComponent = () => {
  const {
    focusOnWindow,
    minimizeWindow,
    openApp,
    unMinimizeWindow,
    windows,
  } = useContext(OpenWindowsContext);
  const [deadlineTab, setDeadlineTab] = useState<DeadlineTabState>({
    isActive: true,
    isVisible: false,
    label: 'Project Deadline',
  });

  useEffect(() => {
    const unsubscribe = gameEventBus.on('windows_update:tab_state', (payload) => {
      setDeadlineTab({
        isActive: payload.isActive,
        isVisible: payload.isVisible,
        label: payload.label,
      });
    });
    return unsubscribe;
  }, []);

  return (
    <Taskbar
      focusOnWindow={focusOnWindow}
      minimizeWindow={minimizeWindow}
      openApp={openApp}
      projectDeadlineTab={
        deadlineTab.isVisible
          ? {
              isActive: deadlineTab.isActive,
              label: deadlineTab.label,
              onClick: () => gameEventBus.emit('windows_update:restore', {}),
            }
          : null
      }
      unMinimizeWindow={unMinimizeWindow}
      windows={windows}
    />
  );
};

export default TaskbarContainer;
