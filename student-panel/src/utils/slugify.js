import npmSlugify from 'slugify';

export const slugify = (text) => {
  if (!text) return '';
  return npmSlugify(text.toString(), {
    lower: true,      // convert to lower case
    strict: true,     // strip special characters
    trim: true        // trim leading and trailing spaces
  });
};
