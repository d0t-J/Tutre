import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Archive, ArchiveRestore, FileText, Loader2, MonitorPlay, Pencil, Plus, Share2, Trash2, Users } from 'lucide-react';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import ShareDialog from './ShareDialog';
import { chapterPath, useDeleteMaterial, useMyMaterials, useSetMaterialStatus } from '../hooks/useMaterials';
import { translateError } from '../../../i18n/errors';
import { formatDate } from '../../../i18n';
import { dangerButtonClass, primaryButtonClass, secondaryButtonClass } from '../../school/utils/school';
import { useAuth } from '../../../context/AuthContext';

const KIND_ICON = { simulation: MonitorPlay, notes: FileText };

// One material in a list: what it is, where it sits in the curriculum, and
// whom it is shared with. actions are buttons for the row.
export function MaterialRow({ material, sectionNames = {}, byline, showShares = true, children }) {
  const { t } = useTranslation('classroom');
  const Icon = KIND_ICON[material.kind];
  const shares = material.material_shares ?? [];
  const origin = material.based_on_simulation_id || material.based_on_topic_id
    ? t('origin.tutre')
    : material.based_on_material_id ? t('origin.school') : null;
  return (
    <li className="flex flex-wrap items-start gap-3 py-3">
      <div className={`p-2 rounded-lg shrink-0 ${material.kind === 'simulation' ? 'bg-primary-50 text-primary-600' : 'bg-amber-50 text-amber-600'}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-bold ${material.status === 'archived' ? 'text-slate-400' : 'text-slate-800'}`}>
          <bdi>{material.title}</bdi>
          {material.status === 'archived' && <span className="ms-2 text-[10px] uppercase tracking-wider text-slate-400">{t('status.archived')}</span>}
        </p>
        <p className="text-xs text-slate-500">
          <bdi>{[chapterPath(material.chapters), material.topic?.name].filter(Boolean).join(' · ')}</bdi>
        </p>
        <p className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-2">
          {byline && <span><bdi>{byline}</bdi></span>}
          <span>{t(`kind.${material.kind}`)}</span>
          {origin && <span>{origin}</span>}
          {material.visibility === 'school' && <span>{t('visibility.inLibrary')}</span>}
          {showShares && (
            <span className="inline-flex items-center gap-1">
              <Users className="w-3 h-3" />
              {shares.length === 0
                ? t('share.none')
                : t('share.with', { count: shares.length, sections: shares.map(s => sectionNames[s.section_id]).filter(Boolean).join(', ') })}
            </span>
          )}
          {material.updated_at && <span>{t('updated', { date: formatDate(material.updated_at) })}</span>}
        </p>
      </div>
      <div className="flex flex-wrap gap-1 ms-auto">{children}</div>
    </li>
  );
}

export default function MyMaterials() {
  const { t } = useTranslation('classroom');
  const { sections, staffOrgs } = useAuth();
  const { data: materials = [], isLoading, error } = useMyMaterials();
  const setStatus = useSetMaterialStatus();
  const deleteMaterial = useDeleteMaterial();
  const [sharing, setSharing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [showArchived, setShowArchived] = useState(false);

  // Section names the user can see; school admins' other sections show in the dialog.
  const sectionNames = Object.fromEntries(sections.map(s => [s.section_id, s.name]));
  const active = materials.filter(m => m.status === 'active');
  const archived = materials.filter(m => m.status === 'archived');

  const changeStatus = (material, status) => setStatus.mutate(
    { id: material.id, status },
    {
      onSuccess: () => toast.success(t(status === 'archived' ? 'archive.done' : 'archive.restored', { title: material.title })),
      onError: (err) => toast.error(translateError(err, t, 'archive.failed')),
    }
  );
  const confirmDelete = () => deleteMaterial.mutate(deleting.id, {
    onSuccess: () => { toast.success(t('delete.done', { title: deleting.title })); setDeleting(null); },
    onError: (err) => toast.error(translateError(err, t, 'delete.failed')),
  });

  if (staffOrgs.length === 0) return <p className="text-sm text-slate-500">{t('noSchool')}</p>;

  const row = (m) => (
    <MaterialRow key={m.id} material={m} sectionNames={sectionNames}>
      <Link to={`/classroom/materials/${m.id}`} className={secondaryButtonClass}>
        <Pencil className="w-3.5 h-3.5" /> {t('common:actions.edit')}
      </Link>
      {m.status === 'active' && (
        <button type="button" onClick={() => setSharing(m)} className={secondaryButtonClass}>
          <Share2 className="w-3.5 h-3.5" /> {t('share.button')}
        </button>
      )}
      {m.status === 'active' ? (
        <button type="button" onClick={() => changeStatus(m, 'archived')} disabled={setStatus.isPending} className={secondaryButtonClass}>
          <Archive className="w-3.5 h-3.5" /> {t('archive.button')}
        </button>
      ) : (
        <button type="button" onClick={() => changeStatus(m, 'active')} disabled={setStatus.isPending} className={secondaryButtonClass}>
          <ArchiveRestore className="w-3.5 h-3.5" /> {t('archive.restore')}
        </button>
      )}
      <button type="button" onClick={() => setDeleting(m)} className={dangerButtonClass} aria-label={t('delete.button')}>
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </MaterialRow>
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        <Link to="/classroom/materials/new?kind=simulation" className={primaryButtonClass}>
          <Plus className="w-4 h-4" /> {t('new.simulation')}
        </Link>
        <Link to="/classroom/materials/new?kind=notes" className={secondaryButtonClass.replace('text-xs', 'text-sm')}>
          <Plus className="w-4 h-4" /> {t('new.notes')}
        </Link>
      </div>

      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
      ) : error ? (
        <p className="text-sm text-red-600">{t('loadFailed')}</p>
      ) : active.length === 0 ? (
        <p className="text-sm text-slate-500">{t('empty')}</p>
      ) : (
        <ul className="divide-y divide-slate-100">{active.map(row)}</ul>
      )}

      {archived.length > 0 && (
        <div>
          <button type="button" onClick={() => setShowArchived(v => !v)} className="cursor-pointer text-xs font-bold text-slate-500">
            {t('archive.listTitle', { count: archived.length })}
          </button>
          {showArchived && <ul className="divide-y divide-slate-100">{archived.map(row)}</ul>}
        </div>
      )}

      {sharing && <ShareDialog material={sharing} onClose={() => setSharing(null)} />}
      <ConfirmationModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        isPending={deleteMaterial.isPending}
        isDestructive
        title={t('delete.title')}
        message={deleting ? t('delete.message', { title: deleting.title }) : ''}
        confirmText={t('delete.button')}
        cancelText={t('common:actions.cancel')}
      />
    </div>
  );
}
