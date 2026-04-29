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
import { gameEventBus } from '../../game/events';
import { useGameState } from '../../game/state';
import { getAttachmentDecryptionKeyFromDump } from '../../system/desktop/dynamicDesktopItems';
import {
  getDeliveredEmailInstances,
  subscribeRuntimeMailbox,
} from '../../system/email/runtimeMailbox';
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
interface VisibleEmailItem {
  instanceId: string;
  email: EmailRecord;
}

const accountToAddressMap: Record<EmailAccountId, string> = {
  corpMail: 'conner.work@aol.com',
  personalMail: 'connerdabeast@aol.com',
  corpMailLegacy: 'you@legacy.corp.internal',
};

const accountServerMap: Record<EmailAccountId, string> = {
  corpMail: 'POP3: corp.internal',
  personalMail: 'POP3: personalmail.com',
  corpMailLegacy: 'POP3: legacy.corp.internal',
};

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
    setFlag,
    setStage,
  } = useGameState();
  const [selectedFolder, setSelectedFolder] = useState<EmailFolder>('inbox');
  const [selectedEmail, setSelectedEmail] = useState<VisibleEmailItem | null>(null);
  const [isLoadingEmail, setIsLoadingEmail] = useState(false);
  const [passwordDialogContext, setPasswordDialogContext] =
    useState<PasswordDialogContext>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [readEmailMap, setReadEmailMap] = useState<Record<string, true>>({});
  const [movedToTrashMap, setMovedToTrashMap] = useState<Record<string, true>>(
    {}
  );
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [mailboxVersion, setMailboxVersion] = useState(0);
  const loadEmailTimerRef = useRef<number | null>(null);
  const attachmentUnlockKeyRef = useRef(getAttachmentDecryptionKeyFromDump());
  const previewBodyRef = useRef<HTMLDivElement>(null);

  const eligibleEmails = useMemo(() => getEmailsForAccount(accountId, flags), [
    accountId,
    flags,
  ]);
  const eligibleEmailMap = useMemo(
    () => new Map(eligibleEmails.map((email) => [email.id, email])),
    [eligibleEmails]
  );

  const accountEmails = useMemo<VisibleEmailItem[]>(() => {
    const instances = getDeliveredEmailInstances();
    const visibleItems = instances
      .map((item) => {
        const email = eligibleEmailMap.get(item.emailId);
        if (!email) return null;
        return { instanceId: item.instanceId, email };
      })
      .filter((item): item is VisibleEmailItem => item !== null);
    return visibleItems.reverse();
  }, [eligibleEmailMap, mailboxVersion]);

  const folderEmails = useMemo(
    () =>
      accountEmails.filter((item) => {
        const effectiveFolder = movedToTrashMap[item.instanceId]
          ? 'trash'
          : item.email.folder;
        return effectiveFolder === selectedFolder;
      }),
    [accountEmails, movedToTrashMap, selectedFolder]
  );

  const folderCounts = useMemo(() => {
    const counts: Record<EmailFolder, number> = {
      inbox: 0,
      promotions: 0,
      spam: 0,
      sent: 0,
      trash: 0,
    };
    accountEmails.forEach((item) => {
      const effectiveFolder = movedToTrashMap[item.instanceId]
        ? 'trash'
        : item.email.folder;
      if (effectiveFolder === 'trash') {
        counts.trash = (counts.trash ?? 0) + 1;
        return;
      }
      if (readEmailMap[item.instanceId]) return;
      counts[effectiveFolder] = (counts[effectiveFolder] ?? 0) + 1;
    });
    return counts;
  }, [accountEmails, movedToTrashMap, readEmailMap]);

  const unreadInCurrentFolderCount = useMemo(
    () =>
      folderEmails.reduce(
        (count, item) => (readEmailMap[item.instanceId] ? count : count + 1),
        0
      ),
    [folderEmails, readEmailMap]
  );

  useEffect(() => {
    return () => {
      if (loadEmailTimerRef.current !== null) {
        window.clearTimeout(loadEmailTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    return subscribeRuntimeMailbox(() => {
      setMailboxVersion((current) => current + 1);
    });
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
    const configuredBurstCount =
      source === 'attachment_open'
        ? sourceEmail.malwarePopupBurstCountOnAttachmentOpen
        : sourceEmail.malwarePopupBurstCountOnEmailOpen;
    const burstCount =
      typeof configuredBurstCount === 'number' && configuredBurstCount > 0
        ? Math.round(configuredBurstCount)
        : source === 'attachment_open'
          ? 3
          : 2;
    for (let i = 0; i < burstCount; i += 1) {
      gameEventBus.emit('popup:test_spawn_random', {
        x: 140 + i * 80,
        y: 80 + i * 56,
      });
    }
  };

  const markEmailRead = (instanceId: string) => {
    setReadEmailMap((current) => {
      if (current[instanceId]) return current;
      return { ...current, [instanceId]: true };
    });
  };

  const handleSelectEmail = (item: VisibleEmailItem) => {
    const email = item.email;
    if (loadEmailTimerRef.current !== null) {
      window.clearTimeout(loadEmailTimerRef.current);
      loadEmailTimerRef.current = null;
    }

    markEmailRead(item.instanceId);

    const loadDelayMs = email.loadDelayMs ?? 0;
    if (loadDelayMs > 0) {
      setSelectedEmail(null);
      setIsLoadingEmail(true);
      loadEmailTimerRef.current = window.setTimeout(() => {
        setIsLoadingEmail(false);
        setSelectedEmail(item);
        loadEmailTimerRef.current = null;
      }, loadDelayMs);
      return;
    }

    setIsLoadingEmail(false);
    setSelectedEmail(item);
  };

  const openAttachmentPasswordDialog = (email: EmailRecord) => {
    setPasswordError(null);
    setPasswordDialogContext({ mode: 'attachment', emailId: email.id });
    gameEventBus.emit('email:attachment_password_prompt_opened', {
      accountId,
      emailId: email.id,
    });
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
    }
  };

  const submitPasswordDialog = (password: string) => {
    if (!passwordDialogContext) return;
    if (passwordDialogContext.mode === 'attachment') {
      const expected = (attachmentUnlockKeyRef.current ?? '').trim();
      const got = password.trim();
      if (!expected || got !== expected) {
        setPasswordError('incorrect encryption key');
        return;
      }

      setFlag('hasUnlockedAttachment', true);
      setStage('download');
      setPasswordDialogContext(null);
      setPasswordError(null);
      return;
    }

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
      if (flags.hasUnlockedAttachment) {
        setStage('download');
        return;
      }

      openAttachmentPasswordDialog(email);
    }
  };

  const handleDeleteSelected = () => {
    if (!selectedEmail) return;
    markEmailRead(selectedEmail.instanceId);
    setMovedToTrashMap((current) => ({
      ...current,
      [selectedEmail.instanceId]: true,
    }));
    setSelectedEmail(null);
  };

  const selectedEmailIsLocked = false;
  const selectedEmailBody = selectedEmail?.email.body;

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
                  {folderEmails.map((item) => {
                    const email = item.email;
                    const isActive = selectedEmail?.instanceId === item.instanceId;
                    const isUnread = !readEmailMap[item.instanceId];
                    const rowIcon: IconId = isUnread
                      ? 'mailEnvelope'
                      : 'mailEnvelopeOpen';
                    return (
                      <div
                        className={`${style.listRow} ${
                          isActive ? style.listRowActive : ''
                        } ${isUnread ? style.listRowUnread : ''}`}
                        key={item.instanceId}
                        onClick={() => handleSelectEmail(item)}
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
                      <div>{selectedEmail.email.sender}</div>
                      <div className={style.previewLabel}>
                        <b>To:</b>
                      </div>
                      <div>{accountToAddressMap[accountId]}</div>
                      <div className={style.previewLabel}>
                        <b>Subject:</b>
                      </div>
                      <div>{selectedEmail.email.subject}</div>
                      <div className={style.previewLabel}>
                        <b>Date:</b>
                      </div>
                      <div>{selectedEmail.email.timestamp}</div>
                      {!selectedEmailIsLocked &&
                        !!selectedEmail.email.attachments?.length && (
                          <Fragment>
                            <div className={style.previewLabel}>
                              <b>Attach:</b>
                            </div>
                            <div>
                              {selectedEmail.email.attachments.map((attachment) => (
                                <button
                                  className={style.previewAttachment}
                                  key={attachment.id}
                                  onClick={() =>
                                    handleClickAttachment(
                                      selectedEmail.email,
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
                      <div
                        className={style.previewBodyHtml}
                        onClick={(event) => {
                          const target = event.target as HTMLElement;
                          const anchor = target.closest('a') as HTMLAnchorElement | null;
                          if (!anchor || !selectedEmail) return;
                          const href = anchor.getAttribute('href');
                          if (!href || href.startsWith('#')) return;
                          event.preventDefault();
                          if (selectedEmail.email.isMalwareTrap) {
                            triggerMalwareEvent(selectedEmail.email, 'email_open');
                            return;
                          }
                          gameEventBus.emit('browser:navigate_to_url', {
                            url: href,
                            source: 'email',
                            emailId: selectedEmail.email.id,
                          });
                        }}
                        ref={previewBodyRef}
                      >
                        {selectedEmail.email.bodyHtml ? (
                          <div
                            dangerouslySetInnerHTML={{
                              __html: selectedEmail.email.bodyHtml,
                            }}
                          />
                        ) : (
                          selectedEmailBody
                        )}
                      </div>
                    </div>
                  </Fragment>
                )}
              </div>
            </div>
          </div>

          <div className={style.statusBar}>
            <div className={`${style.statusCell} ${style.statusCellLeft}`}>
              {accountToAddressMap[accountId]} | Unread: {unreadInCurrentFolderCount}
            </div>
            <div className={`${style.statusCell} ${style.statusCellMiddle}`}>
              {folderEmails.length} message{folderEmails.length === 1 ? '' : 's'}
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
            prompt="This attachment is encrypted. Enter encryption key:"
          />
        </div>
      }
    />
  );
};

export default EmailClient;
