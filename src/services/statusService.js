import axiosInterceptor from './axiosInterceptor';
import { statusURL } from '../config/config';

export const getAllStatuses = async () => {
    try {
        const response = await axiosInterceptor.get(statusURL);
        return response.data;
    } catch (error) {
        console.error("Error fetching all statuses:", error);
        throw error;
    }
};

export const getStatusById = async (id) => {
    try {
        const response = await axiosInterceptor.get(`${statusURL}/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching status ${id}:`, error);
        throw error;
    }
};

export const addStatus = async (data) => {
    try {
        const response = await axiosInterceptor.post(statusURL, data);
        return response.data;
    } catch (error) {
        console.error("Error adding status:", error);
        throw error;
    }
};

export const updateStatus = async (id, data) => {
    try {
        const response = await axiosInterceptor.put(`${statusURL}/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating status ${id}:`, error);
        throw error;
    }
};

export const deleteStatus = async (id) => {
    try {
        const response = await axiosInterceptor.delete(`${statusURL}/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting status ${id}:`, error);
        throw error;
    }
};
