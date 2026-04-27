import { FunctionComponent } from 'preact';

import { useIntroCallStage } from '../../stages/intro/introCall';

const GameScenarioController: FunctionComponent = () => {
  useIntroCallStage();

  return null;
};

export default GameScenarioController;
