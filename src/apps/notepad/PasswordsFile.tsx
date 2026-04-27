import { h, FunctionComponent } from 'preact';

import Countour from '../../components/shared/Countour/Countour';
import MenuBar from '../../components/shared/MenuBar/MenuBar';
import WindowContent from '../../components/shared/WindowContent/WindowContent';
import { importantPasswordsFileContent } from '../../data/passwords';

const PasswordsFile: FunctionComponent = () => (
  <WindowContent
    menu={<MenuBar options={['File', 'Edit', 'Search', 'Help']} />}
    body={
      <Countour>
        <textarea
          autoComplete="off"
          // eslint-disable-next-line react/no-unknown-property
          readOnly
          spellcheck={false}
          style={{
            border: 'none',
            width: '100%',
            height: '100%',
            resize: 'none',
            padding: '4px',
            fontFamily: 'var(--font-family-sys)',
          }}
          value={importantPasswordsFileContent}
          wrap="off"
        />
      </Countour>
    }
  />
);

export default PasswordsFile;
