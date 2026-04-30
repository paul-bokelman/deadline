import { lockMasterMute } from './masterVolume';
import {
  BluescreenSfxController,
  createBluescreenSfxController,
} from './osSfx';

let activeBsodCount = 0;
let releaseMasterMute: (() => void) | null = null;
let bluescreenSfxController: BluescreenSfxController | null = null;

const pauseAllDocumentMedia = (): void => {
  const mediaElements = Array.from(
    document.querySelectorAll('audio, video')
  ) as HTMLMediaElement[];
  mediaElements.forEach((mediaElement) => {
    mediaElement.pause();
  });
};

export const enterBsodAudioMode = (): void => {
  activeBsodCount += 1;
  if (activeBsodCount > 1) return;

  pauseAllDocumentMedia();
  document.body.classList.add('bsod-active');
  releaseMasterMute = lockMasterMute();
  bluescreenSfxController = createBluescreenSfxController();
  bluescreenSfxController.start();
};

export const exitBsodAudioMode = (): void => {
  activeBsodCount = Math.max(0, activeBsodCount - 1);
  if (activeBsodCount > 0) return;

  bluescreenSfxController?.stop();
  bluescreenSfxController = null;
  releaseMasterMute?.();
  releaseMasterMute = null;
  document.body.classList.remove('bsod-active');
};
