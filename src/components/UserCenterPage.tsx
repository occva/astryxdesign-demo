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
import {uiCopy, type Locale} from '../localization';

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

export function UserCenterPage({
  locale,
  onProfileUpdated,
}: {
  locale: Locale;
  onProfileUpdated?: (profile: UserProfile) => void;
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
        <Text type="body">{copy.loading}</Text>
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
      onProfileUpdated?.(profile);
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

  const profileStatusColor = data.profile.status === copy.offlineStatus
    ? 'gray'
    : data.profile.status === copy.busyStatus
      ? 'orange'
      : 'green';

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
              label={copy.editProfile}
              variant="secondary"
              icon={<Icon icon={PencilSquareIcon} size="sm" />}
              onClick={openProfileDialog}
            />
            <Button
              label={copy.securitySettings}
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
                  <Heading level={3}>{copy.profileDetails}</Heading>
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
                  <Heading level={3}>{copy.contactDetails}</Heading>
                </VStack>
              </HStack>
              <Divider />
              <DetailGrid items={data.contactDetails} />
              <HStack gap={2} wrap="wrap">
                <Button
                  label={copy.sendEmail}
                  variant="secondary"
                  icon={<Icon icon={EnvelopeIcon} size="sm" />}
                  onClick={() => {
                    window.location.href = `mailto:${data.profile.email}`;
                  }}
                />
                <Button
                  label={copy.callPhone}
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
                  <Heading level={3}>{copy.organization}</Heading>
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
            <Heading level={2}>{copy.editTitle}</Heading>
          </StackItem>
          <StackItem size="fill" className="dialogScrollArea">
            {profileDraft ? (
              <VStack gap={4}>
                {profileMessage ? (
                  <Banner status="error" title={profileMessage} container="card" />
                ) : null}
                <Grid columns={{minWidth: 220}} gap={4}>
                  <TextInput
                    label={copy.name}
                    value={profileDraft.name}
                    isRequired
                    onChange={name => setProfileDraft(current => current ? {...current, name} : current)}
                  />
                  <TextInput
                    label={copy.jobTitle}
                    value={profileDraft.title}
                    onChange={title => setProfileDraft(current => current ? {...current, title} : current)}
                  />
                  <TextInput
                    label={copy.department}
                    value={profileDraft.department}
                    onChange={department => setProfileDraft(current => current ? {...current, department} : current)}
                  />
                  <TextInput
                    label={copy.manager}
                    value={profileDraft.manager}
                    onChange={manager => setProfileDraft(current => current ? {...current, manager} : current)}
                  />
                  <TextInput
                    label={copy.email}
                    value={profileDraft.email}
                    type="email"
                    onChange={email => setProfileDraft(current => current ? {...current, email} : current)}
                  />
                  <TextInput
                    label={copy.phone}
                    value={profileDraft.phone}
                    onChange={phone => setProfileDraft(current => current ? {...current, phone} : current)}
                  />
                  <TextInput
                    label={copy.location}
                    value={profileDraft.location}
                    onChange={location => setProfileDraft(current => current ? {...current, location} : current)}
                  />
                  <Selector
                    label={copy.status}
                    value={profileDraft.status}
                    options={data.statusOptions}
                    onChange={status => setProfileDraft(current => current ? {...current, status} : current)}
                  />
                </Grid>
              </VStack>
            ) : null}
          </StackItem>
          <HStack hAlign="end" gap={2} className="dialogFooter">
            <Button label={copy.cancel} variant="secondary" onClick={() => setIsProfileDialogOpen(false)} />
            <Button label={copy.save} isLoading={isProfileSaving} onClick={saveProfile} />
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
            <Heading level={2}>{copy.securityTitle}</Heading>
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
            <Button label={copy.done} onClick={() => setIsSecurityDialogOpen(false)} />
          </HStack>
        </VStack>
      </Dialog>
    </VStack>
  );
}
