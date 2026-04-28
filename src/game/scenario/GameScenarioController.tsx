import { FunctionComponent } from 'preact';

import { useIntroCallStage } from '../../stages/intro/introCall';
import { usePeopleCallScheduler } from '../../stages/people/usePeopleCallScheduler';
import { useEmailDripScheduler } from '../../stages/email/useEmailDripScheduler';

const GameScenarioController: FunctionComponent = () => {
  useIntroCallStage();
  usePeopleCallScheduler();
  useEmailDripScheduler();

  return null;
};

export default GameScenarioController;
