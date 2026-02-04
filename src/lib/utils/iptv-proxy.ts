import axios from 'axios';
const AppConfig = require('@/lib/db/models/AppConfig');

interface IptvConfig {
    enabled: boolean;
    baseUrl: string;
    username: string;
    password: string;
}

export async function getIptvConfig(): Promise<IptvConfig> {
    const enabled = await AppConfig.getValue('iptv_proxy_enabled', false);
    const baseUrl = await AppConfig.getValue('iptv_proxy_base_url', '');
    const username = await AppConfig.getValue('iptv_proxy_username', '');
    const password = await AppConfig.getValue('iptv_proxy_password', '');

    return {
        enabled: enabled === true || enabled === 'true',
        baseUrl: baseUrl || 'http://live.lynxiptv.xyz', // Default from user script
        username: username || '',
        password: password || ''
    };
}

export async function resolveStreamUrl(channelId: string): Promise<string | null> {
    try {
        const config = await getIptvConfig();

        if (!config.enabled) {
            console.log('IPTV Proxy is disabled');
            return null;
        }

        if (!config.baseUrl || !config.username || !config.password) {
            console.error('IPTV Proxy configuration missing details');
            return null;
        }

        // Clean base URL (remove trailing slash)
        const baseUrl = config.baseUrl.replace(/\/$/, '');

        // Construct original URL
        const originalUrl = `${baseUrl}/${config.username}/${config.password}/${channelId}`;
        console.log(`Resolving stream for ID ${channelId} from ${originalUrl}`);

        // Perform request but don't download content, just follow redirects.
        // We use GET because some providers block HEAD requests (405).
        // responseType: 'stream' allows us to get headers/URL without downloading the whole body.
        const response = await axios.get(originalUrl, {
            maxRedirects: 5,
            timeout: 15000, // 15s timeout
            validateStatus: (status) => status >= 200 && status < 400,
            responseType: 'stream'
        });

        // Close the stream immediately as we only need the final URL
        if (response.data && typeof response.data.destroy === 'function') {
            response.data.destroy();
        }

        // The effective URL is the one after redirects
        const finalUrl = response.request.res.responseUrl || response.request.res.url || originalUrl;

        console.log(`Resolved ${channelId} to ${finalUrl}`);
        return finalUrl;
    } catch (error: any) {
        console.error(`Error resolving stream for channel ${channelId}:`, error.message);
        return null;
    }
}
