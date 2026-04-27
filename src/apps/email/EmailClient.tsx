import { h, Fragment, FunctionComponent } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

import PasswordDialog from './PasswordDialog';
import Icon from '../../components/shared/Icon/Icon';
import MenuBar from '../../components/shared/MenuBar/MenuBar';
import WindowContent from '../../components/shared/WindowContent/WindowContent';
import {
  EmailAccountId,
  EmailFolder,
  EmailRecord,
  getEmailsForAccount,
} from '../../data/emails';
import { Q3_ATTACHMENT_PASSWORD } from '../../data/passwords';
import { gameEventBus } from '../../game/events';
import { useGameState } from '../../game/state';
import { IconId } from '../../types/Icon';

import style from './EmailClient.module.css';

const folderOrder: EmailFolder[] = [
  'inbox',
  'promotions',
  'spam',
  'sent',
  'trash',
];

const folderLabels: Record<EmailFolder, string> = {
  inbox: 'Inbox',
  promotions: 'Promotions',
  spam: 'Spam',
  sent: 'Sent',
  trash: 'Trash',
};

const folderIconMap: Record<EmailFolder, IconId> = {
  inbox: 'mailEnvelope',
  promotions: 'mailFolderClosed',
  spam: 'mailSpam',
  sent: 'mailSent',
  trash: 'mailTrashEmpty',
};

interface EmailClientProps {
  accountId: EmailAccountId;
  accountLabel: string;
}

type PasswordDialogContext =
  | { mode: 'attachment'; emailId: string }
  | { mode: 'email'; emailId: string }
  | null;

const PASSWORD_HINT_CALL_TRIGGER_EVENT_ID = 'password_hint_call:triggered';

const accountToAddressMap: Record<EmailAccountId, string> = {
  corpMail: 'me <you@corp.internal>',
  personalMail: 'me <you@personalmail.com>',
  corpMailLegacy: 'me <you@legacy.corp.internal>',
};

const accountServerMap: Record<EmailAccountId, string> = {
  corpMail: 'POP3: corp.internal',
  personalMail: 'POP3: personalmail.com',
  corpMailLegacy: 'POP3: legacy.corp.internal',
};

const normalizePassword = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, '');

interface ToolbarButtonProps {
  label: string;
  iconId: IconId;
  onClick?: () => void;
  disabled?: boolean;
}

const ToolbarButton: FunctionComponent<ToolbarButtonProps> = ({
  label,
  iconId,
  onClick,
  disabled = false,
}: ToolbarButtonProps) => (
  <button
    className={style.toolbarButton}
    disabled={disabled}
    onClick={onClick}
    type="button"
  >
    <Icon iconId={iconId} size={24} />
    <span className={style.toolbarButtonLabel}>{label}</span>
  </button>
);

const EmailClient: FunctionComponent<EmailClientProps> = ({
  accountId,
}: EmailClientProps) => {
  const {
    flags,
    hasEventFired,
    markEventFired,
    setFlag,
    setStage,
    triggerNetVoiceCall,
  } = useGameState();
  const [selectedFolder, setSelectedFolder] = useState<EmailFolder>('inbox');
  const [selectedEmail, setSelectedEmail] = useState<EmailRecord | null>(null);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [passwordDialogContext, setPasswordDialogContext] = useState<
    PasswordDialogContext
  >(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [unlockedEmailMap, setUnlockedEmailMap] = useState<
    Record<string, true>
  >({});
  const [readEmailMap, setReadEmailMap] = useState<Record<string, true>>({});
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const loadEmailTimerRef = useRef<number | null>(null);
  const passwordHintTimerRef = useRef<number | null>(null);

  const accountEmails = useMemo(() => getEmailsForAccount(accountId, flags), [
    accountId,
    flags,
  ]);

  const folderEmails = useMemo(
    () => accountEmails.filter((email) => email.folder === selectedFolder),
    [accountEmails, selectedFolder]
  );

  const folderCounts = useMemo(() => {
    const counts: Record<EmailFolder, number> = {
      inbox: 0,
      promotions: 0,
      spam: 0,
      sent: 0,
      trash: 0,
    };
    accountEmails.forEach((email) => {
      if (readEmailMap[email.id]) return;
      counts[email.folder] = (counts[email.folder] ?? 0) + 1;
    });
    return counts;
  }, [accountEmails, readEmailMap]);

  const unreadInCurrentFolderCount = useMemo(
    () =>
      folderEmails.reduce(
        (count, email) => (readEmailMap[email.id] ? count : count + 1),
        0
      ),
    [folderEmails, readEmailMap]
  );

  useEffect(() => {
    return () => {
      if (loadEmailTimerRef.current !== null) {
        window.clearTimeout(loadEmailTimerRef.current);
      }
      if (passwordHintTimerRef.current !== null) {
        window.clearTimeout(passwordHintTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setSelectedEmail(null);
    setIsLoadingEmail(false);
    if (loadEmailTimerRef.current !== null) {
      window.clearTimeout(loadEmailTimerRef.current);
      loadEmailTimerRef.current = null;
    }
  }, [selectedFolder, accountId]);

  const triggerMalwareEvent = (
    sourceEmail: EmailRecord,
    source: 'email_open' | 'attachment_open'
  ) => {
    gameEventBus.emit('malware:popup', {
      accountId,
      source,
      sourceEmailId: sourceEmail.id,
      subject: sourceEmail.subject,
    });
  };

  const triggerPasswordHintCall = () => {
    if (flags.hasReceivedPasswordHintCall) return;
    if (hasEventFired(PASSWORD_HINT_CALL_TRIGGER_EVENT_ID)) return;
    markEventFired(PASSWORD_HINT_CALL_TRIGGER_EVENT_ID);
    triggerNetVoiceCall('password_hint_assistant');
  };

  const markEmailRead = (emailId: string) => {
    setReadEmailMap((current) => {
      if (current[emailId]) return current;
      return { ...current, [emailId]: true };
    });
  };

  const handleSelectEmail = (email: EmailRecord) => {
    if (email.isMalwareTrap) {
      triggerMalwareEvent(email, 'email_open');
    }

    if (loadEmailTimerRef.current !== null) {
      window.clearTimeout(loadEmailTimerRef.current);
      loadEmailTimerRef.current = null;
    }

    markEmailRead(email.id);

    const loadDelayMs = email.loadDelayMs ?? 0;
    if (loadDelayMs > 0) {
      setSelectedEmail(null);
      setIsLoadingEmail(true);
      loadEmailTimerRef.current = window.setTimeout(() => {
        setIsLoadingEmail(false);
        setSelectedEmail(email);
        loadEmailTimerRef.current = null;
      }, loadDelayMs);
      return;
    }

    setIsLoadingEmail(false);
    setSelectedEmail(email);
  };

  const openAttachmentPasswordDialog = (email: EmailRecord) => {
    setStage('password_hunt');
    setPasswordError(null);
    setPasswordDialogContext({ mode: 'attachment', emailId: email.id });
    gameEventBus.emit('email:attachment_password_prompt_opened', {
      accountId,
      emailId: email.id,
    });

    if (flags.hasReceivedPasswordHintCall) return;
    if (passwordHintTimerRef.current !== null) {
      window.clearTimeout(passwordHintTimerRef.current);
    }
    passwordHintTimerRef.current = window.setTimeout(() => {
      passwordHintTimerRef.current = null;
      triggerPasswordHintCall();
    }, 10000);
  };

  const openEmailPasswordDialog = (email: EmailRecord) => {
    setPasswordError(null);
    setPasswordDialogContext({ mode: 'email', emailId: email.id });
  };

  const closePasswordDialog = () => {
    if (!passwordDialogContext) return;
    const context = passwordDialogContext;
    setPasswordDialogContext(null);
    setPasswordError(null);

    if (context.mode === 'attachment') {
      gameEventBus.emit('email:attachment_password_prompt_closed', {
        accountId,
        emailId: context.emailId,
      });
      if (passwordHintTimerRef.current !== null) {
        window.clearTimeout(passwordHintTimerRef.current);
        passwordHintTimerRef.current = null;
      }
      triggerPasswordHintCall();
    }
  };

  const submitPasswordDialog = (password: string) => {
    if (!passwordDialogContext) return;
    const normalizedInputPassword = normalizePassword(password);

    if (passwordDialogContext.mode === 'attachment') {
      if (
        normalizedInputPassword !== normalizePassword(Q3_ATTACHMENT_PASSWORD)
      ) {
        setPasswordError('Incorrect password. Try again.');
        return;
      }

      setFlag('hasUnlockedAttachment', true);
      setStage('download');
      if (passwordHintTimerRef.current !== null) {
        window.clearTimeout(passwordHintTimerRef.current);
        passwordHintTimerRef.current = null;
      }
      setPasswordDialogContext(null);
      setPasswordError(null);
      return;
    }

    const email = accountEmails.find(
      (item) => item.id === passwordDialogContext.emailId
    );
    if (!email || !email.encryptedWithPassword) {
      setPasswordDialogContext(null);
      return;
    }

    if (
      normalizedInputPassword !== normalizePassword(email.encryptedWithPassword)
    ) {
      setPasswordError('Incorrect password. Try again.');
      return;
    }

    setUnlockedEmailMap((currentMap) => ({
      ...currentMap,
      [email.id]: true,
    }));
    setPasswordDialogContext(null);
    setPasswordError(null);
  };

  const handleClickAttachment = (email: EmailRecord, attachmentId: string) => {
    const attachment = email.attachments?.find(
      (item) => item.id === attachmentId
    );
    if (!attachment) return;

    if (attachment.isMalwareTrap) {
      triggerMalwareEvent(email, 'attachment_open');
      return;
    }

    if (attachment.isRealAttachment) {
      gameEventBus.emit('email:real_attachment_clicked', {
        accountId,
        emailId: email.id,
        attachmentId: attachment.id,
      });
      setFlag('hasFoundRealEmail', true);
      openAttachmentPasswordDialog(email);
    }
  };

  const handleDeleteSelected = () => {
    if (!selectedEmail) return;
    markEmailRead(selectedEmail.id);
    setSelectedEmail(null);
  };

  const selectedEmailIsLocked =
    !!selectedEmail?.encryptedWithPassword &&
    !unlockedEmailMap[selectedEmail.id];
  const selectedEmailBody = selectedEmailIsLocked
    ? selectedEmail?.encryptedLockedBody ??
      'This email is encrypted. Enter a password to unlock it.'
    : selectedEmail?.body;
  const passwordDialogPrompt =
    passwordDialogContext?.mode === 'email'
      ? 'This email is encrypted. Enter password:'
      : 'This file is encrypted. Enter password:';

  return (
    <WindowContent
      menu={
        <MenuBar
          options={['File', 'Edit', 'View', 'Tools', 'Message', 'Help']}
        />
      }
      body={
        <div className={style.root}>
          <div className={style.toolbar}>
            <ToolbarButton iconId="mailToolNew" label="New" />
            <ToolbarButton
              iconId="mailToolReply"
              label="Reply"
              disabled={!selectedEmail}
            />
            <ToolbarButton
              iconId="mailToolReply"
              label="Reply All"
              disabled={!selectedEmail}
            />
            <ToolbarButton
              iconId="mailToolForward"
              label="Forward"
              disabled={!selectedEmail}
            />
            <div className={style.toolbarSeparator} />
            <ToolbarButton iconId="mailToolSend" label="Send/Recv" />
            <ToolbarButton
              iconId="mailToolDelete"
              label="Delete"
              disabled={!selectedEmail}
              onClick={handleDeleteSelected}
            />
            <div className={style.toolbarSpacer} />
            <ToolbarButton
              iconId={
                isSidebarVisible ? 'mailFolderOpen' : 'mailFolderClosed'
              }
              label="Folders"
              onClick={() => setIsSidebarVisible((current) => !current)}
            />
          </div>

          <div className={style.layout}>
            {isSidebarVisible && (
              <div className={style.sidebar}>
                <div className={style.localFolders}>
                  <Icon iconId="mailFolderOpen" size={16} />
                  <span>Local Folders</span>
                </div>
                <div className={style.folderTree}>
                  {folderOrder.map((folder) => {
                    const count = folderCounts[folder];
                    const isActive = selectedFolder === folder;
                    return (
                      <button
                        className={`${style.folderItem} ${
                          isActive ? style.folderItemActive : ''
                        }`}
                        key={folder}
                        onClick={() => setSelectedFolder(folder)}
                        type="button"
                      >
                        <Icon iconId={folderIconMap[folder]} size={16} />
                        <span className={style.folderName}>
                          {folderLabels[folder]}
                        </span>
                        {count > 0 && (
                          <span className={style.folderCount}>({count})</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className={style.rightColumn}>
              <div className={style.list}>
                <div className={style.listHeaderRow}>
                  <div className={style.listHeaderCell}>!</div>
                  <div className={style.listHeaderCell} />
                  <div className={style.listHeaderCell}>From</div>
                  <div className={style.listHeaderCell}>Subject</div>
                  <div className={style.listHeaderCell}>Received</div>
                </div>
                <div className={style.listBody}>
                  {folderEmails.length === 0 && (
                    <div className={style.listEmpty}>No new messages.</div>
                  )}
                  {folderEmails.map((email) => {
                    const isActive = selectedEmail?.id === email.id;
                    const isUnread = !readEmailMap[email.id];
                    const rowIcon: IconId = isUnread
                      ? 'mailEnvelope'
                      : 'mailEnvelopeOpen';
                    return (
                      <div
                        className={`${style.listRow} ${
                          isActive ? style.listRowActive : ''
                        } ${isUnread ? style.listRowUnread : ''}`}
                        key={email.id}
                        onClick={() => handleSelectEmail(email)}
                      >
                        <div
                          className={`${style.listCell} ${style.listCellPriority}`}
                        >
                          {email.isMalwareTrap ? '!' : ''}
                        </div>
                        <div
                          className={`${style.listCell} ${style.listCellIcon}`}
                        >
                          <Icon iconId={rowIcon} size={16} />
                        </div>
                        <div className={`${style.listCell} ${style.listCellFrom}`}>
                          {email.sender}
                        </div>
                        <div
                          className={`${style.listCell} ${style.listCellSubject}`}
                        >
                          {email.subject}
                        </div>
                        <div
                          className={`${style.listCell} ${style.listCellReceived}`}
                        >
                          {email.timestamp}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={style.preview}>
                {isLoadingEmail && (
                  <div className={style.loadingContainer}>
                    <div className={style.spinner} />
                    <span>Loading email... (this may take a moment)</span>
                  </div>
                )}
                {!isLoadingEmail && !selectedEmail && (
                  <div className={style.previewEmpty}>
                    Select an email to preview its contents.
                  </div>
                )}
                {!isLoadingEmail && selectedEmail && (
                  <Fragment>
                    <div className={style.previewHeader}>
                      <div className={style.previewLabel}>
                        <b>From:</b>
                      </div>
                      <div>{selectedEmail.sender}</div>
                      <div className={style.previewLabel}>
                        <b>To:</b>
                      </div>
                      <div>{accountToAddressMap[accountId]}</div>
                      <div className={style.previewLabel}>
                        <b>Subject:</b>
                      </div>
                      <div>{selectedEmail.subject}</div>
                      <div className={style.previewLabel}>
                        <b>Date:</b>
                      </div>
                      <div>{selectedEmail.timestamp}</div>
                      {!selectedEmailIsLocked &&
                        !!selectedEmail.attachments?.length && (
                          <Fragment>
                            <div className={style.previewLabel}>
                              <b>Attach:</b>
                            </div>
                            <div>
                              {selectedEmail.attachments.map((attachment) => (
                                <button
                                  className={style.previewAttachment}
                                  key={attachment.id}
                                  onClick={() =>
                                    handleClickAttachment(
                                      selectedEmail,
                                      attachment.id
                                    )
                                  }
                                  type="button"
                                >
                                  <Icon iconId="notepadDoc" size={16} />
                                  <span>{attachment.fileName}</span>
                                </button>
                              ))}
                            </div>
                          </Fragment>
                        )}
                    </div>
                    <div className={style.previewBody}>
                      {selectedEmailBody}
                      {selectedEmailIsLocked && (
                        <div>
                          <button
                            className={style.unlockButton}
                            onClick={() => openEmailPasswordDialog(selectedEmail)}
                            type="button"
                          >
                            Enter Password
                          </button>
                        </div>
                      )}
                    </div>
                  </Fragment>
                )}
              </div>
            </div>
          </div>

          <div className={style.statusBar}>
            <div className={`${style.statusCell} ${style.statusCellLeft}`}>
              {folderEmails.length} message{folderEmails.length === 1 ? '' : 's'}
              , {unreadInCurrentFolderCount} unread
            </div>
            <div className={`${style.statusCell} ${style.statusCellMiddle}`}>
              Working Online
            </div>
            <div className={`${style.statusCell} ${style.statusCellRight}`}>
              {accountServerMap[accountId]}
            </div>
          </div>

          <PasswordDialog
            errorMessage={passwordError}
            isOpen={passwordDialogContext !== null}
            onClose={closePasswordDialog}
            onSubmit={submitPasswordDialog}
            prompt={passwordDialogPrompt}
          />
        </div>
      }
    />
  );
};

export default EmailClient;
