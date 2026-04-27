export type NetVoiceCallId =
  | 'intro_assistant'
  | 'password_hint_assistant'
  | 'password_dump_hint'
  | 'mom_bailout_1'
  | 'mom_bailout_2'
  | 'it_guy_blackjack_roast'
  | 'it_guy_intro'
  | 'it_guy_angry_1'
  | 'assistant_portal_intro'
  | 'it_guy_cleanup'
  | 'boss_intro'
  | 'boss_deadline_reminder'
  | 'boss_post_bluescreen';

export type NetVoiceCallerId = 'alice' | 'greg' | 'boss' | 'mom';

export interface NetVoiceCaller {
  id: NetVoiceCallerId;
  name: string;
  avatar: string;
  role: string;
  warning?: string;
  address: string;
}

export const netVoiceCallers: Record<NetVoiceCallerId, NetVoiceCaller> = {
  alice: {
    id: 'alice',
    name: 'Alice',
    avatar: '/audio/netvoice/alice_profile.png',
    role: 'Assistant',
    warning: "Don't flirt, she knows Grace and WILL tell (like last time)",
    address: '10.0.0.7',
  },
  greg: {
    id: 'greg',
    name: 'Greg',
    avatar: '/audio/netvoice/greg_profile.png',
    role: 'IT Guy',
    warning: "!!!DON'T PICK UP HIS CALLS!!!",
    address: '192.168.1.42',
  },
  boss: {
    id: 'boss',
    name: 'Boss',
    avatar: '/assets/img/interface/msg_warning-0.png',
    role: 'Manager',
    address: '10.0.0.1',
  },
  mom: {
    id: 'mom',
    name: 'Mom',
    avatar: '/audio/netvoice/mom_profile.png',
    role: 'Family',
    warning: 'Please do not answer this at work',
    address: 'mom@dialup.local',
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
    audioPath: '/audio/netvoice/intro_assistant.mp3',
    dialogText:
      "Hey, listen, you need to download the Q3 report and send it to the boss before deadline. It's in your email. Heads up - my email address isn't my name, it's an ID number, so don't fall for impersonators. And whatever you do, do NOT reboot the computer - you'll lose everything. Good luck.",
    autoTriggerNextStage: false,
  },
  password_hint_assistant: {
    id: 'password_hint_assistant',
    callerId: 'alice',
    audioPath: '/audio/netvoice/password_hint_assistant.mp3',
    dialogText:
      "Oh, right, the password's encrypted too. I sent it in a separate email. But I think the password for THAT email is in your IMPORTANT_PASSWORDS.txt file on the desktop. You know, the one with all the passwords.",
    autoTriggerNextStage: false,
  },
  password_dump_hint: {
    id: 'password_dump_hint',
    callerId: 'alice',
    audioPath: '/audio/netvoice/password_hint_assistant.mp3',
    dialogText:
      "Heads up: the attachment is encrypted. You should already have a scary-looking passwords document on your desktop. The key is hidden somewhere inside it. Yeah... I know. Sorry. You'll need it now.",
    autoTriggerNextStage: false,
  },
  mom_bailout_1: {
    id: 'mom_bailout_1',
    callerId: 'mom',
    audioPath: '/audio/netvoice/mom_bailout_1.wav',
    dialogText:
      "Hey honey uhm… I noticed you have no money in your bank account…. You really need to manage your money better your 43. Me and dad are pretty disappointed in you. Im going to send over $100 to make sure your alright but make sure that lasts\n\n[NOTE: change audio, mom calls and gives you $100]",
    autoTriggerNextStage: false,
  },
  mom_bailout_2: {
    id: 'mom_bailout_2',
    callerId: 'mom',
    audioPath: '/audio/netvoice/mom_bailout_2.wav',
    dialogText:
      "ok this is getting ridiculous. I just gave you money a few minutes ago. I’ll send $100 more but your not getting any allowance next month.\n\n[NOTE: change audio, mom calls and gives you $100]",
    autoTriggerNextStage: false,
  },
  it_guy_blackjack_roast: {
    id: 'it_guy_blackjack_roast',
    callerId: 'greg',
    audioPath: '/audio/netvoice/it_guy_blackjack_roast.wav',
    dialogText:
      'HAHAHAHA, you actually suck at blackjack. go next budy.\n\n[NOTE: change audio, forced hangup + reboot]',
    autoTriggerNextStage: false,
  },
  it_guy_intro: {
    id: 'it_guy_intro',
    callerId: 'greg',
    audioPath: '/audio/netvoice/it_guy_intro.mp3',
    dialogText:
      "Hey, I saw your download fail. I'm gonna remote in and just drop the file on your desktop as a zip. Just extract it, easy. Give me a sec.",
    autoTriggerNextStage: false,
  },
  it_guy_angry_1: {
    id: 'it_guy_angry_1',
    callerId: 'greg',
    audioPath: '/audio/netvoice/it_guy_angry_1.mp3',
    dialogText:
      "Are you serious? You ran the WinRAR update? Fine, fine. I'll send it again. Try not to break things this time.",
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
};
