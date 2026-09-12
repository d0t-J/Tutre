import { useMemo } from 'react';
import { slugify } from '../../../utils/slugify';

export const FALLBACK_MAP = {
  'biology': 'Dna',
  'chemistry': 'FlaskConical',
  'mathematics': 'Calculator',
  'physics': 'Atom',
  'computer-science': 'Laptop',
  'english': 'BookOpen'
};

export function useSubjectIcon(matchedSubject, classSlug) {
  return useMemo(() => {
    if (matchedSubject) {
      const slug = slugify(matchedSubject.name);
      return FALLBACK_MAP[slug] || matchedSubject.icon_name || 'Book';
    }
    if (classSlug) {
      return 'GraduationCap';
    }
    return 'Database';
  }, [matchedSubject, classSlug]);
}
