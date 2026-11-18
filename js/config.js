// The only file you edit to connect Civic Lens.
// Use a SEPARATE Supabase project from BallotBridge. The publishable key is public. Row Level Security protects the data.
export const SUPABASE_URL = 'https://rvqfgwidcjhfmowxekkh.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_TduPKAxZQRMOfqHioIEnrw_4HwD1Mra';

export const LEVELS = {
  federal: 'U.S. House',
  state: 'State legislature',
  county: 'County',
  city: 'City',
  school: 'School district',
  special: 'Special district',
};
export const LEVEL_ORDER = ['federal', 'state', 'county', 'city', 'school', 'special'];

// Stages in the order an item usually moves through them.
export const STAGES = ['introduced', 'committee', 'vote', 'decided'];
export const STAGE_LABEL = {
  introduced: 'Introduced',
  committee: 'Committee',
  vote: 'Vote scheduled',
  decided: 'Decided',
  continued: 'Continued',
  information_only: 'Information only',
};
