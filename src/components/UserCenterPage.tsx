import {useEffect, useState} from 'react';
import {Banner} from '@cloudflare/kumo/components/banner';
import {Button} from '@cloudflare/kumo/components/button';
import {Dialog} from '@cloudflare/kumo/components/dialog';
import {Switch} from '@cloudflare/kumo/components/switch';
import {Text} from '@cloudflare/kumo/components/text';
import {
  Buildings,
  EnvelopeSimple,
  IdentificationCard,
  PencilSimpleLine,
  Phone,
  ShieldCheck,
} from '@phosphor-icons/react';
import {mockApi} from '../services/mockApi';
import type {SecuritySetting, UserCenterData, UserProfile} from '../types';
import {
  Avatar,
  Card,
  FormInput,
  FormSelect,
  PageTitle,
  SectionTitle,
  StatusBadge,
  colorToBadgeVariant,
} from './kumo-ui';
import {Badge} from '@cloudflare/kumo/components/badge';

function DetailGrid({items}: {items: Array<{label: string; value: string}>}) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      {items.map(item => (
        <div key={item.label} className="min-w-0">
          <Text as="dt" variant="secondary" size="sm">{item.label}</Text>
          <Text as="dd" truncate>{item.value}</Text>
        </div>
      ))}
    </dl>
  );
}

function ProfileDialog({
  open,
  profileDraft,
  data,
  message,
  isSaving,
  onOpenChange,
  onDraftChange,
  onSave,
}: {
  open: boolean;
  profileDraft: UserProfile | null;
  data: UserCenterData;
  message: string | null;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onDraftChange: (profile: UserProfile) => void;
  onSave: () => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog size="xl" className="max-h-[82dvh] overflow-y-auto p-6">
        <div className="flex flex-col gap-5">
          <Dialog.Title>编辑资料</Dialog.Title>
          {profileDraft ? (
            <>
              {message ? <Banner variant="error" title={message} /> : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput
                  label="姓名"
                  value={profileDraft.name}
                  required
                  onValueChange={name => onDraftChange({...profileDraft, name})}
                />
                <FormInput
                  label="岗位"
                  value={profileDraft.title}
                  onValueChange={title => onDraftChange({...profileDraft, title})}
                />
                <FormInput
                  label="所属部门"
                  value={profileDraft.department}
                  onValueChange={department => onDraftChange({...profileDraft, department})}
                />
                <FormInput
                  label="直属上级"
                  value={profileDraft.manager}
                  onValueChange={manager => onDraftChange({...profileDraft, manager})}
                />
                <FormInput
                  label="邮箱"
                  value={profileDraft.email}
                  type="email"
                  onValueChange={email => onDraftChange({...profileDraft, email})}
                />
                <FormInput
                  label="手机号"
                  value={profileDraft.phone}
                  onValueChange={phone => onDraftChange({...profileDraft, phone})}
                />
                <FormInput
                  label="办公地点"
                  value={profileDraft.location}
                  onValueChange={location => onDraftChange({...profileDraft, location})}
                />
                <FormSelect
                  label="当前状态"
                  value={profileDraft.status}
                  options={data.statusOptions}
                  onValueChange={status => onDraftChange({...profileDraft, status})}
                />
              </div>
            </>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>取消</Button>
            <Button variant="primary" loading={isSaving} onClick={onSave}>保存</Button>
          </div>
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
  onOpenChange,
  onMessageDismiss,
  onToggle,
}: {
  open: boolean;
  data: UserCenterData;
  message: string | null;
  savingSecurityKey: SecuritySetting['key'] | null;
  onOpenChange: (open: boolean) => void;
  onMessageDismiss: () => void;
  onToggle: (setting: SecuritySetting, value: boolean) => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog size="lg" className="p-6">
        <div className="flex flex-col gap-5">
          <Dialog.Title>安全设置</Dialog.Title>
          {message ? (
            <Banner
              variant="error"
              title={message}
              action={<Button size="sm" variant="secondary" onClick={onMessageDismiss}>关闭</Button>}
            />
          ) : null}
          <div className="flex flex-col gap-4">
            {data.securitySettings.map(setting => (
              <div key={setting.key} className="rounded-lg border border-kumo-line p-4">
                <Switch
                  label={
                    <span className="flex flex-col gap-1">
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
          <div className="flex justify-end">
            <Button variant="primary" onClick={() => onOpenChange(false)}>完成</Button>
          </div>
        </div>
      </Dialog>
    </Dialog.Root>
  );
}

export function UserCenterPage() {
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
  }, []);

  if (!data) {
    return (
      <Card>
        <Text>正在加载用户中心...</Text>
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
      setProfileMessage(null);
      setIsProfileDialogOpen(false);
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : '资料保存失败，请重试。');
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
      setSecurityMessage(error instanceof Error ? error.message : '安全设置保存失败，已恢复原设置。');
      setData(current => current ? {...current, securitySettings: previous} : current);
    } finally {
      setSavingSecurityKey(null);
    }
  };

  const profileStatusTone = data.profile.status === '离线待命'
    ? 'neutral'
    : data.profile.status === '忙碌处理中'
      ? 'warning'
      : 'success';

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar name={data.profile.name} size="lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Text variant="heading1" as="h1">{data.profile.name}</Text>
                <StatusBadge tone={profileStatusTone}>{data.profile.status}</StatusBadge>
              </div>
              <Text variant="secondary">
                {data.profile.title} · {data.profile.department} · {data.profile.employeeId}
              </Text>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="neutral">{data.profile.account}</Badge>
                <Badge variant="blue">{data.profile.email}</Badge>
                <Badge variant="neutral">{data.profile.location}</Badge>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" icon={PencilSimpleLine} onClick={openProfileDialog}>编辑资料</Button>
            <Button variant="primary" icon={ShieldCheck} onClick={() => setIsSecurityDialogOpen(true)}>安全设置</Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(20rem,0.45fr)]">
        <div className="flex flex-col gap-4">
          <Card>
            <div className="flex flex-col gap-4">
              <SectionTitle title={<span className="inline-flex items-center gap-2"><IdentificationCard className="size-5" />基本资料</span>} />
              <DetailGrid items={data.personalDetails} />
            </div>
          </Card>

          <Card>
            <div className="flex flex-col gap-4">
              <SectionTitle title={<span className="inline-flex items-center gap-2"><Phone className="size-5" />联系方式</span>} />
              <DetailGrid items={data.contactDetails} />
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  icon={EnvelopeSimple}
                  onClick={() => {
                    window.location.href = `mailto:${data.profile.email}`;
                  }}
                >
                  发送邮件
                </Button>
                <Button
                  variant="secondary"
                  icon={Phone}
                  onClick={() => {
                    window.location.href = `tel:${data.profile.phone.replace(/\s/g, '')}`;
                  }}
                >
                  拨打电话
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <div className="flex flex-col gap-4">
            <SectionTitle title={<span className="inline-flex items-center gap-2"><Buildings className="size-5" />组织身份</span>} />
            <DetailGrid items={data.organizationDetails} />
            <div className="flex flex-wrap gap-2">
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
        onOpenChange={setIsProfileDialogOpen}
        onDraftChange={setProfileDraft}
        onSave={saveProfile}
      />

      <SecurityDialog
        open={isSecurityDialogOpen}
        data={data}
        message={securityMessage}
        savingSecurityKey={savingSecurityKey}
        onOpenChange={setIsSecurityDialogOpen}
        onMessageDismiss={() => setSecurityMessage(null)}
        onToggle={(setting, value) => {
          void updateSecuritySetting(setting, value);
        }}
      />
    </div>
  );
}
