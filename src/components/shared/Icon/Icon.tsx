import { h, FunctionComponent } from 'preact';

import { IconId } from '../../../types/Icon';
import { iconList } from '../../../data/iconList';

import style from './Icon.module.css';

interface Props {
  iconId?: IconId;
  size?: 8 | 16 | 24 | 32;
}

const Icon: FunctionComponent<Props> = ({
  iconId = 'briefcase',
  size = 16,
}: Props) => {
  const iconUrls = iconList[iconId];
  const src =
    iconUrls[size] ??
    iconUrls[24] ??
    iconUrls[32] ??
    iconUrls[16] ??
    iconUrls[8] ??
    '';
  return (
    <img
      className={style.icon}
      src={src}
      style={{ height: `${size}px`, width: `${size}px` }}
    />
  );
};

export default Icon;
