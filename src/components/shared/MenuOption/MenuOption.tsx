import { h, FunctionComponent } from 'preact';
import { useRef, useState } from 'preact/hooks';

import { AppId } from '@/types/App';
import { FileSystemDir, FileSystemFile } from '@/types/FileSystem';
import { IconId } from '@/types/Icon';
import Icon from '../Icon/Icon';
import Menu from '../Menu/Menu';

import style from './MenuOption.module.css';

export type OptionType = {
  disabled?: boolean;
  iconId?: IconId;
  label: string;
  subMenu?: { isLarge?: boolean; options: OptionType[][] };
  value:
    | { appId: AppId; workingDir?: FileSystemDir; workingFile?: FileSystemFile }
    | string;
};

export type Props = OptionType & {
  isLarge?: boolean;
  onSelect: (value: OptionType['value'], e: MouseEvent) => void;
};

const MenuOption: FunctionComponent<Props> = ({
  // disabled,
  iconId,
  isLarge = false,
  onSelect,
  label,
  subMenu,
  value,
}: Props) => {
  const menuOptionRef = useRef<HTMLDivElement>(null);
  const subMenuRef = useRef<HTMLDivElement>(null);
  const [openLeft, setOpenLeft] = useState(false);

  const handleOnClick = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(value, e);
  };

  const updateSubMenuPlacement = () => {
    if (!subMenu) return;
    window.requestAnimationFrame(() => {
      const optionRect = menuOptionRef.current?.getBoundingClientRect();
      const subMenuWidth = subMenuRef.current?.offsetWidth;
      if (!optionRect || !subMenuWidth) return;

      const projectedRightEdge = optionRect.right + subMenuWidth - 3;
      const overflowRight = projectedRightEdge > window.innerWidth;
      setOpenLeft(overflowRight);
    });
  };

  return (
    <div
      ref={menuOptionRef}
      className={`${style.menuOption} ${isLarge ? style.large : ''}`}
      onClick={handleOnClick}
      onMouseEnter={updateSubMenuPlacement}
    >
      <div className={style.menuOptionIcon}>
        {!!iconId && <Icon iconId={iconId} size={isLarge ? 24 : 16} />}
      </div>
      <div className={style.menuOptionLabel}>{label}</div>
      <div className={style.menuOptionArrow}>
        {!!subMenu && <Icon iconId="menuArrow" size={8} />}
      </div>
      {!!subMenu && (
        <div
          ref={subMenuRef}
          className={`${style.menuOptionSubMenu} ${
            openLeft ? style.menuOptionSubMenuLeft : ''
          }`}
        >
          <Menu
            isLarge={subMenu.isLarge}
            onSelect={onSelect}
            options={subMenu.options}
          />
        </div>
      )}
    </div>
  );
};

export default MenuOption;
