// Generic procedure: callers may pass concrete-typed callbacks, so we widen
// to a permissive callable signature here. This is the one place we lean on
// `any` to keep the helper general; consumers stay strongly typed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Procedure = (...args: any[]) => void;

export const debounce = <P extends Procedure>(func: P, time: number): P => {
  let timeout: number;
  return ((...args: Parameters<P>) => {
    if (timeout) window?.clearTimeout(timeout);
    timeout = window?.setTimeout(() => func(...args), time);
  }) as P;
};

// Debounce-like function that relies on requestAnimationFrame.
export const debounceWithRequestAnimationFrame = <P extends Procedure>(
  func: P
): P => {
  let animationFrame: number;
  return ((...args: Parameters<P>) => {
    if (animationFrame) window?.cancelAnimationFrame(animationFrame);
    animationFrame = window?.requestAnimationFrame(() => func(...args));
  }) as P;
};
