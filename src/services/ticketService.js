import axiosInterceptor from './axiosInterceptor';

export const filterTickets = async (filter) => {
    try {
        const response = await axiosInterceptor.post('/tickets/filter', filter);
        return response.data;
    } catch (error) {
        console.error("Error filtering tickets:", error);
        throw error;
    }
};

export const getAllTickets = async () => {
    try {
        const response = await axiosInterceptor.get('/tickets');
        return response.data;
    } catch (error) {
        console.error("Error fetching all tickets:", error);
        throw error;
    }
};

export const getTicketById = async (id) => {
    try {
        const response = await axiosInterceptor.get(`/tickets/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching ticket ${id}:`, error);
        throw error;
    }
};

export const addTicket = async (data) => {
    try {
        const response = await axiosInterceptor.post('/tickets', data);
        return response.data;
    } catch (error) {
        console.error("Error adding ticket:", error);
        throw error;
    }
};

export const updateTicket = async (id, data) => {
    try {
        const response = await axiosInterceptor.put(`/tickets/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating ticket ${id}:`, error);
        throw error;
    }
};

export const deleteTicket = async (id) => {
    try {
        const response = await axiosInterceptor.delete(`/tickets/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting ticket ${id}:`, error);
        throw error;
    }
};