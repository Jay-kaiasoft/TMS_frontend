const SECRET_KEY = import.meta.env.VITE_CRYPTO_SECRET_KEY || 'default-secret-key';

// Helper to convert string to key
const getKey = async () => {
    const enc = new TextEncoder();
    const keyData = enc.encode(SECRET_KEY);
    const hash = await crypto.subtle.digest('SHA-256', keyData);
    return await crypto.subtle.importKey(
        'raw',
        hash,
        { name: 'AES-GCM' },
        false,
        ['encrypt', 'decrypt']
    );
};

export const encryptData = async (text) => {
    try {
        if (!text) return null;
        const key = await getKey();
        const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV
        const enc = new TextEncoder();
        const encrypted = await crypto.subtle.encrypt(
            { name: 'AES-GCM', iv },
            key,
            enc.encode(text)
        );

        // Combine IV and encrypted data
        const combined = new Uint8Array(iv.length + encrypted.byteLength);
        combined.set(iv);
        combined.set(new Uint8Array(encrypted), iv.length);

        // Convert to Base64
        return btoa(String.fromCharCode(...combined));
    } catch (error) {
        console.error('Encryption failed:', error);
        return null;
    }
};

export const decryptData = async (encryptedBase64) => {
    try {
        if (!encryptedBase64) return null;
        const combined = new Uint8Array(
            atob(encryptedBase64)
                .split('')
                .map((char) => char.charCodeAt(0))
        );

        const iv = combined.slice(0, 12);
        const data = combined.slice(12);
        const key = await getKey();

        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            data
        );

        return new TextDecoder().decode(decrypted);
    } catch (error) {
        console.error('Decryption failed:', error);
        return null;
    }
};
