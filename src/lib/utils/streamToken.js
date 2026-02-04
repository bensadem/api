const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

// Generate a secure stream token
const generateStreamToken = (channelId, userId = null, expiresIn = null) => {
    const secret = process.env.STREAM_TOKEN_SECRET || 'default-secret';
    const expiration = expiresIn || parseInt(process.env.STREAM_TOKEN_EXPIRES) || 3600;
    
    const payload = {
        channelId,
        userId,
        exp: Math.floor(Date.now() / 1000) + expiration,
        nonce: uuidv4()
    };

    const payloadString = JSON.stringify(payload);
    const payloadBase64 = Buffer.from(payloadString).toString('base64url');
    
    const signature = crypto
        .createHmac('sha256', secret)
        .update(payloadBase64)
        .digest('base64url');

    return `${payloadBase64}.${signature}`;
};

// Verify a stream token
const verifyStreamToken = (token) => {
    try {
        const secret = process.env.STREAM_TOKEN_SECRET || 'default-secret';
        const [payloadBase64, signature] = token.split('.');

        if (!payloadBase64 || !signature) {
            return { valid: false, error: 'Invalid token format' };
        }

        // Verify signature
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(payloadBase64)
            .digest('base64url');

        if (signature !== expectedSignature) {
            return { valid: false, error: 'Invalid signature' };
        }

        // Decode payload
        const payloadString = Buffer.from(payloadBase64, 'base64url').toString();
        const payload = JSON.parse(payloadString);

        // Check expiration
        if (payload.exp < Math.floor(Date.now() / 1000)) {
            return { valid: false, error: 'Token expired' };
        }

        return { valid: true, payload };
    } catch (error) {
        return { valid: false, error: 'Token verification failed' };
    }
};

// Generate protected stream URL
const generateProtectedUrl = (baseUrl, channelId, userId = null) => {
    const token = generateStreamToken(channelId, userId);
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}token=${token}`;
};

module.exports = {
    generateStreamToken,
    verifyStreamToken,
    generateProtectedUrl
};
