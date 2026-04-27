import { h, FunctionComponent } from 'preact';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';

import PasswordDialog from './PasswordDialog';
import MenuBar from '../../components/shared/MenuBar/MenuBar';
import StatusBar from '../../components/shared/StatusBar/StatusBar';
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

interface EmailClientProps {
  accountId: EmailAccountId;
  accountLabel: string;
}

type PasswordDialogContext =
  | { mode: 'attachment'; emailId: string }
  | { mode: 'email'; emailId: string }
  | null;

const PASSWORD_HINT_CALL_TRIGGER_EVENT_ID = 'password_hint_call:triggered';
const normalizePassword = (value: string): string =>
  value.trim().toLowerCase().replace(/\s+/g, '');

const EmailClient: FunctionComponent<EmailClientProps> = ({
  accountId,
  accountLabel,
}: EmailClientProps) => {
  const {
    flags,
    hasEventFired,
    markEventFired,
    setFlag,
    setStage,
    triggerSkypeCall,
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
    triggerSkypeCall('password_hint_assistant');
  };

  const handleSelectEmail = (email: EmailRecord) => {
    if (email.isMalwareTrap) {
      triggerMalwareEvent(email, 'email_open');
    }

    if (loadEmailTimerRef.current !== null) {
      window.clearTimeout(loadEmailTimerRef.current);
      loadEmailTimerRef.current = null;
    }

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
    <div style={{ height: '100%' }}>
      <WindowContent
        menu={<MenuBar options={['File', 'Edit', 'View', 'Tools', 'Help']} />}
        body={
          <div className={style.layout}>
            <div className={style.sidebar}>
              <div className={style.accountName}>{accountLabel}</div>
              {folderOrder.map((folder) => (
                <button
                  className={`${style.folderButton} ${
                    selectedFolder === folder ? style.folderButtonActive : ''
                  }`}
                  key={folder}
                  onClick={() => setSelectedFolder(folder)}
                  type="button"
                >
                  <span>{folderLabels[folder]}</span>
                  <span>
                    {
                      accountEmails.filter((item) => item.folder === folder)
                        .length
                    }
                  </span>
                </button>
              ))}
            </div>
            <div className={style.mainPane}>
              <div className={style.listHeader}>
                {folderLabels[selectedFolder]} - {folderEmails.length} messages
              </div>
              <div className={style.listBody}>
                {folderEmails.length === 0 && (
                  <div className={`${style.row} ${style.empty}`}>
                    No new messages.
                  </div>
                )}
                {folderEmails.map((email) => (
                  <div
                    className={`${style.row} ${
                      selectedEmail?.id === email.id ? style.rowActive : ''
                    }`}
                    key={email.id}
                    onClick={() => handleSelectEmail(email)}
                  >
                    <div className={style.rowTop}>
                      <span>{email.sender}</span>
                      <span className={style.timestamp}>{email.timestamp}</span>
                    </div>
                    <div className={style.subject}>{email.subject}</div>
                    <div className={style.preview}>{email.preview}</div>
                  </div>
                ))}
              </div>
              <div className={style.messagePane}>
                {isLoadingEmail && (
                  <div className={style.loadingContainer}>
                    <div className={style.spinner} />
                    <span>Loading email... (this may take a moment)</span>
                  </div>
                )}
                {!isLoadingEmail && !selectedEmail && (
                  <div className={style.empty}>
                    Select an email to preview its contents.
                  </div>
                )}
                {!isLoadingEmail && selectedEmail && (
                  <div>
                    <div className={style.messageMeta}>
                      <div>From:</div>
                      <div>{selectedEmail.sender}</div>
                      <div>Subject:</div>
                      <div>{selectedEmail.subject}</div>
                      <div>Time:</div>
                      <div>{selectedEmail.timestamp}</div>
                    </div>
                    <div className={style.messageBody}>{selectedEmailBody}</div>
                    {selectedEmailIsLocked && (
                      <div className={style.attachments}>
                        <button
                          className={style.attachmentButton}
                          onClick={() => openEmailPasswordDialog(selectedEmail)}
                          type="button"
                        >
                          Enter Password
                        </button>
                      </div>
                    )}
                    {!selectedEmailIsLocked &&
                      !!selectedEmail.attachments?.length && (
                        <div className={style.attachments}>
                          <strong>Attachments</strong>
                          {selectedEmail.attachments.map((attachment) => (
                            <button
                              className={style.attachmentButton}
                              key={attachment.id}
                              onClick={() =>
                                handleClickAttachment(
                                  selectedEmail,
                                  attachment.id
                                )
                              }
                              type="button"
                            >
                              {attachment.fileName}
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                )}
              </div>
            </div>
          </div>
        }
        footer={
          <StatusBar
            textLeft={`Account: ${accountLabel}`}
            textRight={
              selectedEmail
                ? `Selected: ${selectedEmail.subject}`
                : `${folderEmails.length} message(s)`
            }
          />
        }
      />
      <PasswordDialog
        errorMessage={passwordError}
        isOpen={passwordDialogContext !== null}
        onClose={closePasswordDialog}
        onSubmit={submitPasswordDialog}
        prompt={passwordDialogPrompt}
      />
    </div>
  );
};

export default EmailClient;
