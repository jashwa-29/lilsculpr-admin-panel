// File: lilsculpr-admin/src/pages/Gallery/GalleryManagement.jsx

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button, Modal, SearchBar, Table, StatusPill } from '../../components/common';
import { 
  fetchGalleryItemsAdmin, 
  createGalleryItem, 
  updateGalleryItem, 
  deleteGalleryItem, 
  clearGalleryError,
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  resetGalleryState
} from '../../store/slices/gallerySlice';
import api from '../../api/axios';

export const GalleryManagement = () => {
  const dispatch = useDispatch();
  const { items = [], categories = [], isLoading, isSubmitting, error, lastUpdated } = useSelector((state) => state.gallery || { items: [], categories: [] });
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ title: '', description: '', category: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // ─── CATEGORY MANAGEMENT STATE ──────────────────────────────────────────
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryFormData, setCategoryFormData] = useState({ name: '', icon: '📁' });
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

  // ─── Load data ──────────────────────────────────────────────────────────
  useEffect(() => {
    console.log('🔄 GalleryManagement mounted, fetching data...');
    dispatch(fetchGalleryItemsAdmin());
    dispatch(fetchCategories());
    
    return () => {
      dispatch(resetGalleryState());
    };
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      console.error('❌ Gallery error:', error);
      alert('Error: ' + error);
      dispatch(clearGalleryError());
    }
  }, [error, dispatch]);

  useEffect(() => {
    if (showSuccess) {
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccess]);

  // ─── GALLERY ITEM CRUD ──────────────────────────────────────────────────

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({ 
        title: item.title || '', 
        description: item.description || '',
        category: item.category?._id || item.category || (categories.length > 0 ? categories[0]._id : '')
      });
      setImagePreview(item.imageUrl ? `https://backend.lilsculpr.com${item.imageUrl}` : null);
    } else {
      setEditingItem(null);
      setFormData({ 
        title: '', 
        description: '', 
        category: categories.length > 0 ? categories[0]._id : '' 
      });
      setImagePreview(null);
      setImageFile(null);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({ title: '', description: '', category: '' });
    setImageFile(null);
    setImagePreview(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.category) {
      alert('Please select a category.');
      return;
    }

    if (!editingItem && !imageFile) {
      alert('Please select an image to upload.');
      return;
    }

    const submitData = new FormData();
    submitData.append('title', formData.title.trim());
    submitData.append('description', formData.description.trim());
    submitData.append('category', formData.category);
    if (imageFile) {
      submitData.append('image', imageFile);
    }

    try {
      let result;
      if (editingItem) {
        result = await dispatch(updateGalleryItem({ id: editingItem._id, formData: submitData })).unwrap();
        setSuccessMessage(`✅ "${formData.title}" updated successfully!`);
      } else {
        result = await dispatch(createGalleryItem(submitData)).unwrap();
        setSuccessMessage(`✅ "${formData.title}" added to gallery!`);
      }
      
      console.log('📦 Submit result:', result);
      setShowSuccess(true);
      handleCloseModal();
      await dispatch(fetchGalleryItemsAdmin());
      
    } catch (err) {
      console.error('❌ Submit error:', err);
      alert('Failed to save: ' + (err || 'Unknown error'));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this gallery item?')) {
      try {
        await dispatch(deleteGalleryItem(id)).unwrap();
        setSuccessMessage('✅ Gallery item deleted successfully!');
        setShowSuccess(true);
        await dispatch(fetchGalleryItemsAdmin());
      } catch (err) {
        alert('Failed to delete: ' + (err || 'Unknown error'));
      }
    }
  };

  // ─── CATEGORY CRUD ──────────────────────────────────────────────────────

  const handleOpenCategoryModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setCategoryFormData({ 
        name: category.name || '', 
        icon: category.icon || '📁' 
      });
    } else {
      setEditingCategory(null);
      setCategoryFormData({ name: '', icon: '📁' });
    }
    setShowCategoryModal(true);
  };

  const handleCloseCategoryModal = () => {
    setShowCategoryModal(false);
    setEditingCategory(null);
    setCategoryFormData({ name: '', icon: '📁' });
    setIsSubmittingCategory(false);
  };

  const handleCategoryInputChange = (e) => {
    const { name, value } = e.target;
    setCategoryFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingCategory(true);

    if (!categoryFormData.name.trim()) {
      alert('Please enter a category name.');
      setIsSubmittingCategory(false);
      return;
    }

    try {
      if (editingCategory) {
        await dispatch(updateCategory({ 
          id: editingCategory._id, 
          data: { 
            name: categoryFormData.name.trim(), 
            icon: categoryFormData.icon 
          } 
        })).unwrap();
        setSuccessMessage(`✅ Category "${categoryFormData.name}" updated!`);
      } else {
        await dispatch(createCategory({ 
          name: categoryFormData.name.trim(), 
          icon: categoryFormData.icon 
        })).unwrap();
        setSuccessMessage(`✅ Category "${categoryFormData.name}" created!`);
      }
      setShowSuccess(true);
      handleCloseCategoryModal();
      await dispatch(fetchCategories());
      await dispatch(fetchGalleryItemsAdmin());
    } catch (err) {
      alert('Failed to save category: ' + (err || 'Unknown error'));
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    // Check if category is in use
    const usedCount = items.filter(item => {
      const itemCategoryId = item.category?._id || item.category;
      return String(itemCategoryId) === String(categoryId);
    }).length;

    if (usedCount > 0) {
      alert(`Cannot delete this category. It is used by ${usedCount} gallery item(s). Please reassign or delete those items first.`);
      return;
    }

    const category = categories.find(c => c._id === categoryId);
    if (!window.confirm(`Are you sure you want to delete the category "${category?.name}"?`)) {
      return;
    }

    try {
      await dispatch(deleteCategory(categoryId)).unwrap();
      setSuccessMessage(`✅ Category "${category?.name}" deleted!`);
      setShowSuccess(true);
      await dispatch(fetchCategories());
      await dispatch(fetchGalleryItemsAdmin());
    } catch (err) {
      alert('Failed to delete category: ' + (err || 'Unknown error'));
    }
  };

  // ─── HELPER ─────────────────────────────────────────────────────────────

  const filteredItems = (items || []).filter(item => {
    if (!item) return false;
    const searchLower = searchQuery.toLowerCase();
    const title = (item.title || '').toLowerCase();
    const description = (item.description || '').toLowerCase();
    const categoryName = (item.categoryName || item.category?.name || '').toLowerCase();
    return title.includes(searchLower) || 
           description.includes(searchLower) || 
           categoryName.includes(searchLower);
  });

  const getCategoryColor = (categoryName) => {
    const colors = {
      'Miniature Food': 'bg-orange-100 text-orange-800',
      'Animals & Characters': 'bg-green-100 text-green-800',
      'Clay Sculptures': 'bg-purple-100 text-purple-800',
      'Decorative Art': 'bg-pink-100 text-pink-800',
      'Class Activities': 'bg-blue-100 text-blue-800',
      'Other': 'bg-gray-100 text-gray-800'
    };
    return colors[categoryName] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Success Toast */}
      {showSuccess && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg shadow-sm animate-fade-in">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700 font-medium">{successMessage}</p>
            </div>
            <button 
              onClick={() => setShowSuccess(false)}
              className="ml-auto text-green-700 hover:text-green-900"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h3 className="font-nunito font-extrabold">Manage Gallery</h3>
          <p className="text-sm text-muted">
            {items.length} item{items.length !== 1 ? 's' : ''} in gallery · {categories.length} categories
            {lastUpdated && ` · Last updated: ${new Date(lastUpdated).toLocaleTimeString()}`}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              dispatch(fetchGalleryItemsAdmin());
              dispatch(fetchCategories());
            }}
          >
            🔄 Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleOpenCategoryModal()}
          >
            📁 Manage Categories
          </Button>
          <Button variant="primary" onClick={() => handleOpenModal()}>
            ➕ Add New Image
          </Button>
        </div>
      </div>

      {/* ─── CATEGORY QUICK STATS ─────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {categories.map(cat => {
          const count = items.filter(item => {
            const catId = item.category?._id || item.category;
            return String(catId) === String(cat._id);
          }).length;
          return (
            <span key={cat._id} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
              {cat.icon} {cat.name} <span className="text-xs text-muted">({count})</span>
            </span>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 max-w-sm">
          <SearchBar
            placeholder="🔍 Search gallery..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <span className="text-xs text-muted">
          {filteredItems.length} of {items.length} shown
        </span>
      </div>

      <div className="card overflow-hidden">
        <Table
          columns={[
            { key: 'image', title: 'Image' },
            { key: 'title', title: 'Title' },
            { key: 'category', title: 'Category' },
            { key: 'description', title: 'Description' },
            { key: 'status', title: 'Status' },
            { key: 'actions', title: 'Actions' },
          ]}
          data={filteredItems}
          isLoading={isLoading}
          emptyMessage={isLoading ? 'Loading gallery items...' : 'No gallery items found. Click "Add New Image" to get started.'}
          renderRow={(item) => {
            if (!item) return null;
            const imageUrl = item.imageUrl ? `https://backend.lilsculpr.com${item.imageUrl}` : '';
            const categoryName = item.categoryName || item.category?.name || 'Other';
            return (
              <tr key={item._id || Math.random()} className="hover:bg-slate-50 border-b border-slate-50 last:border-b-0">
                <td className="px-4 py-3">
                  {imageUrl ? (
                    <img src={imageUrl} alt={item.title || 'Gallery item'} className="w-16 h-16 object-cover rounded-lg" />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400">No Image</div>
                  )}
                </td>
                <td className="px-4 py-3 font-semibold">{item.title || 'Untitled'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getCategoryColor(categoryName)}`}>
                    {item.category?.icon || '📁'} {categoryName}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-muted max-w-xs truncate">{item.description || ''}</td>
                <td className="px-4 py-3">
                  <StatusPill variant={item.isActive ? 'green' : 'red'}>
                    {item.isActive ? 'Active' : 'Inactive'}
                  </StatusPill>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleOpenModal(item)}>
                      ✏️ Edit
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(item._id)}>
                      🗑️ Delete
                    </Button>
                  </div>
                </td>
              </tr>
            );
          }}
        />
      </div>

      {/* ─── GALLERY ITEM MODAL ──────────────────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingItem ? '✏️ Edit Gallery Item' : '➕ Add New Gallery Item'}
        subtitle={editingItem ? 'Update the image, title, description, or category' : 'Upload a new image for the gallery'}
        headerGradient="from-secondary to-indigo-600"
        maxWidth="max-w-lg"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCloseModal} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                editingItem ? '💾 Save Changes' : '➕ Add to Gallery'
              )}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">
              Image {editingItem ? '' : <span className="text-red-500">*</span>}
            </label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark"
              />
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="w-16 h-16 object-cover rounded-lg border" />
              )}
            </div>
            <p className="text-xs text-muted mt-1">
              {editingItem ? 'Leave empty to keep the current image.' : 'Upload a JPG, PNG, or WebP image (max 5MB).'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Student Masterpiece"
              className="w-full px-3 py-2 border border-[#e8e4f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">
              Category <span className="text-red-500">*</span>
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-[#e8e4f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary bg-white"
              required
            >
              <option value="">Select a category...</option>
              {(categories || []).map(cat => (
                <option key={cat._id} value={cat._id}>
                  {cat.icon || '📁'} {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="A short description of the artwork..."
              rows="3"
              className="w-full px-3 py-2 border border-[#e8e4f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary resize-y"
            />
          </div>
        </form>
      </Modal>

      {/* ─── CATEGORY MANAGEMENT MODAL ───────────────────────────────────── */}
      <Modal
        isOpen={showCategoryModal}
        onClose={handleCloseCategoryModal}
        title={editingCategory ? '✏️ Edit Category' : '📁 Add New Category'}
        subtitle={editingCategory ? 'Update the category name or icon' : 'Create a new category for gallery items'}
        headerGradient="from-secondary to-indigo-600"
        maxWidth="max-w-md"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCloseCategoryModal} disabled={isSubmittingCategory}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCategorySubmit} disabled={isSubmittingCategory}>
              {isSubmittingCategory ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                editingCategory ? '💾 Update Category' : '➕ Create Category'
              )}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCategorySubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={categoryFormData.name}
              onChange={handleCategoryInputChange}
              placeholder="e.g., Abstract Art, Nature, Portraits"
              className="w-full px-3 py-2 border border-[#e8e4f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">
              Icon (Emoji)
            </label>
            <input
              type="text"
              name="icon"
              value={categoryFormData.icon}
              onChange={handleCategoryInputChange}
              placeholder="e.g., 🎨, 🖼️, 🌿"
              className="w-full px-3 py-2 border border-[#e8e4f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
              maxLength="2"
            />
            <p className="text-xs text-muted mt-1">Enter a single emoji for the category icon.</p>
          </div>

          {/* ─── EXISTING CATEGORIES LIST ────────────────────────────────── */}
          <div className="pt-4 border-t border-[#e8e4f0]">
            <h4 className="text-sm font-semibold mb-3">Existing Categories</h4>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {categories.length === 0 ? (
                <p className="text-sm text-muted">No categories created yet.</p>
              ) : (
                categories.map(cat => {
                  const usedCount = items.filter(item => {
                    const catId = item.category?._id || item.category;
                    return String(catId) === String(cat._id);
                  }).length;
                  return (
                    <div key={cat._id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <span className="text-sm">
                        {cat.icon} {cat.name} <span className="text-xs text-muted">({usedCount} items)</span>
                      </span>
                      <div className="flex gap-1">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleOpenCategoryModal(cat)}
                          className="text-xs py-1 px-2"
                        >
                          ✏️
                        </Button>
                        <Button 
                          size="sm" 
                          variant="danger" 
                          onClick={() => handleDeleteCategory(cat._id)}
                          className="text-xs py-1 px-2"
                          disabled={usedCount > 0}
                          title={usedCount > 0 ? `Used by ${usedCount} item(s)` : ''}
                        >
                          🗑️
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default GalleryManagement;