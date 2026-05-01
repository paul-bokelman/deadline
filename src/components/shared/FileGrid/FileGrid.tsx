import { h, FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import { ShellItem } from '@/types/Shell';

import Icon from '../Icon/Icon';

import style from './FileGrid.module.css';

interface Props {
  direction?: 'column' | 'row';
  files: ShellItem[];
  isDraggable?: boolean;
  onClick: (e: MouseEvent) => void;
  onClickFile: (file: ShellItem, e: MouseEvent) => void;
  onDblClickFile: (file: ShellItem, e: MouseEvent) => void;
  onMoveFile?: (draggedFileId: string, targetFileId: string) => void;
  textColor?: 'inherit' | 'white';
}

const FileGrid: FunctionComponent<Props> = ({
  direction = 'row',
  files,
  isDraggable = false,
  onClick,
  onClickFile,
  onDblClickFile,
  onMoveFile,
  textColor = 'inherit',
}: Props) => {
  const [draggedFileId, setDraggedFileId] = useState<string | null>(null);

  const handleOnClickFile = (e: MouseEvent, file: ShellItem) => {
    e.preventDefault();
    e.stopPropagation();
    onClickFile(file, e);
  };

  const handleOnDblClickFile = (e: MouseEvent, file: ShellItem) => {
    e.preventDefault();
    e.stopPropagation();
    onDblClickFile(file, e);
  };

  const handleOnDragStart = (e: DragEvent, file: ShellItem) => {
    if (!isDraggable) return;
    setDraggedFileId(file.id);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', file.id);
    }
  };

  const handleOnDragOver = (e: DragEvent) => {
    if (!isDraggable) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
  };

  const handleOnDrop = (e: DragEvent, file: ShellItem) => {
    if (!isDraggable || !onMoveFile) return;
    e.preventDefault();

    const movedFileId =
      e.dataTransfer?.getData('text/plain') || draggedFileId || '';
    if (!movedFileId || movedFileId === file.id) return;

    onMoveFile(movedFileId, file.id);
    setDraggedFileId(null);
  };

  return (
    <div
      className={style.fileGrid}
      onClick={onClick}
      style={{ flexDirection: direction }}
    >
      {files.map((file, i) => (
        <div
          className={`${style.file} ${file.hasFocus ? style.focus : ''} ${
            file.hasSoftFocus ? style.softFocus : ''
          }`}
          draggable={isDraggable}
          onDragEnd={() => setDraggedFileId(null)}
          onDragOver={handleOnDragOver}
          onDragStart={(e) => handleOnDragStart(e, file)}
          onDrop={(e) => handleOnDrop(e, file)}
          key={i + file.id}
          style={{ color: textColor }}
        >
          <div
            className={style.fileIcon}
            onClick={(e) => handleOnClickFile(e, file)}
            onDblClick={(e) => handleOnDblClickFile(e, file)}
          >
            <Icon iconId={file.iconId} size={32} />
          </div>
          <div
            className={style.fileLabel}
            onClick={(e) => handleOnClickFile(e, file)}
            onDblClick={(e) => handleOnDblClickFile(e, file)}
          >
            {file.name}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FileGrid;
