/**
 * =====================================================
 * AlbumList.jsx - Component hiển thị danh sách Album
 * =====================================================
 * 
 * Mô tả: Component React hiển thị tất cả albums của user dưới dạng lưới
 * Route: /albums
 * 
 * Các chức năng chính:
 * - Hiển thị danh sách album dạng grid
 * - Tạo album mới (modal)
 * - Xóa album (với xác nhận)
 * - Click vào album để xem chi tiết
 * 
 * States:
 * - albums: Danh sách album từ API
 * - loading: Trạng thái đang tải
 * - showCreateModal: Hiển thị modal tạo album
 * - deleteConfirm: Album đang chờ xác nhận xóa
 * 
 * @author GeoPhoto Team
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { fetchAllAlbums, deleteAlbum, createAlbum } from '../../services/albumService'

const AlbumList = () => {
  // ==================== STATES ====================
  
  // Danh sách albums từ API
  const [albums, setAlbums] = useState([])
  
  // Trạng thái loading
  const [loading, setLoading] = useState(true)
  
  // Thông báo lỗi (nếu có)
  const [error, setError] = useState(null)
  
  // Điều khiển modal tạo album
  const [showCreateModal, setShowCreateModal] = useState(false)
  
  // Dữ liệu form tạo album mới
  const [newAlbumName, setNewAlbumName] = useState('')
  const [newAlbumDesc, setNewAlbumDesc] = useState('')
  const [creating, setCreating] = useState(false)
  
  // Album đang chờ xác nhận xóa
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  
  // ==================== HOOKS ====================
  
  // Hook lấy thông tin user và hàm logout
  const { user, logout } = useAuth()
  
  // Hook điều hướng
  const navigate = useNavigate()

  // ==================== EFFECTS ====================
  
  /**
   * Effect: Tải danh sách albums khi user thay đổi
   * Chỉ gọi API khi có user (đã đăng nhập)
   */
  useEffect(() => {
    if (user) {
      loadAlbums()
    }
  }, [user])

  // ==================== HANDLERS ====================

  /**
   * Hàm tải danh sách albums từ API
   * Gọi: fetchAllAlbums() từ albumService
   */
  const loadAlbums = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchAllAlbums()
      setAlbums(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Lỗi khi tải albums:', err)
      setError('Không thể tải danh sách album. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Hàm xử lý tạo album mới
   * - Validate tên album
   * - Gọi API tạo album
   * - Đóng modal và reload danh sách
   */
  const handleCreateAlbum = async () => {
    if (!newAlbumName.trim()) return
    
    try {
      setCreating(true)
      await createAlbum(newAlbumName.trim(), newAlbumDesc.trim())
      // Reset form
      setNewAlbumName('')
      setNewAlbumDesc('')
      setShowCreateModal(false)
      // Reload danh sách albums
      loadAlbums()
    } catch (err) {
      console.error('Lỗi khi tạo album:', err)
      alert(err.response?.data?.message || 'Không thể tạo album')
    } finally {
      setCreating(false)
    }
  }

  /**
   * Hàm xử lý xóa album
   * - Gọi API xóa album
   * - Đóng modal xác nhận
   * - Reload danh sách
   * Lưu ý: Chỉ xóa album, không xóa ảnh
   */
  const handleDeleteAlbum = async (albumId) => {
    try {
      await deleteAlbum(albumId)
      setDeleteConfirm(null)
      loadAlbums()
    } catch (err) {
      console.error('Lỗi khi xóa album:', err)
      alert('Không thể xóa album')
    }
  }

  /**
   * Hàm format ngày tháng theo định dạng Việt Nam
   * VD: 2024-01-15 -> 15/01/2024
   */
  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // ==================== RENDER ====================

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-gray-200 border-t-purple-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-10 h-10 text-purple-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>
          <p className="text-xl text-gray-700 animate-pulse">Đang tải bộ sưu tập...</p>
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
            {/* Back & Title */}
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
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Bộ sưu tập</h1>
                  <p className="text-xs text-gray-500">{albums.length} album</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 hidden sm:block">
                {user?.fullName || user?.username}
              </span>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition font-medium flex items-center gap-2 shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Tạo Album</span>
              </button>
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
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Error State */}
        {error && (
          <div className="bg-white rounded-2xl p-8 text-center max-w-md mx-auto mb-6 border border-red-200 shadow-lg">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Có lỗi xảy ra</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={loadAlbums}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-medium"
            >
              🔄 Thử lại
            </button>
          </div>
        )}

        {/* Empty State */}
        {albums.length === 0 && !error && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Chưa có album nào</h3>
            <p className="text-gray-600 mb-6">Tạo album đầu tiên để sắp xếp ảnh của bạn!</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-medium inline-flex items-center gap-2 shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tạo Album mới
            </button>
          </div>
        )}

        {/* Albums Grid */}
        {albums.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {albums.map((album) => (
              <div
                key={album.id}
                className="group bg-white hover:bg-gray-50 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-lg hover:shadow-2xl border-2 border-gray-300 hover:border-purple-400"
                onClick={() => navigate(`/albums/${album.id}`)}
              >
                {/* Cover Image */}
                <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100">
                  {album.coverPhotoUrl ? (
                    <img
                      src={`http://${window.location.hostname}:8080${album.coverPhotoUrl}`}
                      alt={album.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-16 h-16 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Photo Count Badge */}
                  <div className="absolute top-3 right-3 px-2.5 py-1 bg-white rounded-full text-gray-800 text-sm font-bold flex items-center gap-1.5 shadow-lg border-2 border-gray-300">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                    {album.photoCount}
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteConfirm(album)
                    }}
                    className="absolute top-3 left-3 p-2 bg-red-500/80 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    title="Xóa album"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                {/* Album Info */}
                <div className="p-4 bg-gray-50 border-t border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 truncate mb-1">{album.name}</h3>
                  {album.description && (
                    <p className="text-sm text-gray-700 truncate mt-1">{album.description}</p>
                  )}
                  <p className="text-xs text-gray-600 mt-2 font-medium">{formatDate(album.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Album Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-gray-200 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Tạo Album mới
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên album <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newAlbumName}
                  onChange={(e) => setNewAlbumName(e.target.value)}
                  placeholder="Ví dụ: Du lịch Đà Nẵng 2024"
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả (tùy chọn)
                </label>
                <textarea
                  value={newAlbumDesc}
                  onChange={(e) => setNewAlbumDesc(e.target.value)}
                  placeholder="Mô tả ngắn về album..."
                  rows={3}
                  className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false)
                  setNewAlbumName('')
                  setNewAlbumDesc('')
                }}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium"
                disabled={creating}
              >
                Hủy
              </button>
              <button
                onClick={handleCreateAlbum}
                disabled={!newAlbumName.trim() || creating}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {creating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Đang tạo...
                  </>
                ) : (
                  'Tạo Album'
                )}
              </button>
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">Xóa album?</h3>
              <p className="text-gray-600 mb-6">
                Bạn có chắc muốn xóa album "<span className="text-red-600 font-medium">{deleteConfirm.name}</span>"?
                <br />
                <span className="text-sm text-gray-500">(Các ảnh trong album sẽ không bị xóa)</span>
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleDeleteAlbum(deleteConfirm.id)}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-medium"
                >
                  Xóa album
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AlbumList
