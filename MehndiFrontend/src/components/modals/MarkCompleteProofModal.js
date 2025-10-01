import React, { useEffect, useMemo, useState } from 'react';
import { applicationsAPI } from '../../services/api';

// Theme uses existing modal classes from App.css
// .modal-overlay, .modal, .modal-header, .modal-title, .modal-close, .modal-body, .modal-grid,
// .form-group, .form-input, .modal-footer, .cancel-btn, .confirm-pay-btn (we'll use confirm-btn)

const MAX_IMAGES = 3;

const MarkCompleteProofModal = ({ isOpen, onClose, onSubmit, bookingId, cloudinary = {} }) => {
  const [images, setImages] = useState([]); // File[]
  const [imagePreviews, setImagePreviews] = useState([]); // Preview URLs
  const [video, setVideo] = useState(null); // File | null
  const [videoPreview, setVideoPreview] = useState(null); // Preview URL
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const canSubmit = useMemo(() => images.length > 0 || !!video, [images, video]);

  useEffect(() => {
    if (isOpen) {
      setImages([]);
      setImagePreviews([]);
      setVideo(null);
      setVideoPreview(null);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const remainingSlots = MAX_IMAGES - images.length;
    const filesToAdd = files.slice(0, remainingSlots);
    
    const newImages = [...images, ...filesToAdd].slice(0, MAX_IMAGES);
    setImages(newImages);
    
    // Create previews
    const newPreviews = filesToAdd.map(file => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews].slice(0, MAX_IMAGES));
    
    e.target.value = '';
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideo(file);
      setVideoPreview(URL.createObjectURL(file));
    }
    e.target.value = '';
  };

  const removeImage = (idx) => {
    const newImages = images.filter((_, i) => i !== idx);
    const newPreviews = imagePreviews.filter((_, i) => i !== idx);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const removeVideo = () => {
    setVideo(null);
    setVideoPreview(null);
  };

  const uploadToCloudinary = async () => {
    const { cloudName, uploadPreset, folder } = cloudinary;
    if (!cloudName || !uploadPreset) throw new Error('Cloudinary config missing');
    const base = `https://api.cloudinary.com/v1_1/${cloudName}`;

    const results = { images: [], video: null };

    // Upload images
    for (const file of images) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', uploadPreset);
      if (folder) fd.append('folder', folder);
      const r = await fetch(`${base}/image/upload`, { method: 'POST', body: fd });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error?.message || 'Image upload failed');
      results.images.push(data.secure_url);
    }

    // Upload video
    if (video) {
      const fd = new FormData();
      fd.append('file', video);
      fd.append('upload_preset', uploadPreset);
      if (folder) fd.append('folder', folder);
      const r = await fetch(`${base}/video/upload`, { method: 'POST', body: fd });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error?.message || 'Video upload failed');
      results.video = data.secure_url;
    }

    return results;
  };

  const handleConfirmComplete = async () => {
    try {
      setError('');
      if (!canSubmit) {
        setError('Please add at least one image or one video.');
        return;
      }

      if (!bookingId) {
        setError('Booking ID is missing.');
        return;
      }

      setUploading(true);

      // Step 1: Upload to Cloudinary
      const uploadResults = await uploadToCloudinary();

      // Step 2: Call backend API to update application
      const response = await applicationsAPI.completeApplication({
        bookingId,
        images: uploadResults.images,
        video: uploadResults.video || ''
      });

      if (response.success) {
        // Call the parent's onSubmit callback
        if (typeof onSubmit === 'function') {
          onSubmit(uploadResults);
        }
      } else {
        throw new Error(response.message || 'Failed to complete application');
      }
    } catch (e) {
      console.error('Complete application error:', e);
      setError(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e)=>e.stopPropagation()} style={{ maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h3 className="modal-title">Complete Booking</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p style={{ marginBottom: '20px', color: '#666' }}>
            Upload up to 3 images and one video (optional). Files will be uploaded to Cloudinary.
          </p>
          
          {/* Images Upload Section */}
          <div className="form-group" style={{ marginBottom: '25px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '10px', color: '#333' }}>
              Images (max 3)
            </label>
            <label htmlFor="complete-images-upload" className="upload-label" style={{ 
              display: 'block',
              padding: '20px',
              border: '2px dashed #d4a574',
              borderRadius: '8px',
              textAlign: 'center',
              cursor: images.length >= MAX_IMAGES ? 'not-allowed' : 'pointer',
              backgroundColor: '#faf8f5',
              transition: 'all 0.3s ease',
              opacity: images.length >= MAX_IMAGES ? 0.6 : 1
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d4a574" strokeWidth="2" style={{ margin: '0 auto 10px' }}>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              <p style={{ margin: '0', color: '#d4a574', fontWeight: '600' }}>
                {images.length >= MAX_IMAGES ? `Maximum ${MAX_IMAGES} images reached` : 'Click to upload images'}
              </p>
              <small style={{ color: '#888' }}>PNG, JPG, WEBP • Max 3 images</small>
            </label>
            <input
              type="file"
              id="complete-images-upload"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              style={{ display: 'none' }}
              disabled={uploading || images.length >= MAX_IMAGES}
            />
            
            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '15px' }}>
                {imagePreviews.map((preview, index) => (
                  <div key={index} style={{ position: 'relative' }}>
                    <img 
                      src={preview} 
                      alt={`Preview ${index + 1}`} 
                      style={{ 
                        width: '100%', 
                        height: '120px', 
                        objectFit: 'cover', 
                        borderRadius: '8px',
                        border: '2px solid #d4a574'
                      }} 
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      disabled={uploading}
                      style={{
                        position: 'absolute',
                        top: '5px',
                        right: '5px',
                        background: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '25px',
                        height: '25px',
                        cursor: uploading ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        opacity: uploading ? 0.6 : 1
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Video Upload Section */}
          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontWeight: '600', marginBottom: '10px', color: '#333' }}>
              Video (optional)
            </label>
            {!video ? (
              <label htmlFor="complete-video-upload" className="upload-label" style={{ 
                display: 'block',
                padding: '20px',
                border: '2px dashed #d4a574',
                borderRadius: '8px',
                textAlign: 'center',
                cursor: uploading ? 'not-allowed' : 'pointer',
                backgroundColor: '#faf8f5',
                transition: 'all 0.3s ease'
              }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d4a574" strokeWidth="2" style={{ margin: '0 auto 10px' }}>
                  <polygon points="23 7 16 12 23 17 23 7"/>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                </svg>
                <p style={{ margin: '0', color: '#d4a574', fontWeight: '600' }}>
                  Click to upload video
                </p>
                <small style={{ color: '#888' }}>MP4, MOV, AVI • Optional</small>
              </label>
            ) : null}
            <input
              type="file"
              id="complete-video-upload"
              accept="video/*"
              onChange={handleVideoSelect}
              style={{ display: 'none' }}
              disabled={uploading}
            />
            
            {/* Video Preview */}
            {videoPreview && (
              <div style={{ marginTop: '15px', position: 'relative' }}>
                <video 
                  src={videoPreview} 
                  controls
                  style={{ 
                    width: '100%', 
                    maxHeight: '200px', 
                    borderRadius: '8px',
                    border: '2px solid #d4a574'
                  }} 
                />
                <button
                  type="button"
                  onClick={removeVideo}
                  disabled={uploading}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    background: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '30px',
                    height: '30px',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    fontSize: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    opacity: uploading ? 0.6 : 1
                  }}
                >
                  ×
                </button>
              </div>
            )}
          </div>

          {error && (
            <div style={{ 
              marginTop: '15px', 
              padding: '12px', 
              backgroundColor: '#fee', 
              border: '1px solid #fcc',
              borderRadius: '6px',
              color: '#c33',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button 
            className="btn-secondary" 
            onClick={onClose} 
            disabled={uploading}
            style={{ cursor: uploading ? 'not-allowed' : 'pointer', opacity: uploading ? 0.6 : 1 }}
          >
            Cancel
          </button>
          <button 
            className="btn-primary" 
            onClick={handleConfirmComplete} 
            disabled={!canSubmit || uploading}
            style={{ cursor: (!canSubmit || uploading) ? 'not-allowed' : 'pointer', opacity: (!canSubmit || uploading) ? 0.6 : 1 }}
          >
            {uploading ? 'Uploading...' : 'Confirm & Complete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarkCompleteProofModal;
