import { getCookie } from './cookieHelper';

export const getUserDetails = () => {
    try {
        const userStr = getCookie('tms_user');
        if (userStr) {
            return JSON.parse(userStr);
        }
    } catch (e) {
        console.error("Error parsing user details from Cookies", e);
    }
    return null;
};
