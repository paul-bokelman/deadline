import { h, FunctionComponent, ComponentChildren } from 'preact';

import style from './FieldRow.module.css';

interface Props {
  children: ComponentChildren;
  stacked?: boolean;
}

const FieldRow: FunctionComponent<Props> = ({
  children = null,
  stacked = false,
}: Props) => (
  <div className={stacked ? style.fieldRow : style.fieldRowStacked}>
    {children}
  </div>
);

export default FieldRow;
