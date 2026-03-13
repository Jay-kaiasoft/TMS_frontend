export const getUserDetails = () => {
    try {
        const userStr = localStorage.getItem('tms_user');
        if (userStr) {
            return JSON.parse(userStr);
        }
    } catch (e) {
        console.error("Error parsing user details from localStorage", e);
    }
    return null;
};
