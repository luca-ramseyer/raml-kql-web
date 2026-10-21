import type { NavSection } from './docs';

const base = import.meta.env.BASE_URL;

/** Site operator, shown on the legal notice and privacy pages. */
export const operator = {
  name: 'Luca Ramseyer',
  street: 'Löwenmattweg 8b',
  city: '3110 Münsingen',
  country: 'Switzerland',
  email: 'luca@raml.ch',
};

export const legalHref = { notice: `${base}legal/`, privacy: `${base}privacy/` };

/** Sidebar for the legal pages, in the same shape as the docs sidebar. */
export const legalNav: NavSection = {
  title: '',
  order: 0,
  items: [],
  sections: [{
    key: 'legal',
    title: 'Legal',
    order: 0,
    items: [
      { title: 'Legal notice', href: legalHref.notice, id: 'legal', order: 0 },
      { title: 'Privacy', href: legalHref.privacy, id: 'privacy', order: 1 },
    ],
    sections: [],
  }],
};
