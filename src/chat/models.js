/**
 * Your Library v2.2.1 — Group Chat Client Models
 *
 * These mirror the Supabase schema in v2.2.1_group_chat_schema.sql.
 * Used for type documentation and constructing local objects.
 */

export const PRIVILEGES = [
  'add_member',
  'remove_member',
  'ban_member',
  'report_member',
  'assign_role',
  'start_discussion',
  'manage_books',
];

export const PRIVILEGE_LABELS = {
  add_member:       'Add members',
  remove_member:    'Remove members',
  ban_member:       'Ban members',
  report_member:    'Report members',
  assign_role:      'Assign roles (admin approval required)',
  start_discussion: 'Start discussions',
  manage_books:     'Add / remove books',
};

export const ROLE_TYPES = {
  admin:           { label: 'Admin',           color: '#8b6f47' },
  assistant_admin: { label: 'Assistant Admin', color: '#5c7a3e' },
  manager:         { label: 'Manager',          color: '#3a6ea5' },
  member:          { label: 'Member',           color: '#888'    },
  custom:          { label: 'Custom',           color: '#9b59b6' },
};

export const TIER_LABELS = {
  1: { label: 'General',       description: 'Open to all — casual discussion',                icon: '📖' },
  2: { label: 'Intermediate',  description: 'For readers who have read the book',             icon: '📚' },
  3: { label: 'Deep Dive',     description: 'In-depth analysis — for engaged readers only',   icon: '🔍' },
};

/** Maximum members per group type */
export const MAX_MEMBERS = { private: 40, public: 100 };

/** Maximum shelves per group */
export const MAX_SHELVES = 10;

/** Maximum custom roles for public groups */
export const MAX_CUSTOM_ROLES_PUBLIC = 6;

/**
 * Returns true if a role has the given privilege.
 * Admin role always returns true.
 */
export function hasPrivilege(role, priv) {
  if (!role) return false;
  if (role.roleType === 'admin' || role.role_type === 'admin') return true;
  const privs = role.privileges || [];
  return privs.includes(priv);
}

/**
 * Returns the role object for a user within a group.
 * Works with both local (server) and Supabase shapes.
 */
export function getUserRole(group, userId) {
  if (!group || !userId) return null;
  const member = (group.members || []).find(m =>
    (m.userId || m.user_id) === userId && !m.bannedAt && !m.banned_at
  );
  if (!member) return null;
  const roleId = member.roleId || member.role_id;
  return (group.roles || []).find(r => r.id === roleId) || null;
}

/**
 * Formats a rating (0–5) to a star string.
 */
export function formatRating(rating, count) {
  if (!count) return 'No ratings yet';
  const stars = '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  return `${stars} ${Number(rating).toFixed(1)} (${count})`;
}

/**
 * Returns a short relative time string (e.g. "2m ago", "3h ago").
 */
export function relativeTime(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60)  return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60)  return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}h ago`;
  const day = Math.floor(h / 24);
  return `${day}d ago`;
}
