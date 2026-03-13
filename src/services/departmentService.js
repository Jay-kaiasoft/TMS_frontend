import axiosInterceptor from './axiosInterceptor';
import { departmentURL } from '../config/config';

export const getAllDepartments = async () => {
    try {
        const response = await axiosInterceptor.get(departmentURL);
        return response.data;
    } catch (error) {
        console.error("Error fetching all departments:", error);
        throw error;
    }
};

export const getDepartmentById = async (id) => {
    try {
        const response = await axiosInterceptor.get(`${departmentURL}/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching department ${id}:`, error);
        throw error;
    }
};

export const addDepartment = async (data) => {
    try {
        const response = await axiosInterceptor.post(departmentURL, data);
        return response.data;
    } catch (error) {
        console.error("Error adding department:", error);
        throw error;
    }
};

export const updateDepartment = async (id, data) => {
    try {
        const response = await axiosInterceptor.put(`${departmentURL}/${id}`, data);
        return response.data;
    } catch (error) {
        console.error(`Error updating department ${id}:`, error);
        throw error;
    }
};

export const deleteDepartment = async (id) => {
    try {
        const response = await axiosInterceptor.delete(`${departmentURL}/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting department ${id}:`, error);
        throw error;
    }
};
