import { h, FunctionComponent } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { useGameState } from '../../game/state';
import { CLIPPY_VIDEO_URL } from '../../data/urls';
import { playClippyTipSfx } from '../../utils/audio/sfx';

import style from './ClippyAssistant.module.css';

const CLIPPY_SRC = CLIPPY_VIDEO_URL;
const OUTPUT_CANVAS_WIDTH = 420;
const OUTPUT_CANVAS_HEIGHT = 420;
const CROP_PADDING_X_RATIO = 0.16;
const CROP_PADDING_Y_RATIO = 0.18;
const BUBBLE_INTERVAL_MS = 30_000;
const BUBBLE_VISIBLE_MS = 5_000;
const TYPEWRITER_CHAR_MS = 34;
const CLIPPY_MESSAGES = [
  'Press control s to save the game!',
  'Sometimes emails end up in the wrong place',
  'updating windows speeds up your system',
  'Fuck you',
  "I've seen your history you dirty pig",
  'Some calls are actually useful',
  "I did some terrible things back in 86'... you don't just end up as a desktop assistant...",
  '为了将你击垮，我愿做尽 切。',
];

const ClippyAssistant: FunctionComponent = () => {
  const { rebootGame } = useGameState();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const hasCanvasAccessRef = useRef(true);
  const [useFallbackVideo, setUseFallbackVideo] = useState(false);
  const [speechMessage, setSpeechMessage] = useState<string | null>(null);
  const [typedSpeechMessage, setTypedSpeechMessage] = useState('');

  useEffect(() => {
    let hideTimeoutId = 0;
    let previousIndex = -1;

    const showBubble = () => {
      let index = Math.floor(Math.random() * CLIPPY_MESSAGES.length);
      if (CLIPPY_MESSAGES.length > 1 && index === previousIndex) {
        index = (index + 1) % CLIPPY_MESSAGES.length;
      }
      previousIndex = index;
      playClippyTipSfx();
      setSpeechMessage(CLIPPY_MESSAGES[index] ?? null);
      window.clearTimeout(hideTimeoutId);
      hideTimeoutId = window.setTimeout(() => {
        setSpeechMessage(null);
      }, BUBBLE_VISIBLE_MS);
    };

    const intervalId = window.setInterval(showBubble, BUBBLE_INTERVAL_MS);
    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(hideTimeoutId);
    };
  }, []);

  useEffect(() => {
    if (!speechMessage) {
      setTypedSpeechMessage('');
      return;
    }

    setTypedSpeechMessage('');
    let charIndex = 0;
    const intervalId = window.setInterval(() => {
      charIndex += 1;
      setTypedSpeechMessage(speechMessage.slice(0, charIndex));
      if (charIndex >= speechMessage.length) {
        window.clearInterval(intervalId);
      }
    }, TYPEWRITER_CHAR_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [speechMessage]);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) {
      setUseFallbackVideo(true);
      return;
    }
    context.imageSmoothingEnabled = false;
    const workCanvas = document.createElement('canvas');
    const workContext = workCanvas.getContext('2d', {
      willReadFrequently: true,
    });
    if (!workContext) {
      setUseFallbackVideo(true);
      return;
    }
    workContext.imageSmoothingEnabled = false;
    canvas.width = OUTPUT_CANVAS_WIDTH;
    canvas.height = OUTPUT_CANVAS_HEIGHT;

    const drawFrame = () => {
      if (!video.videoWidth || !video.videoHeight) {
        rafRef.current = window.requestAnimationFrame(drawFrame);
        return;
      }
      if (
        workCanvas.width !== video.videoWidth ||
        workCanvas.height !== video.videoHeight
      ) {
        workCanvas.width = video.videoWidth;
        workCanvas.height = video.videoHeight;
      }

      workContext.clearRect(0, 0, workCanvas.width, workCanvas.height);
      workContext.drawImage(video, 0, 0, workCanvas.width, workCanvas.height);

      if (hasCanvasAccessRef.current) {
        try {
          const frame = workContext.getImageData(
            0,
            0,
            workCanvas.width,
            workCanvas.height
          );
          const pixels = frame.data;
          let minX = workCanvas.width;
          let minY = workCanvas.height;
          let maxX = -1;
          let maxY = -1;

          for (let i = 0; i < pixels.length; i += 4) {
            const r = pixels[i] ?? 0;
            const g = pixels[i + 1] ?? 0;
            const b = pixels[i + 2] ?? 0;
            const pixelIndex = i / 4;
            const x = pixelIndex % workCanvas.width;
            const y = Math.floor(pixelIndex / workCanvas.width);
            const isBlueBackdrop =
              b > 104 && g > 70 && r < 125 && b > r + 25 && g > r + 4;

            if (isBlueBackdrop) {
              pixels[i + 3] = 0;
              continue;
            }

            // Reduce blue edge spill so keyed border looks cleaner.
            if (b > g + 10 && b > r + 6) {
              pixels[i + 2] = Math.max(g, r + 8);
            }

            const alpha = pixels[i + 3] ?? 0;
            if (alpha < 35) continue;
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }

          workContext.putImageData(frame, 0, 0);
          context.clearRect(0, 0, canvas.width, canvas.height);

          if (maxX >= minX && maxY >= minY) {
            const sourceWidth = maxX - minX + 1;
            const sourceHeight = maxY - minY + 1;
            const padX = sourceWidth * CROP_PADDING_X_RATIO;
            const padY = sourceHeight * CROP_PADDING_Y_RATIO;
            const sx = Math.max(0, minX - padX);
            const sy = Math.max(0, minY - padY);
            const sw = Math.min(workCanvas.width - sx, sourceWidth + padX * 2);
            const sh = Math.min(
              workCanvas.height - sy,
              sourceHeight + padY * 2
            );
            const fitScale = Math.min(canvas.width / sw, canvas.height / sh);
            const dw = sw * fitScale;
            const dh = sh * fitScale;
            const dx = (canvas.width - dw) / 2;
            const dy = (canvas.height - dh) / 2;
            context.imageSmoothingEnabled = false;
            context.drawImage(workCanvas, sx, sy, sw, sh, dx, dy, dw, dh);
          }
        } catch (error) {
          void error;
          hasCanvasAccessRef.current = false;
          setUseFallbackVideo(true);
        }
      }

      rafRef.current = window.requestAnimationFrame(drawFrame);
    };

    const start = () => {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = window.requestAnimationFrame(drawFrame);
      video.play().catch(() => {
        setUseFallbackVideo(true);
      });
    };

    video.addEventListener('canplay', start);
    video.addEventListener('loadedmetadata', start);
    video.addEventListener('play', start);
    start();

    return () => {
      video.removeEventListener('canplay', start);
      video.removeEventListener('loadedmetadata', start);
      video.removeEventListener('play', start);
      window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div aria-hidden className={style.layer}>
      <div className={style.wander}>
        <div className={style.bob}>
          <div className={style.shadow} />
          {speechMessage && (
            <div className={style.speechBubble}>
              <span>{typedSpeechMessage}</span>
            </div>
          )}
          <button
            className={style.clickTarget}
            onClick={rebootGame}
            title="Reboot via Clippy"
            type="button"
          >
            <div className={style.frame}>
              <video
                autoPlay
                className={style.source}
                crossOrigin="anonymous"
                loop
                muted
                playsInline
                ref={videoRef}
                src={CLIPPY_SRC}
              />
              <canvas
                className={`${style.clipCanvas} ${
                  useFallbackVideo ? style.isHidden : ''
                }`}
                ref={canvasRef}
              />
              <video
                autoPlay
                className={`${style.clipFallback} ${
                  useFallbackVideo ? '' : style.isHidden
                }`}
                loop
                muted
                playsInline
                src={CLIPPY_SRC}
              />
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClippyAssistant;
