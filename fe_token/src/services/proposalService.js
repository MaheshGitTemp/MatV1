 


// src/services/proposalService.js
import api from '../utils/api';

// POST /api/sendProposal   body: { sender_id, receiver_id }
export const sendProposal = async (senderId, receiverId) => {
  return await api.post('/sendProposal', {
    sender_id:   Number(senderId),
    receiver_id: Number(receiverId)
  });
};

// POST /api/getSentProposals   body: { sender_id }
export const getSentProposals = async (senderId) => {
  return await api.post('/getSentProposals', { sender_id: Number(senderId) });
};

// POST /api/getNotifications   body: { receiver_id }
export const getNotifications = async (receiverId) => {
  return await api.post('/getNotifications', { receiver_id: Number(receiverId) });
};

// POST /api/getSenderNotifications   body: { sender_id }
export const getSenderNotifications = async (senderId) => {
  return await api.post('/getSenderNotifications', { sender_id: Number(senderId) });
};

// POST /api/acceptProposal   body: { proposal_id, receiver_id }
export const acceptProposal = async (proposalId, receiverId) => {
  return await api.post('/acceptProposal', {
    proposal_id: proposalId,
    receiver_id: Number(receiverId)
  });
};

// POST /api/rejectProposal   body: { proposal_id, receiver_id }
export const rejectProposal = async (proposalId, receiverId) => {
  return await api.post('/rejectProposal', {
    proposal_id: proposalId,
    receiver_id: Number(receiverId)
  });
};

// POST /api/getUnreadCount   body: { receiver_id }
export const getUnreadCount = async (receiverId) => {
  return await api.post('/getUnreadCount', { receiver_id: Number(receiverId) });
};

// POST /api/markNotificationsRead   body: { receiver_id }
export const markNotificationsRead = async (receiverId) => {
  return await api.post('/markNotificationsRead', { receiver_id: Number(receiverId) });
};

// POST /api/markSenderNotificationsRead   body: { sender_id }
export const markSenderNotificationsRead = async (senderId) => {
  return await api.post('/markSenderNotificationsRead', { sender_id: Number(senderId) });
};

// Polling helpers
export const fetchReceivedUnreadCount = async (receiverId) => {
  return await api.post('/getUnreadCount', { receiver_id: Number(receiverId) });
};

export const fetchSentUnreadCount = async (senderId) => {
  return await api.post('/getSenderNotifications', { sender_id: Number(senderId) });
};