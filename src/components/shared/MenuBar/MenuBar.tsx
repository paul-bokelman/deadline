import { h, FunctionComponent } from 'preact';
import { useI18n } from '../../../system/i18n';

import style from './MenuBar.module.css';

interface Props {
  options: string[];
}

const MenuBar: FunctionComponent<Props> = ({ options }: Props) => {
  const { t } = useI18n();

  return (
    <ul className={style.menuBar}>
      {options.map((option) => (
        <li className={style.menuBarOption} key={option}>
          <div className={style.menuBarOptionLabel}>
            {t(`menu.${option}`, option)}
          </div>
        </li>
      ))}
    </ul>
  );
};

export default MenuBar;
