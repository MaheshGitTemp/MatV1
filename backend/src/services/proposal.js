

const pool = require('./pool');

// ─── Send Proposal ────────────────────────────────────────────────────────────
const sendProposal = async (senderId, receiverId) => {
    const client = await pool.connect();
    try {
        const existing = await client.query(
            `SELECT id, status FROM proposals WHERE sender_id = $1 AND receiver_id = $2`,
            [senderId, receiverId]
        );
        if (existing.rows.length > 0) {
            return { success: false, message: 'Proposal already sent.', data: existing.rows[0] };
        }
        const result = await client.query(
            `INSERT INTO proposals (sender_id, receiver_id, status, is_read)
             VALUES ($1, $2, 'pending', false) RETURNING *`,
            [senderId, receiverId]
        );
        return { success: true, message: 'Proposal sent successfully.', data: result.rows[0] };
    } catch (error) {
        console.error('sendProposal error:', error);
        throw error;
    } finally {
        client.release();
    }
};

// ─── Get Notifications for Receiver/User1 (proposals sent TO me) ──────────────
const getNotifications = async (receiverId) => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT 
                p.id, p.sender_id, p.receiver_id, p.status, p.is_read, p.created_at,
                u.ufname, u.ulname, u.ugender,
                -- ✅ Include profile pic directly — eliminates separate GetUserGallery call
                (SELECT g.imagepath_thumb FROM usergallery g 
                 WHERE g.uid = p.sender_id AND g.isprofile = true AND g.status = 'approved'
                 LIMIT 1) AS sender_pic_thumb,
                (SELECT g.imagepath FROM usergallery g 
                 WHERE g.uid = p.sender_id AND g.isprofile = true AND g.status = 'approved'
                 LIMIT 1) AS sender_pic
             FROM proposals p
             JOIN users u ON u.uid = p.sender_id
             WHERE p.receiver_id = $1
             ORDER BY p.created_at DESC`,
            [receiverId]
        );
        const unreadCount = result.rows.filter(r => r.is_read === false).length;
        return { rows: result.rows, unreadCount };
    } catch (error) {
        console.error('getNotifications error:', error);
        throw error;
    } finally {
        client.release();
    }
};

// ─── Accept Proposal ──────────────────────────────────────────────────────────
// Step 1: updates proposals table
// Step 2: inserts into proposal_responses so User 2 gets notified
const acceptProposal = async (proposalId, receiverId) => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `UPDATE proposals 
             SET status = 'accepted', is_read = true, updated_at = NOW()
             WHERE id = $1 AND receiver_id = $2 AND status = 'pending'
             RETURNING *`,
            [proposalId, receiverId]
        );
        if (result.rowCount === 0) {
            return { success: false, message: 'Proposal not found or already actioned.' };
        }
        const proposal = result.rows[0];

        // KEY STEP: insert into proposal_responses so sender (User 2) sees it
        await client.query(
            `INSERT INTO proposal_responses 
             (proposal_id, sender_id, receiver_id, response_status, is_read)
             VALUES ($1, $2, $3, 'accepted', false)`,
            [proposalId, proposal.sender_id, receiverId]
        );
        console.log(`[PROPOSAL] Response inserted: proposal_id=${proposalId} sender_id=${proposal.sender_id} status=accepted`);

        return { success: true, message: 'Proposal accepted.', data: proposal };
    } catch (error) {
        console.error('acceptProposal error:', error);
        throw error;
    } finally {
        client.release();
    }
};

// ─── Reject Proposal ──────────────────────────────────────────────────────────
const rejectProposal = async (proposalId, receiverId) => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `UPDATE proposals 
             SET status = 'rejected', is_read = true, updated_at = NOW()
             WHERE id = $1 AND receiver_id = $2 AND status = 'pending'
             RETURNING *`,
            [proposalId, receiverId]
        );
        if (result.rowCount === 0) {
            return { success: false, message: 'Proposal not found or already actioned.' };
        }
        const proposal = result.rows[0];

        // KEY STEP: insert into proposal_responses so sender (User 2) sees it
        await client.query(
            `INSERT INTO proposal_responses 
             (proposal_id, sender_id, receiver_id, response_status, is_read)
             VALUES ($1, $2, $3, 'rejected', false)`,
            [proposalId, proposal.sender_id, receiverId]
        );
        console.log(`[PROPOSAL] Response inserted: proposal_id=${proposalId} sender_id=${proposal.sender_id} status=rejected`);

        return { success: true, message: 'Proposal rejected.', data: proposal };
    } catch (error) {
        console.error('rejectProposal error:', error);
        throw error;
    } finally {
        client.release();
    }
};

// ─── Mark Receiver Notifications Read ─────────────────────────────────────────
const markNotificationsRead = async (receiverId) => {
    const client = await pool.connect();
    try {
        await client.query(
            `UPDATE proposals SET is_read = true WHERE receiver_id = $1 AND is_read = false`,
            [receiverId]
        );
        return { success: true };
    } catch (error) {
        console.error('markNotificationsRead error:', error);
        throw error;
    } finally {
        client.release();
    }
};

// ─── Get Unread Count for Badge ───────────────────────────────────────────────
const getUnreadCount = async (receiverId) => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT COUNT(*) AS count FROM proposals WHERE receiver_id = $1 AND is_read = false`,
            [receiverId]
        );
        return parseInt(result.rows[0].count, 10);
    } catch (error) {
        console.error('getUnreadCount error:', error);
        throw error;
    } finally {
        client.release();
    }
};

// ─── Get Sent Proposals ───────────────────────────────────────────────────────
const getSentProposals = async (senderId) => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT p.id, p.receiver_id, p.status, p.created_at,
                u.ufname, u.ulname, u.ugender, u.ucaste, u.upresentloc, u.udob,
                -- ✅ Include profile pic directly — eliminates separate GetUserGallery call
                (SELECT g.imagepath_thumb FROM usergallery g 
                 WHERE g.uid = p.receiver_id AND g.isprofile = true AND g.status = 'approved'
                 LIMIT 1) AS receiver_pic_thumb,
                (SELECT g.imagepath FROM usergallery g 
                 WHERE g.uid = p.receiver_id AND g.isprofile = true AND g.status = 'approved'
                 LIMIT 1) AS receiver_pic
             FROM proposals p
             JOIN users u ON u.uid = p.receiver_id
             WHERE p.sender_id = $1
             ORDER BY p.created_at DESC`,
            [senderId]
        );
        return result.rows;
    } catch (error) {
        console.error('getSentProposals error:', error);
        throw error;
    } finally {
        client.release();
    }
};

// ─── Get Sender Notifications/User2 (responses to MY sent proposals) ──────────
const getSenderNotifications = async (senderId) => {
    const client = await pool.connect();
    try {
        console.log(`[PROPOSAL] getSenderNotifications called for sender_id=${senderId}`);
        const result = await client.query(
            `SELECT 
                pr.id,
                pr.proposal_id,
                pr.response_status,
                pr.sender_id,    
                pr.receiver_id,  
                pr.is_read,
                pr.created_at,
                u.ufname,
                u.ulname,
                u.udob,
                -- ✅ Include profile pic directly — eliminates separate GetUserGallery call
                (SELECT g.imagepath_thumb FROM usergallery g 
                 WHERE g.uid = pr.receiver_id AND g.isprofile = true AND g.status = 'approved'
                 LIMIT 1) AS receiver_pic_thumb,
                (SELECT g.imagepath FROM usergallery g 
                 WHERE g.uid = pr.receiver_id AND g.isprofile = true AND g.status = 'approved'
                 LIMIT 1) AS receiver_pic
             FROM proposal_responses pr
             JOIN users u ON u.uid = pr.receiver_id
             WHERE pr.sender_id = $1
             ORDER BY pr.created_at DESC`,
            [senderId]
        );
        console.log(`[PROPOSAL] getSenderNotifications found ${result.rows.length} rows`);
        const unreadCount = result.rows.filter(r => r.is_read === false).length;
        return { rows: result.rows, unreadCount };
    } catch (error) {
        console.error('getSenderNotifications error:', error);
        throw error;
    } finally {
        client.release();
    }
};

// ─── Mark Sender Notifications Read ──────────────────────────────────────────
// Called when User 2 opens bell — clears their badge
const markSenderNotificationsRead = async (senderId) => {
    const client = await pool.connect();
    try {
        await client.query(
            `UPDATE proposal_responses SET is_read = true WHERE sender_id = $1 AND is_read = false`,
            [senderId]
        );
        return { success: true };
    } catch (error) {
        console.error('markSenderNotificationsRead error:', error);
        throw error;
    } finally {
        client.release();
    }
};

// ─── Exports ──────────────────────────────────────────────────────────────────
module.exports.sendProposal                = sendProposal;
module.exports.getNotifications            = getNotifications;
module.exports.acceptProposal              = acceptProposal;
module.exports.rejectProposal              = rejectProposal;
module.exports.markNotificationsRead       = markNotificationsRead;
module.exports.getUnreadCount              = getUnreadCount;
module.exports.getSentProposals            = getSentProposals;
module.exports.getSenderNotifications      = getSenderNotifications;
module.exports.markSenderNotificationsRead  = markSenderNotificationsRead;