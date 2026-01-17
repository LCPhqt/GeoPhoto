import React, { useState } from 'react'
import { uploadPhoto } from '../../services/photoService'

/**
 * PhotoUpload Component
 * Form upload ảnh với preview và progress indicator
 */
const PhotoUpload = ({ onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [description, setDescription] = useState('')
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [location, setLocation] = useState(null)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [locationError, setLocationError] = useState(null)
  const fileInputRef = React.useRef(null)

  /**
   * Xử lý khi chọn file
   */
  const handleFileSelect = (event) => {
    console.log('📁 File input change event triggered')
    const file = event.target.files[0]
    
    console.log('📁 Selected file:', file ? {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: new Date(file.lastModified).toISOString()
    } : 'No file selected')
    
    if (file) {
      // Kiểm tra file type
      if (!file.type.startsWith('image/')) {
        console.error('❌ Invalid file type:', file.type)
        setMessage({ type: 'error', text: 'Vui lòng chọn file ảnh (JPG, PNG, etc.)' })
        return
      }

      // Kiểm tra file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        console.error('❌ File too large:', (file.size / 1024 / 1024).toFixed(2), 'MB')
        setMessage({ type: 'error', text: 'File quá lớn! Tối đa 10MB' })
        return
      }

      console.log('✅ File validation passed')
      setSelectedFile(file)
      setMessage(null)

      // Tạo preview
      console.log('🖼️ Creating preview...')
      const reader = new FileReader()
      reader.onloadend = () => {
        console.log('✅ Preview created successfully')
        setPreview(reader.result)
      }
      reader.onerror = (error) => {
        console.error('❌ Error creating preview:', error)
        setMessage({ type: 'error', text: 'Lỗi khi tạo preview ảnh' })
      }
      reader.readAsDataURL(file)
    } else {
      console.warn('⚠️ No file in event.target.files[0]')
    }
  }

  /**
   * Lấy vị trí hiện tại
   */
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Trình duyệt không hỗ trợ Geolocation')
      return
    }

    setGettingLocation(true)
    setLocationError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log('📍 Got location:', position.coords)
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        })
        setGettingLocation(false)
      },
      (error) => {
        console.error('Error getting location:', error)
        let msg = 'Không thể lấy vị trí.'
        if (error.code === 1) msg = 'Bạn đã từ chối quyền truy cập vị trí.'
        else if (error.code === 2) msg = 'Không thể xác định vị trí.'
        else if (error.code === 3) msg = 'Hết thời gian chờ lấy vị trí.'
        setLocationError(msg)
        setGettingLocation(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  /**
   * Xử lý upload
   */
  const handleUpload = async (event) => {
    event.preventDefault()

    console.log('Upload button clicked!', { selectedFile, description })

    if (!selectedFile) {
      console.error('No file selected')
      setMessage({ type: 'error', text: 'Vui lòng chọn ảnh' })
      return
    }

    console.log('Starting upload...', selectedFile.name)
    setUploading(true)
    setMessage({ type: 'info', text: '⏳ Đang upload...' })

    try {
      console.log('Calling uploadPhoto service...')
      
      // Attach location to file object if available
      if (location) {
        selectedFile.latitude = location.latitude
        selectedFile.longitude = location.longitude
      }
      
      const result = await uploadPhoto(selectedFile, description)
      console.log('Upload success!', result)
      
      setMessage({ 
        type: 'success', 
        text: `✅ Upload thành công! ${result.latitude && result.longitude ? 'Đã tìm thấy GPS!' : 'Không tìm thấy GPS'}`
      })

      // Reset form
      setSelectedFile(null)
      setPreview(null)
      setDescription('')
      
      // Callback to parent component
      if (onUploadSuccess) {
        console.log('Calling onUploadSuccess callback')
        onUploadSuccess(result)
      }

      // Auto close form after 2 seconds
      setTimeout(() => {
        setShowForm(false)
        setMessage(null)
      }, 2000)

    } catch (error) {
      console.error('Upload error:', error)
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        stack: error.stack
      })
      
      let errorMessage = 'Lỗi không xác định'
      if (error.response?.data) {
        errorMessage = typeof error.response.data === 'string' 
          ? error.response.data 
          : JSON.stringify(error.response.data)
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setMessage({ 
        type: 'error', 
        text: `❌ Upload thất bại! ${errorMessage}`
      })
    } finally {
      setUploading(false)
      console.log('Upload process finished')
    }
  }

  /**
   * Hủy upload
   */
  const handleCancel = () => {
    setSelectedFile(null)
    setPreview(null)
    setDescription('')
    setLocation(null)
    setLocationError(null)
    setMessage(null)
    setShowForm(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  /**
   * Handle label click - prevent if uploading
   */
  const handleLabelClick = (e) => {
    console.log('🖱️ Label clicked')
    if (uploading) {
      e.preventDefault()
      console.log('⚠️ Upload in progress, preventing file selection')
      return
    }
    // Let the native htmlFor handle the click - no manual trigger needed
    console.log('✓ Allowing native file input trigger via htmlFor')
  }

  return (
    <>
      {/* Upload Button - Floating with enhanced animation */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold px-6 py-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 z-[1100] flex items-center gap-2 animate-bounce-slow group upload-button-mobile"
          style={{
            animation: 'bounce-slow 3s ease-in-out infinite'
          }}
        >
          <svg className="w-6 h-6 group-hover:animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <span>Upload Ảnh</span>
        </button>
      )}

      {/* Upload Form Modal - Enhanced with animation */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-[2500] p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 animate-scale-in modal-mobile">
            {/* Header - Enhanced with better gradient */}
            <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white p-6 rounded-t-3xl relative overflow-hidden">
              <div className="absolute inset-0 bg-white opacity-10 transform -skew-x-12"></div>
              <div className="relative z-10 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold">Upload Ảnh</h2>
                </div>
                <button
                  onClick={handleCancel}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200 hover:rotate-90"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="relative z-10 text-blue-100 text-sm mt-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Upload ảnh có GPS để hiển thị trên bản đồ
              </p>
            </div>

            {/* Form Content */}
            <form onSubmit={handleUpload} className="p-6 space-y-4">
              {/* File Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Chọn Ảnh
                </label>
                <div className="relative">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,image/jpeg,image/jpg,image/png,image/gif"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-input"
                    disabled={uploading}
                    capture="environment"
                  />
                  <label
                    htmlFor="file-input"
                    onClick={handleLabelClick}
                    className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition active:bg-blue-100"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <div className="text-center pointer-events-none">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="mt-2 text-sm text-gray-600 font-medium">
                        {selectedFile ? selectedFile.name : '📷 Click để chọn ảnh'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG, GIF tối đa 10MB
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Location Input */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Vị Trí (GPS)
                  </label>
                  {location && (
                     <button 
                       type="button" 
                       onClick={() => setLocation(null)}
                       className="text-xs text-red-500 hover:text-red-700 font-medium"
                     >
                       Xóa vị trí
                     </button>
                  )}
                </div>

                {!location ? (
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={gettingLocation}
                    className={`w-full py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-all ${
                      gettingLocation 
                        ? 'bg-gray-100 text-gray-400 cursor-wait' 
                        : 'bg-white border hover:bg-blue-50 hover:border-blue-300 text-blue-600 shadow-sm'
                    }`}
                  >
                    {gettingLocation ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Đang lấy vị trí...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        Lấy vị trí hiện tại
                      </>
                    )}
                  </button>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-3">
                    <div className="bg-green-100 p-1.5 rounded-full text-green-600 mt-0.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-green-800">Đã có vị trí!</p>
                      <p className="text-xs text-green-600 mt-1 font-mono">
                        {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                      </p>
                    </div>
                  </div>
                )}
                
                {locationError && (
                  <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {locationError}
                  </p>
                )}
              </div>

              {/* Image Preview */}
              {preview && (
                <div className="relative">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Preview
                  </label>
                  <div className="relative rounded-lg overflow-hidden border-2 border-gray-200">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full h-48 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null)
                        setPreview(null)
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Description Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mô Tả (Tùy chọn)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ví dụ: Chụp tại Đà Nẵng, ngày 25/11/2025..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows="3"
                  disabled={uploading}
                />
              </div>

              {/* Message */}
              {message && (
                <div className={`p-4 rounded-lg ${
                  message.type === 'success' 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  <p className="text-sm font-medium">{message.text}</p>
                </div>
              )}

              {/* Action Buttons - Enhanced with gradients */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 transform hover:scale-105"
                  disabled={uploading}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile || uploading}
                  className={`flex-1 px-4 py-3 font-bold rounded-xl transition-all duration-300 transform flex items-center justify-center gap-2 ${
                    !selectedFile || uploading
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 hover:scale-105 hover:shadow-lg'
                  }`}
                >
                  {uploading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Đang Upload...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Upload Ngay
                    </>
                  )}
                </button>
              </div>

              {/* Info Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                  💡 <strong>Mẹo:</strong> Sử dụng ảnh chụp từ smartphone có bật định vị để có GPS tự động.
                  Ảnh có GPS sẽ hiển thị ngay trên bản đồ!
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default PhotoUpload

