import { h, FunctionComponent } from 'preact';
import { useEffect } from 'preact/hooks';

import { gameEventBus } from '@/game/events';
import { useGameState } from '@/game/state';
import DownloadDialog from './DownloadDialog';
import ProgressBarWindow from './ProgressBarWindow';

const IT_GUY_INTRO_TRIGGER_EVENT_ID = 'download:it_guy_intro:triggered';

const DownloadStageLayer: FunctionComponent = () => {
  const {
    activeNetVoiceCallId,
    flags,
    hasEventFired,
    markEventFired,
    rebootGame,
    setFlag,
    setStage,
    triggerNetVoiceCall,
  } = useGameState();

  const deliverGregZip = () => {
    setFlag('hasZipFile', true);
    setFlag('zipExtractionLevel', 1);
    setFlag('zipGarbageBatch', 0);
    setFlag('hasQueuedGregDrop', false);
  };

  useEffect(() => {
    const unsubscribeCallEnded = gameEventBus.on(
      'netvoice:call_ended',
      ({ callId }) => {
        if (callId === 'it_guy_intro') {
          deliverGregZip();
        }
      }
    );

    return unsubscribeCallEnded;
  }, [setFlag]);

  useEffect(() => {
    if (!flags.hasQueuedGregDrop) return;
    if (flags.hasZipFile) {
      setFlag('hasQueuedGregDrop', false);
      return;
    }
    if (activeNetVoiceCallId !== null) return;
    deliverGregZip();
  }, [activeNetVoiceCallId, flags.hasQueuedGregDrop, flags.hasZipFile, setFlag]);

  const handleStartDownload = () => {
    setFlag('hasDownloadStarted', true);
    setFlag('hasDownloadFailed', false);
    setStage('download');
  };

  const handleProgressFailure = () => {
    setFlag('hasDownloadFailed', true);
    setFlag('hasQueuedGregDrop', true);

    if (!hasEventFired(IT_GUY_INTRO_TRIGGER_EVENT_ID)) {
      markEventFired(IT_GUY_INTRO_TRIGGER_EVENT_ID);
      triggerNetVoiceCall('it_guy_intro');
    }
  };

  const handleCloseProgress = () => {
    setFlag('hasDownloadStarted', false);
    setFlag('hasDownloadFailed', false);
  };

  const showDownloadDialog =
    flags.hasUnlockedAttachment && !flags.hasDownloadStarted;
  const showProgressBar = flags.hasDownloadStarted && !flags.hasDownloadFailed;

  return (
    <div>
      {showDownloadDialog && (
        <DownloadDialog
          onReboot={rebootGame}
          onStartDownload={handleStartDownload}
        />
      )}
      {showProgressBar && (
        <ProgressBarWindow
          onClose={handleCloseProgress}
          onFailure={handleProgressFailure}
        />
      )}
    </div>
  );
};

export default DownloadStageLayer;
