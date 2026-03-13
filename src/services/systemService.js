import axiosInterceptor from './axiosInterceptor';

export const getNavigationMenu = async (email) => {
    try {
        const response = await axiosInterceptor.get(`/api/navigation?user_email=${email}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching navigation menu:", error);
        throw error;
    }
};
