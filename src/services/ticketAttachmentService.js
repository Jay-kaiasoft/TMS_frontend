import axiosInterceptor from './axiosInterceptor';

export const uploadTicketAttachment = async (id, formData) => {
    try {
        const response = await axiosInterceptor.post(`/tickets/${id}/attachments`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        console.error("Error uploading ticket attachment:", error);
        throw error;
    }
};

export const deleteTicketAttachment = async (ticketId, attachmentId) => {
    try {
        const response = await axiosInterceptor.delete(`/tickets/${ticketId}/attachments/${attachmentId}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting ticket attachment ${attachmentId}:`, error);
        throw error;
    }
};
