import Cookies from 'js-cookie';

/**
 * Set a cookie with a 12-hour expiry.
 * @param {string} key 
 * @param {string} value 
 */
export const setCookie = (key, value) => {
    Cookies.set(key, value, { expires: 0.5 }); // 0.5 days = 12 hours
};

/**
 * Get a cookie value by key.
 * @param {string} key 
 * @returns {string | undefined}
 */
export const getCookie = (key) => {
    return Cookies.get(key);
};

/**
 * Remove a cookie by key.
 * @param {string} key 
 */
export const removeCookie = (key) => {
    Cookies.remove(key);
};
