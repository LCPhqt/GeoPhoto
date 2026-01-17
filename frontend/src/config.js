/**
 * =====================================================
 * config.js - Cấu hình URL cho ứng dụng
 * =====================================================
 * 
 * Hướng dẫn:
 * - Mặc định: Dùng hostname hiện tại (hỗ trợ localhost và IP LAN)
 * - Khi dùng ngrok: Thay NGROK_BACKEND_URL bằng URL ngrok của backend
 */

// ==================== CẤU HÌNH ====================

/**
 * URL Backend khi dùng ngrok
 * Ví dụ: 'https://abc123.ngrok-free.app'
 * Để null nếu không dùng ngrok
 */
const NGROK_BACKEND_URL = null

// ==================================================

/**
 * Lấy URL của Backend API
 * - Nếu có NGROK_BACKEND_URL: dùng URL ngrok
 * - Nếu không: dùng hostname hiện tại với port 8080
 */
export const getBackendUrl = () => {
  if (NGROK_BACKEND_URL) {
    return NGROK_BACKEND_URL
  }
  const hostname = window.location.hostname
  return `http://${hostname}:8080`
}

/**
 * Lấy URL đầy đủ của API
 */
export const getApiUrl = () => {
  return `${getBackendUrl()}/api`
}

/**
 * Lấy URL cho ảnh
 * @param {string} photoUrl - URL ảnh từ backend (ví dụ: /uploads/abc.jpg)
 */
export const getPhotoUrl = (photoUrl) => {
  if (!photoUrl) return ''
  return `${getBackendUrl()}${photoUrl}`
}

export default {
  getBackendUrl,
  getApiUrl,
  getPhotoUrl,
  NGROK_BACKEND_URL
}
