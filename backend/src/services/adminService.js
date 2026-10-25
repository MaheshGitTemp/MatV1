// services/adminService.js
// ─────────────────────────────────────────────────────────────────────────────
// All admin-side DB access. Follows the repo conventions:
//   • pool.connect() / client.release() (release in finally)
//   • parameterized queries only (no string-concatenated SQL)
//   • display names via concat_ws(' ', ufname, ulname) (NULL-safe)
//   • MAT id surfaced as 'MAT' || uid
// The controller layer is responsible for request-boundary validation; this
// layer trusts validated inputs but still parameterizes as defense-in-depth.
// ─────────────────────────────────────────────────────────────────────────────

const crypto = require('crypto');
const pool = require('./pool');
const imageService = require('./imageService');

// ── Admin lookup ──────────────────────────────────────────────────────────────
// Match by username OR email. ORDER prefers an exact username match when the
// identifier equals both for different rows (defensive; both columns are UNIQUE).
async function findAdminByIdentifier(identifier) {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT id, username, email, password, name, role
         FROM public.adminlogin
        WHERE username = $1 OR email = $1
        ORDER BY (username = $1) DESC
        LIMIT 1`,
      [identifier]
    );
    return rows[0] || null;
  } finally {
    client.release();
  }
}

// ── Dashboard ───────────────────────────────────────────────────────────────
// Stat counts + four capped lists for the dashboard widgets.
async function getDashboard() {
  const client = await pool.connect();
  try {
    const [totalUsers, pendingProfiles, pendingPhotos, flaggedCount] = await Promise.all([
      client.query(`SELECT count(*)::int AS c FROM public.users`),
      client.query(`SELECT count(*)::int AS c FROM public.users WHERE profile_status = 'pending'`),
      client.query(`SELECT count(DISTINCT uid)::int AS c FROM public.usergallery WHERE status = 'pending'`),
      client.query(`${flaggedCountSql()}`, [])
    ]);

    const [pendingProfilesList, pendingPhotosList, recentUsersList, flaggedSendersList] = await Promise.all([
      client.query(
        `SELECT uid,
                ('MAT' || uid)                        AS "matId",
                concat_ws(' ', ufname, ulname)        AS name,
                uemail, uphone, status, profile_status AS "profileStatus"
           FROM public.users
          WHERE profile_status = 'pending'
          ORDER BY uid DESC
          LIMIT 10`
      ),
      client.query(
        `SELECT g.id,
                ('MAT' || g.uid)                      AS "matId",
                concat_ws(' ', u.ufname, u.ulname)    AS name,
                g.imagepath, g.imagepath_thumb, g.imagepath_medium,
                g.isprofile, g.status
           FROM public.usergallery g
           JOIN public.users u ON u.uid = g.uid
          WHERE g.status = 'pending'
          ORDER BY g.insertdate DESC
          LIMIT 10`
      ),
      client.query(
        `SELECT uid,
                ('MAT' || uid)                        AS "matId",
                concat_ws(' ', ufname, ulname)        AS name,
                uemail, uphone, status, profile_status AS "profileStatus"
           FROM public.users
          ORDER BY uid DESC
          LIMIT 10`
      ),
      client.query(`${flaggedSelectSql()} LIMIT $1 OFFSET $2`, [10, 0])
    ]);

    return {
      stats: {
        totalUsers: totalUsers.rows[0].c,
        pendingProfiles: pendingProfiles.rows[0].c,
        pendingPhotos: pendingPhotos.rows[0].c,
        flaggedSenders: flaggedCount.rows[0].c
      },
      pendingProfilesList: pendingProfilesList.rows,
      pendingPhotosList: pendingPhotosList.rows,
      recentUsersList: recentUsersList.rows,
      flaggedSendersList: flaggedSendersList.rows
    };
  } finally {
    client.release();
  }
}

// ── Users list ────────────────────────────────────────────────────────────────
// whereSql/params built ONCE by the controller and reused verbatim by BOTH the
// data query and the count query (prevents total/row drift).
async function listUsers({ page, limit, whereSql, params }) {
  const client = await pool.connect();
  try {
    const offset = (page - 1) * limit;
    const dataParams = params.concat([limit, offset]);
    const limitIdx = params.length + 1;
    const offsetIdx = params.length + 2;

    const dataQuery = `
      SELECT a.uid,
             ('MAT' || a.uid)                        AS "matId",
             concat_ws(' ', a.ufname, a.ulname)      AS name,
             a.uemail, a.uphone, a.status,
             a.profile_status                        AS "profileStatus",
             (SELECT count(*) FROM public.usergallery g WHERE g.uid = a.uid) AS photos_count
        FROM public.users a
        ${whereSql}
        ORDER BY a.uid DESC
        LIMIT $${limitIdx} OFFSET $${offsetIdx}`;

    const countQuery = `SELECT count(*)::int AS total FROM public.users a ${whereSql}`;

    const [data, count] = await Promise.all([
      client.query(dataQuery, dataParams),
      client.query(countQuery, params)
    ]);

    return { rows: data.rows, total: count.rows[0].total };
  } finally {
    client.release();
  }
}

async function setUserStatus(uid, status) {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `UPDATE public.users SET status = $2 WHERE uid = $1 RETURNING uid, status`,
      [uid, status]
    );
    return rows[0] || null;
  } finally {
    client.release();
  }
}

async function setProfileStatus(uid, profileStatus) {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `UPDATE public.users SET profile_status = $2 WHERE uid = $1 RETURNING uid, profile_status`,
      [uid, profileStatus]
    );
    return rows[0] || null;
  } finally {
    client.release();
  }
}

// ── Photos list ────────────────────────────────────────────────────────────────
async function listPhotos({ page, limit, whereSql, params }) {
  const client = await pool.connect();
  try {
    const offset = (page - 1) * limit;
    const dataParams = params.concat([limit, offset]);
    const limitIdx = params.length + 1;
    const offsetIdx = params.length + 2;

    const dataQuery = `
      SELECT g.id,
             ('MAT' || g.uid)                       AS "matId",
             g.uid,
             concat_ws(' ', u.ufname, u.ulname)     AS name,
             g.imagepath, g.imagepath_thumb, g.imagepath_medium,
             g.isprofile, g.status
        FROM public.usergallery g
        JOIN public.users u ON u.uid = g.uid
        ${whereSql}
        ORDER BY CASE WHEN g.status = 'pending' THEN 0 ELSE 1 END, g.insertdate DESC
        LIMIT $${limitIdx} OFFSET $${offsetIdx}`;

    const countQuery = `
      SELECT count(*)::int AS total
        FROM public.usergallery g
        JOIN public.users u ON u.uid = g.uid
        ${whereSql}`;

    const [data, count] = await Promise.all([
      client.query(dataQuery, dataParams),
      client.query(countQuery, params)
    ]);

    return { rows: data.rows, total: count.rows[0].total };
  } finally {
    client.release();
  }
}

async function setPhotoStatus(id, status) {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `UPDATE public.usergallery SET status = $2 WHERE id = $1 RETURNING id, status`,
      [id, status]
    );
    return rows[0] || null;
  } finally {
    client.release();
  }
}

// ── Flagged senders (message spam) ──────────────────────────────────────────
// A sender with MORE THAN 10 consecutive trailing messages to the same recipient
// with no reply in between is flagged. Any reply from the recipient resets the
// streak. Computed LIVE, per direction. Soft-delete flags are intentionally
// ignored (deleted_by_sender/receiver not consulted).
//
// The CTE body is shared between the paged SELECT and the COUNT pager so both
// evaluate the same flagged set.
function flaggedCteSql() {
  return `
    WITH pair AS (
      SELECT sender_id, receiver_id,
             max(created_at) AS last_msg_time
        FROM public.messages
       GROUP BY sender_id, receiver_id
    ),
    flagged AS (
      SELECT p.sender_id, p.receiver_id, p.last_msg_time,
             (SELECT count(*) FROM public.messages m
                WHERE m.sender_id   = p.sender_id
                  AND m.receiver_id = p.receiver_id
                  AND (r.last_reply IS NULL OR m.created_at > r.last_reply)
             ) AS unanswered_count
        FROM pair p
        LEFT JOIN LATERAL (
          SELECT max(m2.created_at) AS last_reply
            FROM public.messages m2
           WHERE m2.sender_id   = p.receiver_id
             AND m2.receiver_id = p.sender_id
        ) r ON true
    )`;
}

function flaggedSelectSql() {
  return `${flaggedCteSql()}
    SELECT f.sender_id,
           ('MAT' || f.sender_id)                   AS sender_mat,
           concat_ws(' ', sa.ufname, sa.ulname)     AS sender_name,
           f.receiver_id,
           ('MAT' || f.receiver_id)                 AS recipient_mat,
           concat_ws(' ', ra.ufname, ra.ulname)     AS recipient_name,
           f.unanswered_count,
           f.last_msg_time                          AS last_message_time
      FROM flagged f
      JOIN public.users sa ON sa.uid = f.sender_id
      JOIN public.users ra ON ra.uid = f.receiver_id
     WHERE f.unanswered_count > 10
     ORDER BY f.unanswered_count DESC, f.last_msg_time DESC`;
}

function flaggedCountSql() {
  return `${flaggedCteSql()}
    SELECT count(*)::int AS c
      FROM flagged f
     WHERE f.unanswered_count > 10`;
}

async function listFlaggedSenders({ page, limit }) {
  const client = await pool.connect();
  try {
    const offset = (page - 1) * limit;
    const [data, count] = await Promise.all([
      client.query(`${flaggedSelectSql()} LIMIT $1 OFFSET $2`, [limit, offset]),
      client.query(flaggedCountSql(), [])
    ]);
    return { rows: data.rows, total: count.rows[0].c };
  } finally {
    client.release();
  }
}

// ── Impersonation tokens ──────────────────────────────────────────────────────
// Single-use, 60-second tokens. Retry ONCE on a UNIQUE collision (23505).
async function createImpersonationToken(uid, adminId) {
  const client = await pool.connect();
  try {
    for (let attempt = 0; attempt < 2; attempt++) {
      const token = crypto.randomBytes(32).toString('hex'); // 64 chars
      try {
        const { rows } = await client.query(
          `INSERT INTO public.admin_impersonation_tokens (token, uid, admin_id, expires_at)
                VALUES ($1, $2, $3, now() + interval '60 seconds')
             RETURNING token`,
          [token, uid, adminId]
        );
        return rows[0].token;
      } catch (err) {
        if (err.code === '23505' && attempt === 0) continue; // collision — retry once
        throw err;
      }
    }
    // Unreachable in practice; the loop either returns or throws above.
    throw new Error('Failed to create impersonation token.');
  } finally {
    client.release();
  }
}

// ── Contact-view limit setting ──────────────────────────────────────────────
// The daily contact-view limit lives in the app_settings key/value table under
// the key 'daily_contact_view_limit'. Enforcement (dbController) reads it live,
// so updates here take effect on the next request. Default to 5 when missing.
const CONTACT_LIMIT_KEY = 'daily_contact_view_limit';
const CONTACT_LIMIT_DEFAULT = 5;

async function getContactViewLimit() {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(
      `SELECT value FROM public.app_settings WHERE key = $1`,
      [CONTACT_LIMIT_KEY]
    );
    const parsed = rows[0] ? parseInt(rows[0].value, 10) : NaN;
    return Number.isFinite(parsed) ? parsed : CONTACT_LIMIT_DEFAULT;
  } finally {
    client.release();
  }
}

async function setContactViewLimit(value) {
  const limit = Number(value);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error('Invalid contact view limit.');
  }
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO public.app_settings (key, value, updated_at)
            VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [CONTACT_LIMIT_KEY, String(limit)]
    );
    return limit;
  } finally {
    client.release();
  }
}

// ── Audit log ──────────────────────────────────────────────────────────────
async function writeAudit({ adminId, action, targetUid, details }) {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO public.admin_audit_log (admin_id, action, target_uid, details)
            VALUES ($1, $2, $3, $4)`,
      [adminId ?? null, action, targetUid ?? null, details != null ? JSON.stringify(details) : null]
    );
  } finally {
    client.release();
  }
}

// ── Cascade hard-delete ──────────────────────────────────────────────────────
// Transactional. Deletes the user and everything tied to them. Tables with an
// ON DELETE CASCADE FK to users(uid) (conversations, messages, proposals,
// proposal_responses, contact_views, admin_impersonation_tokens) are handled by
// the final DELETE FROM users. usergallery.uid and userdetails.uid have NO FK,
// so they are deleted explicitly inside the transaction. Image files are removed
// best-effort (failures logged, NOT fatal, NOT rolled back).
async function deleteUserCascade(uid, adminId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const gallery = await client.query(
      `SELECT imagepath, imagepath_medium, imagepath_thumb
         FROM public.usergallery WHERE uid = $1`,
      [uid]
    );

    // Best-effort file cleanup (outside the DB's rollback concern).
    gallery.rows.forEach((row) => {
      try {
        imageService.deleteImageFiles(row.imagepath, row.imagepath_medium, row.imagepath_thumb);
      } catch (e) {
        console.error(`deleteUserCascade: file cleanup failed for uid ${uid}:`, e.message);
      }
    });

    await client.query(`DELETE FROM public.usergallery WHERE uid = $1`, [uid]);
    await client.query(`DELETE FROM public.userdetails WHERE uid = $1`, [uid]);
    await client.query(
      `DELETE FROM public.contact_views WHERE viewer_id = $1 OR viewed_uid = $1`,
      [uid]
    );
    await client.query(`DELETE FROM public.users WHERE uid = $1`, [uid]);

    await client.query(
      `INSERT INTO public.admin_audit_log (admin_id, action, target_uid, details)
            VALUES ($1, $2, $3, $4)`,
      [adminId ?? null, 'delete_user', uid, JSON.stringify({ galleryDeleted: gallery.rows.length })]
    );

    await client.query('COMMIT');
    return { uid, galleryDeleted: gallery.rows.length };
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) { /* best effort */ }
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  findAdminByIdentifier,
  getDashboard,
  listUsers,
  setUserStatus,
  setProfileStatus,
  listPhotos,
  setPhotoStatus,
  listFlaggedSenders,
  createImpersonationToken,
  writeAudit,
  deleteUserCascade,
  getContactViewLimit,
  setContactViewLimit
};
