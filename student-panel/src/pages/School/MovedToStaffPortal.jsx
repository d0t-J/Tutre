import { useTranslation } from 'react-i18next';
import { ExternalLink, MoveRight } from 'lucide-react';
import { STAFF_PORTAL_URL } from '../../services/portals';
import { primaryButtonClass } from '../../features/school/utils/school';

// /school and /teaching moved to the staff portal in Phase 5a. Old links and
// bookmarks land here for one release, then the routes are removed.
export default function MovedToStaffPortal({ path }) {
  const { t } = useTranslation('school');
  return (
    <div className="max-w-xl mx-auto p-4 sm:p-6 lg:p-8">
      <section className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-100 space-y-3">
        <div className="flex items-center gap-2">
          <MoveRight className="w-5 h-5 text-primary-600 rtl:-scale-x-100" />
          <h1 className="text-lg font-extrabold text-slate-800">{t('moved.title')}</h1>
        </div>
        <p className="text-sm text-slate-600">{t('moved.message')}</p>
        {STAFF_PORTAL_URL ? (
          <a href={`${STAFF_PORTAL_URL}${path}`} className={primaryButtonClass}>
            <ExternalLink className="w-4 h-4" /> {t('moved.open')}
          </a>
        ) : (
          <p className="text-sm text-slate-500">{t('moved.noLink')}</p>
        )}
      </section>
    </div>
  );
}
