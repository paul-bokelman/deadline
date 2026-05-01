import { FileSystemDir } from '../types/FileSystem';

export type CoreGameEvents = {
  'boot:complete': { at: number };
  'bootloader:started': { at: number };
  'bootloader:ended': { at: number };
  'startup_sfx:ended': { at: number };
  'game:rebooted': { at: number };
  'email:opened': { emailId: string };
  'email:delivered': { emailId: string };
  'file:real_report_opened': {
    fileId: string;
    fileName: string;
  };
  'email:real_attachment_clicked': {
    accountId: string;
    emailId: string;
    attachmentId: string;
  };
  'email:attachment_password_prompt_opened': {
    accountId: string;
    emailId: string;
  };
  'email:attachment_password_prompt_closed': {
    accountId: string;
    emailId: string;
  };
  'file:downloaded': { fileId: string };
  'browser:navigate_to_url': {
    url: string;
    source: 'email';
    emailId: string;
  };
  'browser:url_requested': {
    url: string;
  };
  'audio:resume_requested': {
    source: 'web_open' | 'bootloader_end' | 'user_interaction';
  };
  'popup:test_spawn_random': { x: number; y: number };
  'popup:closed': { popupId: string };
  'popup:clear_all': { source: 'antivirus_app' | 'taskbar_button' };
  'popup:count_changed': { count: number };
  'desktop:scatter_icons': Record<string, never>;
  'windows_update:tab_state': {
    isActive: boolean;
    isVisible: boolean;
    label: string;
  };
  'windows_update:restore': Record<string, never>;
  'netvoice:call_accepted': {
    callId: string;
    autoTriggerNextStage: boolean;
  };
  'netvoice:call_ended': {
    callId: string;
    autoTriggerNextStage: boolean;
    reason?: 'hangup' | 'call_over' | 'remote_hangup';
  };
  'blackjack:hand_started': { at: number };
  'blackjack:hand_finished': { at: number };
  'shell:directory_updated': { dir: FileSystemDir };
  'screen:mirror_toggled': Record<string, never>;
  'trap:instant_bsod': { source: 'desktop_shortcut' };
  'fullscreen:recommendation_visibility': { isVisible: boolean };
  'deadline:seconds_remaining': { seconds: number; remainingMs: number };
  'clock:advanced': { byMs: number };
  'fly:spawn_swarm': { count: number };
};

type EventHandler<TPayload> = (payload: TPayload) => void;

class TypedEventBus<TEventMap extends Record<string, unknown>> {
  private listeners: {
    [K in keyof TEventMap]?: Set<EventHandler<TEventMap[K]>>;
  } = {};

  on<K extends keyof TEventMap>(
    eventName: K,
    handler: EventHandler<TEventMap[K]>
  ): () => void {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = new Set();
    }

    this.listeners[eventName]?.add(handler);
    return () => this.off(eventName, handler);
  }

  once<K extends keyof TEventMap>(
    eventName: K,
    handler: EventHandler<TEventMap[K]>
  ): () => void {
    const unsubscribe = this.on(eventName, (payload) => {
      unsubscribe();
      handler(payload);
    });

    return unsubscribe;
  }

  off<K extends keyof TEventMap>(
    eventName: K,
    handler: EventHandler<TEventMap[K]>
  ): void {
    this.listeners[eventName]?.delete(handler);
  }

  emit<K extends keyof TEventMap>(eventName: K, payload: TEventMap[K]): void {
    this.listeners[eventName]?.forEach((handler) => {
      handler(payload);
    });
  }

  clear(): void {
    this.listeners = {};
  }
}

export type GameEventMap = CoreGameEvents;
export type GameEventName = keyof GameEventMap;

export const gameEventBus = new TypedEventBus<GameEventMap>();
