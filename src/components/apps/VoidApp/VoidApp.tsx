import { h, FunctionComponent } from 'preact';

import { AppProps } from '@/types/App';
import Button from '@/components/shared/Button/Button';
import Icon from '@/components/shared/Icon/Icon';
import WindowContent from '@/components/shared/WindowContent/WindowContent';

import style from './VoidApp.module.css';

const VoidApp: FunctionComponent<AppProps> = ({ closeWindow }: AppProps) => {
  return (
    <WindowContent
      body={
        <div className={style.voidApp}>
          <div className={style.message}>
            <Icon iconId={'warning'} size={32} />
            <div>
              <p>
                Sadly, the application you requested is currently unavailable.
              </p>
              <p>
                Microsoft&apos;s engineers are hard at work to bring it back as
                soon as possible.
              </p>
              <p>Thanks for you understanding.</p>
            </div>
          </div>
          <Button hasFocus label={'Understood'} onClick={closeWindow} />
        </div>
      }
    />
  );
};

export default VoidApp;
