// services/chat.js
// Updated to match messages table columns from image:
// id, sender_id, receiver_id, message, message_type,
// is_read, read_at, created_at, deleted_by_sender, deleted_by_receiver

const pool = require('./pool');

// ─── Helper: Get or Create Conversation ──────────────────────────────────────
const getOrCreateConversation = async (userAId, userBId) => {
    const client = await pool.connect();
    try {
        const user1_id = Math.min(userAId, userBId);
        const user2_id = Math.max(userAId, userBId);

        const existing = await client.query(
            `SELECT * FROM conversations WHERE user1_id = $1 AND user2_id = $2`,
            [user1_id, user2_id]
        );

        if (existing.rows.length > 0) return existing.rows[0];

        const result = await client.query(
            `INSERT INTO conversations (user1_id, user2_id)
             VALUES ($1, $2) RETURNING *`,
            [user1_id, user2_id]
        );

        return result.rows[0];
    } catch (error) {
        console.error('getOrCreateConversation error:', error);
        throw error;
    } finally {
        client.release();
    }
};

// ─── Send Message ─────────────────────────────────────────────────────────────
// POST /api/sendMessage
// Body: { sender_id, receiver_id, message, message_type? }
// message_type: 'text' | 'image' | 'file'  (default: 'text')
const sendMessage = async (senderId, receiverId, message, messageType = 'text') => {
    const client = await pool.connect();
    try {
        const conversation = await getOrCreateConversation(senderId, receiverId);

        const result = await client.query(
            `INSERT INTO messages 
             (conversation_id, sender_id, receiver_id, message, message_type,
              is_read, read_at, deleted_by_sender, deleted_by_receiver)
             VALUES ($1, $2, $3, $4, $5, false, null, false, false)
             RETURNING *`,
            [conversation.id, senderId, receiverId, message, messageType]
        );

        // Update conversation updated_at — keeps inbox sorted by latest
        await client.query(
            `UPDATE conversations SET updated_at = NOW() WHERE id = $1`,
            [conversation.id]
        );

        return { success: true, message: 'Message sent.', data: result.rows[0] };
    } catch (error) {
        console.error('sendMessage error:', error);
        throw error;
    } finally {
        client.release();
    }
};

// ─── Get Messages (Chat History) ─────────────────────────────────────────────
// POST /api/getMessages
// Body: { user_id, other_user_id, page?, limit? }
// Filters out messages deleted by this user
// Marks received messages as read + sets read_at timestamp
const getMessages = async (userId, otherUserId, page = 1, limit = 50) => {
    const client = await pool.connect();
    try {
        const user1_id = Math.min(userId, otherUserId);
        const user2_id = Math.max(userId, otherUserId);

        const convResult = await client.query(
            `SELECT * FROM conversations WHERE user1_id = $1 AND user2_id = $2`,
            [user1_id, user2_id]
        );

        if (convResult.rows.length === 0) {
            return { rows: [], total: 0, conversationId: null };
        }

        const conversationId = convResult.rows[0].id;
        const offset = (page - 1) * limit;

        // Fetch messages — filter out deleted ones based on who is requesting
        // If userId is sender   → exclude deleted_by_sender = true
        // If userId is receiver → exclude deleted_by_receiver = true
        const result = await client.query(
            `SELECT 
                m.id,
                m.conversation_id,
                m.sender_id,
                m.receiver_id,
                m.message,
                m.message_type,
                m.is_read,
                m.read_at,
                m.created_at,
                m.deleted_by_sender,
                m.deleted_by_receiver,
                u.ufname AS sender_fname,
                u.ulname AS sender_lname
             FROM messages m
             JOIN users u ON u.uid = m.sender_id
             WHERE m.conversation_id = $1
               AND (
                 -- Hide messages deleted by this user
                 CASE
                   WHEN m.sender_id   = $2 THEN m.deleted_by_sender   = false
                   WHEN m.receiver_id = $2 THEN m.deleted_by_receiver = false
                   ELSE true
                 END
               )
             ORDER BY m.created_at ASC
             LIMIT $3 OFFSET $4`,
            [conversationId, userId, limit, offset]
        );

        // Count total visible messages for this user
        const countResult = await client.query(
            `SELECT COUNT(*) AS total FROM messages
             WHERE conversation_id = $1
               AND (
                 CASE
                   WHEN sender_id   = $2 THEN deleted_by_sender   = false
                   WHEN receiver_id = $2 THEN deleted_by_receiver = false
                   ELSE true
                 END
               )`,
            [conversationId, userId]
        );

        // Mark messages received by this user as read + set read_at
        await client.query(
            `UPDATE messages
             SET is_read = true, read_at = NOW()
             WHERE conversation_id = $1
               AND receiver_id = $2
               AND is_read = false`,
            [conversationId, userId]
        );

        return {
            rows:           result.rows,
            total:          parseInt(countResult.rows[0].total, 10),
            conversationId: conversationId
        };
    } catch (error) {
        console.error('getMessages error:', error);
        throw error;
    } finally {
        client.release();
    }
};

// ─── Get Inbox (All Conversations) ───────────────────────────────────────────
// POST /api/getInbox
// Body: { user_id }
// Returns all conversations with last message, unread count, other user info
const getInbox = async (userId) => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT 
                c.id AS conversation_id,
                c.updated_at,

                -- Other user info
                CASE WHEN c.user1_id = $1 THEN c.user2_id ELSE c.user1_id END AS other_user_id,
                CASE WHEN c.user1_id = $1 THEN u2.ufname  ELSE u1.ufname  END AS other_fname,
                CASE WHEN c.user1_id = $1 THEN u2.ulname  ELSE u1.ulname  END AS other_lname,
                CASE WHEN c.user1_id = $1 THEN u2.ugender ELSE u1.ugender END AS other_gender,

                -- Last message (not deleted by this user)
                (SELECT m.message FROM messages m
                 WHERE m.conversation_id = c.id
                   AND CASE
                     WHEN m.sender_id   = $1 THEN m.deleted_by_sender   = false
                     WHEN m.receiver_id = $1 THEN m.deleted_by_receiver = false
                     ELSE true END
                 ORDER BY m.created_at DESC LIMIT 1) AS last_message,

                (SELECT m.message_type FROM messages m
                 WHERE m.conversation_id = c.id
                   AND CASE
                     WHEN m.sender_id   = $1 THEN m.deleted_by_sender   = false
                     WHEN m.receiver_id = $1 THEN m.deleted_by_receiver = false
                     ELSE true END
                 ORDER BY m.created_at DESC LIMIT 1) AS last_message_type,

                (SELECT m.created_at FROM messages m
                 WHERE m.conversation_id = c.id
                 ORDER BY m.created_at DESC LIMIT 1) AS last_message_time,

                (SELECT m.sender_id FROM messages m
                 WHERE m.conversation_id = c.id
                 ORDER BY m.created_at DESC LIMIT 1) AS last_message_sender_id,

                (SELECT m.is_read FROM messages m
                 WHERE m.conversation_id = c.id
                 ORDER BY m.created_at DESC LIMIT 1) AS last_message_is_read,

                (SELECT m.read_at FROM messages m
                 WHERE m.conversation_id = c.id
                 ORDER BY m.created_at DESC LIMIT 1) AS last_message_read_at,

                -- Unread count for this user
                (SELECT COUNT(*) FROM messages m
                 WHERE m.conversation_id = c.id
                   AND m.receiver_id = $1
                   AND m.is_read = false
                   AND m.deleted_by_receiver = false) AS unread_count,
 
 
-- Other user profile picture (Use thumbnail for faster chat loading!)
(SELECT COALESCE(g.imagepath_thumb, g.imagepath) FROM usergallery g
 WHERE g.uid = CASE WHEN c.user1_id = $1 THEN c.user2_id ELSE c.user1_id END
   AND g.isprofile = true AND g.status = 'approved' LIMIT 1) AS other_profile_pic

             FROM conversations c
             JOIN users u1 ON u1.uid = c.user1_id
             JOIN users u2 ON u2.uid = c.user2_id
             WHERE c.user1_id = $1 OR c.user2_id = $1
             ORDER BY c.updated_at DESC`,
            [userId]
        );

        return result.rows;
    } catch (error) {
        console.error('getInbox error:', error);
        throw error;
    } finally {
        client.release();
    }
};

// ─── Get Unread Message Count (Badge) ─────────────────────────────────────────
// POST /api/getUnreadMessageCount
// Body: { user_id }
const getUnreadMessageCount = async (userId) => {
    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT COUNT(*) AS count FROM messages
             WHERE receiver_id = $1
               AND is_read = false
               AND deleted_by_receiver = false`,
            [userId]
        );
        return parseInt(result.rows[0].count, 10);
    } catch (error) {
        console.error('getUnreadMessageCount error:', error);
        throw error;
    } finally {
        client.release();
    }
};

// ─── Mark Messages as Read ────────────────────────────────────────────────────
// POST /api/markMessagesRead
// Body: { conversation_id, user_id }
// Sets is_read = true and read_at = NOW()
const markMessagesRead = async (conversationId, userId) => {
    const client = await pool.connect();
    try {
        await client.query(
            `UPDATE messages
             SET is_read = true, read_at = NOW()
             WHERE conversation_id = $1
               AND receiver_id = $2
               AND is_read = false`,
            [conversationId, userId]
        );
        return { success: true };
    } catch (error) {
        console.error('markMessagesRead error:', error);
        throw error;
    } finally {
        client.release();
    }
};

// ─── Delete Message (Soft Delete) ────────────────────────────────────────────
// POST /api/deleteMessage
// Body: { message_id, user_id }
// Sets deleted_by_sender OR deleted_by_receiver based on who is deleting
// Message only fully disappears when BOTH sides delete it
const deleteMessage = async (messageId, userId) => {
    const client = await pool.connect();
    try {
        // First find the message to know if user is sender or receiver
        const msgResult = await client.query(
            `SELECT * FROM messages WHERE id = $1`,
            [messageId]
        );

        if (msgResult.rows.length === 0) {
            return { success: false, message: 'Message not found.' };
        }

        const msg = msgResult.rows[0];

        if (msg.sender_id !== userId && msg.receiver_id !== userId) {
            return { success: false, message: 'Not authorized to delete this message.' };
        }

        // Set correct deleted flag based on role
        if (msg.sender_id === userId) {
            await client.query(
                `UPDATE messages SET deleted_by_sender = true WHERE id = $1`,
                [messageId]
            );
        } else {
            await client.query(
                `UPDATE messages SET deleted_by_receiver = true WHERE id = $1`,
                [messageId]
            );
        }

        return { success: true, message: 'Message deleted.' };
    } catch (error) {
        console.error('deleteMessage error:', error);
        throw error;
    } finally {
        client.release();
    }
};

// ─── Get Conversation ─────────────────────────────────────────────────────────
// POST /api/getConversation
// Body: { user_id, other_user_id }
const getConversation = async (userAId, userBId) => {
    const client = await pool.connect();
    try {
        const user1_id = Math.min(userAId, userBId);
        const user2_id = Math.max(userAId, userBId);

        const result = await client.query(
            `SELECT * FROM conversations WHERE user1_id = $1 AND user2_id = $2`,
            [user1_id, user2_id]
        );

        return result.rows[0] || null;
    } catch (error) {
        console.error('getConversation error:', error);
        throw error;
    } finally {
        client.release();
    }
};

// ─── Exports ──────────────────────────────────────────────────────────────────
module.exports.sendMessage           = sendMessage;
module.exports.getMessages           = getMessages;
module.exports.getInbox              = getInbox;
module.exports.getUnreadMessageCount = getUnreadMessageCount;
module.exports.markMessagesRead      = markMessagesRead;
module.exports.deleteMessage         = deleteMessage;
module.exports.getConversation       = getConversation;