import axiosInterceptor from './axiosInterceptor';

export const loginUser = async (data) => {
    try {
        const response = await axiosInterceptor.post('/login', data);
        return response.data;
    } catch (error) {
        console.error("Error logging in:", error);
        throw error;
    }
};

export const verifyOTP = async (data) => {
    try {
        const response = await axiosInterceptor.post('/verify-otp', data);
        return response.data;
    } catch (error) {
        console.error("Error verifying OTP:", error);
        throw error;
    }
};

export const forgotPassword = async (email) => {
    try {
        const response = await axiosInterceptor.post(`/forgot-password?email=${email}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching forgot password:", error);
        throw error;
    }
};

export const setPassword = async (data) => {
    try {
        const response = await axiosInterceptor.post('/set-password', data);
        return response.data;
    } catch (error) {
        console.error("Error setting password:", error);
        throw error;
    }
};
