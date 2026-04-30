import { h, FunctionComponent } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

import style from './Dropdown.module.css';

interface Option {
  disabled?: boolean;
  label: string;
  value: string;
}

interface Props {
  disabled?: boolean;
  emptyLabel?: string;
  id: string;
  label?: string;
  options: Option[];
  onChange: (value: string) => void;
  selected: string;
}

const Dropdown: FunctionComponent<Props> = ({
  disabled = false,
  emptyLabel = 'No options available',
  id,
  label = '',
  onChange,
  options,
  selected,
}: Props) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const hasOptions = options.length > 0;
  const isDisabled = disabled || !hasOptions;

  const selectedOption = useMemo(
    () => options.find((option) => option.value === selected) ?? null,
    [options, selected]
  );

  useEffect(() => {
    if (!isOpen || isDisabled) return undefined;
    const onPointerDown = (event: PointerEvent): void => {
      const target = event.target as Node | null;
      if (!target) return;
      if (rootRef.current?.contains(target)) return;
      setIsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isDisabled, isOpen]);

  useEffect(() => {
    if (!isDisabled || !isOpen) return;
    setIsOpen(false);
  }, [isDisabled, isOpen]);

  return (
    <div className={style.root} ref={rootRef}>
      {label && <label htmlFor={id}>{label}</label>}
      <button
        aria-controls={`${id}-menu`}
        aria-expanded={isOpen}
        className={style.trigger}
        disabled={isDisabled}
        id={id}
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span className={style.triggerLabel}>
          {selectedOption?.label ?? (hasOptions ? '(select)' : emptyLabel)}
        </span>
        <span className={style.triggerArrow}>▼</span>
      </button>
      {isOpen && !isDisabled && (
        <div className={style.menu} id={`${id}-menu`} role="listbox">
          {options.map((option) => {
            const isSelected = option.value === selected;
            return (
              <button
                className={`${style.option} ${
                  isSelected ? style.optionSelected : ''
                }`}
                disabled={option.disabled}
                key={`${id}-${option.value}`}
                onClick={() => {
                  if (option.disabled) return;
                  onChange(option.value);
                  setIsOpen(false);
                }}
                role="option"
                type="button"
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
