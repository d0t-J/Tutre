import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../features/auth';
import { ProfileForm, SchoolCard, useProfile, useClassOptions, useMySchool } from '../../features/profile';
import { MyProgressCard } from '../../features/progress';

function Card({ title, children }) {
  return (
    <section className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100">
      <h2 className="text-lg font-extrabold text-slate-800 mb-4">{title}</h2>
      {children}
    </section>
  );
}

function Loading() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2 text-sm text-slate-500">
      <Loader2 className="w-4 h-4 animate-spin" /> {t('status.loading')}
    </div>
  );
}

export default function Profile() {
  const { t } = useTranslation('profile');
  const { user } = useAuth();
  const profile = useProfile();
  const classes = useClassOptions();
  const school = useMySchool();

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <Card title={t('title')}>
        {profile.isLoading || classes.isLoading ? (
          <Loading />
        ) : profile.error || classes.error ? (
          <p className="text-sm text-red-600">{t('loadFailed')}</p>
        ) : !profile.data ? (
          <p className="text-sm text-red-600">{t('notFound')}</p>
        ) : (
          <ProfileForm profile={profile.data} email={user?.email} classes={classes.data} />
        )}
      </Card>

      <Card title={t('progress:profile.title')}>
        <MyProgressCard />
      </Card>

      <Card title={t('school.title')}>
        {school.isLoading ? (
          <Loading />
        ) : school.error ? (
          <p className="text-sm text-red-600">{t('school.loadFailed')}</p>
        ) : (
          <SchoolCard schools={school.data} />
        )}
      </Card>
    </div>
  );
}
