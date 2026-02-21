# Gallery Management System - Implementation Guide

## Overview
A complete gallery management system has been added to the AJ Academy platform, allowing administrators to manage gallery images from the admin panel.

## Features Implemented

### 1. **Admin Gallery Management Panel** (`GalleryManagementView.js`)
- **Image Upload**: Upload multiple images at once with preview
- **Image Gallery Display**: View all uploaded images in a grid
- **Image Deletion**: Delete individual images from the gallery
- **Image Management**: Hover effects to manage images with delete buttons
- **Loading States**: Proper loading and error handling

**Features:**
- Multiple image selection with preview before upload
- Drag-and-drop support for file input
- Real-time preview of selected images
- Automatic refresh after upload/delete operations
- Error handling and user feedback via toast notifications

### 2. **Backend API Endpoints** (server.py)

#### Gallery Model
```python
class GalleryImage(BaseModel):
    id: str
    url: str
    alt: Optional[str] = None
    order: int = 0
    created_at: datetime
    updated_at: datetime
```

#### Endpoints Added
- **GET `/api/admin/gallery`** - Retrieve all gallery images (public endpoint)
- **POST `/api/admin/gallery/upload`** - Upload images to gallery (admin only)
- **DELETE `/api/admin/gallery/{image_id}`** - Delete an image (admin only)
- **PATCH `/api/admin/gallery/{image_id}/order`** - Reorder images (admin only)

### 3. **Frontend API Integration** (api.js)
Added gallery management methods to the `adminAPI` object:
```javascript
adminAPI.getGallery()                              // Get all gallery images
adminAPI.uploadGalleryImages(formData)             // Upload images
adminAPI.deleteGalleryImage(imageId)               // Delete image
adminAPI.updateGalleryImageOrder(imageId, order)   // Reorder images
```

### 4. **Admin Dashboard Integration**
- Added "Gallery Management" menu item to the admin sidebar
- Integrated route at `/admin/gallery`
- Uses Image icon from lucide-react for visual identification

### 5. **HomePage Gallery Updates**
- Gallery now fetches images from the backend
- Fallback to default images if backend unavailable
- Dynamic rendering based on available images
- Maintains original styling and layout

## How to Use

### For Admins

1. **Access Gallery Management**
   - Go to Admin Panel (http://localhost:3000/admin)
   - Click "Gallery Management" in the sidebar

2. **Upload Images**
   - Click "Select Images" button
   - Choose multiple image files (JPG, PNG, GIF, WebP)
   - Preview images before uploading
   - Click "Upload" button

3. **Delete Images**
   - Hover over an image in the gallery
   - Click the red delete button that appears
   - Confirm deletion

4. **View Current Gallery**
   - All uploaded images are displayed in a grid
   - Shows image count at the top
   - Images can be managed from this view

### For Users

The gallery displays dynamically:
- If custom images are uploaded via admin panel, those display
- Otherwise, default images are shown
- No changes needed for end users

## File Structure

### New Files Created
```
frontend/src/pages/admin/
├── GalleryManagementView.js          # Gallery admin component
```

### Modified Files
```
frontend/src/
├── utils/api.js                       # Added gallery API endpoints
├── pages/HomePage.js                  # Updated to fetch gallery from backend
└── pages/admin/AdminDashboard.js      # Added gallery route and menu item

backend/
└── server.py                          # Added gallery model and endpoints
```

## Technical Details

### Image Storage
- Images are stored as Base64-encoded data URLs in MongoDB
- This approach works well for smaller galleries
- For production with large images, consider:
  - AWS S3 integration
  - Google Cloud Storage
  - Cloudinary or similar CDN services

### Database Collection
- Collection: `gallery`
- Fields: `_id`, `url`, `alt`, `order`, `filename`, `created_at`, `updated_at`
- Indexed by: `order` (ascending)

### Security
- Admin endpoints require authentication (`Depends(get_current_user)`)
- Only super_admin and school_admin roles can manage gallery
- Public endpoint (`/api/admin/gallery`) is accessible to all for fetching images

## Error Handling

The system includes comprehensive error handling:
- Network failures: Fallback to default gallery
- Upload failures: Toast notification with error message
- Delete failures: User confirmation before deletion
- File validation: Only image files accepted

## Testing Checklist

- [ ] Admin can upload single/multiple images
- [ ] Images preview before upload
- [ ] Images are stored and displayed correctly
- [ ] Admin can delete images with confirmation
- [ ] HomePage displays gallery from backend
- [ ] Fallback works when backend unavailable
- [ ] Error messages display correctly
- [ ] UI is responsive on mobile devices
- [ ] Only admins can access management panel

## Future Enhancements

1. **Image Reordering**: Drag-and-drop to reorder gallery images
2. **Image Compression**: Optimize large images automatically
3. **Bulk Operations**: Delete multiple images at once
4. **Image Categories**: Organize gallery by events/categories
5. **CDN Integration**: Store images on cloud storage
6. **Image Editing**: Crop, resize, or apply filters
7. **Gallery Analytics**: Track gallery views and interactions

## API Response Examples

### GET /api/admin/gallery
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "url": "data:image/png;base64,...",
    "alt": "Gallery Image 1",
    "order": 1,
    "created_at": "2024-01-26T10:30:00Z",
    "updated_at": "2024-01-26T10:30:00Z"
  }
]
```

### POST /api/admin/gallery/upload
**Response:**
```json
{
  "success": true,
  "message": "Uploaded 3 image(s)",
  "count": 3
}
```

### DELETE /api/admin/gallery/{image_id}
**Response:**
```json
{
  "success": true,
  "message": "Image deleted successfully"
}
```

## Troubleshooting

### Images not uploading
1. Check file size (max 5MB each)
2. Verify file format (JPG, PNG, GIF, WebP)
3. Check browser console for errors
4. Ensure backend is running

### Gallery not displaying on homepage
1. Check if gallery has been populated via admin panel
2. Verify backend API is accessible
3. Check browser network tab for API calls
4. Review browser console for errors

### Authorization errors
1. Ensure user is logged in as admin
2. Verify user role is super_admin or school_admin
3. Check authentication token in localStorage

---

**Implementation Date**: January 26, 2026
**Status**: Complete and Ready for Testing
