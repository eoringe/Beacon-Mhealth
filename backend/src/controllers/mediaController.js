const { externalQuery } = require('../config/externalDatabase');

/**
 * Get all media files for a child by registration number
 */
const getMediaByRegistration = async (req, res) => {
    const { registrationNumber } = req.params;

    try {
        // First, get the child ID from the registration number
        const childResult = await externalQuery(
            'SELECT id FROM children WHERE registration_number = $1',
            [registrationNumber]
        );

        if (childResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Child not found'
            });
        }

        const childId = childResult.rows[0].id;

        // Get all media for this child
        const mediaResult = await externalQuery(`
            SELECT 
                id,
                uuid,
                collection_name,
                name,
                file_name,
                mime_type,
                disk,
                size,
                custom_properties,
                created_at
            FROM media 
            WHERE model_id = $1 
              AND model_type LIKE '%Children%'
            ORDER BY created_at DESC
        `, [childId]);

        // Format the response
        const laravelBaseUrl = process.env.LARAVEL_APP_URL || 'http://localhost:8000';

        const mediaList = mediaResult.rows.map(m => ({
            id: m.id,
            uuid: m.uuid,
            collection: m.collection_name,
            name: m.name,
            fileName: m.file_name,
            mimeType: m.mime_type,
            size: m.size,
            sizeFormatted: formatFileSize(m.size),
            description: m.custom_properties?.description || '',
            uploadedAt: m.created_at,
            // Provide both proxy and direct URLs
            downloadUrl: `/api/media/download/${m.id}`,
            directUrl: `${laravelBaseUrl}/media/${m.id}/preview`,
        }));

        res.json({
            success: true,
            count: mediaList.length,
            data: mediaList
        });

    } catch (error) {
        console.error('Error fetching media:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch media files'
        });
    }
};

/**
 * Proxy file download from Laravel's private storage
 * This route fetches the file from Laravel and streams it to the client
 */
const downloadMedia = async (req, res) => {
    const { mediaId } = req.params;

    try {
        // Get media info from database
        const mediaResult = await externalQuery(
            'SELECT id, name, file_name, mime_type, size, disk FROM media WHERE id = $1',
            [mediaId]
        );

        if (mediaResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Media not found'
            });
        }

        const media = mediaResult.rows[0];
        console.log(`[MediaController] Found media: ${media.file_name} (Disk: ${media.disk})`);

        // Laravel base URL (adjust based on your Laravel server URL)
        const laravelBaseUrl = process.env.LARAVEL_APP_URL || 'http://localhost:8000';

        // Construct URL based on disk type
        let downloadUrl;
        if (media.disk === 'public') {
            downloadUrl = `${laravelBaseUrl}/storage/${media.id}/${media.file_name}`;
        } else {
            // CONFIRMED API ROUTE: /api/media/download/{id}
            downloadUrl = `${laravelBaseUrl}/api/media/download/${mediaId}`;
        }

        console.log(`[MediaController] Fetching PDF from: ${downloadUrl}`);

        // Fetch the file from Laravel
        const fetch = (await import('node-fetch')).default;
        const headers = {};

        // Add auth token if configured
        if (process.env.LARAVEL_API_TOKEN) {
            headers['Authorization'] = `Bearer ${process.env.LARAVEL_API_TOKEN}`;
            headers['Accept'] = 'application/json';
        }

        const response = await fetch(downloadUrl, { headers });

        if (!response.ok) {
            console.error(`Laravel returned ${response.status} for media ${mediaId} at ${downloadUrl}`);
            return res.status(response.status).json({
                success: false,
                message: 'File fetch failed from remote server'
            });
        }

        // Set headers for download
        res.setHeader('Content-Type', media.mime_type);
        res.setHeader('Content-Disposition', `inline; filename="${media.file_name}"`);
        res.setHeader('Content-Length', media.size);

        // Stream the response
        response.body.pipe(res);

    } catch (error) {
        console.error('Error downloading media:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to download file'
        });
    }
};

/**
 * Format file size to human readable string
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = {
    getMediaByRegistration,
    downloadMedia
};
