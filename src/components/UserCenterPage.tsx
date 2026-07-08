import {useEffect, useState} from 'react';
import {Avatar} from '@astryxdesign/core/Avatar';
import {Banner} from '@astryxdesign/core/Banner';
import {Button} from '@astryxdesign/core/Button';
import {Card} from '@astryxdesign/core/Card';
import {Dialog} from '@astryxdesign/core/Dialog';
import {Divider} from '@astryxdesign/core/Divider';
import {Grid} from '@astryxdesign/core/Grid';
import {Icon} from '@astryxdesign/core/Icon';
import {Selector} from '@astryxdesign/core/Selector';
import {Switch} from '@astryxdesign/core/Switch';
import {TextInput} from '@astryxdesign/core/TextInput';
import {Heading, Text} from '@astryxdesign/core/Text';
import {HStack, StackItem, VStack} from '@astryxdesign/core/Stack';
import {Token} from '@astryxdesign/core/Token';
import {
  BuildingOffice2Icon,
  EnvelopeIcon,
  IdentificationIcon,
  PencilSquareIcon,
  PhoneIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import {mockApi} from '../services/mockApi';
import type {SecuritySetting, UserCenterData, UserProfile} from '../types';

function DetailGrid({items}: {items: Array<{label: string; value: string}>}) {
  return (
    <Grid columns={{minWidth: 180}} gap={4}>
      {items.map(item => (
        <VStack key={item.label} gap={0.5} className="profileDetailItem">
          <Text type="supporting" color="secondary">{item.label}</Text>
          <Text type="body">{item.value}</Text>
        </VStack>
      ))}
    </Grid>
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
        <Text type="body">正在加载用户中心...</Text>
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

  const profileStatusColor = data.profile.status === '离线待命' ? 'gray' : data.profile.status === '忙碌处理中' ? 'orange' : 'green';

  return (
    <VStack gap={5} className="userCenterPage">
      <Card className="profileHero">
        <HStack hAlign="between" vAlign="center" wrap="wrap" gap={5}>
          <HStack gap={4} vAlign="center" className="profileIdentity">
            <Avatar name={data.profile.name} size="large" />
            <VStack gap={1}>
              <HStack gap={2} vAlign="center" wrap="wrap">
                <Heading level={1}>{data.profile.name}</Heading>
                <Token label={data.profile.status} color={profileStatusColor} size="sm" />
              </HStack>
              <Text type="body" color="secondary">
                {data.profile.title} · {data.profile.department} · {data.profile.employeeId}
              </Text>
              <HStack gap={2} wrap="wrap">
                <Token label={data.profile.account} color="gray" size="sm" />
                <Token label={data.profile.email} color="blue" size="sm" />
                <Token label={data.profile.location} color="gray" size="sm" />
              </HStack>
            </VStack>
          </HStack>
          <HStack gap={2} vAlign="center" className="profileActions">
            <Button
              label="编辑资料"
              variant="secondary"
              icon={<Icon icon={PencilSquareIcon} size="sm" />}
              onClick={openProfileDialog}
            />
            <Button
              label="安全设置"
              icon={<Icon icon={ShieldCheckIcon} size="sm" />}
              onClick={() => setIsSecurityDialogOpen(true)}
            />
          </HStack>
        </HStack>
      </Card>

      <Grid gap={4} align="start" className="userCenterMainGrid">
        <VStack gap={4} className="userCenterPrimaryColumn">
          <Card>
            <VStack gap={4}>
              <HStack gap={3} vAlign="center">
                <Icon icon={IdentificationIcon} size="md" />
                <VStack gap={0}>
                  <Heading level={3}>基本资料</Heading>
                </VStack>
              </HStack>
              <Divider />
              <DetailGrid items={data.personalDetails} />
            </VStack>
          </Card>

          <Card>
            <VStack gap={4}>
              <HStack gap={3} vAlign="center">
                <Icon icon={PhoneIcon} size="md" />
                <VStack gap={0}>
                  <Heading level={3}>联系方式</Heading>
                </VStack>
              </HStack>
              <Divider />
              <DetailGrid items={data.contactDetails} />
              <HStack gap={2} wrap="wrap">
                <Button
                  label="发送邮件"
                  variant="secondary"
                  icon={<Icon icon={EnvelopeIcon} size="sm" />}
                  onClick={() => {
                    window.location.href = `mailto:${data.profile.email}`;
                  }}
                />
                <Button
                  label="拨打电话"
                  variant="secondary"
                  icon={<Icon icon={PhoneIcon} size="sm" />}
                  onClick={() => {
                    window.location.href = `tel:${data.profile.phone.replace(/\s/g, '')}`;
                  }}
                />
              </HStack>
            </VStack>
          </Card>
        </VStack>

        <VStack gap={4} className="userCenterSideColumn">
          <Card>
            <VStack gap={4}>
              <HStack gap={3} vAlign="center">
                <Icon icon={BuildingOffice2Icon} size="md" />
                <VStack gap={0}>
                  <Heading level={3}>组织身份</Heading>
                </VStack>
              </HStack>
              <Divider />
              <DetailGrid items={data.organizationDetails} />
              <HStack gap={2} wrap="wrap">
                <Token label={data.profile.role} color="purple" size="sm" />
                <Token label={data.profile.department} color="blue" size="sm" />
              </HStack>
            </VStack>
          </Card>
        </VStack>
      </Grid>

      <Dialog
        isOpen={isProfileDialogOpen}
        onOpenChange={open => !open && setIsProfileDialogOpen(false)}
        width="min(45rem, calc(100vw - var(--spacing-12)))"
        maxHeight="min(82dvh, 46rem)"
        padding={0}
        purpose="form"
      >
        <VStack gap={0} className="dialogFrame formDialog">
          <StackItem className="dialogHeader">
            <Heading level={2}>编辑资料</Heading>
          </StackItem>
          <StackItem size="fill" className="dialogScrollArea">
            {profileDraft ? (
              <VStack gap={4}>
                {profileMessage ? (
                  <Banner status="error" title={profileMessage} container="card" />
                ) : null}
                <Grid columns={{minWidth: 220}} gap={4}>
                  <TextInput
                    label="姓名"
                    value={profileDraft.name}
                    isRequired
                    onChange={name => setProfileDraft(current => current ? {...current, name} : current)}
                  />
                  <TextInput
                    label="岗位"
                    value={profileDraft.title}
                    onChange={title => setProfileDraft(current => current ? {...current, title} : current)}
                  />
                  <TextInput
                    label="所属部门"
                    value={profileDraft.department}
                    onChange={department => setProfileDraft(current => current ? {...current, department} : current)}
                  />
                  <TextInput
                    label="直属上级"
                    value={profileDraft.manager}
                    onChange={manager => setProfileDraft(current => current ? {...current, manager} : current)}
                  />
                  <TextInput
                    label="邮箱"
                    value={profileDraft.email}
                    type="email"
                    onChange={email => setProfileDraft(current => current ? {...current, email} : current)}
                  />
                  <TextInput
                    label="手机号"
                    value={profileDraft.phone}
                    onChange={phone => setProfileDraft(current => current ? {...current, phone} : current)}
                  />
                  <TextInput
                    label="办公地点"
                    value={profileDraft.location}
                    onChange={location => setProfileDraft(current => current ? {...current, location} : current)}
                  />
                  <Selector
                    label="当前状态"
                    value={profileDraft.status}
                    options={data.statusOptions}
                    onChange={status => setProfileDraft(current => current ? {...current, status} : current)}
                  />
                </Grid>
              </VStack>
            ) : null}
          </StackItem>
          <HStack hAlign="end" gap={2} className="dialogFooter">
            <Button label="取消" variant="secondary" onClick={() => setIsProfileDialogOpen(false)} />
            <Button label="保存" isLoading={isProfileSaving} onClick={saveProfile} />
          </HStack>
        </VStack>
      </Dialog>

      <Dialog
        isOpen={isSecurityDialogOpen}
        onOpenChange={open => !open && setIsSecurityDialogOpen(false)}
        width="min(32.5rem, calc(100vw - var(--spacing-12)))"
        maxHeight="min(82dvh, 46rem)"
        padding={0}
        purpose="form"
      >
        <VStack gap={0} className="dialogFrame">
          <StackItem className="dialogHeader">
            <Heading level={2}>安全设置</Heading>
          </StackItem>
          <StackItem className="dialogContent">
            <VStack gap={4}>
              {securityMessage ? (
                <Banner
                  status="error"
                  title={securityMessage}
                  container="card"
                  isDismissable
                  onDismiss={() => setSecurityMessage(null)}
                />
              ) : null}
              {data.securitySettings.map(setting => (
                <Switch
                  key={setting.key}
                  label={setting.label}
                  value={setting.value}
                  isLoading={savingSecurityKey === setting.key}
                  isDisabled={savingSecurityKey !== null && savingSecurityKey !== setting.key}
                  labelSpacing="spread"
                  onChange={value => {
                    void updateSecuritySetting(setting, value);
                  }}
                />
              ))}
            </VStack>
          </StackItem>
          <HStack hAlign="end" gap={2} className="dialogFooter">
            <Button label="完成" onClick={() => setIsSecurityDialogOpen(false)} />
          </HStack>
        </VStack>
      </Dialog>
    </VStack>
  );
}
