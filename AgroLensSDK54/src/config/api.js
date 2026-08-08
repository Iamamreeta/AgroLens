export const API_BASE_URL = 'https://agrolens-ti0t.onrender.com/api';
export default API_BASE_URL;

export const testConnection = async () => {
    try {
        const healthUrl = API_BASE_URL.replace(/\/api\/?$/, '') + '/health';
        const res = await fetch(healthUrl);
        return { ok: res.ok };
    } catch (e) {
        return { ok: false, error: e.message };
    }
};