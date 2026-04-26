import { h, FunctionComponent, Fragment } from 'preact';

import style from './Textbox.module.css';

interface Props {
  cols?: number;
  disabled?: boolean;
  id: string;
  label: string;
  onChange: (e: Event) => void;
  rows?: number;
  type?: 'text' | 'textarea';
  value: string;
}

const Textbox: FunctionComponent<Props> = ({
  cols,
  disabled = false,
  id,
  label,
  onChange,
  rows,
  type = 'text',
  value,
}: Props) => (
  <Fragment>
    <label htmlFor={id}>{label}</label>
    {type === 'textarea' ? (
      <textarea
        className={style.textbox}
        cols={cols}
        disabled={disabled}
        id={id}
        onChange={onChange}
        rows={rows}
        value={value}
      />
    ) : (
      <input
        className={style.textbox}
        disabled={disabled}
        id={id}
        onChange={onChange}
        type={type}
        value={value}
      />
    )}
  </Fragment>
);

export default Textbox;
