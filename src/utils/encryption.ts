import JSEncrypt from 'jsencrypt';
import axios from 'axios';
import { API } from '@/config/api';

let cachedPublicKey: string | null = null;

/**
 * Fetch the RSA public key from the backend
 */
export const fetchPublicKey = async (): Promise<string> => {
    if (cachedPublicKey) return cachedPublicKey;

    const response = await axios.get(API.AUTH.ENCRYPTION_KEY);
    cachedPublicKey = response.data.data.publicKey;
    return cachedPublicKey!;
};

/**
 * Encrypt a password using the backend's RSA public key
 * @param password - Plain text password
 * @returns Encrypted password (base64)
 */
export const encryptPassword = async (password: string): Promise<string> => {
    const publicKey = await fetchPublicKey();
    const encrypt = new JSEncrypt();
    encrypt.setPublicKey(publicKey);
    const encrypted = encrypt.encrypt(password);
    if (!encrypted) {
        throw new Error('Failed to encrypt password');
    }
    return encrypted;
};

