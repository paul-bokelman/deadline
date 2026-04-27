import { FunctionComponent } from 'preact';
import { useContext, useEffect, useRef } from 'preact/hooks';

import OpenWindowsContext from '../../context/OpenWindowsContext';
import { useGameState } from '../../game/state';

const Narrator: FunctionComponent = () => {
  const { windows } = useContext(OpenWindowsContext);
  const { flags } = useGameState();
  const debounceRef = useRef<number | null>(null);
  const lastSpokenTitleRef = useRef<string>('');

  useEffect(() => {
    return () => {
      if (debounceRef.current !== null) {
        window.clearTimeout(debounceRef.current);
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (!flags.narrator) return;

    const focusedWindow = windows.find((window) => window.hasFocus);
    const title = focusedWindow?.title ?? '';
    if (!title || title === lastSpokenTitleRef.current) return;

    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(title);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      lastSpokenTitleRef.current = title;
    }, 350);
  }, [windows, flags.narrator]);

  return null;
};

export default Narrator;
