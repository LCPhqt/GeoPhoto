/**
 * =====================================================
 * PhotoLibrary.jsx - Component Thư viện ảnh
 * =====================================================
 * 
 * Mô tả: Component React hiển thị tất cả ảnh của user đã upload
 * Route: /library
 * 
 * Các chức năng chính:
 * - Hiển thị ảnh dạng lưới (grid) hoặc danh sách (list)
 * - Lọc ảnh: Tất cả / Có GPS / Không có GPS
 * - Click vào ảnh có GPS: Chuyển đến bản đồ và focus vào vị trí ảnh
 * - Click vào ảnh không GPS: Mở preview
 * - Xóa ảnh
 * - Thêm ảnh vào album
 * 
 * Navigation:
 * - Khi click ảnh có GPS, sẽ navigate đến "/" với query params:
 *   - lat: vĩ độ
 *   - lng: kinh độ
 *   - photoId: ID ảnh (để highlight marker)
 * 
 * States chính:
 * - photos: Danh sách ảnh từ API
 * - viewMode: 'grid' | 'list' - Chế độ hiển thị
 * - filter: 'all' | 'with-gps' | 'without-gps' - Bộ lọc
 * - addToAlbumPhoto: Ảnh đang được thêm vào album (hiển thị modal)
 * 
 * @author GeoPhoto Team
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { fetchAllPhotos, deletePhoto } from '../../services/photoService'
import AddToAlbum from '../album/AddToAlbum'
import ShareModal from '../share/ShareModal'

const PhotoLibrary = () => {
  // ==================== STATES ====================
  
  // Danh sách ảnh từ API
  const [photos, setPhotos] = useState([])
  
  // Trạng thái loading
  const [loading, setLoading] = useState(true)
  
  // Thông báo lỗi
  const [error, setError] = useState(null)
  
  // Ảnh đang xem preview (cho ảnh không có GPS)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  
  // Ảnh đang chờ xác nhận xóa
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  
  // Ảnh đang được thêm vào album (mở modal AddToAlbum)
  const [addToAlbumPhoto, setAddToAlbumPhoto] = useState(null)
  
  // Ảnh đang được chia sẻ (mở modal ShareModal)
  const [sharePhoto, setSharePhoto] = useState(null)
  
  // Chế độ hiển thị: 'grid' (lưới) hoặc 'list' (danh sách)
  const [viewMode, setViewMode] = useState('grid')
  
  // Bộ lọc: 'all' (tất cả), 'with-gps' (có GPS), 'without-gps' (không GPS)
  const [filter, setFilter] = useState('all')
  
  // ==================== HOOKS ====================
  
  // Hook lấy thông tin user và hàm logout
  const { user, logout } = useAuth()
  
  // Hook điều hướng
  const navigate = useNavigate()

  // ==================== EFFECTS ====================

  /**
   * Effect: Tải danh sách ảnh khi user thay đổi
   * Chỉ gọi API khi có user (đã đăng nhập)
   */
  useEffect(() => {
    if (user) {
      loadPhotos()
    }
  }, [user])

  // ==================== HANDLERS ====================

  /**
   * Hàm tải danh sách ảnh từ API
   * Gọi: fetchAllPhotos() từ photoService
   */
  const loadPhotos = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchAllPhotos()
      setPhotos(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Lỗi khi tải ảnh:', err)
      setError('Không thể tải thư viện ảnh. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Lọc ảnh theo bộ lọc đã chọn
   * - 'all': Trả về tất cả
   * - 'with-gps': Chỉ ảnh có latitude và longitude
   * - 'without-gps': Chỉ ảnh không có GPS
   */
  const filteredPhotos = photos.filter(photo => {
    if (filter === 'with-gps') return photo.latitude && photo.longitude
    if (filter === 'without-gps') return !photo.latitude || !photo.longitude
    return true
  })

  /**
   * Hàm xử lý click vào ảnh
   * - Nếu có GPS: Chuyển đến bản đồ và focus vào vị trí
   * - Nếu không có GPS: Mở modal preview
   */
  const handlePhotoClick = (photo) => {
    if (photo.latitude && photo.longitude) {
      // Chuyển đến bản đồ với params: lat, lng, photoId
      navigate(`/?lat=${photo.latitude}&lng=${photo.longitude}&photoId=${photo.id}`)
    } else {
      // Mở modal preview cho ảnh không có GPS
      setSelectedPhoto(photo)
    }
  }

  /**
   * Hàm xử lý xóa ảnh
   * - Gọi API xóa
   * - Cập nhật state local
   * - Đóng modal xác nhận
   */
  const handleDeletePhoto = async (photoId) => {
    try {
      await deletePhoto(photoId)
      // Cập nhật state local (không cần reload từ API)
      setPhotos(photos.filter(p => p.id !== photoId))
      setDeleteConfirm(null)
    } catch (err) {
      console.error('Lỗi khi xóa ảnh:', err)
      alert('Không thể xóa ảnh. Vui lòng thử lại.')
    }
  }

  /**
   * Hàm format ngày tháng theo định dạng Việt Nam
   * VD: 2024-01-15 -> 15/01/2024
   */
  const formatDate = (dateString) => {
    if (!dateString) return 'Không rõ'
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200 border-t-purple-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-10 h-10 text-purple-600 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <p className="text-xl text-gray-700 animate-pulse">Đang tải thư viện...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md border border-red-200 shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Có lỗi xảy ra</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={loadPhotos}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-medium"
          >
            🔄 Thử lại
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Back button */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition group"
              >
                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden sm:inline">Bản đồ</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Thư viện ảnh</h1>
                  <p className="text-xs text-gray-500">{photos.length} ảnh</p>
                </div>
              </div>
            </div>

            {/* User info & actions */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 hidden sm:block">
                {user?.fullName || user?.username}
              </span>
              <button
                onClick={logout}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Đăng xuất"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>

          {/* Filters & View Mode */}
          <div className="flex items-center justify-between mt-4 gap-4">
            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === 'all'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tất cả ({photos.length})
              </button>
              <button
                onClick={() => setFilter('with-gps')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                  filter === 'with-gps'
                    ? 'bg-green-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Có GPS ({photos.filter(p => p.latitude && p.longitude).length})
              </button>
              <button
                onClick={() => setFilter('without-gps')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                  filter === 'without-gps'
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                Chưa có GPS ({photos.filter(p => !p.latitude || !p.longitude).length})
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition ${viewMode === 'grid' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                title="Dạng lưới"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition ${viewMode === 'list' ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-900'}`}
                title="Dạng danh sách"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Empty State */}
        {filteredPhotos.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {filter === 'all' ? 'Chưa có ảnh nào' : 'Không có ảnh phù hợp'}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? 'Hãy quay lại bản đồ và upload ảnh đầu tiên của bạn!'
                : 'Thử thay đổi bộ lọc để xem các ảnh khác.'}
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-medium inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Upload ảnh mới
            </button>
          </div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && filteredPhotos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredPhotos.map((photo) => (
              <div
                key={photo.id}
                className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer transform hover:scale-105 transition-all duration-300 shadow-md hover:shadow-2xl border-2 border-gray-300 hover:border-purple-400"
                onClick={() => handlePhotoClick(photo)}
              >
                {/* Image */}
                <img
                  src={`http://${window.location.hostname}:8080${photo.url}`}
                  alt={photo.fileName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x300?text=📷'
                  }}
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white text-sm font-medium truncate">{photo.fileName}</p>
                    <p className="text-purple-300 text-xs">{formatDate(photo.uploadedAt)}</p>
                  </div>
                </div>

                {/* GPS Badge */}
                <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                  photo.latitude && photo.longitude
                    ? 'bg-green-500/90 text-white'
                    : 'bg-orange-500/90 text-white'
                }`}>
                  {photo.latitude && photo.longitude ? (
                    <>
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      GPS
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      No GPS
                    </>
                  )}
                </div>

                {/* Click indicator for GPS photos */}
                {photo.latitude && photo.longitude && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="bg-white/90 rounded-full p-3 shadow-lg transform group-hover:scale-110 transition-transform">
                      <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {/* Share button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSharePhoto(photo)
                    }}
                    className="p-1.5 bg-green-500/80 text-white rounded-full hover:bg-green-600"
                    title="Chia sẻ"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                  {/* Add to Album button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setAddToAlbumPhoto(photo)
                    }}
                    className="p-1.5 bg-blue-500/80 text-white rounded-full hover:bg-blue-600"
                    title="Thêm vào album"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteConfirm(photo)
                    }}
                    className="p-1.5 bg-red-500/80 text-white rounded-full hover:bg-red-600"
                    title="Xóa ảnh"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && filteredPhotos.length > 0 && (
          <div className="space-y-3">
            {filteredPhotos.map((photo) => (
              <div
                key={photo.id}
                className="flex items-center gap-4 bg-white hover:bg-gray-50 rounded-xl p-3 cursor-pointer transition group border border-gray-200 shadow-sm"
                onClick={() => handlePhotoClick(photo)}
              >
                {/* Thumbnail */}
                <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                  <img
                    src={`http://${window.location.hostname}:8080${photo.url}`}
                    alt={photo.fileName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/80x80?text=📷'
                    }}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-gray-900 font-medium truncate">{photo.fileName}</h3>
                  <p className="text-gray-500 text-sm">{formatDate(photo.uploadedAt)}</p>
                  {photo.description && (
                    <p className="text-gray-400 text-sm truncate mt-1">{photo.description}</p>
                  )}
                </div>

                {/* GPS Status */}
                <div className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2 ${
                  photo.latitude && photo.longitude
                    ? 'bg-green-100 text-green-700'
                    : 'bg-orange-100 text-orange-700'
                }`}>
                  {photo.latitude && photo.longitude ? (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      Xem vị trí
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      Chưa có GPS
                    </>
                  )}
                </div>

                {/* Share button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setSharePhoto(photo)
                  }}
                  className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                  title="Chia sẻ"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>

                {/* Add to Album button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setAddToAlbumPhoto(photo)
                  }}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                  title="Thêm vào album"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setDeleteConfirm(photo)
                  }}
                  className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                  title="Xóa ảnh"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* No GPS Modal */}
      {selectedPhoto && !selectedPhoto.latitude && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-gray-200 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Ảnh chưa có vị trí GPS</h3>
              <p className="text-gray-600 mb-6">
                Ảnh "<span className="text-purple-600 font-medium">{selectedPhoto.fileName}</span>" chưa có tọa độ GPS. 
                Bạn có thể thêm vị trí thủ công trên bản đồ.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedPhoto(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    setSelectedPhoto(null)
                    navigate(`/?addGpsTo=${selectedPhoto.id}`)
                  }}
                  className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Thêm GPS
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-gray-200 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Xác nhận xóa ảnh?</h3>
              <p className="text-gray-600 mb-6">
                Bạn có chắc muốn xóa "<span className="text-red-600 font-medium">{deleteConfirm.fileName}</span>"? 
                Hành động này không thể hoàn tác.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleDeletePhoto(deleteConfirm.id)}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-medium"
                >
                  Xóa ảnh
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add to Album Modal */}
      {addToAlbumPhoto && (
        <AddToAlbum
          photoId={addToAlbumPhoto.id}
          photoName={addToAlbumPhoto.fileName}
          onClose={() => setAddToAlbumPhoto(null)}
          onSuccess={(albumName) => {
            alert(`Đã thêm ảnh vào album "${albumName}"`)
          }}
        />
      )}

      {/* Share Photo Modal */}
      {sharePhoto && (
        <ShareModal
          type="photo"
          targetId={sharePhoto.id}
          targetName={sharePhoto.fileName}
          onClose={() => setSharePhoto(null)}
        />
      )}
    </div>
  )
}

export default PhotoLibrary
