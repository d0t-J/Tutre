import { useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Loader2, Share2, X } from 'lucide-react';
import { useSetShares, useShareableSections } from '../hooks/useMaterials';
import { translateError } from '../../../i18n/errors';
import { primaryButtonClass, secondaryButtonClass } from '../../school/utils/school';

// Choose which of your sections can see a material. Students of a section see
// shared material on their chapter page, under "From your teacher".
export default function ShareDialog({ material, onClose }) {
  const { t } = useTranslation('classroom');
  const current = material.material_shares.map(s => s.section_id);
  const [selected, setSelected] = useState(current);
  const { data: sections = [], isLoading } = useShareableSections(material.org_id);
  const setShares = useSetShares();

  const toggle = (id) => setSelected(prev => (prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]));
  const save = () => {
    setShares.mutate(
      { id: material.id, current, next: selected },
      {
        onSuccess: () => { toast.success(t('share.saved', { title: material.title })); onClose(); },
        onError: (err) => toast.error(translateError(err, t, 'share.failed')),
      }
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-9999 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="share-title">
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={setShares.isPending ? undefined : onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl border border-slate-100 p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 id="share-title" className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-primary-600" /> {t('share.title')}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5"><bdi>{material.title}</bdi></p>
          </div>
          <button type="button" onClick={onClose} aria-label={t('common:actions.close')} className="cursor-pointer p-1 text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {material.status !== 'active' ? (
          <p className="text-sm text-slate-500">{t('share.archived')}</p>
        ) : isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        ) : sections.length === 0 ? (
          <p className="text-sm text-slate-500">{t('share.noSections')}</p>
        ) : (
          <ul className="space-y-1 max-h-64 overflow-y-auto">
            {sections.map(s => (
              <li key={s.id}>
                <label className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggle(s.id)} className="w-4 h-4 accent-primary-600" />
                  <span className="text-sm text-slate-700"><bdi>{s.name}</bdi></span>
                </label>
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={setShares.isPending} className={secondaryButtonClass}>{t('common:actions.cancel')}</button>
          <button type="button" onClick={save} disabled={setShares.isPending || material.status !== 'active'} className={primaryButtonClass}>
            {setShares.isPending && <Loader2 className="w-4 h-4 animate-spin" />} {t('common:actions.save')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
