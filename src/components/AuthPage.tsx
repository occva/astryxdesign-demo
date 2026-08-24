import {useState, type FormEvent} from 'react';
import {useTranslation} from 'react-i18next';
import {Button} from '@cloudflare/kumo/components/button';
import {Checkbox} from '@cloudflare/kumo/components/checkbox';
import {Text} from '@cloudflare/kumo/components/text';
import {useKumoToastManager} from '@cloudflare/kumo/components/toast';
import {SignIn, Translate, UserPlus} from '@phosphor-icons/react';
import {languageRegistry, supportedLanguages, type AppLanguage} from '../i18n';
import {authApi} from '../services/authApi';
import type {AuthSession} from '../types';
import {BrandMark} from './BrandMark';
import {Card, FormInput, FormPasswordInput} from './kumo-ui';

type AuthMode = 'login' | 'register';
type AuthForm = {
  name: string;
  account: string;
  email: string;
  password: string;
  confirmPassword: string;
  rememberLogin: boolean;
};

type AuthPageProps = {
  language: AppLanguage;
  onLanguageChange: (language: AppLanguage) => void;
  onComplete: (session: AuthSession) => void;
};

export function AuthPage({language, onLanguageChange, onComplete}: AuthPageProps) {
  const {t} = useTranslation(['auth', 'shell']);
  const toasts = useKumoToastManager();
  const rememberedLogin = authApi.rememberedLogin();
  const [mode, setMode] = useState<AuthMode>('login');
  const [values, setValues] = useState<AuthForm>({
    name: '', account: rememberedLogin?.account ?? '', email: '', password: '', confirmPassword: '',
    rememberLogin: Boolean(rememberedLogin),
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const setValue = <K extends keyof AuthForm>(key: K, value: AuthForm[K]) =>
    setValues(current => ({...current, [key]: value}));

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    const saved = nextMode === 'login' ? authApi.rememberedLogin() : null;
    setValues(current => ({...current, account: saved?.account ?? current.account, password: '', confirmPassword: ''}));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const error = values.password.length < 6 ? t('passwordShort')
      : !values.account.trim() ? t('accountRequired')
      : mode === 'register' && !values.name.trim() ? t('nameRequired')
      : mode === 'register' && !/^[A-Za-z0-9_-]{3,100}$/.test(values.account) ? t('accountInvalid')
      : mode === 'register' && values.email && !/^\S+@\S+\.\S+$/.test(values.email) ? t('failed')
      : mode === 'register' && values.password !== values.confirmPassword ? t('passwordMismatch') : '';
    if (error) return void toasts.add({title: error, variant: 'error'});
    setIsSubmitting(true);
    try {
      const session = mode === 'login'
        ? await authApi.login(values.account, values.password, values.rememberLogin)
        : await authApi.register({name: values.name, account: values.account, email: values.email || undefined, password: values.password});
      onComplete(session);
    } catch (cause) {
      toasts.add({title: cause instanceof Error ? cause.message : t('failed'), variant: 'error'});
    } finally {
      setIsSubmitting(false);
    }
  };

  const cycleLanguage = () => {
    const currentIndex = supportedLanguages.indexOf(language);
    onLanguageChange(supportedLanguages[(currentIndex + 1) % supportedLanguages.length]);
  };

  return (
    <main className="relative grid min-h-screen place-items-center bg-kumo-canvas px-6 py-10">
      <Button
        className="absolute right-6 top-6"
        shape="square"
        variant="secondary"
        icon={Translate}
        aria-label={languageRegistry[language].label}
        title={languageRegistry[language].label}
        onClick={cycleLanguage}
      />
      <section className="flex w-full max-w-[24rem] flex-col gap-5">
        <header className="flex flex-col items-center gap-2 text-center">
          <BrandMark />
          <Text variant="secondary" size="sm">{t('shell:title')}</Text>
        </header>
        <Card className="p-6 sm:p-7">
          <form className="flex flex-col gap-5" onSubmit={submit}>
            <header className="flex flex-col gap-1">
              <Text variant="heading2" as="h1">
                {t(mode === 'login' ? 'loginTitle' : 'registerTitle')}
              </Text>
              {mode === 'register' ? (
                <Text variant="secondary" size="sm">{t('registerDescription')}</Text>
              ) : null}
            </header>
            <section className="flex flex-col gap-4">
              {mode === 'register' ? (
                <FormInput label={t('name')} value={values.name} autoComplete="name" required autoFocus onValueChange={value => setValue('name', value)} />
              ) : null}
              <FormInput
                label={t('account')}
                value={values.account}
                description={mode === 'register' ? t('accountHint') : undefined}
                autoComplete="username"
                required
                autoFocus={mode === 'login'}
                onValueChange={value => setValue('account', value)}
              />
              {mode === 'register' ? (
                <FormInput label={t('email')} value={values.email} type="email" autoComplete="email" onValueChange={value => setValue('email', value)} />
              ) : null}
              <FormPasswordInput
                label={t('password')}
                value={values.password}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                required
                showLabel={t('showPassword')}
                hideLabel={t('hidePassword')}
                onValueChange={value => setValue('password', value)}
              />
              {mode === 'register' ? (
                <FormPasswordInput
                  label={t('confirmPassword')}
                  value={values.confirmPassword}
                  autoComplete="new-password"
                  required
                  showLabel={t('showConfirmPassword')}
                  hideLabel={t('hideConfirmPassword')}
                  onValueChange={value => setValue('confirmPassword', value)}
                />
              ) : (
                <Checkbox
                  label={t('rememberLogin')}
                  checked={values.rememberLogin}
                  onCheckedChange={checked => {
                    setValue('rememberLogin', checked);
                    if (!checked) authApi.forgetRememberedLogin();
                  }}
                />
              )}
            </section>
            <Button
              className="w-full justify-center"
              variant="primary"
              type="submit"
              icon={mode === 'login' ? SignIn : UserPlus}
              loading={isSubmitting}
            >
              {t(mode === 'login' ? 'loginAction' : 'registerAction')}
            </Button>
            <footer className="flex items-center justify-center gap-1">
              <Text variant="secondary" size="sm">{t(mode === 'login' ? 'noAccount' : 'hasAccount')}</Text>
              <Button variant="ghost" size="sm" type="button" onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}>
                {t(mode === 'login' ? 'goRegister' : 'backToLogin')}
              </Button>
            </footer>
          </form>
        </Card>
      </section>
    </main>
  );
}
