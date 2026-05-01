import { h, FunctionComponent } from 'preact';
import { AppProps } from '@/types/App';

import Countour from '@/components/shared/Countour/Countour';
import MenuBar from '@/components/shared/MenuBar/MenuBar';
import StatusBar from '@/components/shared/StatusBar/StatusBar';
import WindowContent from '@/components/shared/WindowContent/WindowContent';

import style from './QuickViewApp.module.css';

const QuickViewApp: FunctionComponent<AppProps> = ({
  workingFile,
}: AppProps) => (
  <WindowContent
    menu={<MenuBar options={['File', 'View', 'Help']} />}
    body={
      <Countour>
        <img className={style.picture} src={workingFile?.content ?? ''} />
      </Countour>
    }
    footer={
      <StatusBar textLeft="To edit, click Open File for Editing on the File menu." />
    }
  />
);

export default QuickViewApp;
