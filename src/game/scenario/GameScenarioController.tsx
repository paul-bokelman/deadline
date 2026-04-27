import { FunctionComponent } from 'preact';

import { useIntroCallStage } from '../../stages/intro/introCall';
import { usePasswordHuntStage } from '../../stages/password/passwordHunt';

const GameScenarioController: FunctionComponent = () => {
  useIntroCallStage();
  usePasswordHuntStage();

  return null;
};

export default GameScenarioController;
