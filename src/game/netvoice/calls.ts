export type NetVoiceCallId =
  | 'intro_assistant'
  | 'harold_first_call'
  | 'harold_second_call'
  | 'alice_halfway'
  | 'alice_greg_warning'
  | 'mom_bailout_1'
  | 'mom_bailout_2'
  | 'mom_www_issues'
  | 'mom_maryjane'
  | 'greg_3rd_0'
  | 'it_guy_intro'
  | 'assistant_portal_intro'
  | 'it_guy_cleanup'
  | 'boss_intro'
  | 'boss_deadline_reminder'
  | 'boss_post_bluescreen'
  | 'computer_heartless'
  | 'fly_random';

export type NetVoiceCallerId =
  | 'alice'
  | 'greg'
  | 'boss'
  | 'mom'
  | 'computer'
  | 'harold'
  | 'fly';

export interface NetVoiceCaller {
  id: NetVoiceCallerId;
  name: string;
  username?: string;
  avatar: string;
  role: string;
  warning?: string;
  address: string;
}

export const netVoiceCallers: Record<NetVoiceCallerId, NetVoiceCaller> = {
  alice: {
    id: 'alice',
    name: 'Alice',
    username: '@guantummy1_11',
    avatar: '/audio/netvoice/alice_profile.png',
    role: 'Assistant',
    warning: "Don't flirt, she knows Grace and WILL tell (like last time)",
    address: '10.0.0.7',
  },
  greg: {
    id: 'greg',
    name: 'Greg',
    username: '@coxial_cable_slayer4',
    avatar: '/audio/netvoice/greg_profile.png',
    role: 'IT Guy',
    warning: 'He gives me the creeps....',
    address: '192.168.1.42',
  },
  boss: {
    id: 'boss',
    name: 'Boss',
    avatar: '/assets/images/interface/msg_warning-0.png',
    role: 'Manager',
    address: '10.0.0.1',
  },
  harold: {
    id: 'harold',
    name: 'Harold',
    username: '@haroldhartsbabes92',
    avatar: '/audio/netvoice/harold_profile.png',
    role: 'Boss',
    warning: 'DO NOT PISS OFF!!!',
    address: '10.0.0.92',
  },
  mom: {
    id: 'mom',
    name: 'Mom',
    username: '@julia45ALE',
    avatar: '/audio/netvoice/mom_profile.png',
    role: 'Family',
    warning: 'Please do not answer this at work',
    address: 'mom@dialup.local',
  },
  computer: {
    id: 'computer',
    name: 'Computer',
    avatar: '/audio/netvoice/computer_profile.png',
    role: '',
    warning:
      '??????????????????????????????\n??????????????????????????????\n??????????????????????????????\n??????????????????????????????',
    address: '127.0.0.1',
  },
  fly: {
    id: 'fly',
    name: 'fly',
    username: '@flyby',
    avatar: '/audio/netvoice/fly_profile.png',
    role: 'buzzes',
    address: 'fly@buzz.local',
  },
};

export interface NetVoiceCallDefinition {
  id: NetVoiceCallId;
  callerId: NetVoiceCallerId;
  audioPath: string;
  dialogText: string;
  autoTriggerNextStage?: boolean;
}

export const netVoiceCalls: Record<NetVoiceCallId, NetVoiceCallDefinition> = {
  intro_assistant: {
    id: 'intro_assistant',
    callerId: 'alice',
    audioPath: '/audio/netvoice/people/alice-intro.mp3',
    dialogText:
      "Hey, listen, you need to download the Q3 report and send it to the boss before deadline. It's in your email. Heads up - my email address isn't my name, it's an ID number, so don't fall for impersonators. And whatever you do, do NOT reboot the computer - you'll lose everything. Good luck.",
    autoTriggerNextStage: false,
  },
  harold_first_call: {
    id: 'harold_first_call',
    callerId: 'harold',
    audioPath: '/audio/netvoice/people/harold-2m-complete.mp3',
    dialogText: 'Harold first call.',
    autoTriggerNextStage: false,
  },
  harold_second_call: {
    id: 'harold_second_call',
    callerId: 'harold',
    audioPath: '/audio/netvoice/people/harold-deadline-complete.mp3',
    dialogText: 'Harold deadline call.',
    autoTriggerNextStage: false,
  },
  alice_halfway: {
    id: 'alice_halfway',
    callerId: 'alice',
    audioPath: '/audio/netvoice/people/alice-halfway.mp3',
    dialogText: 'Deadline halfway check-in from Alice.',
    autoTriggerNextStage: false,
  },
  alice_greg_warning: {
    id: 'alice_greg_warning',
    callerId: 'alice',
    audioPath: '/audio/netvoice/people/alice-greg-warning.mp3',
    dialogText: 'Alice warning call.',
    autoTriggerNextStage: false,
  },
  mom_bailout_1: {
    id: 'mom_bailout_1',
    callerId: 'mom',
    audioPath: '/audio/netvoice/people/mom-1st-0.mp3',
    dialogText:
      'Hey honey uhm… I noticed you have no money in your bank account…. You really need to manage your money better your 43. Me and dad are pretty disappointed in you. Im going to send over $100 to make sure your alright but make sure that lasts\n\n[NOTE: change audio, mom calls and gives you $100]',
    autoTriggerNextStage: false,
  },
  mom_bailout_2: {
    id: 'mom_bailout_2',
    callerId: 'mom',
    audioPath: '/audio/netvoice/people/mom-2nd-0.mp3',
    dialogText:
      'ok this is getting ridiculous. I just gave you money a few minutes ago. I’ll send $100 more but your not getting any allowance next month.\n\n[NOTE: change audio, mom calls and gives you $100]',
    autoTriggerNextStage: false,
  },
  mom_www_issues: {
    id: 'mom_www_issues',
    callerId: 'mom',
    audioPath: '/audio/netvoice/people/mom-www-issues.mp3',
    dialogText: 'Mom random call about web issues.',
    autoTriggerNextStage: false,
  },
  mom_maryjane: {
    id: 'mom_maryjane',
    callerId: 'mom',
    audioPath: '/audio/netvoice/people/mom-maryjane.mp3',
    dialogText: 'Mom random call.',
    autoTriggerNextStage: false,
  },
  greg_3rd_0: {
    id: 'greg_3rd_0',
    callerId: 'greg',
    audioPath: '/audio/netvoice/people/greg-3rd-0.mp3',
    dialogText:
      'HAHAHAHA, you actually suck at blackjack. go next budy.\n\n[NOTE: change audio, forced hangup + reboot]',
    autoTriggerNextStage: false,
  },
  it_guy_intro: {
    id: 'it_guy_intro',
    callerId: 'greg',
    audioPath: '/audio/netvoice/people/greg-download-failed.mp3',
    dialogText:
      "Hey, I saw your download fail. I'm gonna remote in and just drop the file on your desktop as a zip. Just extract it, easy. Give me a sec.",
    autoTriggerNextStage: false,
  },
  assistant_portal_intro: {
    id: 'assistant_portal_intro',
    callerId: 'alice',
    audioPath: '/audio/netvoice/assistant_portal_intro.mp3',
    dialogText:
      "Great, you got the file. Now I'm sending you the link to the submission portal - check your email. Almost done, you got this.",
    autoTriggerNextStage: false,
  },
  it_guy_cleanup: {
    id: 'it_guy_cleanup',
    callerId: 'greg',
    audioPath: '/audio/netvoice/it_guy_cleanup.mp3',
    dialogText:
      "Hey, I'm seeing a TON of malware on your machine. Let me remote in real quick and clean it up. Don't touch anything.",
    autoTriggerNextStage: false,
  },
  boss_intro: {
    id: 'boss_intro',
    callerId: 'boss',
    audioPath: '/audio/netvoice/boss_intro.mp3',
    dialogText:
      'Morning. Pull the requested file and send it to me before lunch.',
    autoTriggerNextStage: false,
  },
  boss_deadline_reminder: {
    id: 'boss_deadline_reminder',
    callerId: 'boss',
    audioPath: '/audio/netvoice/boss_deadline_reminder.mp3',
    dialogText: 'Deadline check. I still need that file immediately.',
    autoTriggerNextStage: false,
  },
  boss_post_bluescreen: {
    id: 'boss_post_bluescreen',
    callerId: 'boss',
    audioPath: '/audio/netvoice/boss_post_bluescreen.mp3',
    dialogText: 'System crashed? Recover and finish the task now.',
    autoTriggerNextStage: false,
  },
  computer_heartless: {
    id: 'computer_heartless',
    callerId: 'computer',
    audioPath: '/audio/netvoice/computer-complete.mp3',
    dialogText: '??????????????????',
    autoTriggerNextStage: false,
  },
  fly_random: {
    id: 'fly_random',
    callerId: 'fly',
    audioPath: '/audio/netvoice/people/fly-complete.mp3',
    dialogText: '*buzzes*',
    autoTriggerNextStage: false,
  },
};
