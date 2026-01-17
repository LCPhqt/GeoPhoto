/**
 * =====================================================
 * AlbumDetail.jsx - Component hiển thị chi tiết Album
 * =====================================================
 * 
 * Mô tả: Component React hiển thị chi tiết một album và danh sách ảnh
 * Route: /albums/:id
 * 
 * Các chức năng chính:
 * - Hiển thị danh sách ảnh trong album (dạng grid)
 * - Chỉnh sửa tên/mô tả album (inline edit)
 * - Đặt ảnh bìa cho album
 * - Xóa ảnh khỏi album (chỉ xóa liên kết, không xóa ảnh gốc)
 * - Click ảnh có GPS -> Chuyển đến bản đồ
 * - Click ảnh không GPS -> Xem preview
 * 
 * States:
 * - album: Dữ liệu album từ API (bao gồm photos)
 * - editMode: Đang ở chế độ chỉnh sửa
 * - selectedPhoto: Ảnh đang xem preview
 * - removeConfirm: Ảnh đang chờ xác nhận xóa
 * 
 * @author GeoPhoto Team
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { fetchAlbumById, updateAlbum, removePhotoFromAlbum } from '../../services/albumService'
import ShareModal from '../share/ShareModal'

const AlbumDetail = () => {
  // ==================== HOOKS ====================
  
  // Lấy ID album từ URL params (/albums/:id)
  const { id } = useParams()
  
  // Hook điều hướng
  const navigate = useNavigate()
  
  // Lấy thông tin user từ context
  const { user } = useAuth()
  
  // ==================== STATES ====================
  
  // Dữ liệu album (bao gồm photos)
  const [album, setAlbum] = useState(null)
  
  // Trạng thái loading
  const [loading, setLoading] = useState(true)
  
  // Thông báo lỗi
  const [error, setError] = useState(null)
  
  // Chế độ chỉnh sửa (inline edit)
  const [editMode, setEditMode] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [saving, setSaving] = useState(false)
  
  // Ảnh đang xem preview (cho ảnh không có GPS)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  
  // Ảnh đang chờ xác nhận xóa khỏi album
  const [removeConfirm, setRemoveConfirm] = useState(null)
  
  // Hiển thị modal chia sẻ album
  const [showShareModal, setShowShareModal] = useState(false)

  // ==================== EFFECTS ====================

  /**
   * Effect: Tải album khi user hoặc id thay đổi
   */
  useEffect(() => {
    if (user && id) {
      loadAlbum()
    }
  }, [user, id])

  // ==================== HANDLERS ====================

  /**
   * Hàm tải dữ liệu album từ API
   * Gọi: fetchAlbumById(id) từ albumService
   */
  const loadAlbum = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchAlbumById(id)
      setAlbum(data)
      // Khởi tạo giá trị cho form edit
      setEditName(data.name)
      setEditDesc(data.description || '')
    } catch (err) {
      console.error('Lỗi khi tải album:', err)
      setError('Không thể tải album. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Hàm lưu chỉnh sửa album (tên, mô tả)
   */
  const handleSaveEdit = async () => {
    if (!editName.trim()) return
    
    try {
      setSaving(true)
      const updated = await updateAlbum(id, editName.trim(), editDesc.trim())
      setAlbum(updated)
      setEditMode(false)
    } catch (err) {
      console.error('Lỗi khi cập nhật album:', err)
      alert(err.response?.data?.message || 'Không thể cập nhật album')
    } finally {
      setSaving(false)
    }
  }

  /**
   * Hàm xóa ảnh khỏi album
   * Lưu ý: Chỉ xóa liên kết, ảnh gốc vẫn còn trong thư viện
   */
  const handleRemovePhoto = async (photoId) => {
    try {
      const updated = await removePhotoFromAlbum(id, photoId)
      // Cập nhật state local để UI phản hồi ngay
      setAlbum(prev => ({
        ...prev,
        photos: prev.photos.filter(p => p.id !== photoId),
        photoCount: prev.photoCount - 1
      }))
      setRemoveConfirm(null)
    } catch (err) {
      console.error('Lỗi khi xóa ảnh khỏi album:', err)
      alert('Không thể xóa ảnh khỏi album')
    }
  }

  /**
   * Hàm xử lý click vào ảnh
   * - Nếu có GPS: Chuyển đến bản đồ và focus vào vị trí ảnh
   * - Nếu không có GPS: Mở preview ảnh
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
   * Hàm đặt ảnh làm ảnh bìa album
   */
  const handleSetCover = async (photoId) => {
    try {
      const updated = await updateAlbum(id, album.name, album.description, photoId)
      setAlbum(updated)
      loadAlbum() // Reload để lấy URL ảnh bìa mới
    } catch (err) {
      console.error('Lỗi khi đặt ảnh bìa:', err)
    }
  }

  /**
   * Hàm format ngày tháng theo định dạng Việt Nam
   * VD: 2024-01-15 -> 15/01/2024, 14:30
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
          <p className="text-xl text-gray-700 animate-pulse">Đang tải album...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !album) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md border border-red-200 shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Không tìm thấy album</h3>
          <p className="text-gray-600 mb-6">{error || 'Album không tồn tại hoặc đã bị xóa.'}</p>
          <button
            onClick={() => navigate('/albums')}
            className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-medium"
          >
            Quay lại danh sách
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
            {/* Back & Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/albums')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition group"
              >
                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="hidden sm:inline">Albums</span>
              </button>
              <div className="h-6 w-px bg-gray-300"></div>
              
              {/* Editable Title */}
              {editMode ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-purple-500"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveEdit}
                    disabled={saving || !editName.trim()}
                    className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => {
                      setEditMode(false)
                      setEditName(album.name)
                      setEditDesc(album.description || '')
                    }}
                    className="p-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900">{album.name}</h1>
                  <button
                    onClick={() => setEditMode(true)}
                    className="p-1 text-gray-500 hover:text-gray-700 transition"
                    title="Chỉnh sửa"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Info & Share */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  {album.photoCount} ảnh
                </span>
                <span className="hidden sm:inline">{formatDate(album.createdAt)}</span>
              </div>
              
              {/* Share Album Button */}
              <button
                onClick={() => setShowShareModal(true)}
                className="px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-emerald-700 transition flex items-center gap-1.5"
                title="Chia sẻ album"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                </svg>
                <span className="hidden sm:inline">Chia sẻ</span>
              </button>
            </div>
          </div>
          
          {/* Description */}
          {album.description && !editMode && (
            <p className="text-sm text-gray-600 mt-2 max-w-2xl">{album.description}</p>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Empty State */}
        {(!album.photos || album.photos.length === 0) && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Album trống</h3>
            <p className="text-gray-600 mb-6">Thêm ảnh vào album từ thư viện hoặc bản đồ.</p>
            <button
              onClick={() => navigate('/library')}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-medium inline-flex items-center gap-2 shadow-md"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Đến Thư viện ảnh
            </button>
          </div>
        )}

        {/* Photos Grid */}
        {album.photos && album.photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {album.photos.map((photo) => (
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
                    <p className="text-gray-200 text-xs mt-1">{formatDate(photo.uploadedAt)}</p>
                  </div>
                </div>

                {/* Cover Badge */}
                {album.coverPhotoId === photo.id && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-purple-500/90 text-white text-xs font-medium rounded-full flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                    Ảnh bìa
                  </div>
                )}

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

                {/* Action Buttons */}
                <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {album.coverPhotoId !== photo.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSetCover(photo.id)
                      }}
                      className="p-1.5 bg-purple-500/80 text-white rounded-full hover:bg-purple-600"
                      title="Đặt làm ảnh bìa"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setRemoveConfirm(photo)
                    }}
                    className="p-1.5 bg-red-500/80 text-white rounded-full hover:bg-red-600"
                    title="Xóa khỏi album"
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
      </main>

      {/* Photo Preview Modal (for photos without GPS) */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="max-w-4xl max-h-[90vh] relative" onClick={e => e.stopPropagation()}>
            <img
              src={`http://${window.location.hostname}:8080${selectedPhoto.url}`}
              alt={selectedPhoto.fileName}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-3">
              <p className="text-white font-medium">{selectedPhoto.fileName}</p>
              <p className="text-orange-400 text-sm mt-1">
                ⚠️ Ảnh này chưa có vị trí GPS
              </p>
            </div>
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full hover:bg-black/80"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Remove Photo Confirmation Modal */}
      {removeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-gray-200 shadow-2xl">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Xóa ảnh khỏi album?</h3>
              <p className="text-gray-600 mb-1">
                Ảnh "<span className="text-orange-600 font-medium">{removeConfirm.fileName}</span>" sẽ được xóa khỏi album này.
              </p>
              <p className="text-sm text-gray-500 mb-6">
                (Ảnh vẫn còn trong thư viện của bạn)
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setRemoveConfirm(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleRemovePhoto(removeConfirm.id)}
                  className="flex-1 px-4 py-2.5 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition font-medium"
                >
                  Xóa khỏi album
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Album Modal */}
      {showShareModal && album && (
        <ShareModal
          type="album"
          targetId={album.id}
          targetName={album.name}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  )
}

export default AlbumDetail
