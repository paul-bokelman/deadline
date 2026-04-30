import { h, FunctionComponent } from 'preact';

import { AppId } from '../../../types/App';
import { FileSystemDir, FileSystemFile } from '../../../types/FileSystem';
import { appList } from '../../../data/appList';
import { OptionType } from '../MenuOption/MenuOption';
import Menu from '../Menu/Menu';

import style from './StartMenu.module.css';

interface Props {
  onSelect: (
    appId: AppId,
    workingDirPath?: FileSystemDir,
    workinFile?: FileSystemFile
  ) => void;
}

const appOption = (appId: AppId, label?: string): OptionType => ({
  label: label ?? appList[appId].name,
  iconId: appList[appId].iconId,
  value: { appId },
});

const programsOption: OptionType = {
  label: 'Programs',
  iconId: 'programs',
  value: '',
  subMenu: {
    isLarge: true,
    options: [
      [
        appOption('worldWideWeb'),
        appOption('corpMail', 'CorpMail'),
        appOption('personalMail', 'PersonalMail'),
        appOption('myComputer'),
        appOption('notepad'),
      ],
      [
        appOption('systemPerformance'),
        appOption('antiVirus'),
        appOption('fileConverter'),
        appOption('portal', 'CorpPortal'),
        appOption('timer', 'Project Deadline'),
      ],
      [
        {
          label: 'Games',
          iconId: 'gameSpider0',
          value: '',
          subMenu: {
            options: [
              [
                appOption('minesweeper'),
                appOption('blackjack', 'BlackJack 96'),
                appOption('leaderboard'),
                appOption('clickMeReset', 'FunWare'),
                appOption('clickMeReset', 'Click Me'),
              ],
            ],
          },
        },
        {
          label: 'Utilities',
          iconId: 'settings',
          value: '',
          subMenu: {
            options: [[appOption('draftDocumentLink'), appOption('winRarInstaller')]],
          },
        },
      ],
    ],
  },
};

const internetOption = appOption('worldWideWeb', 'Internet');
const mailOption = appOption('corpMail', 'Mail');
const performanceOption = appOption('systemPerformance');
const antivirusOption = appOption('antiVirus');
const shutdownOption = appOption('shutdown', 'Reboot...');

const StartMenu: FunctionComponent<Props> = ({ onSelect }: Props) => {
  const handleOnSelect = (
    value:
      | string
      | {
          appId: AppId;
          workingDir?: FileSystemDir;
          workingFile?: FileSystemFile;
        }
  ) => {
    if (typeof value === 'string') return;
    onSelect(value.appId, value.workingDir, value.workingFile);
  };

  return (
    <div className={style.startMenu}>
      <Menu
        onSelect={handleOnSelect}
        isLarge={true}
        options={[
          [
            programsOption,
            internetOption,
            mailOption,
            performanceOption,
            antivirusOption,
          ],
          [shutdownOption],
        ]}
      />
    </div>
  );
};

export default StartMenu;
