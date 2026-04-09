import axiosInterceptor from './axiosInterceptor';

export const getTicketComments = async (ticketId) => {
    try {
        const response = await axiosInterceptor.get(`/ticket_comments?ticket_id=${ticketId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching comments for ticket ${ticketId}:`, error);
        throw error;
    }
};

export const addTicketComment = async (data) => {
    try {
        const response = await axiosInterceptor.post('/ticket_comments', data);
        return response.data;
    } catch (error) {
        console.error("Error adding comment:", error);
        throw error;
    }
};

export const updateTicketComment = async (id, data) => {
    try {
        const response = await axiosInterceptor.put(`/ticket_comments/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating comment ${id}:`, error);
        throw error;
    }
};

export const deleteTicketComment = async (id) => {
    try {
        const response = await axiosInterceptor.delete(`/ticket_comments/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting comment ${id}:`, error);
        throw error;
    }
};

export const uploadCommentAttachment = async (commentId, formData) => {
    try {
        const response = await axiosInterceptor.post(`/ticket_comments/${commentId}/attachments`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error(`Error uploading attachment for comment ${commentId}:`, error);
        throw error;
    }
};

export const deleteCommentAttachment = async (commentId, attachmentId) => {
    try {
        const response = await axiosInterceptor.delete(`/ticket_comments/${commentId}/attachments/${attachmentId}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting attachment ${attachmentId}:`, error);
        throw error;
    }
};
