export type SkypeCallId =
  | 'intro_assistant'
  | 'password_hint_assistant'
  | 'it_guy_intro'
  | 'it_guy_angry_1'
  | 'assistant_portal_intro'
  | 'it_guy_cleanup'
  | 'boss_intro'
  | 'boss_deadline_reminder'
  | 'boss_post_bluescreen';

export interface SkypeCallDefinition {
  id: SkypeCallId;
  callerName: string;
  callerAvatar: string;
  audioPath: string;
  dialogText: string;
  autoTriggerNextStage?: boolean;
}

export const skypeCalls: Record<SkypeCallId, SkypeCallDefinition> = {
  intro_assistant: {
    id: 'intro_assistant',
    callerName: 'Assistant',
    callerAvatar: '/audio/skype/assistant_silhouette.svg',
    audioPath: '/audio/skype/intro_assistant.mp3',
    dialogText:
      "Hey, listen, you need to download the Q3 report and send it to the boss before deadline. It's in your email. Heads up - my email address isn't my name, it's an ID number, so don't fall for impersonators. And whatever you do, do NOT reboot the computer - you'll lose everything. Good luck.",
    autoTriggerNextStage: false,
  },
  password_hint_assistant: {
    id: 'password_hint_assistant',
    callerName: 'Assistant',
    callerAvatar: '/audio/skype/assistant_silhouette.svg',
    audioPath: '/audio/skype/password_hint_assistant.mp3',
    dialogText:
      "Oh, right, the password's encrypted too. I sent it in a separate email. But I think the password for THAT email is in your IMPORTANT_PASSWORDS.txt file on the desktop. You know, the one with all the passwords.",
    autoTriggerNextStage: false,
  },
  it_guy_intro: {
    id: 'it_guy_intro',
    callerName: 'IT Support',
    callerAvatar: '/audio/skype/it_support_avatar.svg',
    audioPath: '/audio/skype/it_guy_intro.mp3',
    dialogText:
      "Hey, I saw your download fail. I'm gonna remote in and just drop the file on your desktop as a zip. Just extract it, easy. Give me a sec.",
    autoTriggerNextStage: false,
  },
  it_guy_angry_1: {
    id: 'it_guy_angry_1',
    callerName: 'IT Support',
    callerAvatar: '/audio/skype/it_support_avatar.svg',
    audioPath: '/audio/skype/it_guy_angry_1.mp3',
    dialogText:
      "Are you serious? You ran the WinRAR update? Fine, fine. I'll send it again. Try not to break things this time.",
    autoTriggerNextStage: false,
  },
  assistant_portal_intro: {
    id: 'assistant_portal_intro',
    callerName: 'Assistant',
    callerAvatar: '/audio/skype/assistant_silhouette.svg',
    audioPath: '/audio/skype/assistant_portal_intro.mp3',
    dialogText:
      "Great, you got the file. Now I'm sending you the link to the submission portal - check your email. Almost done, you got this.",
    autoTriggerNextStage: false,
  },
  it_guy_cleanup: {
    id: 'it_guy_cleanup',
    callerName: 'IT Support',
    callerAvatar: '/audio/skype/it_support_avatar.svg',
    audioPath: '/audio/skype/it_guy_cleanup.mp3',
    dialogText:
      "Hey, I'm seeing a TON of malware on your machine. Let me remote in real quick and clean it up. Don't touch anything.",
    autoTriggerNextStage: false,
  },
  boss_intro: {
    id: 'boss_intro',
    callerName: 'Boss',
    callerAvatar: '/assets/img/interface/msg_warning-0.png',
    audioPath: '/audio/skype/boss_intro.mp3',
    dialogText:
      'Morning. Pull the requested file and send it to me before lunch.',
    autoTriggerNextStage: false,
  },
  boss_deadline_reminder: {
    id: 'boss_deadline_reminder',
    callerName: 'Boss',
    callerAvatar: '/assets/img/interface/msg_warning-0.png',
    audioPath: '/audio/skype/boss_deadline_reminder.mp3',
    dialogText: 'Deadline check. I still need that file immediately.',
    autoTriggerNextStage: false,
  },
  boss_post_bluescreen: {
    id: 'boss_post_bluescreen',
    callerName: 'Boss',
    callerAvatar: '/assets/img/interface/msg_warning-0.png',
    audioPath: '/audio/skype/boss_post_bluescreen.mp3',
    dialogText: 'System crashed? Recover and finish the task now.',
    autoTriggerNextStage: false,
  },
};
