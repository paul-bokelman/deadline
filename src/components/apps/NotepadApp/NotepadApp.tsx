import { h, FunctionComponent } from 'preact';

import { AppProps } from '../../../types/App';
import Countour from '../../shared/Countour/Countour';
import MenuBar from '../../shared/MenuBar/MenuBar';
import WindowContent from '../../shared/WindowContent/WindowContent';

import style from './NotepadApp.module.css';

const DEFAULT_NOTES_TEXT = `todo:
- get new job
- call back ex-wife
- appear at court tomorrow (IMPORTANT)`;

const NotepadApp: FunctionComponent<AppProps> = ({ workingFile }: AppProps) => {
  const textContent = workingFile ? workingFile.content : DEFAULT_NOTES_TEXT;

  return (
    <WindowContent
      menu={<MenuBar options={['File', 'Edit', 'Search', 'Help']} />}
      body={
        <Countour>
          <textarea
            autoComplete="off"
            className={style.textarea}
            // eslint-disable-next-line react/no-unknown-property
            spellcheck={false}
            wrap="off"
          >
            {textContent}
          </textarea>
        </Countour>
      }
    />
  );
};

export default NotepadApp;
