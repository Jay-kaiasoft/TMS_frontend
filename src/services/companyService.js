import axiosInterceptor from './axiosInterceptor';
import { companyURL } from '../config/config';

export const getAllCompanies = async () => {
    try {
        const response = await axiosInterceptor.get(companyURL);
        return response.data;
    } catch (error) {
        console.error("Error fetching all companies:", error);
        throw error;
    }
};

export const getCompanyById = async (id) => {
    try {
        const response = await axiosInterceptor.get(`${companyURL}/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching company ${id}:`, error);
        throw error;
    }
};

export const createCompany = async (formData) => {
    try {
        const response = await axiosInterceptor.post(companyURL, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    } catch (error) {
        console.error("Error creating company:", error);
        throw error;
    }
};

export const updateCompany = async (id, formData) => {
    try {
        const response = await axiosInterceptor.put(`${companyURL}/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    } catch (error) {
        console.error(`Error updating company ${id}:`, error);
        throw error;
    }
};

export const deleteCompany = async (id) => {
    try {
        const response = await axiosInterceptor.delete(`${companyURL}/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error deleting company ${id}:`, error);
        throw error;
    }
};
