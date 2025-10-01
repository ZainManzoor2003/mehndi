import React, { useEffect, useMemo, useRef, useState } from 'react';

// Theme uses existing modal classes from App.css
// .modal-overlay, .modal, .modal-header, .modal-title, .modal-close, .modal-body, .modal-grid,
// .form-group, .form-input, .modal-footer, .cancel-btn, .confirm-pay-btn (we'll use confirm-btn)

const MAX_IMAGES = 3;
const MAX_VIDEO = 1;

 const MarkCompleteProofModal = ({ isOpen, onClose, onSubmit, cloudinary = {} }) => {
     const [images, setImages] = useState([]); // File[]
  const [video, setVideo] = useState(null); // File | null
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const imgInputRef = useRef(null);
  const vidInputRef = useRef(null);

  const canSubmit = useMemo(() => images.length > 0 || !!video, [images, video]);
  useEffect(() => {
    if (isOpen) {
      setImages([]);
      setVideo(null);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddImages = (e) => {
    const files = Array.from(e.target.files || []);
    const next = [...images, ...files].slice(0, MAX_IMAGES);
    setImages(next);
    e.target.value = '';
  };

  const handleAddVideo = (e) => {
    const files = Array.from(e.target.files || []);
    setVideo(files[0] || null);
    e.target.value = '';
  };

  const removeImage = (idx) => {
    const next = images.filter((_, i) => i !== idx);
    setImages(next);
  };

  const removeVideo = () => setVideo(null);


  const uploadToCloudinary = async () => {
    const { cloudName, uploadPreset, folder } = cloudinary;
    if (!cloudName || !uploadPreset) throw new Error('Cloudinary config missing');
    const base = `https://api.cloudinary.com/v1_1/${cloudName}`;

    const results = { images: [], video: null };

    // images
    for (const file of images) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('upload_preset', uploadPreset);
      if (folder) fd.append('folder', folder);
      const r = await fetch(`${base}/image/upload`, { method: 'POST', body: fd });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error?.message || 'Image upload failed');
      results.images.push({ url: data.secure_url, publicId: data.public_id });
    }

    // video
    if (video) {
      const fd = new FormData();
      fd.append('file', video);
      fd.append('upload_preset', uploadPreset);
      if (folder) fd.append('folder', folder);
      const r = await fetch(`${base}/video/upload`, { method: 'POST', body: fd });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error?.message || 'Video upload failed');
      results.video = { url: data.secure_url, publicId: data.public_id };
    }

    return results;
  };

  const handleSubmit = async () => {
    try {
      setError('');
      if (!canSubmit) {
        setError('Please add at least one image or one video.');
        return;
      }
      setUploading(true);
      const res = await uploadToCloudinary();
      if (typeof onSubmit === 'function') onSubmit(res);
    } catch (e) {
      setError(e.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e)=>e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Mark Complete - Add Proof</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="modal-grid">
             <div className="form-group full">
              <label>Images (max {MAX_IMAGES})</label>
               <input ref={imgInputRef} type="file" accept="image/*" multiple onChange={handleAddImages} disabled={uploading} />
            </div>
            {!!images.length && (
              <div className="form-group full" style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))',gap:8}}>
                {images.map((img, idx) => (
                  <div key={idx} className="image-preview" style={{position:'relative'}}>
                    <img alt="preview" src={URL.createObjectURL(img)} style={{width:'100%',height:100,objectFit:'cover',borderRadius:8}} />
                    <button className="remove-image" onClick={() => removeImage(idx)} title="Remove">×</button>
                  </div>
                ))}
              </div>
            )}

            <div className="form-group full">
              <label>Video (max {MAX_VIDEO})</label>
               {!video ? (
                 <input ref={vidInputRef} type="file" accept="video/*" onChange={handleAddVideo} disabled={uploading} />
              ) : (
                <div className="image-preview" style={{ position:'relative' }}>
                  <video src={URL.createObjectURL(video)} style={{ width:'100%', borderRadius:8 }} controls />
                  <button className="remove-image" onClick={removeVideo} title="Remove" disabled={uploading}>×</button>
                </div>
              )}
            </div>
          </div>
          {error && <div className="error-message" style={{marginTop:8}}>{error}</div>}
        </div>
        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose} disabled={uploading}>Cancel</button>
          <button className="confirm-btn" onClick={handleSubmit} disabled={!canSubmit || uploading}>{uploading ? 'Uploading…' : 'Upload & Submit'}</button>
        </div>
      </div>
    </div>
  );
};

export default MarkCompleteProofModal;


