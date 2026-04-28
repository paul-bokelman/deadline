import { h, FunctionComponent, RefObject } from 'preact';

import { IconId } from '../../../types/Icon';
import Button from '../Button/Button';
import Icon from '../Icon/Icon';
import style from './TitleBar.module.css';

export interface Props {
  iconId?: IconId;
  isInactive?: boolean;
  isMaximized?: boolean;
  onClickMinimize?: () => void;
  onClickMaximize?: () => void;
  onClickRestore?: () => void;
  onClickHelp?: () => void;
  onClickClose: () => void;
  onDblClickTitleBar?: () => void;
  showCloseButton?: boolean;
  showMaximizeButton?: boolean;
  innerRef?: RefObject<HTMLDivElement>;
  title: string;
}

const TitleBar: FunctionComponent<Props> = ({
  iconId,
  isInactive = false,
  isMaximized = false,
  onClickMinimize,
  onClickMaximize,
  onClickRestore,
  onClickHelp,
  onClickClose,
  onDblClickTitleBar,
  showCloseButton = true,
  showMaximizeButton = true,
  innerRef,
  title,
}: Props) => {
  const handleOnMouseDownButton = (e: MouseEvent | TouchEvent) => {
    e.stopPropagation();
  };

  const handleOnMouseDownCloseButton = (e: MouseEvent | TouchEvent) => {
    // Close immediately on press so moving windows/popups still close reliably.
    e.preventDefault();
    e.stopPropagation();
    onClickClose();
  };

  return (
    <div
      className={`${style.titleBar} ${isInactive ? style.inactive : ''}`}
      onDblClick={onDblClickTitleBar}
      ref={innerRef}
    >
      <div className={style.titleBarIcon}>
        {!!iconId && <Icon iconId={iconId} />}
      </div>
      <div className={style.titleBarText}>{title}</div>
      <div className={style.titleBarControls}>
        {onClickMinimize && (
          <Button
            label={<div className={style.minimize} />}
            onClick={onClickMinimize}
            onMouseDown={handleOnMouseDownButton}
          />
        )}
        {showMaximizeButton && !isMaximized && (
          <Button
            disabled={!onClickMaximize}
            label={<div className={style.maximize} />}
            onClick={onClickMaximize}
            onMouseDown={handleOnMouseDownButton}
          />
        )}
        {isMaximized && onClickRestore && (
          <Button
            label={<div className={style.restore} />}
            onClick={onClickRestore}
            onMouseDown={handleOnMouseDownButton}
          />
        )}
        {onClickHelp && (
          <Button onClick={onClickHelp} onMouseDown={handleOnMouseDownButton} />
        )}
        {showCloseButton && (
          <Button
            label={<div className={style.close} />}
            onClick={onClickClose}
            onMouseDown={handleOnMouseDownCloseButton}
          />
        )}
      </div>
    </div>
  );
};

export default TitleBar;
