const axios = require('axios');

/**
 * Parse M3U8 playlist and extract quality variants
 * @param {string} m3u8Url - URL of the M3U8 playlist
 * @returns {Promise<Object>} Object containing quality variants
 */
async function parseM3U8Playlist(m3u8Url) {
    try {
        // Fetch M3U8 content
        const response = await axios.get(m3u8Url, {
            headers: {
                'User-Agent': 'NextTV/1.0',
            },
            timeout: 10000
        });

        const content = response.data;
        
        // Check if it's a master playlist (contains #EXT-X-STREAM-INF)
        if (!content.includes('#EXT-X-STREAM-INF')) {
            return {
                isMasterPlaylist: false,
                message: 'This is not a master playlist. Single quality stream.',
                variants: {}
            };
        }

        const lines = content.split('\n');
        const variants = {};
        const baseUrl = m3u8Url.substring(0, m3u8Url.lastIndexOf('/') + 1);

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.startsWith('#EXT-X-STREAM-INF:')) {
                // Extract resolution and bandwidth
                const resolutionMatch = line.match(/RESOLUTION=(\d+)x(\d+)/);
                const bandwidthMatch = line.match(/BANDWIDTH=(\d+)/);
                
                if (resolutionMatch && i + 1 < lines.length) {
                    const width = parseInt(resolutionMatch[1]);
                    const height = parseInt(resolutionMatch[2]);
                    const bandwidth = bandwidthMatch ? parseInt(bandwidthMatch[1]) : 0;
                    
                    // Get the variant URL (next line)
                    let variantUrl = lines[i + 1].trim();
                    
                    // Make absolute URL if relative
                    if (variantUrl && !variantUrl.startsWith('http')) {
                        variantUrl = baseUrl + variantUrl;
                    }

                    // Determine quality based on height
                    let quality = 'auto';
                    if (height >= 1080) quality = 'fhd';
                    else if (height >= 720) quality = 'hd';
                    else if (height >= 480) quality = 'sd';
                    else if (height >= 360) quality = 'ld';

                    // Store the highest bandwidth for each quality
                    if (!variants[quality] || variants[quality].bandwidth < bandwidth) {
                        variants[quality] = {
                            url: variantUrl,
                            resolution: `${width}x${height}`,
                            bandwidth,
                            height,
                            width
                        };
                    }
                }
            }
        }

        // If no variants found, return error
        if (Object.keys(variants).length === 0) {
            return {
                isMasterPlaylist: true,
                message: 'No quality variants found in playlist',
                variants: {}
            };
        }

        // Convert to simple URL mapping
        const streamUrls = {};
        Object.keys(variants).forEach(quality => {
            streamUrls[quality] = variants[quality].url;
        });

        return {
            isMasterPlaylist: true,
            message: 'Successfully extracted quality variants',
            variants: streamUrls,
            details: variants
        };

    } catch (error) {
        console.error('Error parsing M3U8:', error.message);
        return {
            success: false,
            message: `Failed to parse M3U8: ${error.message}`,
            variants: {}
        };
    }
}

module.exports = {
    parseM3U8Playlist
};
