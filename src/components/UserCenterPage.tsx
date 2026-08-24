import {useMemo, useRef, useState, type ReactNode} from 'react';
import {useTranslation} from 'react-i18next';
import {Button} from '@cloudflare/kumo/components/button';
import {Dialog} from '@cloudflare/kumo/components/dialog';
import {Text} from '@cloudflare/kumo/components/text';
import {useKumoToastManager} from '@cloudflare/kumo/components/toast';
import {Buildings, Camera, EnvelopeSimple, IdentificationCard, Key, PencilSimpleLine, Phone} from '@phosphor-icons/react';
import {AuthenticationRequiredError, authApi} from '../services/authApi';
import type {AuthSession} from '../types';
import {currentLanguage, translationMap} from '../i18n';
import {Avatar, Card, FormDateInput, FormInput, SectionTitle, Skeleton} from './kumo-ui';

type Detail = {label: string; value: string; displayValue?: ReactNode};
type ProfileDraft = Pick<AuthSession['user'],
  'name' | 'email' | 'phone' | 'employeeNo' | 'jobTitle' | 'managerName' |
  'enterpriseWechat' | 'emergencyContact' | 'officeLocation' | 'joinedAt'
>;
const emptyProfile: ProfileDraft = {name:'',email:'',phone:'',employeeNo:'',jobTitle:'',managerName:'',enterpriseWechat:'',emergencyContact:'',officeLocation:'',joinedAt:''};

function DetailGrid({items, className}: {items: Detail[]; className?: string}) {
  return (
    <dl className={`grid gap-4 ${className ?? 'sm:grid-cols-2'}`}>
      {items.map((item) => (
        <span key={item.label} className="min-w-0">
          <Text as="dt" variant="secondary" size="sm">{item.label}</Text>
          <Text as="dd" truncate>{item.displayValue ?? item.value}</Text>
        </span>
      ))}
    </dl>
  );
}

function PhoneDisplay({value}: {value: string}) {
  const match = value.match(/1\d{10}/);
  if (!match || match.index === undefined) return value;
  const phone = match[0];
  const before = value.slice(0, match.index);
  const after = value.slice(match.index + phone.length);
  return (
    <>
      {before}
      <span className="inline-flex gap-1 whitespace-nowrap tabular-nums" aria-label={phone}>
        <span>{phone.slice(0, 3)}</span>
        <span>{phone.slice(3, 7)}</span>
        <span>{phone.slice(7)}</span>
      </span>
      {after}
    </>
  );
}

function availableDetails(items: Detail[]) {
  return items.filter((item) => item.value?.trim());
}

function formatDate(value: string, language: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(language, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function UserCenterPage({
  sessionUser,
  onSessionChange,
}: {
  sessionUser?: AuthSession['user'];
  onSessionChange?: (session: AuthSession) => void;
}) {
  const {t} = useTranslation(['userCenter', 'common']);
  const toasts = useKumoToastManager();
  const language = currentLanguage();
  const copy = {
    ...translationMap(['name','account','gender','employeeNo','joinedAt','createdAt','lastLoginAt','phone','email','enterpriseWechat','emergencyContact','department','jobTitle','systemRole','manager','departmentOwner','location','loading','profileSaveFailed','editProfile','profileDetails','contactDetails','sendEmail','callPhone','organization','editTitle','changeAvatar','avatarUploadFailed','changePassword','changePasswordTitle','newPassword','confirmNewPassword','passwordShort','passwordMismatch','passwordChanged','passwordChangeFailed'] as const, key => t(`userCenter:${key}`)),
    ...translationMap(['cancel','save'] as const, key => t(`common:${key}`)),
  };
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [draft, setDraft] = useState(emptyProfile);
  const [passwords, setPasswords] = useState({password:'', confirmation:''});
  const [saving, setSaving] = useState(false);
  const [avatarSaving,setAvatarSaving]=useState(false);
  const avatarPicker=useRef<HTMLInputElement>(null);

  const details = useMemo(() => {
    if (!sessionUser) return null;
    return {
      personal: availableDetails([
        {label: copy.account, value: sessionUser.account},
        {label: copy.gender, value: sessionUser.gender},
        {label: copy.employeeNo, value: sessionUser.employeeNo},
        {label: copy.joinedAt, value: sessionUser.joinedAt},
        {label: copy.createdAt, value: formatDate(sessionUser.createdAt, language)},
        {label: copy.lastLoginAt, value: formatDate(sessionUser.lastLoginAt, language)},
      ]),
      contact: availableDetails([
        {label: copy.phone, value: sessionUser.phone, displayValue: <PhoneDisplay value={sessionUser.phone} />},
        {label: copy.email, value: sessionUser.email},
        {label: copy.enterpriseWechat, value: sessionUser.enterpriseWechat},
        {
          label: copy.emergencyContact,
          value: sessionUser.emergencyContact,
          displayValue: <PhoneDisplay value={sessionUser.emergencyContact} />,
        },
      ]),
      organization: availableDetails([
        {label: copy.department, value: sessionUser.department},
        {label: copy.jobTitle, value: sessionUser.jobTitle},
        {label: copy.systemRole, value: sessionUser.roleName},
        {label: copy.departmentOwner, value: sessionUser.departmentOwner ?? ''},
        {label: copy.location, value: sessionUser.officeLocation},
      ]),
    };
  }, [language, sessionUser, t]);

  if (!sessionUser || !details) {
    return (
      <Card aria-label={copy.loading}>
        <div className="flex items-center gap-4"><Skeleton className="size-16 rounded-full" /><Skeleton className="h-7 w-48" /></div>
      </Card>
    );
  }

  const openEditor = () => {
    setDraft({
      name: sessionUser.name,
      email: sessionUser.email,
      phone: sessionUser.phone,
      employeeNo: sessionUser.employeeNo,
      jobTitle: sessionUser.jobTitle,
      managerName: sessionUser.managerName,
      enterpriseWechat: sessionUser.enterpriseWechat,
      emergencyContact: sessionUser.emergencyContact,
      officeLocation: sessionUser.officeLocation,
      joinedAt: sessionUser.joinedAt,
    });
    setIsEditing(true);
  };

  const save = async () => {
    if (!draft.name.trim() || (draft.email && !/^\S+@\S+\.\S+$/.test(draft.email))) {
      return void toasts.add({title: copy.profileSaveFailed, variant: 'error'});
    }
    setSaving(true);
    try {
      const session = await authApi.updateProfile(draft);
      onSessionChange?.(session);
      setIsEditing(false);
    } catch (error) {
      if (error instanceof AuthenticationRequiredError) return;
      toasts.add({title: error instanceof Error ? error.message : copy.profileSaveFailed, variant: 'error'});
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    const validation = passwords.password.length < 6 ? copy.passwordShort
      : passwords.password !== passwords.confirmation ? copy.passwordMismatch : '';
    if (validation) return void toasts.add({title: validation, variant: 'error'});
    setSaving(true);
    try {
      await authApi.changePassword(passwords.password);
      setIsChangingPassword(false);
      setPasswords({password:'', confirmation:''});
      toasts.add({title:copy.passwordChanged,variant:'success'});
    } catch (error) {
      if (error instanceof AuthenticationRequiredError) return;
      toasts.add({title:error instanceof Error?error.message:copy.passwordChangeFailed,variant:'error'});
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar=async(file:File)=>{
    setAvatarSaving(true);
    try{
      const session=await authApi.updateAvatar(file);
      onSessionChange?.(session);
    }catch(error){
      if(error instanceof AuthenticationRequiredError)return;
      toasts.add({title:error instanceof Error?error.message:copy.avatarUploadFailed,variant:'error'});
    }finally{
      setAvatarSaving(false);
      if(avatarPicker.current)avatarPicker.current.value='';
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <Card>
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="flex min-w-0 items-center gap-4">
              <Avatar name={sessionUser.name} src={sessionUser.avatarUrl} size="lg" />
              <div className="min-w-0">
                <Text variant="heading1" as="h1">{sessionUser.name}</Text>
                <Text variant="secondary">
                  {[sessionUser.roleName, sessionUser.department].filter(Boolean).join(' · ')}
                </Text>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" icon={Key} onClick={() => { setPasswords({password:'', confirmation:''}); setIsChangingPassword(true); }}>{copy.changePassword}</Button>
              <Button variant="secondary" icon={PencilSimpleLine} onClick={openEditor}>{copy.editProfile}</Button>
            </div>
          </div>
          <div className="grid gap-5 border-t border-kumo-line pt-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
            <div className="min-w-0">
              <DetailGrid items={details.contact} className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-4" />
            </div>
            <div className="flex flex-wrap gap-2 xl:justify-end">
              {sessionUser.email ? (
                <Button variant="secondary" icon={EnvelopeSimple} onClick={() => { window.location.href = `mailto:${sessionUser.email}`; }}>
                  {copy.sendEmail}
                </Button>
              ) : null}
              {sessionUser.phone ? (
                <Button variant="secondary" icon={Phone} onClick={() => { window.location.href = `tel:${sessionUser.phone}`; }}>
                  {copy.callPhone}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="h-full">
          <div className="flex flex-col gap-4">
            <SectionTitle title={<span className="inline-flex items-center gap-2"><IdentificationCard className="size-5" />{copy.profileDetails}</span>} />
            <DetailGrid items={details.personal} />
          </div>
        </Card>
        <Card className="h-full">
          <div className="flex flex-col gap-4">
            <SectionTitle title={<span className="inline-flex items-center gap-2"><Buildings className="size-5" />{copy.organization}</span>} />
            <DetailGrid items={details.organization} />
          </div>
        </Card>
      </div>

      <Dialog.Root open={isEditing} onOpenChange={setIsEditing}>
        <Dialog size="xl" className="flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden p-0">
          <div className="border-b border-kumo-line px-6 py-5">
            <Dialog.Title>{copy.editTitle}</Dialog.Title>
          </div>
          <div className="min-h-0 overflow-y-auto px-6 py-5">
            <div className="mb-5 flex items-center gap-4 border-b border-kumo-line pb-5">
              <Avatar name={sessionUser.name} src={sessionUser.avatarUrl} size="lg" />
              <input ref={avatarPicker} className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={event=>{const file=event.target.files?.[0];if(file)void uploadAvatar(file);}} />
              <Button type="button" variant="secondary" icon={Camera} loading={avatarSaving} onClick={()=>avatarPicker.current?.click()}>{copy.changeAvatar}</Button>
            </div>
            <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
              <FormInput label={copy.name} value={draft.name} required onValueChange={name => setDraft(current => ({...current,name}))} />
              <FormInput label={copy.employeeNo} value={draft.employeeNo} onValueChange={employeeNo => setDraft(current => ({...current,employeeNo}))} />
              <FormInput label={copy.email} value={draft.email} type="email" onValueChange={email => setDraft(current => ({...current,email}))} />
              <FormInput label={copy.phone} value={draft.phone} onValueChange={phone => setDraft(current => ({...current,phone}))} />
              <FormInput label={copy.enterpriseWechat} value={draft.enterpriseWechat} onValueChange={enterpriseWechat => setDraft(current => ({...current,enterpriseWechat}))} />
              <FormInput label={copy.emergencyContact} value={draft.emergencyContact} onValueChange={emergencyContact => setDraft(current => ({...current,emergencyContact}))} />
              <FormInput label={copy.jobTitle} value={draft.jobTitle} onValueChange={jobTitle => setDraft(current => ({...current,jobTitle}))} />
              <FormInput label={copy.manager} value={draft.managerName} onValueChange={managerName => setDraft(current => ({...current,managerName}))} />
              <FormInput label={copy.location} value={draft.officeLocation} onValueChange={officeLocation => setDraft(current => ({...current,officeLocation}))} />
              <FormDateInput
                label={copy.joinedAt}
                value={draft.joinedAt}
                locale={language}
                onValueChange={joinedAt => setDraft(current => ({...current,joinedAt}))}
              />
            </div>
          </div>
          <div className="flex shrink-0 justify-end gap-2 border-t border-kumo-line px-6 py-4">
            <Dialog.Close render={<Button variant="secondary">{copy.cancel}</Button>} />
            <Button variant="primary" loading={saving} disabled={!draft.name.trim()} onClick={() => void save()}>{copy.save}</Button>
          </div>
        </Dialog>
      </Dialog.Root>

      <Dialog.Root open={isChangingPassword} onOpenChange={setIsChangingPassword}>
        <Dialog size="base" className="p-6">
          <div className="flex flex-col gap-5">
            <Dialog.Title>{copy.changePasswordTitle}</Dialog.Title>
            <div className="grid gap-4">
              <FormInput label={copy.newPassword} value={passwords.password} type="password" autoComplete="new-password" required onValueChange={password => setPasswords(current => ({...current,password}))} />
              <FormInput label={copy.confirmNewPassword} value={passwords.confirmation} type="password" autoComplete="new-password" required onValueChange={confirmation => setPasswords(current => ({...current,confirmation}))} />
            </div>
            <div className="flex justify-end gap-2">
              <Dialog.Close render={<Button variant="secondary">{copy.cancel}</Button>} />
              <Button variant="primary" loading={saving} disabled={!passwords.password||!passwords.confirmation} onClick={() => void savePassword()}>{copy.changePassword}</Button>
            </div>
          </div>
        </Dialog>
      </Dialog.Root>
    </div>
  );
}
