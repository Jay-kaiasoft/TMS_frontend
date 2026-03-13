import axiosInterceptor from './axiosInterceptor';
import { roleURL } from '../config/config';

export const getAllRoles = async () => {
    try {
        const response = await axiosInterceptor.get(roleURL);
        return response.data;
    } catch (error) {
        console.error("Error fetching all roles:", error);
        throw error;
    }
};

export const getRoleById = async (id) => {
    try {
        const response = await axiosInterceptor.get(`${roleURL}/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching role ${id}:`, error);
        throw error;
    }
};

export const getRolePermissions = async (id) => {
    try {
        const response = await axiosInterceptor.get(`${roleURL}/permissions/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching permissions for role ${id}:`, error);
        throw error;
    }
};

export const getAllActions = async () => {
    try {
        const response = await axiosInterceptor.get(`${roleURL}/actions/all`);
        return response.data;
    } catch (error) {
        console.error("Error fetching all actions:", error);
        throw error;
    }
};

export const createRole = async (data) => {
    try {
        const response = await axiosInterceptor.post(roleURL, data);
        return response.data;
    } catch (error) {
        console.error("Error creating role:", error);
        throw error;
    }
};

export const updateRole = async (id, data) => {
    try {
        const response = await axiosInterceptor.put(`${roleURL}/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating role ${id}:`, error);
        throw error;
    }
};

export const deleteRole = async (id) => {
    try {
        const response = await axiosInterceptor.delete(`${roleURL}/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting role ${id}:`, error);
        throw error;
    }
};
