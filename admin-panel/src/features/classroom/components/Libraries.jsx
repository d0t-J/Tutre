import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Copy, FileText, Loader2, MonitorPlay, ShieldCheck } from 'lucide-react';
import CurriculumPicker from './CurriculumPicker';
import { MaterialRow } from './MyMaterials';
import {
  useCopyMaterial, useCopyTutreNotes, useCopyTutreSimulation, useSchoolLibrary, useTutreLibrary,
} from '../hooks/useMaterials';
import { translateError } from '../../../i18n/errors';
import { inputClass, labelClass, secondaryButtonClass } from '../../school/utils/school';
import { useAuth } from '../../../context/AuthContext';

// Which school a copy belongs to, when the user teaches in more than one.
export function SchoolChooser({ value, onChange, id = 'material-school' }) {
  const { t } = useTranslation('classroom');
  const { staffOrgs } = useAuth();
  if (staffOrgs.length < 2) return null;
  return (
    <div className="max-w-xs">
      <label htmlFor={id} className={labelClass}>{t('school')}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
        {staffOrgs.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
    </div>
  );
}

// Tutre's verified library: copy a simulation or its notes into "My
// materials", then change the copy. The original is never touched.
export function TutreLibrary() {
  const { t } = useTranslation('classroom');
  const navigate = useNavigate();
  const { staffOrgs } = useAuth();
  const [orgId, setOrgId] = useState(staffOrgs[0]?.id ?? '');
  const [place, setPlace] = useState({ classId: null, subjectId: null, chapterId: null, topicId: null });
  const { data: simulations = [], isLoading } = useTutreLibrary(place.chapterId);
  const copySimulation = useCopyTutreSimulation();
  const copyNotes = useCopyTutreNotes();

  const opened = (id) => {
    toast.success(t('copy.done'));
    navigate(`/classroom/materials/${id}`);
  };
  const onError = (err) => toast.error(translateError(err, t, 'copy.failed'));

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500 flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" /> {t('tutre.intro')}
      </p>
      <SchoolChooser value={orgId} onChange={setOrgId} id="tutre-copy-school" />
      <CurriculumPicker value={place} onChange={setPlace} showTopic={false} idPrefix="tutre-library" />
      {!place.chapterId ? null : isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
      ) : simulations.length === 0 ? (
        <p className="text-sm text-slate-500">{t('tutre.none')}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {simulations.map(sim => (
            <li key={sim.sim_id} className="flex flex-wrap items-center gap-3 py-2.5">
              <span className="text-sm font-medium text-slate-800"><bdi>{sim.topic}</bdi></span>
              <span className="ms-auto flex gap-1">
                <button type="button" disabled={copySimulation.isPending}
                  onClick={() => copySimulation.mutate({ simulationId: sim.sim_id, orgId }, { onSuccess: opened, onError })}
                  className={secondaryButtonClass}>
                  <MonitorPlay className="w-3.5 h-3.5" /> {t('tutre.copySimulation')}
                </button>
                <button type="button" disabled={copyNotes.isPending}
                  onClick={() => copyNotes.mutate({ topicId: sim.topic_id, orgId }, { onSuccess: opened, onError })}
                  className={secondaryButtonClass}>
                  <FileText className="w-3.5 h-3.5" /> {t('tutre.copyNotes')}
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Other teachers' material their school shares, to copy.
export function SchoolLibrary() {
  const { t } = useTranslation('classroom');
  const navigate = useNavigate();
  const { staffOrgs } = useAuth();
  const [orgId, setOrgId] = useState(staffOrgs[0]?.id ?? '');
  const { data: materials = [], isLoading, error } = useSchoolLibrary(orgId);
  const copy = useCopyMaterial();

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">{t('library.intro')}</p>
      <SchoolChooser value={orgId} onChange={setOrgId} id="library-school" />
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
      ) : error ? (
        <p className="text-sm text-red-600">{t('loadFailed')}</p>
      ) : materials.length === 0 ? (
        <p className="text-sm text-slate-500">{t('library.none')}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {materials.map(m => (
            <MaterialRow key={m.id} material={m} byline={m.owner_name} showShares={false}>
              <button type="button" disabled={copy.isPending} className={secondaryButtonClass}
                onClick={() => copy.mutate(m.id, {
                  onSuccess: (id) => { toast.success(t('copy.done')); navigate(`/classroom/materials/${id}`); },
                  onError: (err) => toast.error(translateError(err, t, 'copy.failed')),
                })}>
                <Copy className="w-3.5 h-3.5" /> {t('library.copy')}
              </button>
            </MaterialRow>
          ))}
        </ul>
      )}
    </div>
  );
}
