import { h, FunctionComponent } from 'preact';
import { useEffect } from 'preact/hooks';

import { gameEventBus } from '../../game/events';
import { useGameState } from '../../game/state';
import DownloadDialog from './DownloadDialog';
import ProgressBarWindow from './ProgressBarWindow';

const IT_GUY_INTRO_TRIGGER_EVENT_ID = 'download:it_guy_intro:triggered';
const IT_GUY_WINRAR_LINK_CALL_TRIGGER_EVENT_ID =
  'download:it_guy_winrar_link:triggered';
const IT_GUY_WINRAR_LINK_EMAIL_EVENT_ID = 'download:it_guy_winrar_link:emailed';

const DownloadStageLayer: FunctionComponent = () => {
  const {
    flags,
    hasEventFired,
    markEventFired,
    rebootGame,
    setFlag,
    setStage,
    triggerNetVoiceCall,
  } = useGameState();

  useEffect(() => {
    const unsubscribeCallEnded = gameEventBus.on(
      'netvoice:call_ended',
      ({ callId }) => {
        if (callId === 'it_guy_intro') {
          setFlag('hasZipFile', true);
          setFlag('zipExtractionLevel', 1);
          setFlag('zipGarbageBatch', 0);

          if (!hasEventFired(IT_GUY_WINRAR_LINK_CALL_TRIGGER_EVENT_ID)) {
            markEventFired(IT_GUY_WINRAR_LINK_CALL_TRIGGER_EVENT_ID);
            window.setTimeout(() => {
              triggerNetVoiceCall('it_guy_winrar_link');
            }, 1200);
          }
        }

        if (callId === 'it_guy_angry_1') {
          setFlag('hasZipFile', true);
          setFlag('zipExtractionLevel', 1);
        }

        if (callId === 'it_guy_winrar_link') {
          if (!hasEventFired(IT_GUY_WINRAR_LINK_EMAIL_EVENT_ID)) {
            markEventFired(IT_GUY_WINRAR_LINK_EMAIL_EVENT_ID);
            setFlag('hasReceivedWinRarLinkEmail', true);
            const emailDing = new Audio('/audio/email_ding.mp3');
            emailDing.play().catch(() => undefined);
            gameEventBus.emit('email:delivered', {
              emailId: 'corp-winrar-download-link',
            });
          }
        }
      }
    );

    return unsubscribeCallEnded;
  }, [
    hasEventFired,
    markEventFired,
    setFlag,
    triggerNetVoiceCall,
  ]);

  const handleStartDownload = () => {
    setFlag('hasDownloadStarted', true);
    setFlag('hasDownloadFailed', false);
    setStage('download');
  };

  const handleProgressFailure = () => {
    setFlag('hasDownloadFailed', true);

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
