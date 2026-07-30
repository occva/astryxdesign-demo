import {useState} from 'react';
import {AppShell} from '@astryxdesign/core/AppShell';
import {Banner} from '@astryxdesign/core/Banner';
import {Button} from '@astryxdesign/core/Button';
import {Card} from '@astryxdesign/core/Card';
import {Center} from '@astryxdesign/core/Center';
import {Icon} from '@astryxdesign/core/Icon';
import {Link} from '@astryxdesign/core/Link';
import {Heading, Text} from '@astryxdesign/core/Text';
import {TextInput} from '@astryxdesign/core/TextInput';
import {HStack, VStack} from '@astryxdesign/core/Stack';
import {
  ArrowRightEndOnRectangleIcon,
  EnvelopeIcon,
  LanguageIcon,
  LockClosedIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import {mockApi} from '../services/mockApi';
import type {AppConfig, AuthSession, AuthUser} from '../types';
import {uiCopy, type Locale} from '../localization';

type AuthMode = 'login' | 'register';

export function AuthPage({
  appConfig,
  authUsers,
  locale,
  onLocaleToggle,
  onComplete,
}: {
  appConfig: AppConfig;
  authUsers: AuthUser[];
  locale: Locale;
  onLocaleToggle: () => void;
  onComplete: (session: AuthSession) => void;
}) {
  const copy = uiCopy[locale].auth;
  const defaultUser = authUsers[0] ?? {name: '', email: '', password: ''};
  const [mode, setMode] = useState<AuthMode>('login');
  const [name, setName] = useState(defaultUser.name);
  const [email, setEmail] = useState(defaultUser.email);
  const [password, setPassword] = useState(defaultUser.password);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isRegister = mode === 'register';
  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setMessage(null);
  };
  const submit = async () => {
    if (isRegister && name.trim().length === 0) {
      setMessage(copy.nameRequired);
      return;
    }
    if (!email.includes('@')) {
      setMessage(copy.emailInvalid);
      return;
    }
    if (password.length < 6) {
      setMessage(copy.passwordShort);
      return;
    }
    setIsSubmitting(true);
    try {
      let session: AuthSession;
      if (isRegister) {
        session = await mockApi.registerAuthUser({name, email, password});
      } else {
        session = await mockApi.login(email, password);
      }
      setMessage(null);
      onComplete(session);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : copy.failed);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell height="fill" variant="wash" contentPadding={0} mobileNav={false}>
      <Center minHeight="100dvh" width="100%" className="authPage">
        <VStack gap={4} className="authPanel">
          <HStack hAlign="end" width="100%">
            <Button
              label={locale === 'en' ? '中文' : 'EN'}
              size="sm"
              variant="ghost"
              icon={<Icon icon={LanguageIcon} size="sm" />}
              onClick={onLocaleToggle}
            />
          </HStack>
          <VStack gap={2} hAlign="center">
            <img
              className="authBrandIcon"
              src="/astryx-team.png"
              alt=""
              aria-hidden="true"
            />
            <Text type="supporting" color="secondary">{appConfig.profile.name}</Text>
          </VStack>
          <Card padding={8} width="100%">
            <VStack gap={4}>
              <VStack gap={1}>
                <Heading level={1}>{isRegister ? copy.registerTitle : copy.loginTitle}</Heading>
                <Text type="supporting" color="secondary">
                  {isRegister ? copy.registerDescription : copy.loginDescription}
                </Text>
              </VStack>
              {message ? (
                <Banner status="error" title={message} container="card" />
              ) : null}
              {isRegister ? (
                <TextInput
                  label={copy.name}
                  value={name}
                  startIcon={UserIcon}
                  isRequired
                  hasAutoFocus
                  onChange={setName}
                />
              ) : null}
              <TextInput
                label={copy.email}
                value={email}
                type="email"
                startIcon={EnvelopeIcon}
                isRequired
                hasAutoFocus={!isRegister}
                onChange={setEmail}
              />
              <TextInput
                label={copy.password}
                value={password}
                type="password"
                startIcon={LockClosedIcon}
                isRequired
                onChange={setPassword}
              />
              <Button
                label={isRegister ? copy.registerAction : copy.loginAction}
                variant="primary"
                icon={<Icon icon={ArrowRightEndOnRectangleIcon} size="sm" />}
                isLoading={isSubmitting}
                onClick={submit}
              />
              <HStack gap={1} hAlign="center" wrap="wrap">
                <Text type="supporting" color="secondary">
                  {isRegister ? copy.hasAccount : copy.newHere}
                </Text>
                <Link
                  href={isRegister ? '#login' : '#register'}
                  isStandalone
                  onClick={event => {
                    event.preventDefault();
                    switchMode(isRegister ? 'login' : 'register');
                  }}
                >
                  {isRegister ? copy.loginAction : copy.registerTitle}
                </Link>
              </HStack>
            </VStack>
          </Card>
        </VStack>
      </Center>
    </AppShell>
  );
}
