import { FunctionComponent } from 'preact';

import { useIntroCallStage } from '@/stages/intro/introCall';
import { usePeopleCallScheduler } from '@/stages/people/usePeopleCallScheduler';
import { useDeadlineChaosSequence } from '@/stages/people/useDeadlineChaosSequence';
import { useEmailDripScheduler } from '@/stages/email/useEmailDripScheduler';
import { useFlyVoiceLineScheduler } from '@/stages/fly/useFlyVoiceLineScheduler';

const GameScenarioController: FunctionComponent = () => {
  useIntroCallStage();
  usePeopleCallScheduler();
  useDeadlineChaosSequence();
  useEmailDripScheduler();
  useFlyVoiceLineScheduler();

  return null;
};

export default GameScenarioController;
