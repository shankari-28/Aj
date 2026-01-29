import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Plus, Loader, AlertCircle, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '../../utils/api';

const GalleryManagementView = () => {
  const [galleryImages, setGalleryImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [addingUrl, setAddingUrl] = useState(false);

  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await adminAPI.getGallery();
      setGalleryImages(response.data || []);
    } catch (err) {
      console.error('Failed to load gallery:', err);
      setError('Failed to load gallery images');
      toast.error('Failed to load gallery');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
    
    // Create preview URLs
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviewUrls(urls);
  };

  const uploadImages = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select images to upload');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });

      await adminAPI.uploadGalleryImages(formData);
      toast.success(`${selectedFiles.length} image(s) uploaded successfully`);
      
      // Clear selections and reload
      setSelectedFiles([]);
      setPreviewUrls([]);
      document.getElementById('file-input').value = '';
      await loadGallery();
    } catch (err) {
      console.error('Upload failed:', err);
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) {
      return;
    }

    try {
      await adminAPI.deleteGalleryImage(imageId);
      toast.success('Image deleted successfully');
      await loadGallery();
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Failed to delete image');
    }
  };

  const addImageFromUrl = async () => {
    if (!imageUrl.trim()) {
      toast.error('Please enter an image URL');
      return;
    }

    try {
      setAddingUrl(true);
      await adminAPI.addGalleryImageUrl(imageUrl, imageAlt || 'Gallery Image');
      toast.success('Image added successfully');
      setImageUrl('');
      setImageAlt('');
      await loadGallery();
    } catch (err) {
      console.error('Failed to add image:', err);
      toast.error(err.response?.data?.detail || 'Failed to add image from URL');
    } finally {
      setAddingUrl(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-3xl font-bold text-gray-900">Gallery Management</h1>
        <p className="text-gray-600 mt-2">Manage images in the gallery section</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Upload Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Add Images to Gallery</h2>
          
          {/* Tab Navigation */}
          <div className="flex gap-4 mb-6 border-b border-gray-200">
            <button
              onClick={() => document.getElementById('file-upload-tab').click()}
              className="px-4 py-2 border-b-2 border-blue-600 text-blue-600 font-medium"
            >
              <Upload className="w-4 h-4 inline mr-2" />
              Upload Files
            </button>
            <button
              onClick={() => document.getElementById('url-tab').focus()}
              className="px-4 py-2 border-b-2 border-transparent text-gray-600 font-medium hover:text-gray-900"
            >
              <LinkIcon className="w-4 h-4 inline mr-2" />
              Add from URL
            </button>
          </div>

          <div className="space-y-4">
            {/* File Upload Section */}
            <div id="file-upload-tab">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Images
              </label>
              <input
                id="file-input"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                disabled={uploading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50"
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: JPG, PNG, GIF, WebP. Max size: 5MB each
              </p>

              {/* Preview Selected Images */}
              {previewUrls.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Preview ({previewUrls.length} selected)
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {previewUrls.map((url, idx) => (
                      <div
                        key={idx}
                        className="aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-blue-300"
                      >
                        <img
                          src={url}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={uploadImages}
                  disabled={uploading || selectedFiles.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {uploading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}
                    </>
                  )}
                </button>
                {selectedFiles.length > 0 && (
                  <button
                    onClick={() => {
                      setSelectedFiles([]);
                      setPreviewUrls([]);
                      document.getElementById('file-input').value = '';
                    }}
                    disabled={uploading}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* URL Input Section */}
            <div id="url-tab" className="pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Add Image from URL</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/image.jpg or Google Drive link..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    disabled={addingUrl}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Paste a direct image link or Google Drive share link
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image Description (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 'School Event 2024' or 'Classroom Activity'"
                    value={imageAlt}
                    onChange={(e) => setImageAlt(e.target.value)}
                    disabled={addingUrl}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>

                {/* URL Preview */}
                {imageUrl && (
                  <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <p className="text-xs text-gray-600 mb-2">Preview:</p>
                    <div className="aspect-video bg-gray-200 rounded overflow-hidden max-h-40">
                      <img
                        src={imageUrl}
                        alt="URL preview"
                        className="w-full h-full object-cover"
                        onError={() => (
                          <div className="flex items-center justify-center h-full text-red-600 text-sm">
                            Failed to load image
                          </div>
                        )}
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={addImageFromUrl}
                  disabled={addingUrl || !imageUrl.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {addingUrl ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="w-4 h-4" />
                      Add Image
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery Images Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Current Gallery ({galleryImages.length} images)
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : galleryImages.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-3">
                <Plus className="w-12 h-12 mx-auto opacity-50" />
              </div>
              <p className="text-gray-600">No images in gallery yet. Upload some to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {galleryImages.map((image) => (
                <div
                  key={image._id || image.id}
                  className="relative group aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200"
                >
                  <img
                    src={image.url}
                    alt={image.alt || 'Gallery image'}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      onClick={() => deleteImage(image._id || image.id)}
                      className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      title="Delete image"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Image Info */}
                  <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white p-2 text-xs truncate group-hover:hidden">
                    {image.alt || `Image ${image.order || ''}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GalleryManagementView;
