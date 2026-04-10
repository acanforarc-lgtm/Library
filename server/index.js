/**
 * Your Library — Groups Chat API Server (local dev)
 * v2.2.1
 *
 * Run: node index.js  (or npm run dev with --watch)
 * Port: 3001 (override with PORT env var)
 *
 * This server mirrors the Supabase schema in v2.2.1_group_chat_schema.sql
 * using a single JSON file for persistence.  In production use Supabase directly.
 */

'use strict';

const express    = require('express');
const bodyParser = require('body-parser');
const cors       = require('cors');
const { nanoid } = require('nanoid');
const fs         = require('fs');
const path       = require('path');
const crypto     = require('crypto');

// ─── Persistence ─────────────────────────────────────────────
const DATA_FILE = path.join(__dirname, 'data.json');

function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return { groups: [], bookPublicChats: [], reports: [], aiModerationLog: [] };
  }
}

function writeData(d) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(d, null, 2));
}

// ─── Privilege constants ──────────────────────────────────────
const ALL_PRIVS  = ['add_member','remove_member','ban_member','report_member','assign_role','start_discussion','manage_books'];
const ASST_PRIVS = ['add_member','remove_member','ban_member','report_member','assign_role','start_discussion','manage_books'];
const MGR_PRIVS  = ['add_member','remove_member','report_member','start_discussion'];

function makeDefaultRoles() {
  return [
    { id: 'role_' + nanoid(), name: 'Admin',           roleType: 'admin',           privileges: ALL_PRIVS,  sortOrder: 1 },
    { id: 'role_' + nanoid(), name: 'Assistant Admin', roleType: 'assistant_admin',  privileges: ASST_PRIVS, sortOrder: 2 },
    { id: 'role_' + nanoid(), name: 'Manager',         roleType: 'manager',          privileges: MGR_PRIVS,  sortOrder: 3 },
    { id: 'role_' + nanoid(), name: 'Member',          roleType: 'member',           privileges: [],         sortOrder: 4 },
  ];
}

// ─── Moderation ───────────────────────────────────────────────
const BANNED_WORDS = ['badword1','badword2']; // replace with real list

/**
 * Moderate a message.  Returns { allowed, action, reason, confidence }.
 * Extend this to call an external AI moderation API (e.g. OpenAI Moderation)
 * by setting MODERATION_API_KEY in the environment.
 */
async function moderateContent(content) {
  const lower = content.toLowerCase();

  // 1. Basic keyword filter (synchronous)
  for (const word of BANNED_WORDS) {
    if (lower.includes(word)) {
      return { allowed: false, action: 'blocked', reason: 'prohibited_content', confidence: 1.0 };
    }
  }

  // 2. External AI moderation hook (optional)
  if (process.env.MODERATION_API_KEY) {
    try {
      const res = await fetch('https://api.openai.com/v1/moderations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MODERATION_API_KEY}`,
        },
        body: JSON.stringify({ input: content }),
      });
      const json = await res.json();
      const result = json.results?.[0];
      if (result?.flagged) {
        const topCategory = Object.entries(result.categories || {})
          .filter(([, v]) => v)
          .map(([k]) => k)[0] || 'policy_violation';
        const confidence = Math.max(...Object.values(result.category_scores || {}), 0);
        return { allowed: false, action: 'flagged', reason: topCategory, confidence };
      }
    } catch (err) {
      console.warn('AI moderation unavailable, falling back to keyword filter:', err.message);
    }
  }

  return { allowed: true, action: 'allowed', reason: null, confidence: null };
}

function logModeration(d, { messageId, contextType, contextId, content, action, reason, confidence }) {
  d.aiModerationLog = d.aiModerationLog || [];
  d.aiModerationLog.push({
    id: 'aml_' + nanoid(),
    messageId,
    contextType,
    contextId,
    contentHash: crypto.createHash('sha256').update(content).digest('hex'),
    action,
    reason,
    confidence: confidence ?? null,
    createdAt: new Date().toISOString(),
  });
}

// ─── Helpers ──────────────────────────────────────────────────
function findGroup(d, id) {
  return d.groups.find(g => g.id === id) || null;
}

function getMember(group, userId) {
  return (group.members || []).find(m => m.userId === userId) || null;
}

function getRole(group, roleId) {
  return (group.roles || []).find(r => r.id === roleId) || null;
}

function getMemberRole(group, userId) {
  const member = getMember(group, userId);
  if (!member || member.bannedAt) return null;
  return getRole(group, member.roleId);
}

function hasPrivilege(role, priv) {
  if (!role) return false;
  if (role.roleType === 'admin') return true;
  return (role.privileges || []).includes(priv);
}

function isAdmin(group, userId) {
  const role = getMemberRole(group, userId);
  return role?.roleType === 'admin';
}

function isModerator(group, userId) {
  const role = getMemberRole(group, userId);
  if (!role) return false;
  return ['admin','assistant_admin'].includes(role.roleType) || hasPrivilege(role, 'ban_member');
}

function activeMemberCount(group) {
  return (group.members || []).filter(m => !m.bannedAt).length;
}

// ─── App ──────────────────────────────────────────────────────
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Simple auth shim: clients pass X-User-Id and X-User-Name headers.
// In production, Supabase JWT handles auth.
function resolveUser(req) {
  return {
    id:   req.headers['x-user-id']   || 'anon_' + nanoid(6),
    name: req.headers['x-user-name'] || 'Anonymous',
  };
}

// ─── Groups ───────────────────────────────────────────────────

// GET /api/groups — list groups (user's groups + all public groups)
app.get('/api/groups', (req, res) => {
  const user = resolveUser(req);
  const d = readData();
  const result = d.groups.filter(g => {
    if (!g.isActive) return false;
    if (g.type === 'public') return true;
    return (g.members || []).some(m => m.userId === user.id && !m.bannedAt);
  });
  res.json(result);
});

// POST /api/groups — create group
app.post('/api/groups', (req, res) => {
  const user = resolveUser(req);
  const { title, description, type, relatedBookId, relatedShelfId } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  if (!['private','public'].includes(type)) return res.status(400).json({ error: 'type must be private or public' });

  const d = readData();
  const roles = makeDefaultRoles();
  const adminRole = roles.find(r => r.roleType === 'admin');

  const group = {
    id: 'g_' + nanoid(),
    title: title.trim(),
    description: (description || '').trim(),
    type,
    relatedBookId:  relatedBookId  || null,
    relatedShelfId: relatedShelfId || null,
    ownerId:  user.id,
    ownerName: user.name,
    maxMembers: type === 'public' ? 100 : 40,
    maxShelves: 10,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    roles,
    members: [{
      id: 'gm_' + nanoid(),
      userId:   user.id,
      userName: user.name,
      roleId:   adminRole.id,
      joinedAt: new Date().toISOString(),
      bannedAt: null,
      banReason: null,
    }],
    shelves: [],
    chats: [],
    roleChangeRequests: [],
  };

  d.groups.push(group);
  writeData(d);
  res.status(201).json(group);
});

// GET /api/groups/:id
app.get('/api/groups/:id', (req, res) => {
  const user = resolveUser(req);
  const d = readData();
  const g = findGroup(d, req.params.id);
  if (!g || !g.isActive) return res.status(404).json({ error: 'not found' });

  const isMember = (g.members || []).some(m => m.userId === user.id && !m.bannedAt);
  if (g.type === 'private' && !isMember) return res.status(403).json({ error: 'not a member' });
  res.json(g);
});

// PATCH /api/groups/:id — update title/description (admin only)
app.patch('/api/groups/:id', (req, res) => {
  const user = resolveUser(req);
  const d = readData();
  const g = findGroup(d, req.params.id);
  if (!g) return res.status(404).json({ error: 'not found' });
  if (!isAdmin(g, user.id)) return res.status(403).json({ error: 'admin only' });

  const { title, description } = req.body;
  if (title) g.title = title.trim();
  if (description !== undefined) g.description = description.trim();
  g.updatedAt = new Date().toISOString();
  writeData(d);
  res.json(g);
});

// DELETE /api/groups/:id (owner only)
app.delete('/api/groups/:id', (req, res) => {
  const user = resolveUser(req);
  const d = readData();
  const idx = d.groups.findIndex(g => g.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  if (d.groups[idx].ownerId !== user.id) return res.status(403).json({ error: 'owner only' });
  d.groups[idx].isActive = false;
  writeData(d);
  res.json({ ok: true });
});

// ─── Members ──────────────────────────────────────────────────

// POST /api/groups/:id/members — add member (add_member privilege)
app.post('/api/groups/:id/members', (req, res) => {
  const user = resolveUser(req);
  const { targetUserId, targetUserName } = req.body;
  if (!targetUserId) return res.status(400).json({ error: 'targetUserId required' });

  const d = readData();
  const g = findGroup(d, req.params.id);
  if (!g) return res.status(404).json({ error: 'not found' });

  const actorRole = getMemberRole(g, user.id);
  if (!hasPrivilege(actorRole, 'add_member')) return res.status(403).json({ error: 'insufficient privilege' });
  if (activeMemberCount(g) >= g.maxMembers) return res.status(409).json({ error: `group is full (max ${g.maxMembers})` });
  if (getMember(g, targetUserId)) return res.status(409).json({ error: 'already a member' });

  const memberRole = g.roles.find(r => r.roleType === 'member');
  const newMember = {
    id: 'gm_' + nanoid(),
    userId: targetUserId,
    userName: targetUserName || 'User',
    roleId: memberRole?.id || null,
    joinedAt: new Date().toISOString(),
    bannedAt: null,
    banReason: null,
  };
  g.members.push(newMember);
  g.updatedAt = new Date().toISOString();
  writeData(d);
  res.status(201).json(newMember);
});

// DELETE /api/groups/:id/members/:userId — remove member
app.delete('/api/groups/:id/members/:userId', (req, res) => {
  const user = resolveUser(req);
  const d = readData();
  const g = findGroup(d, req.params.id);
  if (!g) return res.status(404).json({ error: 'not found' });

  const isSelf = user.id === req.params.userId;
  const actorRole = getMemberRole(g, user.id);
  if (!isSelf && !hasPrivilege(actorRole, 'remove_member')) return res.status(403).json({ error: 'insufficient privilege' });

  const idx = g.members.findIndex(m => m.userId === req.params.userId);
  if (idx === -1) return res.status(404).json({ error: 'member not found' });
  if (g.ownerId === req.params.userId) return res.status(400).json({ error: 'cannot remove group owner' });

  g.members.splice(idx, 1);
  g.updatedAt = new Date().toISOString();
  writeData(d);
  res.json({ ok: true });
});

// PATCH /api/groups/:id/members/:userId/ban — ban/unban
app.patch('/api/groups/:id/members/:userId/ban', (req, res) => {
  const user = resolveUser(req);
  const { ban, reason } = req.body; // ban: true|false
  const d = readData();
  const g = findGroup(d, req.params.id);
  if (!g) return res.status(404).json({ error: 'not found' });

  const actorRole = getMemberRole(g, user.id);
  if (!hasPrivilege(actorRole, 'ban_member')) return res.status(403).json({ error: 'insufficient privilege' });
  if (g.ownerId === req.params.userId) return res.status(400).json({ error: 'cannot ban group owner' });

  const member = getMember(g, req.params.userId);
  if (!member) return res.status(404).json({ error: 'member not found' });

  member.bannedAt  = ban ? new Date().toISOString() : null;
  member.banReason = ban ? (reason || null) : null;
  member.bannedBy  = ban ? user.id : null;
  g.updatedAt = new Date().toISOString();
  writeData(d);
  res.json(member);
});

// ─── Roles ────────────────────────────────────────────────────

// GET /api/groups/:id/roles
app.get('/api/groups/:id/roles', (req, res) => {
  const user = resolveUser(req);
  const d = readData();
  const g = findGroup(d, req.params.id);
  if (!g) return res.status(404).json({ error: 'not found' });
  if (g.type === 'private' && !getMember(g, user.id)) return res.status(403).json({ error: 'not a member' });
  res.json(g.roles);
});

// POST /api/groups/:id/roles — add custom role (admin only; public max 6 custom)
app.post('/api/groups/:id/roles', (req, res) => {
  const user = resolveUser(req);
  const { name, privileges } = req.body;
  if (!name) return res.status(400).json({ error: 'name required' });

  const d = readData();
  const g = findGroup(d, req.params.id);
  if (!g) return res.status(404).json({ error: 'not found' });
  if (!isAdmin(g, user.id)) return res.status(403).json({ error: 'admin only' });
  if (g.roles.find(r => r.name === name)) return res.status(409).json({ error: 'role name already exists' });

  if (g.type === 'public') {
    const customCount = g.roles.filter(r => r.roleType === 'custom').length;
    if (customCount >= 6) return res.status(409).json({ error: 'public groups may have at most 6 custom roles' });
  }

  const validPrivs = (privileges || []).filter(p => ALL_PRIVS.includes(p));
  const role = { id: 'role_' + nanoid(), name: name.trim(), roleType: 'custom', privileges: validPrivs, sortOrder: 99 };
  g.roles.push(role);
  g.updatedAt = new Date().toISOString();
  writeData(d);
  res.status(201).json(role);
});

// PATCH /api/groups/:id/roles/:roleId — update privileges (admin only)
app.patch('/api/groups/:id/roles/:roleId', (req, res) => {
  const user = resolveUser(req);
  const { privileges, name } = req.body;

  const d = readData();
  const g = findGroup(d, req.params.id);
  if (!g) return res.status(404).json({ error: 'not found' });
  if (!isAdmin(g, user.id)) return res.status(403).json({ error: 'admin only' });

  const role = getRole(g, req.params.roleId);
  if (!role) return res.status(404).json({ error: 'role not found' });
  if (role.roleType === 'admin') return res.status(400).json({ error: 'cannot modify admin role' });

  if (privileges !== undefined) role.privileges = (privileges || []).filter(p => ALL_PRIVS.includes(p));
  if (name) role.name = name.trim();
  g.updatedAt = new Date().toISOString();
  writeData(d);
  res.json(role);
});

// DELETE /api/groups/:id/roles/:roleId (admin, cannot delete built-in roles)
app.delete('/api/groups/:id/roles/:roleId', (req, res) => {
  const user = resolveUser(req);
  const d = readData();
  const g = findGroup(d, req.params.id);
  if (!g) return res.status(404).json({ error: 'not found' });
  if (!isAdmin(g, user.id)) return res.status(403).json({ error: 'admin only' });

  const roleIdx = g.roles.findIndex(r => r.id === req.params.roleId);
  if (roleIdx === -1) return res.status(404).json({ error: 'role not found' });
  const role = g.roles[roleIdx];
  if (role.roleType !== 'custom') return res.status(400).json({ error: 'cannot delete built-in roles' });

  // Move any members with this role to 'member'
  const memberRole = g.roles.find(r => r.roleType === 'member');
  g.members.forEach(m => { if (m.roleId === role.id) m.roleId = memberRole?.id || null; });
  g.roles.splice(roleIdx, 1);
  g.updatedAt = new Date().toISOString();
  writeData(d);
  res.json({ ok: true });
});

// ─── Role Change Requests ─────────────────────────────────────

// POST /api/groups/:id/role-requests — request a role change for a target user
app.post('/api/groups/:id/role-requests', (req, res) => {
  const user = resolveUser(req);
  const { targetUserId, requestedRoleId } = req.body;
  if (!targetUserId || !requestedRoleId) return res.status(400).json({ error: 'targetUserId and requestedRoleId required' });

  const d = readData();
  const g = findGroup(d, req.params.id);
  if (!g) return res.status(404).json({ error: 'not found' });

  const actorRole = getMemberRole(g, user.id);
  if (!hasPrivilege(actorRole, 'assign_role')) return res.status(403).json({ error: 'assign_role privilege required' });
  if (!getMember(g, targetUserId)) return res.status(404).json({ error: 'target not a member' });
  if (!getRole(g, requestedRoleId)) return res.status(404).json({ error: 'role not found' });

  const request = {
    id: 'rcr_' + nanoid(),
    requestedBy: user.id,
    requestedByName: user.name,
    targetUserId,
    requestedRoleId,
    status: 'pending',
    reviewedBy: null,
    reviewNote: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  g.roleChangeRequests = g.roleChangeRequests || [];
  g.roleChangeRequests.push(request);
  g.updatedAt = new Date().toISOString();
  writeData(d);
  res.status(201).json(request);
});

// GET /api/groups/:id/role-requests
app.get('/api/groups/:id/role-requests', (req, res) => {
  const user = resolveUser(req);
  const d = readData();
  const g = findGroup(d, req.params.id);
  if (!g) return res.status(404).json({ error: 'not found' });
  if (!getMember(g, user.id)) return res.status(403).json({ error: 'not a member' });
  const pending = (g.roleChangeRequests || []).filter(r => r.status === 'pending');
  res.json(pending);
});

// PATCH /api/groups/:id/role-requests/:reqId — approve or reject (admin only)
app.patch('/api/groups/:id/role-requests/:reqId', (req, res) => {
  const user = resolveUser(req);
  const { action, reviewNote } = req.body; // action: 'approve' | 'reject'
  if (!['approve','reject'].includes(action)) return res.status(400).json({ error: "action must be 'approve' or 'reject'" });

  const d = readData();
  const g = findGroup(d, req.params.id);
  if (!g) return res.status(404).json({ error: 'not found' });
  if (!isAdmin(g, user.id)) return res.status(403).json({ error: 'admin only' });

  const reqItem = (g.roleChangeRequests || []).find(r => r.id === req.params.reqId);
  if (!reqItem) return res.status(404).json({ error: 'request not found' });
  if (reqItem.status !== 'pending') return res.status(409).json({ error: 'already reviewed' });

  reqItem.status     = action === 'approve' ? 'approved' : 'rejected';
  reqItem.reviewedBy = user.id;
  reqItem.reviewNote = reviewNote || null;
  reqItem.updatedAt  = new Date().toISOString();

  if (action === 'approve') {
    const member = getMember(g, reqItem.targetUserId);
    if (member) member.roleId = reqItem.requestedRoleId;
  }

  g.updatedAt = new Date().toISOString();
  writeData(d);
  res.json(reqItem);
});

// ─── Shelves ──────────────────────────────────────────────────

// GET /api/groups/:id/shelves
app.get('/api/groups/:id/shelves', (req, res) => {
  const user = resolveUser(req);
  const d = readData();
  const g = findGroup(d, req.params.id);
  if (!g) return res.status(404).json({ error: 'not found' });
  if (g.type === 'private' && !getMember(g, user.id)) return res.status(403).json({ error: 'not a member' });
  res.json(g.shelves || []);
});

// POST /api/groups/:id/shelves (manage_books privilege)
app.post('/api/groups/:id/shelves', (req, res) => {
  const user = resolveUser(req);
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });

  const d = readData();
  const g = findGroup(d, req.params.id);
  if (!g) return res.status(404).json({ error: 'not found' });

  const actorRole = getMemberRole(g, user.id);
  if (!hasPrivilege(actorRole, 'manage_books')) return res.status(403).json({ error: 'manage_books privilege required' });
  if ((g.shelves || []).length >= g.maxShelves) return res.status(409).json({ error: `shelf limit reached (max ${g.maxShelves})` });

  const shelf = { id: 'sh_' + nanoid(), title: title.trim(), books: [], createdAt: new Date().toISOString() };
  g.shelves = g.shelves || [];
  g.shelves.push(shelf);
  g.updatedAt = new Date().toISOString();
  writeData(d);
  res.status(201).json(shelf);
});

// PATCH /api/groups/:id/shelves/:shelfId — rename shelf
app.patch('/api/groups/:id/shelves/:shelfId', (req, res) => {
  const user = resolveUser(req);
  const { title } = req.body;
  const d = readData();
  const g = findGroup(d, req.params.id);
  if (!g) return res.status(404).json({ error: 'not found' });
  const actorRole = getMemberRole(g, user.id);
  if (!hasPrivilege(actorRole, 'manage_books')) return res.status(403).json({ error: 'manage_books privilege required' });
  const shelf = (g.shelves || []).find(s => s.id === req.params.shelfId);
  if (!shelf) return res.status(404).json({ error: 'shelf not found' });
  if (title) shelf.title = title.trim();
  g.updatedAt = new Date().toISOString();
  writeData(d);
  res.json(shelf);
});

// DELETE /api/groups/:id/shelves/:shelfId
app.delete('/api/groups/:id/shelves/:shelfId', (req, res) => {
  const user = resolveUser(req);
  const d = readData();
  const g = findGroup(d, req.params.id);
  if (!g) return res.status(404).json({ error: 'not found' });
  const actorRole = getMemberRole(g, user.id);
  if (!hasPrivilege(actorRole, 'manage_books')) return res.status(403).json({ error: 'manage_books privilege required' });
  const idx = (g.shelves || []).findIndex(s => s.id === req.params.shelfId);
  if (idx === -1) return res.status(404).json({ error: 'shelf not found' });
  g.shelves.splice(idx, 1);
  g.updatedAt = new Date().toISOString();
  writeData(d);
  res.json({ ok: true });
});

// POST /api/groups/:id/shelves/:shelfId/books — add book
app.post('/api/groups/:id/shelves/:shelfId/books', (req, res) => {
  const user = resolveUser(req);
  const { bookId, bookTitle, bookCover } = req.body;
  if (!bookId) return res.status(400).json({ error: 'bookId required' });

  const d = readData();
  const g = findGroup(d, req.params.id);
  if (!g) return res.status(404).json({ error: 'not found' });
  const actorRole = getMemberRole(g, user.id);
  if (!hasPrivilege(actorRole, 'manage_books')) return res.status(403).json({ error: 'manage_books privilege required' });
  const shelf = (g.shelves || []).find(s => s.id === req.params.shelfId);
  if (!shelf) return res.status(404).json({ error: 'shelf not found' });
  if (shelf.books.find(b => b.id === bookId)) return res.status(409).json({ error: 'book already on shelf' });

  const book = { id: bookId, title: bookTitle || bookId, cover: bookCover || null, addedAt: new Date().toISOString() };
  shelf.books.push(book);
  g.updatedAt = new Date().toISOString();
  writeData(d);
  res.status(201).json(book);
});

// DELETE /api/groups/:id/shelves/:shelfId/books/:bookId
app.delete('/api/groups/:id/shelves/:shelfId/books/:bookId', (req, res) => {
  const user = resolveUser(req);
  const d = readData();
  const g = findGroup(d, req.params.id);
  if (!g) return res.status(404).json({ error: 'not found' });
  const actorRole = getMemberRole(g, user.id);
  if (!hasPrivilege(actorRole, 'manage_books')) return res.status(403).json({ error: 'manage_books privilege required' });
  const shelf = (g.shelves || []).find(s => s.id === req.params.shelfId);
  if (!shelf) return res.status(404).json({ error: 'shelf not found' });
  const idx = shelf.books.findIndex(b => b.id === req.params.bookId);
  if (idx === -1) return res.status(404).json({ error: 'book not found on shelf' });
  shelf.books.splice(idx, 1);
  g.updatedAt = new Date().toISOString();
  writeData(d);
  res.json({ ok: true });
});

// ─── Chats ────────────────────────────────────────────────────

// GET /api/groups/:id/chats
app.get('/api/groups/:id/chats', (req, res) => {
  const user = resolveUser(req);
  const d = readData();
  const g = findGroup(d, req.params.id);
  if (!g) return res.status(404).json({ error: 'not found' });
  if (g.type === 'private' && !getMember(g, user.id)) return res.status(403).json({ error: 'not a member' });
  const chats = (g.chats || []).filter(c => c.isActive).map(c => ({ ...c, messages: undefined }));
  res.json(chats);
});

// POST /api/groups/:id/chats (start_discussion privilege)
app.post('/api/groups/:id/chats', (req, res) => {
  const user = resolveUser(req);
  const { title, tier } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });

  const d = readData();
  const g = findGroup(d, req.params.id);
  if (!g) return res.status(404).json({ error: 'not found' });
  const actorRole = getMemberRole(g, user.id);
  if (!hasPrivilege(actorRole, 'start_discussion')) return res.status(403).json({ error: 'start_discussion privilege required' });

  const tierNum = [1,2,3].includes(Number(tier)) ? Number(tier) : 1;
  const chat = {
    id: 'c_' + nanoid(),
    title: title.trim(),
    tier: tierNum,
    rating: 0,
    ratingCount: 0,
    isActive: true,
    createdBy: user.id,
    createdAt: new Date().toISOString(),
    messages: [],
    ratings: {},
  };
  g.chats = g.chats || [];
  g.chats.push(chat);
  g.updatedAt = new Date().toISOString();
  writeData(d);
  res.status(201).json({ ...chat, messages: undefined });
});

// DELETE /api/groups/:id/chats/:chatId (admin only — soft delete)
app.delete('/api/groups/:id/chats/:chatId', (req, res) => {
  const user = resolveUser(req);
  const d = readData();
  const g = findGroup(d, req.params.id);
  if (!g) return res.status(404).json({ error: 'not found' });
  if (!isAdmin(g, user.id)) return res.status(403).json({ error: 'admin only' });
  const chat = (g.chats || []).find(c => c.id === req.params.chatId);
  if (!chat) return res.status(404).json({ error: 'chat not found' });
  chat.isActive = false;
  g.updatedAt = new Date().toISOString();
  writeData(d);
  res.json({ ok: true });
});

// ─── Messages ─────────────────────────────────────────────────

// GET /api/groups/:id/chats/:chatId/messages
app.get('/api/groups/:id/chats/:chatId/messages', (req, res) => {
  const user = resolveUser(req);
  const d = readData();
  const g = findGroup(d, req.params.id);
  if (!g) return res.status(404).json({ error: 'not found' });
  if (g.type === 'private' && !getMember(g, user.id)) return res.status(403).json({ error: 'not a member' });

  const chat = (g.chats || []).find(c => c.id === req.params.chatId && c.isActive);
  if (!chat) return res.status(404).json({ error: 'chat not found' });

  const since = req.query.since ? Number(req.query.since) : 0;
  const msgs = (chat.messages || [])
    .filter(m => !m.isDeleted && (!since || new Date(m.createdAt).getTime() > since))
    .slice(-100); // last 100 messages
  res.json(msgs);
});

// POST /api/groups/:id/chats/:chatId/messages
app.post('/api/groups/:id/chats/:chatId/messages', async (req, res) => {
  const user = resolveUser(req);
  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'content required' });
  if (content.length > 2000) return res.status(400).json({ error: 'message too long (max 2000 chars)' });

  const d = readData();
  const g = findGroup(d, req.params.id);
  if (!g) return res.status(404).json({ error: 'not found' });

  const member = getMember(g, user.id);
  if (g.type === 'private' && (!member || member.bannedAt)) return res.status(403).json({ error: 'not a member or banned' });
  if (member?.bannedAt) return res.status(403).json({ error: 'banned from this group' });

  const chat = (g.chats || []).find(c => c.id === req.params.chatId && c.isActive);
  if (!chat) return res.status(404).json({ error: 'chat not found' });

  // Moderate
  const modResult = await moderateContent(content);
  logModeration(d, {
    messageId: null,
    contextType: 'group_chat',
    contextId: chat.id,
    content,
    ...modResult,
  });

  if (!modResult.allowed) {
    writeData(d); // persist log even on block
    return res.status(403).json({ error: 'message blocked by moderation', reason: modResult.reason });
  }

  const msg = {
    id: 'm_' + nanoid(),
    senderId:   user.id,
    senderName: user.name,
    content: content.trim(),
    isModerated: false,
    aiFlagged: modResult.action === 'flagged',
    isDeleted: false,
    createdAt: new Date().toISOString(),
  };
  chat.messages = chat.messages || [];
  chat.messages.push(msg);
  writeData(d);
  res.status(201).json(msg);
});

// DELETE /api/groups/:id/chats/:chatId/messages/:msgId (sender or moderator)
app.delete('/api/groups/:id/chats/:chatId/messages/:msgId', (req, res) => {
  const user = resolveUser(req);
  const d = readData();
  const g = findGroup(d, req.params.id);
  if (!g) return res.status(404).json({ error: 'not found' });

  const chat = (g.chats || []).find(c => c.id === req.params.chatId);
  if (!chat) return res.status(404).json({ error: 'chat not found' });
  const msg = (chat.messages || []).find(m => m.id === req.params.msgId);
  if (!msg) return res.status(404).json({ error: 'message not found' });

  const isSender = msg.senderId === user.id;
  if (!isSender && !isModerator(g, user.id)) return res.status(403).json({ error: 'insufficient privilege' });

  msg.isDeleted = true;
  msg.content   = '';
  writeData(d);
  res.json({ ok: true });
});

// ─── Chat Ratings ─────────────────────────────────────────────

// POST /api/groups/:id/chats/:chatId/rate
app.post('/api/groups/:id/chats/:chatId/rate', (req, res) => {
  const user = resolveUser(req);
  const { rating } = req.body;
  const ratingNum = Number(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ error: 'rating must be an integer 1–5' });
  }

  const d = readData();
  const g = findGroup(d, req.params.id);
  if (!g) return res.status(404).json({ error: 'not found' });
  const chat = (g.chats || []).find(c => c.id === req.params.chatId && c.isActive);
  if (!chat) return res.status(404).json({ error: 'chat not found' });

  chat.ratings = chat.ratings || {};
  chat.ratings[user.id] = ratingNum;

  // Recalculate
  const allRatings = Object.values(chat.ratings);
  chat.rating      = allRatings.reduce((s, r) => s + r, 0) / allRatings.length;
  chat.ratingCount = allRatings.length;

  g.updatedAt = new Date().toISOString();
  writeData(d);
  res.json({ rating: chat.rating, ratingCount: chat.ratingCount, myRating: ratingNum });
});

// ─── Reports ──────────────────────────────────────────────────

// POST /api/reports
app.post('/api/reports', (req, res) => {
  const user = resolveUser(req);
  const { groupId, targetId, reason } = req.body;
  if (!targetId || !reason) return res.status(400).json({ error: 'targetId and reason required' });
  if (targetId === user.id) return res.status(400).json({ error: 'cannot report yourself' });

  const d = readData();
  if (groupId) {
    const g = findGroup(d, groupId);
    if (!g) return res.status(404).json({ error: 'group not found' });
  }

  const report = {
    id: 'rpt_' + nanoid(),
    groupId: groupId || null,
    reporterId: user.id,
    reporterName: user.name,
    targetId,
    reason: reason.trim(),
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  d.reports.push(report);
  writeData(d);
  res.status(201).json({ ok: true, reportId: report.id });
});

// ─── Book Public Chats ─────────────────────────────────────────

// GET /api/books/:bookId/public-chats
app.get('/api/books/:bookId/public-chats', (req, res) => {
  const d = readData();
  const chats = (d.bookPublicChats || [])
    .filter(c => c.bookId === req.params.bookId && c.isActive)
    .sort((a, b) => b.rating - a.rating || a.tier - b.tier);
  res.json(chats);
});

// POST /api/books/:bookId/public-chats
app.post('/api/books/:bookId/public-chats', (req, res) => {
  const user = resolveUser(req);
  const { title, description, tier, readingScaleMin } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });
  const tierNum = [1,2,3].includes(Number(tier)) ? Number(tier) : 1;

  const d = readData();
  const chat = {
    id: 'bpc_' + nanoid(),
    bookId: req.params.bookId,
    title: title.trim(),
    description: (description || '').trim(),
    tier: tierNum,
    readingScaleMin: Number(readingScaleMin) || 1,
    rating: 0,
    ratingCount: 0,
    relevancyScore: 0,
    hostId: user.id,
    hostName: user.name,
    maxMembers: 100,
    isActive: true,
    aiModerationEnabled: true,
    createdAt: new Date().toISOString(),
    messages: [],
    ratings: {},
  };
  d.bookPublicChats = d.bookPublicChats || [];
  d.bookPublicChats.push(chat);
  writeData(d);
  res.status(201).json({ ...chat, messages: undefined, ratings: undefined });
});

// GET /api/books/:bookId/public-chats/:chatId/messages
app.get('/api/books/:bookId/public-chats/:chatId/messages', (req, res) => {
  const d = readData();
  const chat = (d.bookPublicChats || []).find(c => c.id === req.params.chatId && c.isActive);
  if (!chat) return res.status(404).json({ error: 'chat not found' });
  const msgs = (chat.messages || []).filter(m => !m.isDeleted).slice(-100);
  res.json(msgs);
});

// POST /api/books/:bookId/public-chats/:chatId/messages
app.post('/api/books/:bookId/public-chats/:chatId/messages', async (req, res) => {
  const user = resolveUser(req);
  const { content } = req.body;
  if (!content || !content.trim()) return res.status(400).json({ error: 'content required' });
  if (content.length > 2000) return res.status(400).json({ error: 'message too long (max 2000 chars)' });

  const d = readData();
  const chat = (d.bookPublicChats || []).find(c => c.id === req.params.chatId && c.isActive);
  if (!chat) return res.status(404).json({ error: 'chat not found' });

  const modResult = await moderateContent(content);
  logModeration(d, { contextType: 'book_chat', contextId: chat.id, content, ...modResult });

  if (!modResult.allowed) {
    writeData(d);
    return res.status(403).json({ error: 'message blocked by moderation', reason: modResult.reason });
  }

  const msg = {
    id: 'm_' + nanoid(),
    senderId: user.id,
    senderName: user.name,
    content: content.trim(),
    aiFlagged: modResult.action === 'flagged',
    isDeleted: false,
    createdAt: new Date().toISOString(),
  };
  chat.messages.push(msg);
  writeData(d);
  res.status(201).json(msg);
});

// POST /api/books/:bookId/public-chats/:chatId/rate
app.post('/api/books/:bookId/public-chats/:chatId/rate', (req, res) => {
  const user = resolveUser(req);
  const ratingNum = Number(req.body.rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ error: 'rating must be integer 1–5' });
  }
  const d = readData();
  const chat = (d.bookPublicChats || []).find(c => c.id === req.params.chatId && c.isActive);
  if (!chat) return res.status(404).json({ error: 'chat not found' });

  chat.ratings = chat.ratings || {};
  chat.ratings[user.id] = ratingNum;
  const vals = Object.values(chat.ratings);
  chat.rating = vals.reduce((s, r) => s + r, 0) / vals.length;
  chat.ratingCount = vals.length;
  writeData(d);
  res.json({ rating: chat.rating, ratingCount: chat.ratingCount, myRating: ratingNum });
});

// ─── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Your Library Groups API — listening on http://localhost:${PORT}`);
  console.log('Pass X-User-Id and X-User-Name headers to identify callers.');
  if (!process.env.MODERATION_API_KEY) {
    console.log('Tip: set MODERATION_API_KEY to enable AI (OpenAI) moderation.');
  }
});
