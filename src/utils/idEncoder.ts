/**
 * Utility functions for encoding/decoding project IDs
 * Uses Base64 with a prefix to obfuscate the raw ID
 */

const ID_PREFIX = 'prj_';

/**
 * Encode a project ID to hide it in the URL
 * @param id - The numeric project ID
 * @returns Encoded string
 */
export const encodeProjectId = (id: number | string): string => {
    const idString = String(id);
    // Add prefix and encode to base64
    const encoded = btoa(`${ID_PREFIX}${idString}`);
    // Make URL-safe by replacing + and /
    return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
};

/**
 * Decode an encoded project ID
 * @param encoded - The encoded project ID
 * @returns The original numeric project ID, or null if invalid
 */
export const decodeProjectId = (encoded: string): string | null => {
    try {
        // Restore base64 characters
        const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
        // Decode from base64
        const decoded = atob(base64);
        // Verify and extract ID
        if (decoded.startsWith(ID_PREFIX)) {
            return decoded.substring(ID_PREFIX.length);
        }
        return null;
    } catch {
        return null;
    }
};
