import React, { useState, useEffect, useRef } from 'react';
import { FaPaperclip, FaInstagram, FaCar, FaPen, FaCamera, FaLightbulb, FaTrash, FaUpload, FaEye } from 'react-icons/fa';
import ClientPortfolioPreview from './ClientPortfolioPreview';

const ArtistPortfolioForm = ({ portfolioData, onSave, onCancel, loading = false, artistId }) => {
  const [formData, setFormData] = useState({
    aboutMe: '',
    socials: {
      instagram: '',
      tiktok: '',
      facebook: ''
    },
    availableForTravel: false,
    homeBased: false,
    languagesSpoken: '',
    services: {
      bridalMehndi: {
        enabled: false,
        description: '',
        priceFrom: '',
        priceTo: ''
      },
      partyMehndi: {
        enabled: false,
        description: '',
        priceFrom: '',
        priceTo: ''
      },
      festivalMehndi: {
        enabled: false,
        description: '',
        priceFrom: '',
        priceTo: ''
      },
      casualMehndi: {
        enabled: false,
        description: '',
        priceFrom: '',
        priceTo: ''
      }
    },
    portfolioImages: []
  });

  const [errors, setErrors] = useState({});
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [showClientPreview, setShowClientPreview] = useState(false);
  const fileInputRef = useRef(null);

  // Cloudinary upload function
  const uploadToCloudinary = async (file, resourceType = 'image') => {
    const url = `https://api.cloudinary.com/v1_1/dfoetpdk9/${resourceType}/upload`;
    const fd = new FormData();
    fd.append('file', file);
    // IMPORTANT: replace with your actual unsigned preset name created in Cloudinary settings
    fd.append('upload_preset', 'mehndi');
    const res = await fetch(url, { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'Upload failed');
    return data.secure_url || data.url;
  };

  useEffect(() => {
    if (portfolioData) {
      setFormData({
        aboutMe: portfolioData.aboutMe || '',
        socials: {
          instagram: portfolioData.socials?.instagram || '',
          tiktok: portfolioData.socials?.tiktok || '',
          facebook: portfolioData.socials?.facebook || ''
        },
        availableForTravel: portfolioData.availableForTravel || false,
        homeBased: portfolioData.homeBased || false,
        languagesSpoken: (portfolioData.languagesSpoken || []).join(', '),
        services: {
          bridalMehndi: {
            enabled: portfolioData.services?.bridalMehndi?.enabled || false,
            description: portfolioData.services?.bridalMehndi?.description || '',
            priceFrom: portfolioData.services?.bridalMehndi?.priceFrom || '',
            priceTo: portfolioData.services?.bridalMehndi?.priceTo || ''
          },
          partyMehndi: {
            enabled: portfolioData.services?.partyMehndi?.enabled || false,
            description: portfolioData.services?.partyMehndi?.description || '',
            priceFrom: portfolioData.services?.partyMehndi?.priceFrom || '',
            priceTo: portfolioData.services?.partyMehndi?.priceTo || ''
          },
          festivalMehndi: {
            enabled: portfolioData.services?.festivalMehndi?.enabled || false,
            description: portfolioData.services?.festivalMehndi?.description || '',
            priceFrom: portfolioData.services?.festivalMehndi?.priceFrom || '',
            priceTo: portfolioData.services?.festivalMehndi?.priceTo || ''
          },
          casualMehndi: {
            enabled: portfolioData.services?.casualMehndi?.enabled || false,
            description: portfolioData.services?.casualMehndi?.description || '',
            priceFrom: portfolioData.services?.casualMehndi?.priceFrom || '',
            priceTo: portfolioData.services?.casualMehndi?.priceTo || ''
          }
        },
        portfolioImages: portfolioData.mediaUrls || []
      });
    }
  }, [portfolioData]);

  const handleInputChange = (section, field, value) => {
    if (section === 'socials') {
      setFormData(prev => ({
        ...prev,
        socials: {
          ...prev.socials,
          [field]: value
        }
      }));
    } else if (section === 'services') {
      setFormData(prev => ({
        ...prev,
        services: {
          ...prev.services,
          [field]: {
            ...prev.services[field],
            ...value
          }
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleServiceToggle = (serviceName) => {
    setFormData(prev => ({
      ...prev,
      services: {
        ...prev.services,
        [serviceName]: {
          ...prev.services[serviceName],
          enabled: !prev.services[serviceName].enabled
        }
      }
    }));
  };

  // Image upload handlers
  const handleImageUpload = async (files) => {
    const fileArray = Array.from(files);
    
    // Validate file count
    const totalImages = formData.portfolioImages.length + fileArray.length;
    if (totalImages > 10) {
      setErrors(prev => ({ ...prev, portfolioImages: 'Maximum 10 images allowed' }));
      return;
    }

    setUploadingImages(true);
    setErrors(prev => ({ ...prev, portfolioImages: '' }));

    try {
      const uploadPromises = fileArray.map(async (file, index) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error(`${file.name} is not a valid image file`);
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(`${file.name} is too large. Maximum size is 5MB`);
        }

        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        
        const url = await uploadToCloudinary(file);
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        
        return url;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      
      setFormData(prev => ({
        ...prev,
        portfolioImages: [...prev.portfolioImages, ...uploadedUrls]
      }));

    } catch (error) {
      setErrors(prev => ({ ...prev, portfolioImages: error.message }));
    } finally {
      setUploadingImages(false);
      setUploadProgress({});
    }
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleImageUpload(files);
    }
    // Reset input
    e.target.value = '';
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      portfolioImages: prev.portfolioImages.filter((_, i) => i !== index)
    }));
  };

  // Validation function
  const validateForm = () => {
    const newErrors = {};

    // About Me validation
    if (!formData.aboutMe.trim()) {
      newErrors.aboutMe = 'About Me is required';
    } else if (formData.aboutMe.length < 50) {
      newErrors.aboutMe = 'About Me must be at least 50 characters';
    }

    // Portfolio Images validation
    if (formData.portfolioImages.length < 3) {
      newErrors.portfolioImages = 'Minimum 3 images required';
    } else if (formData.portfolioImages.length > 10) {
      newErrors.portfolioImages = 'Maximum 10 images allowed';
    }

    // Services validation - at least one service must be enabled
    const enabledServices = Object.values(formData.services).filter(service => service.enabled);
    if (enabledServices.length === 0) {
      newErrors.services = 'At least one service must be selected';
    }

    // Validate enabled services have pricing
    enabledServices.forEach((service, index) => {
      const serviceName = Object.keys(formData.services)[index];
      if (!service.priceFrom || !service.priceTo) {
        newErrors[`${serviceName}Pricing`] = 'Price range is required for selected services';
      }
    });

    // Social links validation - at least one social link required
    const hasSocialLinks = Object.values(formData.socials).some(link => link.trim());
    if (!hasSocialLinks) {
      newErrors.socials = 'At least one social media link is required';
    }

    // Travel & Languages validation
    if (!formData.availableForTravel && !formData.homeBased) {
      newErrors.travel = 'Please select at least one travel option';
    }

    if (!formData.languagesSpoken.trim()) {
      newErrors.languagesSpoken = 'Languages spoken is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const processedData = {
      ...formData,
      languagesSpoken: formData.languagesSpoken.split(',').map(lang => lang.trim()).filter(Boolean),
      mediaUrls: formData.portfolioImages
    };
    onSave(processedData);
  };

  const aboutMeCharCount = formData.aboutMe.length;

  // Show client preview if enabled
  if (showClientPreview) {
    return (
      <ClientPortfolioPreview 
        portfolioData={formData}
        onBackToEdit={() => setShowClientPreview(false)}
        artistId={artistId}
      />
    );
  }

  return (
    <div style={{ 
      maxWidth: '800px', 
      margin: '0 auto', 
      padding: '20px',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px',
        padding: '20px 0'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600', color: '#333' }}>
            Profile Completion: 0%
          </h1>
          <div style={{ 
            width: '200px', 
            height: '8px', 
            backgroundColor: '#e9ecef', 
            borderRadius: '4px',
            marginTop: '8px'
          }}>
            <div style={{ 
              width: '0%', 
              height: '100%', 
              backgroundColor: '#ff6b35', 
              borderRadius: '4px',
              transition: 'width 0.3s ease'
            }}></div>
          </div>
        </div>
        <button 
          onClick={() => setShowClientPreview(true)}
          style={{
            backgroundColor: '#ff6b35',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'background-color 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e85a28'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ff6b35'}
        >
          <FaEye />
          Preview as Client
        </button>
      </div>

      {/* Services & Pricing Section */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <FaPen style={{ color: '#ff6b35', marginRight: '12px', fontSize: '20px' }} />
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#333' }}>
            Services & Pricing
          </h2>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Bridal Mehndi */}
          <div style={{ border: '1px solid #e9ecef', borderRadius: '8px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <input
                type="checkbox"
                id="bridalMehndi"
                checked={formData.services.bridalMehndi.enabled}
                onChange={() => handleServiceToggle('bridalMehndi')}
                style={{ transform: 'scale(1.2)' }}
              />
              <label htmlFor="bridalMehndi" style={{ fontSize: '16px', fontWeight: '500', color: '#333', cursor: 'pointer' }}>
                Bridal Mehndi
              </label>
            </div>
            {formData.services.bridalMehndi.enabled && (
              <>
                <p style={{ fontSize: '14px', color: '#6c757d', margin: '0 0 12px 0' }}>
                  (Full hands & feet - traditional or contemporary bridal styles)
                </p>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: '#333' }}>From £</span>
                  <input
                    type="number"
                    value={formData.services.bridalMehndi.priceFrom}
                    onChange={(e) => handleInputChange('services', 'bridalMehndi', { priceFrom: e.target.value })}
                    style={{
                      width: '80px',
                      padding: '8px',
                      border: '1px solid #e9ecef',
                      borderRadius: '4px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                  <span style={{ fontSize: '14px', color: '#333' }}>To £</span>
                  <input
                    type="number"
                    value={formData.services.bridalMehndi.priceTo}
                    onChange={(e) => handleInputChange('services', 'bridalMehndi', { priceTo: e.target.value })}
                    style={{
                      width: '80px',
                      padding: '8px',
                      border: '1px solid #e9ecef',
                      borderRadius: '4px',
                      fontSize: '14px',
                      outline: 'none'
                    }}
                  />
                </div>
              </>
            )}
          </div>

          {/* Party Mehndi */}
          <div style={{ border: '1px solid #e9ecef', borderRadius: '8px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <input
                type="checkbox"
                id="partyMehndi"
                checked={formData.services.partyMehndi.enabled}
                onChange={() => handleServiceToggle('partyMehndi')}
                style={{ transform: 'scale(1.2)' }}
              />
              <label htmlFor="partyMehndi" style={{ fontSize: '16px', fontWeight: '500', color: '#333', cursor: 'pointer' }}>
                Party Mehndi
              </label>
            </div>
            {formData.services.partyMehndi.enabled && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#333' }}>From £</span>
                <input
                  type="number"
                  value={formData.services.partyMehndi.priceFrom}
                  onChange={(e) => handleInputChange('services', 'partyMehndi', { priceFrom: e.target.value })}
                  style={{
                    width: '80px',
                    padding: '8px',
                    border: '1px solid #e9ecef',
                    borderRadius: '4px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <span style={{ fontSize: '14px', color: '#333' }}>To £</span>
                <input
                  type="number"
                  value={formData.services.partyMehndi.priceTo}
                  onChange={(e) => handleInputChange('services', 'partyMehndi', { priceTo: e.target.value })}
                  style={{
                    width: '80px',
                    padding: '8px',
                    border: '1px solid #e9ecef',
                    borderRadius: '4px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            )}
          </div>

          {/* Festival Mehndi */}
          <div style={{ border: '1px solid #e9ecef', borderRadius: '8px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <input
                type="checkbox"
                id="festivalMehndi"
                checked={formData.services.festivalMehndi.enabled}
                onChange={() => handleServiceToggle('festivalMehndi')}
                style={{ transform: 'scale(1.2)' }}
              />
              <label htmlFor="festivalMehndi" style={{ fontSize: '16px', fontWeight: '500', color: '#333', cursor: 'pointer' }}>
                Festival Mehndi
              </label>
            </div>
            {formData.services.festivalMehndi.enabled && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#333' }}>From £</span>
                <input
                  type="number"
                  value={formData.services.festivalMehndi.priceFrom}
                  onChange={(e) => handleInputChange('services', 'festivalMehndi', { priceFrom: e.target.value })}
                  style={{
                    width: '80px',
                    padding: '8px',
                    border: '1px solid #e9ecef',
                    borderRadius: '4px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <span style={{ fontSize: '14px', color: '#333' }}>To £</span>
                <input
                  type="number"
                  value={formData.services.festivalMehndi.priceTo}
                  onChange={(e) => handleInputChange('services', 'festivalMehndi', { priceTo: e.target.value })}
                  style={{
                    width: '80px',
                    padding: '8px',
                    border: '1px solid #e9ecef',
                    borderRadius: '4px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            )}
          </div>

          {/* Casual Mehndi */}
          <div style={{ border: '1px solid #e9ecef', borderRadius: '8px', padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <input
                type="checkbox"
                id="casualMehndi"
                checked={formData.services.casualMehndi.enabled}
                onChange={() => handleServiceToggle('casualMehndi')}
                style={{ transform: 'scale(1.2)' }}
              />
              <label htmlFor="casualMehndi" style={{ fontSize: '16px', fontWeight: '500', color: '#333', cursor: 'pointer' }}>
                Casual Mehndi
              </label>
            </div>
            {formData.services.casualMehndi.enabled && (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: '#333' }}>From £</span>
                <input
                  type="number"
                  value={formData.services.casualMehndi.priceFrom}
                  onChange={(e) => handleInputChange('services', 'casualMehndi', { priceFrom: e.target.value })}
                  style={{
                    width: '80px',
                    padding: '8px',
                    border: '1px solid #e9ecef',
                    borderRadius: '4px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <span style={{ fontSize: '14px', color: '#333' }}>To £</span>
                <input
                  type="number"
                  value={formData.services.casualMehndi.priceTo}
                  onChange={(e) => handleInputChange('services', 'casualMehndi', { priceTo: e.target.value })}
                  style={{
                    width: '80px',
                    padding: '8px',
                    border: '1px solid #e9ecef',
                    borderRadius: '4px',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>
            )}
          </div>
        </div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          marginTop: '20px',
          padding: '12px',
          backgroundColor: '#fff3cd',
          borderRadius: '8px',
          border: '1px solid #ffeaa7'
        }}>
          <FaLightbulb style={{ color: '#856404', fontSize: '16px' }} />
          <span style={{ fontSize: '14px', color: '#856404' }}>
            Add your best estimates. You can quote exact prices when applying to bookings.
          </span>
        </div>
        
        {/* Error Messages */}
        {errors.services && (
          <div style={{ 
            color: '#dc3545', 
            fontSize: '14px', 
            marginTop: '8px',
            padding: '8px 12px',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '4px'
          }}>
            {errors.services}
          </div>
        )}
      </div>

      {/* Portfolio Section */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <FaCamera style={{ color: '#ff6b35', marginRight: '12px', fontSize: '20px' }} />
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#333' }}>
            Portfolio (3-10 Photos)
          </h2>
          <span style={{ 
            marginLeft: '12px', 
            fontSize: '14px', 
            color: '#6c757d',
            backgroundColor: '#f8f9fa',
            padding: '4px 8px',
            borderRadius: '4px'
          }}>
            {formData.portfolioImages.length}/10
          </span>
        </div>

        {/* Upload Area */}
        <div style={{ 
          border: '2px dashed #e9ecef', 
          borderRadius: '8px', 
          padding: '40px', 
          textAlign: 'center',
          backgroundColor: '#f8f9fa',
          marginBottom: '20px',
          position: 'relative'
        }}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />
          
          <FaCamera style={{ fontSize: '48px', color: '#6c757d', marginBottom: '16px' }} />
          <p style={{ fontSize: '16px', color: '#6c757d', margin: '0 0 8px 0' }}>
            Upload your best work
          </p>
          <p style={{ fontSize: '14px', color: '#6c757d', margin: '0 0 16px 0' }}>
            Drag and drop images here or click to browse
          </p>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingImages || formData.portfolioImages.length >= 10}
            style={{
              backgroundColor: uploadingImages || formData.portfolioImages.length >= 10 ? '#ccc' : '#ff6b35',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '6px',
              cursor: uploadingImages || formData.portfolioImages.length >= 10 ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {uploadingImages ? (
              <>
                <FaUpload style={{ marginRight: '8px' }} />
                Uploading...
              </>
            ) : (
              'Choose Files'
            )}
          </button>
          
          {uploadingImages && (
            <div style={{ marginTop: '16px' }}>
              {Object.entries(uploadProgress).map(([filename, progress]) => (
                <div key={filename} style={{ marginBottom: '8px' }}>
                  <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>
                    {filename}
                  </div>
                  <div style={{ 
                    width: '100%', 
                    height: '4px', 
                    backgroundColor: '#e9ecef', 
                    borderRadius: '2px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: `${progress}%`, 
                      height: '100%', 
                      backgroundColor: '#ff6b35',
                      transition: 'width 0.3s ease'
                    }}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Image Gallery */}
        {formData.portfolioImages.length > 0 && (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
            gap: '12px',
            marginBottom: '16px'
          }}>
            {formData.portfolioImages.map((imageUrl, index) => (
              <div key={index} style={{ position: 'relative' }}>
                <img 
                  src={imageUrl} 
                  alt={`Portfolio ${index + 1}`}
                  style={{
                    width: '100%',
                    height: '150px',
                    objectFit: 'cover',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef'
                  }}
                />
                <button
                  onClick={() => removeImage(index)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px'
                  }}
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Error Messages */}
        {errors.portfolioImages && (
          <div style={{ 
            color: '#dc3545', 
            fontSize: '14px', 
            marginTop: '8px',
            padding: '8px 12px',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '4px'
          }}>
            {errors.portfolioImages}
          </div>
        )}
      </div>

      {/* Social Links Section */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <FaInstagram style={{ color: '#ff6b35', marginRight: '12px', fontSize: '20px' }} />
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#333' }}>
            Social Links
          </h2>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            value={formData.socials.instagram}
            onChange={(e) => handleInputChange('socials', 'instagram', e.target.value)}
            placeholder="Instagram"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#ff6b35'}
            onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
          />
          
          <input
            type="text"
            value={formData.socials.tiktok}
            onChange={(e) => handleInputChange('socials', 'tiktok', e.target.value)}
            placeholder="TikTok"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#ff6b35'}
            onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
          />
          
          <input
            type="text"
            value={formData.socials.facebook}
            onChange={(e) => handleInputChange('socials', 'facebook', e.target.value)}
            placeholder="Facebook"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#ff6b35'}
            onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
          />
        </div>
        
        {/* Error Message */}
        {errors.socials && (
          <div style={{ 
            color: '#dc3545', 
            fontSize: '14px', 
            marginTop: '8px',
            padding: '8px 12px',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '4px'
          }}>
            {errors.socials}
          </div>
        )}
      </div>

      {/* Travel & Languages Section */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <FaCar style={{ color: '#ff6b35', marginRight: '12px', fontSize: '20px' }} />
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#333' }}>
            Travel & Languages
          </h2>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input
              type="checkbox"
              id="availableForTravel"
              checked={formData.availableForTravel}
              onChange={(e) => handleInputChange('', 'availableForTravel', e.target.checked)}
              style={{ transform: 'scale(1.2)' }}
            />
            <label htmlFor="availableForTravel" style={{ fontSize: '14px', color: '#333', cursor: 'pointer' }}>
              Available for Travel
            </label>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input
              type="checkbox"
              id="homeBased"
              checked={formData.homeBased}
              onChange={(e) => handleInputChange('', 'homeBased', e.target.checked)}
              style={{ transform: 'scale(1.2)' }}
            />
            <label htmlFor="homeBased" style={{ fontSize: '14px', color: '#333', cursor: 'pointer' }}>
              Home-Based (Clients come to me)
            </label>
          </div>
          
          <input
            type="text"
            value={formData.languagesSpoken}
            onChange={(e) => handleInputChange('', 'languagesSpoken', e.target.value)}
            placeholder="Languages Spoken (comma separated)"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s ease'
            }}
            onFocus={(e) => e.target.style.borderColor = '#ff6b35'}
            onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
          />
        </div>
        
        {/* Error Messages */}
        {(errors.travel || errors.languagesSpoken) && (
          <div style={{ 
            color: '#dc3545', 
            fontSize: '14px', 
            marginTop: '8px',
            padding: '8px 12px',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '4px'
          }}>
            {errors.travel && <div>{errors.travel}</div>}
            {errors.languagesSpoken && <div>{errors.languagesSpoken}</div>}
          </div>
        )}
      </div>

      {/* About Me Section */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
          <FaPaperclip style={{ color: '#ff6b35', marginRight: '12px', fontSize: '20px' }} />
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#333' }}>
            About Me
          </h2>
        </div>
        
        <textarea
          value={formData.aboutMe}
          onChange={(e) => handleInputChange('', 'aboutMe', e.target.value)}
          placeholder="Tell clients about yourself..."
          maxLength={300}
          style={{
            width: '100%',
            minHeight: '120px',
            padding: '12px',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            fontSize: '14px',
            fontFamily: 'inherit',
            resize: 'vertical',
            outline: 'none',
            transition: 'border-color 0.2s ease'
          }}
          onFocus={(e) => e.target.style.borderColor = '#ff6b35'}
          onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
        />
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginTop: '12px'
        }}>
          <span style={{ fontSize: '12px', color: '#6c757d' }}>
            {aboutMeCharCount}/300 characters
          </span>
        </div>
        
        {/* Error Message */}
        {errors.aboutMe && (
          <div style={{ 
            color: '#dc3545', 
            fontSize: '14px', 
            marginTop: '8px',
            padding: '8px 12px',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '4px'
          }}>
            {errors.aboutMe}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '20px 0'
      }}>
        <button
          onClick={onCancel}
          style={{
            backgroundColor: 'transparent',
            color: '#6c757d',
            border: '1px solid #e9ecef',
            padding: '12px 24px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          Cancel
        </button>
        
        <button
          onClick={handleSave}
          disabled={loading}
          style={{
            backgroundColor: loading ? '#ccc' : '#ff6b35',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          {loading ? 'Saving...' : 'Save Portfolio'}
        </button>
      </div>
    </div>
  );
};

export default ArtistPortfolioForm;
