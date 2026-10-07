import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Archive, ArchiveRestore, Eye, Loader2, Unlink } from 'lucide-react';
import { MaterialRow } from '../../classroom/components/MyMaterials';
import { useSchoolMaterials, useSetMaterialStatus, useSetShares } from '../../classroom/hooks/useMaterials';
import { translateError } from '../../../i18n/errors';
import { secondaryButtonClass } from '../utils/school';

// Everything the school's teachers have made (Phase 5c). School admins can
// look at it, archive it and unshare it, but never edit another person's work.
export default function SchoolMaterialsTab({ data }) {
  const { t } = useTranslation('classroom');
  const { data: materials = [], isLoading, error } = useSchoolMaterials(data.school.id);
  const setStatus = useSetMaterialStatus();
  const setShares = useSetShares();
  const sectionNames = Object.fromEntries(data.sections.map(s => [s.id, s.name]));
  const busy = setStatus.isPending || setShares.isPending;

  const changeStatus = (m, status) => setStatus.mutate({ id: m.id, status }, {
    onSuccess: () => toast.success(t(status === 'archived' ? 'archive.done' : 'archive.restored', { title: m.title })),
    onError: (err) => toast.error(translateError(err, t, 'archive.failed')),
  });
  const unshareAll = (m) => setShares.mutate(
    { id: m.id, current: m.material_shares.map(s => s.section_id), next: [] },
    {
      onSuccess: () => toast.success(t('share.removedAll', { title: m.title })),
      onError: (err) => toast.error(translateError(err, t, 'share.failed')),
    }
  );

  if (isLoading) return <Loader2 className="w-4 h-4 animate-spin text-slate-400" />;
  if (error) return <p className="text-sm text-red-600">{t('loadFailed')}</p>;

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400">{t('schoolTab.note')}</p>
      {materials.length === 0 ? (
        <p className="text-sm text-slate-500">{t('schoolTab.none')}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {materials.map(m => (
            <MaterialRow key={m.id} material={m} sectionNames={sectionNames} byline={m.ownerName ?? t('schoolTab.formerStaff')}>
              <Link to={`/classroom/materials/${m.id}`} className={secondaryButtonClass}>
                <Eye className="w-3.5 h-3.5" /> {t('schoolTab.view')}
              </Link>
              {m.material_shares.length > 0 && (
                <button type="button" disabled={busy} onClick={() => unshareAll(m)} className={secondaryButtonClass}>
                  <Unlink className="w-3.5 h-3.5" /> {t('share.unshareAll')}
                </button>
              )}
              {m.status === 'active' ? (
                <button type="button" disabled={busy} onClick={() => changeStatus(m, 'archived')} className={secondaryButtonClass}>
                  <Archive className="w-3.5 h-3.5" /> {t('archive.button')}
                </button>
              ) : (
                <button type="button" disabled={busy} onClick={() => changeStatus(m, 'active')} className={secondaryButtonClass}>
                  <ArchiveRestore className="w-3.5 h-3.5" /> {t('archive.restore')}
                </button>
              )}
            </MaterialRow>
          ))}
        </ul>
      )}
    </div>
  );
}
