export const siteURL = import.meta.env.REACT_APP_MAIN_SITE_URL || 'http://localhost:5173';
export const baseURL = import.meta.env.REACT_APP_MAIN_BASE_URL || 'http://localhost:8000';

export const userURL = `${baseURL}/users`;
export const projectURL = `${baseURL}/projects`;
export const clientURL = `${baseURL}/clients`;
export const departmentURL = `${baseURL}/departments`;
export const statusURL = `${baseURL}/status`;
export const roleURL = `${baseURL}/roles`;
export const companyURL = `${baseURL}/companies`;