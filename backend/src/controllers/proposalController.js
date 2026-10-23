 

const proposalService = require('../services/proposal');

// ─── Send Proposal ────────────────────────────────────────────────────────────
exports.sendProposal = async (req, res) => {
    try {
        const { sender_id, receiver_id } = req.body;
        if (!sender_id || !receiver_id)
            return res.status(400).json({ status: 'Failure', result: 'sender_id and receiver_id are required.' });
        if (sender_id === receiver_id)
            return res.status(400).json({ status: 'Failure', result: 'You cannot send a proposal to yourself.' });

        const result = await proposalService.sendProposal(sender_id, receiver_id);
        if (!result.success)
            return res.status(200).json({ status: 'Failure', result: result.message });

        return res.status(200).json({ status: 'Success', result: result.message, data: result.data });
    } catch (error) {
        res.status(500).json({ status: 'Failure', result: error.message });
    }
};

// ─── Get Notifications for Receiver/User 1 ────────────────────────────────────
exports.getNotifications = async (req, res) => {
    try {
        const { receiver_id } = req.body;
        if (!receiver_id)
            return res.status(400).json({ status: 'Failure', result: 'receiver_id is required.' });

        const result = await proposalService.getNotifications(receiver_id);
        return res.status(200).json({
            status: 'Success',
            data: result.rows,
            unreadCount: result.unreadCount
        });
    } catch (error) {
        res.status(500).json({ status: 'Failure', result: error.message });
    }
};

// ─── Accept Proposal ──────────────────────────────────────────────────────────
exports.acceptProposal = async (req, res) => {
    try {
        const { proposal_id, receiver_id } = req.body;
        if (!proposal_id || !receiver_id)
            return res.status(400).json({ status: 'Failure', result: 'proposal_id and receiver_id are required.' });

        const result = await proposalService.acceptProposal(proposal_id, receiver_id);
        if (!result.success)
            return res.status(200).json({ status: 'Failure', result: result.message });

        return res.status(200).json({ status: 'Success', result: result.message, data: result.data });
    } catch (error) {
        res.status(500).json({ status: 'Failure', result: error.message });
    }
};

// ─── Reject Proposal ──────────────────────────────────────────────────────────
exports.rejectProposal = async (req, res) => {
    try {
        const { proposal_id, receiver_id } = req.body;
        if (!proposal_id || !receiver_id)
            return res.status(400).json({ status: 'Failure', result: 'proposal_id and receiver_id are required.' });

        const result = await proposalService.rejectProposal(proposal_id, receiver_id);
        if (!result.success)
            return res.status(200).json({ status: 'Failure', result: result.message });

        return res.status(200).json({ status: 'Success', result: result.message, data: result.data });
    } catch (error) {
        res.status(500).json({ status: 'Failure', result: error.message });
    }
};

// ─── Mark Receiver Notifications Read ─────────────────────────────────────────
exports.markNotificationsRead = async (req, res) => {
    try {
        const { receiver_id } = req.body;
        if (!receiver_id)
            return res.status(400).json({ status: 'Failure', result: 'receiver_id is required.' });

        await proposalService.markNotificationsRead(receiver_id);
        return res.status(200).json({ status: 'Success', result: 'Notifications marked as read.' });
    } catch (error) {
        res.status(500).json({ status: 'Failure', result: error.message });
    }
};

// ─── Get Unread Count ─────────────────────────────────────────────────────────
exports.getUnreadCount = async (req, res) => {
    try {
        const { receiver_id } = req.body;
        if (!receiver_id)
            return res.status(400).json({ status: 'Failure', result: 'receiver_id is required.' });

        const count = await proposalService.getUnreadCount(receiver_id);
        return res.status(200).json({ status: 'Success', unreadCount: count });
    } catch (error) {
        res.status(500).json({ status: 'Failure', result: error.message });
    }
};

// ─── Get Sent Proposals ───────────────────────────────────────────────────────
exports.getSentProposals = async (req, res) => {
    try {
        const { sender_id } = req.body;
        if (!sender_id)
            return res.status(400).json({ status: 'Failure', result: 'sender_id is required.' });

        const rows = await proposalService.getSentProposals(sender_id);
        return res.status(200).json({ status: 'Success', data: rows });
    } catch (error) {
        res.status(500).json({ status: 'Failure', result: error.message });
    }
};

// ─── Get Sender Notifications/User 2 (responses to my sent proposals) ─────────
exports.getSenderNotifications = async (req, res) => {
    try {
        const { sender_id } = req.body;
        if (!sender_id)
            return res.status(400).json({ status: 'Failure', result: 'sender_id is required.' });

        const result = await proposalService.getSenderNotifications(sender_id);
        return res.status(200).json({
            status: 'Success',
            data: result.rows,
            unreadCount: result.unreadCount
        });
    } catch (error) {
        res.status(500).json({ status: 'Failure', result: error.message });
    }
};

// ─── Mark Sender Notifications Read ──────────────────────────────────────────
exports.markSenderNotificationsRead = async (req, res) => {
    try {
        const { sender_id } = req.body;
        if (!sender_id)
            return res.status(400).json({ status: 'Failure', result: 'sender_id is required.' });

        await proposalService.markSenderNotificationsRead(sender_id);
        return res.status(200).json({ status: 'Success', result: 'Marked as read.' });
    } catch (error) {
        res.status(500).json({ status: 'Failure', result: error.message });
    }
};