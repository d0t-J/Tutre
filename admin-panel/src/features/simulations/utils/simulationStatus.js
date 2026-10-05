// Review statuses of a simulation (simulations.status, Phase 2b).
export const STATUS_STYLES = {
  draft: { label: 'Draft', className: 'bg-slate-100 text-slate-700 border-slate-200' },
  in_review: { label: 'In review', className: 'bg-amber-50 text-amber-800 border-amber-200' },
  published: { label: 'Published', className: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  archived: { label: 'Archived', className: 'bg-zinc-100 text-zinc-500 border-zinc-200' },
};

// For filter dropdowns, which take { id, name } options.
export const STATUS_OPTIONS = Object.entries(STATUS_STYLES).map(([id, { label }]) => ({ id, name: label }));

// Reviewers and platform admins publish; authors submit for review.
export const canPublish = (studioRole) => studioRole === 'reviewer' || studioRole === 'platform_admin';
