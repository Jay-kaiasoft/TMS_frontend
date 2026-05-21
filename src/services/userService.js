import axiosInterceptor from './axiosInterceptor';
import { userURL } from '../config/config';


export const getUserHierarchy = async () => {
    try {
        const response = await axiosInterceptor.get(`${userURL}/hierarchy`);
        return response.data;
    } catch (error) {
        console.error("Error fetching user hierarchy:", error);
        throw error;
    }
};

export const getAllUsers = async () => {
    try {
        const response = await axiosInterceptor.get(userURL);
        return response.data;
    } catch (error) {
        console.error("Error fetching all users:", error);
        throw error;
    }
};

export const getUserById = async (id) => {
    try {
        const response = await axiosInterceptor.get(`${userURL}/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching user ${id}:`, error);
        throw error;
    }
};

export const addUser = async (data) => {
    try {
        const response = await axiosInterceptor.post(userURL, data);
        return response.data;
    } catch (error) {
        console.error("Error adding user:", error);
        throw error;
    }
};

export const updateUser = async (id, data) => {
    try {
        const response = await axiosInterceptor.put(`${userURL}/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating user ${id}:`, error);
        throw error;
    }
};

export const deleteUser = async (id) => {
    try {
        const response = await axiosInterceptor.delete(`${userURL}/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting user ${id}:`, error);
        throw error;
    }
};

export const getCustomers = async () => {
    try {
        const response = await axiosInterceptor.get(`${userURL}/customers`);
        return response.data;
    } catch (error) {
        console.error("Error fetching customers:", error);
        throw error;
    }
};

export const getNonCustomers = async () => {
    try {
        const response = await axiosInterceptor.get(`${userURL}/non-customers`);
        return response.data;
    } catch (error) {
        console.error("Error fetching non-customers:", error);
        throw error;
    }
};

export const getAllAdmins = async () => {
    try {
        const response = await axiosInterceptor.get(`${userURL}/get/all/admins`);
        return response.data;
    } catch (error) {
        console.error("Error fetching admins:", error);
        throw error;
    }
};

export const filterUsers = async (roleIds) => {
    try {
        let url = `${userURL}/filter`;
        if (roleIds && roleIds.length > 0) {
            const queryParams = roleIds.map(id => `role_ids=${id}`).join('&');
            url += `?${queryParams}`;
        }
        const response = await axiosInterceptor.get(url);
        return response.data;
    } catch (error) {
        console.error("Error filtering users:", error);
        throw error;
    }
};

export const sendUserCredentials = async (id) => {
    try {
        const response = await axiosInterceptor.post(`${userURL}/${id}/send-credentials`);
        return response.data;
    } catch (error) {
        console.error(`Error sending credentials to user ${id}:`, error);
        throw error;
    }
};