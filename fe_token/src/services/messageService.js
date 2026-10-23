 


// src/services/messageService.js
import api from '../utils/api';

// POST /api/getInbox   body: { user_id }
export const fetchInbox = async (userId) => {
  return await api.post('/getInbox', { user_id: Number(userId) });
};

// POST /api/getMessages   body: { user_id, other_user_id, page, limit }
export const fetchMessages = async (userId, otherUserId, page = 1, limit = 100) => {
  return await api.post('/getMessages', {
    user_id:       Number(userId),
    other_user_id: Number(otherUserId),
    page,
    limit
  });
};

// POST /api/sendMessage   body: { sender_id, receiver_id, message, message_type }
export const sendMessage = async (senderId, receiverId, message, messageType = 'text') => {
  return await api.post('/sendMessage', {
    sender_id:    Number(senderId),
    receiver_id:  Number(receiverId),
    message,
    message_type: messageType
  });
};

// POST /api/deleteMessage   body: { message_id, user_id }
export const deleteMessage = async (messageId, userId) => {
  return await api.post('/deleteMessage', {
    message_id: messageId,
    user_id:    Number(userId)
  });
};

// POST /api/getUnreadMessageCount   body: { user_id }
export const getUnreadMessageCount = async (userId) => {
  return await api.post('/getUnreadMessageCount', { user_id: Number(userId) });
};

// POST /api/markMessagesRead   body: { conversation_id, user_id }
export const markMessagesRead = async (conversationId, userId) => {
  return await api.post('/markMessagesRead', {
    conversation_id: Number(conversationId),
    user_id:         Number(userId)
  });
};

// POST /api/getConversation   body: { user_id, other_user_id }
export const getConversation = async (userId, otherUserId) => {
  return await api.post('/getConversation', {
    user_id:       Number(userId),
    other_user_id: Number(otherUserId)
  });
};
export const getTotalMessageCount = async (userId) => {
  return await api.post('/getTotalMessageCount', { user_id: userId });
};