import { h, FunctionComponent } from 'preact';
import { useEffect } from 'preact/hooks';

import { gameEventBus } from '../../game/events';
import { useGameState } from '../../game/state';
import DownloadDialog from './DownloadDialog';
import ProgressBarWindow from './ProgressBarWindow';

const IT_GUY_INTRO_TRIGGER_EVENT_ID = 'download:it_guy_intro:triggered';

const DownloadStageLayer: FunctionComponent = () => {
  const {
    flags,
    hasEventFired,
    markEventFired,
    resetGame,
    setFlag,
    setStage,
    triggerSkypeCall,
  } = useGameState();

  useEffect(() => {
    const unsubscribeCallEnded = gameEventBus.on(
      'skype:call_ended',
      ({ callId }) => {
        if (callId === 'it_guy_intro') {
          setFlag('hasZipFile', true);
          setFlag('zipExtractionLevel', 1);
          setFlag('zipGarbageBatch', 0);
        }

        if (callId === 'it_guy_angry_1') {
          setFlag('hasZipFile', true);
          setFlag('zipExtractionLevel', 1);
        }
      }
    );

    return unsubscribeCallEnded;
  }, [setFlag]);

  const handleStartDownload = () => {
    setFlag('hasDownloadStarted', true);
    setFlag('hasDownloadFailed', false);
    setStage('download');
  };

  const handleProgressFailure = () => {
    setFlag('hasDownloadFailed', true);

    if (!hasEventFired(IT_GUY_INTRO_TRIGGER_EVENT_ID)) {
      markEventFired(IT_GUY_INTRO_TRIGGER_EVENT_ID);
      triggerSkypeCall('it_guy_intro');
    }
  };

  const showDownloadDialog =
    flags.hasUnlockedAttachment && !flags.hasDownloadStarted;
  const showProgressBar = flags.hasDownloadStarted && !flags.hasDownloadFailed;

  return (
    <div>
      {showDownloadDialog && (
        <DownloadDialog
          onReboot={resetGame}
          onStartDownload={handleStartDownload}
        />
      )}
      {showProgressBar && (
        <ProgressBarWindow onFailure={handleProgressFailure} />
      )}
    </div>
  );
};

export default DownloadStageLayer;
