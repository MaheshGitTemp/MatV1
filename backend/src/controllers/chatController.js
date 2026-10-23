
const chatService = require('../services/chat');

exports.sendMessage = async (req, res) => {
    try {
        const { sender_id, receiver_id, message, message_type = 'text' } = req.body;

        if (!sender_id || !receiver_id || !message) {
            return res.status(400).json({
                status: 'Failure',
                result: 'sender_id, receiver_id and message are required.'
            });
        }
        if (Number(sender_id) === Number(receiver_id)) {
            return res.status(400).json({
                status: 'Failure',
                result: 'You cannot message yourself.'
            });
        }
        if (message.trim().length === 0) {
            return res.status(400).json({
                status: 'Failure',
                result: 'Message cannot be empty.'
            });
        }

        const validTypes = ['text', 'image', 'file'];
        if (!validTypes.includes(message_type)) {
            return res.status(400).json({
                status: 'Failure',
                result: 'message_type must be text, image or file.'
            });
        }

        const result = await chatService.sendMessage(
            Number(sender_id),
            Number(receiver_id),
            message.trim(),
            message_type
        );

        return res.status(200).json({
            status: 'Success',
            result: result.message,
            data:   result.data
        });
    } catch (error) {
        console.error('sendMessage controller error:', error);
        res.status(500).json({ status: 'Failure', result: error.message });
    }
};


exports.getMessages = async (req, res) => {
    try {
        const { user_id, other_user_id, page = 1, limit = 50 } = req.body;

        if (!user_id || !other_user_id) {
            return res.status(400).json({
                status: 'Failure',
                result: 'user_id and other_user_id are required.'
            });
        }

        const result = await chatService.getMessages(
            Number(user_id),
            Number(other_user_id),
            Number(page),
            Number(limit)
        );

        return res.status(200).json({
            status:         'Success',
            data:           result.rows,
            total:          result.total,
            conversationId: result.conversationId,
            page:           Number(page),
            limit:          Number(limit)
        });
    } catch (error) {
        console.error('getMessages controller error:', error);
        res.status(500).json({ status: 'Failure', result: error.message });
    }
};


exports.getInbox = async (req, res) => {
    try {
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({
                status: 'Failure',
                result: 'user_id is required.'
            });
        }

        const rows = await chatService.getInbox(Number(user_id));

        return res.status(200).json({
            status: 'Success',
            data:   rows
        });
    } catch (error) {
        console.error('getInbox controller error:', error);
        res.status(500).json({ status: 'Failure', result: error.message });
    }
};


exports.getUnreadMessageCount = async (req, res) => {
    try {
        const { user_id } = req.body;

        if (!user_id) {
            return res.status(400).json({
                status: 'Failure',
                result: 'user_id is required.'
            });
        }

        const count = await chatService.getUnreadMessageCount(Number(user_id));

        return res.status(200).json({
            status:      'Success',
            unreadCount: count
        });
    } catch (error) {
        console.error('getUnreadMessageCount controller error:', error);
        res.status(500).json({ status: 'Failure', result: error.message });
    }
};


exports.markMessagesRead = async (req, res) => {
    try {
        const { conversation_id, user_id } = req.body;

        if (!conversation_id || !user_id) {
            return res.status(400).json({
                status: 'Failure',
                result: 'conversation_id and user_id are required.'
            });
        }

        await chatService.markMessagesRead(
            Number(conversation_id),
            Number(user_id)
        );

        return res.status(200).json({
            status: 'Success',
            result: 'Messages marked as read.'
        });
    } catch (error) {
        console.error('markMessagesRead controller error:', error);
        res.status(500).json({ status: 'Failure', result: error.message });
    }
};


exports.deleteMessage = async (req, res) => {
    try {
        const { message_id, user_id } = req.body;

        if (!message_id || !user_id) {
            return res.status(400).json({
                status: 'Failure',
                result: 'message_id and user_id are required.'
            });
        }

        const result = await chatService.deleteMessage(
            Number(message_id),
            Number(user_id)
        );

        if (!result.success) {
            return res.status(200).json({ status: 'Failure', result: result.message });
        }

        return res.status(200).json({ status: 'Success', result: result.message });
    } catch (error) {
        console.error('deleteMessage controller error:', error);
        res.status(500).json({ status: 'Failure', result: error.message });
    }
};


exports.getConversation = async (req, res) => {
    try {
        const { user_id, other_user_id } = req.body;

        if (!user_id || !other_user_id) {
            return res.status(400).json({
                status: 'Failure',
                result: 'user_id and other_user_id are required.'
            });
        }

        const conversation = await chatService.getConversation(
            Number(user_id),
            Number(other_user_id)
        );

        if (!conversation) {
            return res.status(200).json({
                status: 'Success',
                data:   null,
                result: 'No conversation found.'
            });
        }

        return res.status(200).json({
            status: 'Success',
            data:   conversation
        });
    } catch (error) {
        console.error('getConversation controller error:', error);
        res.status(500).json({ status: 'Failure', result: error.message });
    }
};