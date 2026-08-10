import {useEffect, useId, useState, type ChangeEvent, type ReactElement, type ReactNode} from 'react';
import {
  Buildings,
  EnvelopeSimple,
  IdentificationCard,
  PencilSimpleLine,
  Phone,
  ShieldCheck,
} from './vercel-icons';
import {mockApi} from '../services/mockApi';
import type {SecuritySetting, UserCenterData, UserProfile} from '../types';
import {
  Avatar,
  Badge,
  Banner,
  Button,
  Card,
  Dialog,
  FormInput,
  FormSelect,
  SectionTitle,
  StatusBadge,
  Switch,
  Text,
  colorToBadgeVariant,
} from './report-ui';
import {uiCopy, type Locale} from '../localization';

function DetailGrid({items}: {items: Array<{label: string; value: string}>}) {
  return (
    <dl className="vbg-user-detail-grid">
      {items.map(item => (
        <div key={item.label} className="vbg-user-detail-grid__item">
          <Text as="dt" variant="secondary" size="sm">{item.label}</Text>
          <Text as="dd" truncate>{item.value}</Text>
        </div>
      ))}
    </dl>
  );
}

function ProfileFormSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactElement;
  children: ReactNode;
}) {
  return (
    <section className="vbg-custom-group">
      <div className="vbg-user-section">
        <SectionTitle
          title={<span className="vbg-user-section-title">{icon}{title}</span>}
        />
        {children}
      </div>
    </section>
  );
}

function ProfileDialog({
  open,
  profileDraft,
  data,
  message,
  isSaving,
  locale,
  onOpenChange,
  onDraftChange,
  onSave,
}: {
  open: boolean;
  profileDraft: UserProfile | null;
  data: UserCenterData;
  message: string | null;
  isSaving: boolean;
  locale: Locale;
  onOpenChange: (open: boolean) => void;
  onDraftChange: (profile: UserProfile) => void;
  onSave: () => void;
}) {
  const copy = uiCopy[locale].userCenter;
  const avatarInputId = useId();
  const updateAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    if (!file || !profileDraft) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onDraftChange({...profileDraft, avatarUrl: reader.result});
      }
    };
    reader.readAsDataURL(file);
    event.currentTarget.value = '';
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog size="xl" className="vbg-user-profile-dialog">
        <div className="vbg-custom-dialog__header">
          <Dialog.Title>{copy.editTitle}</Dialog.Title>
        </div>
        <div className="vbg-user-profile-dialog__content">
          {profileDraft ? (
            <div className="vbg-user-section">
              {message ? <Banner variant="error" title={message} /> : null}
              <div className="vbg-user-section">
                <section className="vbg-custom-group">
                  <div className="vbg-user-avatar-editor">
                    <Avatar
                      name={profileDraft.name}
                      src={profileDraft.avatarUrl}
                      className="vbg-user-avatar-editor__avatar"
                    />
                    <div className="vbg-user-avatar-editor__body">
                      <div className="vbg-user-avatar-editor__copy">
                        <Text size="sm" bold>{copy.avatar}</Text>
                        <Text variant="secondary" size="sm">{copy.avatarHint}</Text>
                      </div>
                      <div>
                        <input
                          id={avatarInputId}
                          className="vbg-visually-hidden"
                          type="file"
                          accept="image/*"
                          onChange={updateAvatar}
                        />
                        <label
                          className="vbg-button vbg-button--secondary vbg-user-file-button"
                          htmlFor={avatarInputId}
                        >
                          {copy.chooseAvatar}
                        </label>
                      </div>
                    </div>
                  </div>
                </section>

                <ProfileFormSection
                  title={copy.profileDetails}
                  icon={<IdentificationCard className="vbg-custom-icon vbg-custom-icon--lg" />}
                >
                  <div className="vbg-user-form-grid">
                    <FormInput
                      label={copy.name}
                      value={profileDraft.name}
                      required
                      onValueChange={name => onDraftChange({...profileDraft, name})}
                    />
                    <FormInput
                      label={copy.location}
                      value={profileDraft.location}
                      onValueChange={location => onDraftChange({...profileDraft, location})}
                    />
                    <FormSelect
                      label={copy.status}
                      value={profileDraft.status}
                      options={data.statusOptions}
                      onValueChange={status => onDraftChange({...profileDraft, status})}
                    />
                  </div>
                </ProfileFormSection>

                <ProfileFormSection
                  title={copy.contactDetails}
                  icon={<Phone className="vbg-custom-icon vbg-custom-icon--lg" />}
                >
                  <div className="vbg-user-form-grid">
                    <FormInput
                      label={copy.email}
                      value={profileDraft.email}
                      type="email"
                      onValueChange={email => onDraftChange({...profileDraft, email})}
                    />
                    <FormInput
                      label={copy.phone}
                      value={profileDraft.phone}
                      onValueChange={phone => onDraftChange({...profileDraft, phone})}
                    />
                    <FormInput
                      label={copy.enterpriseWechat}
                      value={profileDraft.enterpriseWechat}
                      onValueChange={enterpriseWechat => onDraftChange({...profileDraft, enterpriseWechat})}
                    />
                    <FormInput
                      label={copy.emergencyContact}
                      value={profileDraft.emergencyContact}
                      onValueChange={emergencyContact => onDraftChange({...profileDraft, emergencyContact})}
                    />
                  </div>
                </ProfileFormSection>

              </div>
            </div>
          ) : null}
        </div>
        <div className="vbg-custom-dialog__footer">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>{copy.cancel}</Button>
          <Button variant="primary" loading={isSaving} onClick={onSave}>{copy.save}</Button>
        </div>
      </Dialog>
    </Dialog.Root>
  );
}

function SecurityDialog({
  open,
  data,
  message,
  savingSecurityKey,
  locale,
  onOpenChange,
  onMessageDismiss,
  onToggle,
}: {
  open: boolean;
  data: UserCenterData;
  message: string | null;
  savingSecurityKey: SecuritySetting['key'] | null;
  locale: Locale;
  onOpenChange: (open: boolean) => void;
  onMessageDismiss: () => void;
  onToggle: (setting: SecuritySetting, value: boolean) => void;
}) {
  const copy = uiCopy[locale].userCenter;
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog size="lg" className="vbg-user-security-dialog">
        <div className="vbg-user-security-dialog__body">
          <Dialog.Title>{copy.securityTitle}</Dialog.Title>
          {message ? (
            <Banner
              variant="error"
              title={message}
              action={<Button size="sm" variant="secondary" onClick={onMessageDismiss}>{copy.dismiss}</Button>}
            />
          ) : null}
          <div className="vbg-user-section">
            {data.securitySettings.map(setting => (
              <div key={setting.key} className="vbg-custom-group">
                <Switch
                  label={
                    <span className="vbg-user-switch-label">
                      <span>{setting.label}</span>
                      <Text as="span" variant="secondary" size="sm">{setting.description}</Text>
                    </span>
                  }
                  checked={setting.value}
                  transitioning={savingSecurityKey === setting.key}
                  disabled={savingSecurityKey !== null && savingSecurityKey !== setting.key}
                  controlFirst={false}
                  onCheckedChange={value => onToggle(setting, value)}
                />
              </div>
            ))}
          </div>
          <div className="vbg-user-dialog-actions">
            <Button variant="primary" onClick={() => onOpenChange(false)}>{copy.done}</Button>
          </div>
        </div>
      </Dialog>
    </Dialog.Root>
  );
}

export function UserCenterPanel({
  locale,
  onProfileSaved,
}: {
  locale: Locale;
  onProfileSaved?: (profile: UserProfile) => void;
}) {
  const copy = uiCopy[locale].userCenter;
  const [data, setData] = useState<UserCenterData | null>(null);
  const [profileDraft, setProfileDraft] = useState<UserProfile | null>(null);
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [isSecurityDialogOpen, setIsSecurityDialogOpen] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [securityMessage, setSecurityMessage] = useState<string | null>(null);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [savingSecurityKey, setSavingSecurityKey] = useState<SecuritySetting['key'] | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      mockApi.getUserProfile(),
      mockApi.getUserStatusOptions(),
      mockApi.getUserProfileDetails(),
      mockApi.getSecuritySettings(),
    ]).then(([profile, statusOptions, details, securitySettings]) => {
      if (mounted) {
        setData({
          profile,
          statusOptions,
          securitySettings,
          ...details,
        });
      }
    });
    return () => {
      mounted = false;
    };
  }, [locale]);

  if (!data) {
    return (
      <Card>
        <Text>{copy.loading}</Text>
      </Card>
    );
  }

  const openProfileDialog = () => {
    setProfileDraft({...data.profile});
    setProfileMessage(null);
    setIsProfileDialogOpen(true);
  };

  const saveProfile = async () => {
    if (!profileDraft) return;
    setIsProfileSaving(true);
    try {
      const profile = await mockApi.updateUserProfile(profileDraft);
      const details = await mockApi.getUserProfileDetails();
      setData(current => current ? {...current, profile, ...details} : current);
      onProfileSaved?.(profile);
      setProfileMessage(null);
      setIsProfileDialogOpen(false);
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : copy.profileSaveFailed);
    } finally {
      setIsProfileSaving(false);
    }
  };

  const updateSecuritySetting = async (setting: SecuritySetting, value: boolean) => {
    const nextSettings = data.securitySettings.map(item => (
      item.key === setting.key ? {...item, value} : item
    ));
    const previous = data.securitySettings;
    setSavingSecurityKey(setting.key);
    setSecurityMessage(null);
    setData(current => current ? {...current, securitySettings: nextSettings} : current);
    try {
      const next = await mockApi.updateSecuritySettings(nextSettings);
      setData(current => current ? {...current, securitySettings: next} : current);
    } catch (error) {
      setSecurityMessage(error instanceof Error ? error.message : copy.securitySaveFailed);
      setData(current => current ? {...current, securitySettings: previous} : current);
    } finally {
      setSavingSecurityKey(null);
    }
  };

  const profileStatusTone = data.profile.status === copy.offlineStatus
    ? 'neutral'
    : data.profile.status === copy.busyStatus
      ? 'warning'
      : 'success';

  return (
    <div className="vbg-user-page">
      <Card>
        <div className="vbg-user-hero">
          <div className="vbg-user-hero__identity">
            <Avatar name={data.profile.name} src={data.profile.avatarUrl} size="lg" />
            <div className="vbg-user-hero__copy">
              <div className="vbg-user-hero__name">
                <Text variant="heading1" as="h1">{data.profile.name}</Text>
                <StatusBadge tone={profileStatusTone}>{data.profile.status}</StatusBadge>
              </div>
              <Text variant="secondary">
                {data.profile.title} · {data.profile.department} · {data.profile.employeeId}
              </Text>
              <div className="vbg-user-meta-row">
                <Badge variant="neutral">{data.profile.account}</Badge>
                <Badge variant="blue">{data.profile.email}</Badge>
                <Badge variant="neutral">{data.profile.location}</Badge>
              </div>
            </div>
          </div>
          <div className="vbg-user-hero__actions">
            <Button variant="secondary" icon={PencilSimpleLine} onClick={openProfileDialog}>{copy.editProfile}</Button>
            <Button variant="primary" icon={ShieldCheck} onClick={() => setIsSecurityDialogOpen(true)}>{copy.securitySettings}</Button>
          </div>
        </div>
      </Card>

      <div className="vbg-user-grid">
        <div className="vbg-user-section">
          <Card>
            <div className="vbg-user-section">
              <SectionTitle title={<span className="vbg-user-section-title"><IdentificationCard className="vbg-custom-icon vbg-custom-icon--lg" />{copy.profileDetails}</span>} />
              <DetailGrid items={data.personalDetails} />
            </div>
          </Card>

          <Card>
            <div className="vbg-user-section">
              <SectionTitle title={<span className="vbg-user-section-title"><Phone className="vbg-custom-icon vbg-custom-icon--lg" />{copy.contactDetails}</span>} />
              <DetailGrid items={data.contactDetails} />
              <div className="vbg-user-button-row">
                <Button
                  variant="secondary"
                  icon={EnvelopeSimple}
                  onClick={() => {
                    window.location.href = `mailto:${data.profile.email}`;
                  }}
                >
                  {copy.sendEmail}
                </Button>
                <Button
                  variant="secondary"
                  icon={Phone}
                  onClick={() => {
                    window.location.href = `tel:${data.profile.phone.replace(/\s/g, '')}`;
                  }}
                >
                  {copy.callPhone}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <div className="vbg-user-section">
            <SectionTitle title={<span className="vbg-user-section-title"><Buildings className="vbg-custom-icon vbg-custom-icon--lg" />{copy.organization}</span>} />
            <DetailGrid items={data.organizationDetails} />
            <div className="vbg-user-meta-row">
              <Badge variant="purple">{data.profile.role}</Badge>
              <Badge variant={colorToBadgeVariant('blue')}>{data.profile.department}</Badge>
            </div>
          </div>
        </Card>
      </div>

      <ProfileDialog
        open={isProfileDialogOpen}
        profileDraft={profileDraft}
        data={data}
        message={profileMessage}
        isSaving={isProfileSaving}
        locale={locale}
        onOpenChange={setIsProfileDialogOpen}
        onDraftChange={setProfileDraft}
        onSave={saveProfile}
      />

      <SecurityDialog
        open={isSecurityDialogOpen}
        data={data}
        message={securityMessage}
        savingSecurityKey={savingSecurityKey}
        locale={locale}
        onOpenChange={setIsSecurityDialogOpen}
        onMessageDismiss={() => setSecurityMessage(null)}
        onToggle={(setting, value) => {
          void updateSecuritySetting(setting, value);
        }}
      />
    </div>
  );
}

export function UserCenterPage({
  locale,
  onProfileSaved,
}: {
  locale: Locale;
  onProfileSaved?: (profile: UserProfile) => void;
}) {
  return <UserCenterPanel locale={locale} onProfileSaved={onProfileSaved} />;
}
