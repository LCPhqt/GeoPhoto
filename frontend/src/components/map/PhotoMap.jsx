import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'
import { useAuth } from '../../context/AuthContext'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { fetchPhotosWithGps } from '../../services/photoService'
// Photo components
import PhotoUpload from '../photo/PhotoUpload'
import PhotosWithoutGPS from '../photo/PhotosWithoutGPS'
import PhotoManagement from '../photo/PhotoManagement'
import PhotoDetails from '../photo/PhotoDetails'
import PhotoLocationEditor from '../photo/PhotoLocationEditor'

/**
 * Component to handle map focus when navigating from library
 */
const MapFocusHandler = ({ targetLocation, onFocused }) => {
  const map = useMap()
  
  useEffect(() => {
    if (targetLocation) {
      map.flyTo([targetLocation.lat, targetLocation.lng], 15, {
        duration: 1.5
      })
      // Clear the target after focusing
      setTimeout(() => onFocused(), 2000)
    }
  }, [targetLocation, map, onFocused])
  
  return null
}

/**
 * PhotoMap Component
 * Hiển thị ảnh trên bản đồ với markers là thumbnail hình tròn
 * Sử dụng MarkerClusterGroup để nhóm ảnh khi zoom out
 */
const PhotoMap = () => {
  const [photos, setPhotos] = useState([])
  const [totalPhotos, setTotalPhotos] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPhoto, setSelectedPhoto] = useState(null) // For PhotoDetails modal
  const [editingPhoto, setEditingPhoto] = useState(null) // For PhotoLocationEditor modal
  const [infoPanelCollapsed, setInfoPanelCollapsed] = useState(false) // Collapse/expand info panel
  const [targetLocation, setTargetLocation] = useState(null) // For focusing map from library
  const photosWithoutGPSRef = useRef(null)
  
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // Default center (Vietnam - Đà Nẵng)
  const defaultCenter = [16.0544, 108.2022]
  const defaultZoom = 6

  // Load photos on component mount (only if user is authenticated)
  useEffect(() => {
    if (user) {
      loadPhotos()
    }
  }, [user])

  // Handle URL query params from library navigation
  useEffect(() => {
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const photoId = searchParams.get('photoId')
    const addGpsTo = searchParams.get('addGpsTo')
    
    if (lat && lng) {
      setTargetLocation({
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        photoId
      })
      // Clear the URL params
      setSearchParams({})
    }
    
    // Xử lý khi muốn thêm GPS cho ảnh cụ thể
    if (addGpsTo) {
      // Đợi một chút để component PhotosWithoutGPS mount xong
      setTimeout(() => {
        if (photosWithoutGPSRef.current) {
          photosWithoutGPSRef.current.openWithPhoto(addGpsTo)
        }
      }, 500)
      // Clear the URL params
      setSearchParams({})
    }
  }, [searchParams, setSearchParams])

  // Auto-select photo when navigating from library
  useEffect(() => {
    if (targetLocation?.photoId && photos.length > 0) {
      const photo = photos.find(p => p.id === targetLocation.photoId)
      if (photo) {
        // Small delay to let the map fly to location first
        setTimeout(() => setSelectedPhoto(photo), 1500)
      }
    }
  }, [targetLocation, photos])

  /**
   * Fetch photos from backend API
   */
  const loadPhotos = async () => {
    try {
      setLoading(true)
      setError(null) // Clear any previous errors
      
      const data = await fetchPhotosWithGps()
      console.log(`Loaded ${data.length} photos with GPS coordinates`)
      setPhotos(Array.isArray(data) ? data : [])
      
      // Also fetch total count (including photos without GPS)
      try {
        const allPhotosResponse = await fetch('http://${window.location.hostname}:8080/api/photos', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        
        if (allPhotosResponse.ok) {
          const allPhotos = await allPhotosResponse.json()
          setTotalPhotos(Array.isArray(allPhotos) ? allPhotos.length : 0)
          console.log(`Total photos in database: ${allPhotos.length}`)
        } else {
          setTotalPhotos(data.length) // Fallback to GPS photos count
        }
      } catch (totalErr) {
        console.warn('Could not fetch total photos count:', totalErr)
        setTotalPhotos(data.length) // Fallback to GPS photos count
      }
      
    } catch (err) {
      console.error('Lỗi khi tải ảnh:', err)
      // Handle authentication errors
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
        // Clear invalid token
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        // Redirect will be handled by interceptor
      } else if (err.response && err.response.status !== 200) {
        setError('Không thể kết nối đến server. Vui lòng thử lại sau.')
      } else {
        setPhotos([])
        setTotalPhotos(0)
      }
    } finally {
      setLoading(false)
    }
  }

  /**
   * Create custom circular thumbnail marker using L.divIcon
   * Marker hình tròn với viền trắng, bóng đổ đẹp mắt và hiệu ứng hover
   */
  const createCustomIcon = (photo) => {
    const imageUrl = `http://${window.location.hostname}:8080${photo.thumbnailUrl || photo.url}`
    
    return L.divIcon({
      className: 'custom-photo-marker',
      html: `
        <div class="relative w-14 h-14 rounded-full bg-white p-1 shadow-lg hover:shadow-2xl transition-all duration-200 hover:scale-110 cursor-pointer ring-2 ring-white ring-offset-2 ring-offset-transparent">
          <div class="w-full h-full rounded-full overflow-hidden">
            <img 
              src="${imageUrl}" 
              alt="Photo marker"
              class="w-full h-full object-cover"
              onerror="this.src='https://via.placeholder.com/56x56?text=📷'"
            />
          </div>
          <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-md flex items-center justify-center">
            <svg class="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
            </svg>
          </div>
        </div>
      `,
      iconSize: [56, 56],
      iconAnchor: [28, 56],
      popupAnchor: [0, -56]
    })
  }

  /**
   * Handle successful upload - refresh photos
   */
  const handleUploadSuccess = (uploadedPhoto) => {
    console.log('Photo uploaded successfully:', uploadedPhoto)
    // Reload photos to show new one on map
    loadPhotos()
  }

  /**
   * Handle location added to photo without GPS
   */
  const handleLocationAdded = () => {
    console.log('Location added to photo')
    // Reload photos to show updated one on map
    loadPhotos()
  }

  /**
   * Open Photos Without GPS management
   */
  const handleOpenManagement = () => {
    // Scroll to and trigger the PhotosWithoutGPS component
    if (photosWithoutGPSRef.current) {
      photosWithoutGPSRef.current.openPanel()
    }
  }

  // Loading state - Improved with pulse animation
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center animate-fade-in">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <div className="text-xl font-semibold text-gray-700 mb-2 animate-pulse">Đang tải bản đồ...</div>
          <div className="text-sm text-gray-500">Vui lòng chờ trong giây lát</div>
          <div className="mt-4 flex justify-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
          </div>
        </div>
      </div>
    )
  }

  // Error state - Enhanced with better styling
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-red-50 to-orange-100">
        <div className="text-center p-8 bg-white rounded-2xl shadow-2xl max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Có lỗi xảy ra</h3>
          <div className="text-gray-600 mb-6">{error}</div>
          <button
            onClick={loadPhotos}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg font-medium"
          >
            🔄 Thử lại
          </button>
        </div>
      </div>
    )
  }

  // Empty state - Welcome screen for new users
  const hasNoPhotos = !loading && !error && photos.length === 0 && totalPhotos === 0

  return (
    <div className="map-container relative">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        zoomControl={true}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%' }}
      >
        {/* Map Focus Handler - for navigating from library */}
        <MapFocusHandler 
          targetLocation={targetLocation} 
          onFocused={() => setTargetLocation(null)} 
        />

        {/* OpenStreetMap Tile Layer */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
          minZoom={3}
        />

        {/* Photos Without GPS Management Component */}
        <PhotosWithoutGPS ref={photosWithoutGPSRef} onLocationAdded={handleLocationAdded} />

        {/* Marker Cluster Group - Groups photos when zoomed out */}
        {photos.length > 0 && (
          <MarkerClusterGroup
            key={`cluster-${photos.length}`}
            chunkedLoading
            maxClusterRadius={60}
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
            zoomToBoundsOnClick={true}
          >
             {photos.map((photo) => (
               <Marker
                 key={`marker-${photo.id}`}
                 position={[photo.latitude, photo.longitude]}
                 icon={createCustomIcon(photo)}
                 eventHandlers={{
                   click: () => {
                     setSelectedPhoto(photo)
                   }
                 }}
               >
               <Popup maxWidth={280} minWidth={250}>
                 <div className="photo-popup text-center">
                   {/* Thumbnail Preview */}
                   <div className="photo-popup-image mb-3">
                     <img
                       src={`http://${window.location.hostname}:8080${photo.url}`}
                       alt={photo.fileName}
                       className="w-full h-32 object-cover rounded-lg"
                       onError={(e) => {
                         e.target.src = 'https://via.placeholder.com/250x120?text=Image+Not+Found'
                       }}
                     />
                   </div>

                   {/* Photo Name */}
                   <h3 className="text-sm font-semibold text-gray-800 mb-2 truncate">
                     {photo.fileName}
                   </h3>

                   {/* View Details Button */}
                   <button
                     onClick={() => setSelectedPhoto(photo)}
                     className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition font-medium text-sm flex items-center justify-center gap-2"
                   >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                     </svg>
                     Xem Chi Tiết
                   </button>
                 </div>
               </Popup>
               </Marker>
             ))}
          </MarkerClusterGroup>
        )}
      </MapContainer>

      {/* Floating Info Panel - Compact & Collapsible */}
      <div className={`absolute top-4 left-4 bg-white rounded-2xl shadow-2xl z-[900] backdrop-blur-sm bg-opacity-95 border border-gray-100 transition-all duration-300 ${
        infoPanelCollapsed ? 'w-14' : 'w-80 max-w-[calc(100vw-2rem)]'
      }`}>
        {/* Collapsed View - Mini Icon */}
        {infoPanelCollapsed && (
          <div className="p-3">
            <button
              onClick={() => setInfoPanelCollapsed(false)}
              className="w-full h-full flex items-center justify-center hover:bg-blue-50 rounded-xl transition group"
              title="Mở rộng"
            >
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                {totalPhotos > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow">
                    {totalPhotos > 99 ? '99+' : totalPhotos}
                  </div>
                )}
              </div>
            </button>
          </div>
        )}

        {/* Expanded View - Full Panel */}
        {!infoPanelCollapsed && (
          <div className="p-4">
            {/* Header - Compact */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent truncate">
                    GeoPhoto
                  </h1>
                  <p className="text-xs text-gray-600 truncate">
                    {user?.fullName || user?.username}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => setInfoPanelCollapsed(true)}
                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition"
                  title="Thu gọn"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={logout}
                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Đăng xuất"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Stats - Compact Grid */}
            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="flex flex-col items-center p-2 bg-blue-50 rounded-lg">
                <span className="text-2xl font-bold text-blue-600">{totalPhotos}</span>
                <span className="text-xs text-gray-600 mt-0.5">Tổng ảnh</span>
              </div>
              
              <div className="flex flex-col items-center p-2 bg-green-50 rounded-lg">
                <span className="text-2xl font-bold text-green-600">{photos.length}</span>
                <span className="text-xs text-gray-600 mt-0.5">Có GPS</span>
              </div>
            </div>
            
            {/* Warning - Compact */}
            {totalPhotos > photos.length && (
              <div className="p-2 bg-orange-50 rounded-lg border border-orange-200 mb-3">
                <p className="text-xs font-medium text-orange-700 flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>{totalPhotos - photos.length} ảnh chưa có GPS</span>
                </p>
              </div>
            )}

            {/* Action Buttons - Compact */}
            <div className="space-y-2">
              {/* Library Button */}
              <button
                onClick={() => navigate('/library')}
                className="w-full px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-medium rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-md flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                </svg>
                Thư viện ảnh
              </button>

              {/* Albums Button */}
              <button
                onClick={() => navigate('/albums')}
                className="w-full px-3 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-sm font-medium rounded-lg hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 shadow-md flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Bộ sưu tập
              </button>

              <button
                onClick={loadPhotos}
                className="w-full px-3 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Làm mới
              </button>

              {/* Button to manage photos without GPS */}
              <PhotoManagement 
                photosWithoutGps={totalPhotos - photos.length}
                onOpenManagement={handleOpenManagement}
              />
            </div>
          </div>
        )}
      </div>

      {/* Empty State - Compact welcome message */}
      {hasNoPhotos && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-[850] bg-white/95 backdrop-blur-sm px-6 py-4 rounded-2xl shadow-xl text-center max-w-md border border-blue-200 animate-fade-in pointer-events-none welcome-message-mobile">
          <div className="flex items-center gap-3 justify-center">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-left">
              <h2 className="text-lg font-bold text-gray-800">Chào mừng đến GeoPhoto! 📸</h2>
              <p className="text-sm text-gray-600 mt-0.5">
                Click nút <strong className="text-blue-600">"Upload Ảnh"</strong> để bắt đầu
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Photo Upload Component */}
      <PhotoUpload onUploadSuccess={handleUploadSuccess} />

      {/* Photo Details Modal */}
      {selectedPhoto && (
        <PhotoDetails
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          onPhotoUpdated={(updatedPhoto) => {
            // Update photo in list
            setPhotos(photos.map(p => p.id === updatedPhoto.id ? updatedPhoto : p))
            loadPhotos() // Reload to ensure consistency
          }}
          onPhotoDeleted={(photoId) => {
            // Remove photo from list
            setPhotos(photos.filter(p => p.id !== photoId))
            loadPhotos() // Reload to update counts
          }}
          onEditLocation={(photo) => {
            setSelectedPhoto(null) // Close details modal
            setEditingPhoto(photo) // Open location editor
          }}
        />
      )}

      {/* Photo Location Editor Modal */}
      {editingPhoto && (
        <PhotoLocationEditor
          photo={editingPhoto}
          onClose={() => setEditingPhoto(null)}
          onLocationUpdated={(updatedPhoto) => {
            // Update photo in list
            setPhotos(photos.map(p => p.id === updatedPhoto.id ? updatedPhoto : p))
            loadPhotos() // Reload to ensure consistency
            setEditingPhoto(null)
          }}
        />
      )}
    </div>
  )
}

export default PhotoMap

