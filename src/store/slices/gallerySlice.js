// File: lilsculpr-admin/src/store/slices/gallerySlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { endpoints } from '../../api/endpoints';
import api from '../../api/axios';

export const fetchGalleryItems = createAsyncThunk(
  'gallery/fetchAll',
  async (category = null) => {
    const url = category && category !== 'all' 
      ? `/gallery?category=${category}` 
      : '/gallery';
    const response = await api.get(url);
    return response.data;
  }
);

export const fetchGalleryItemsAdmin = createAsyncThunk(
  'gallery/fetchAllAdmin',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔍 Fetching gallery items from admin endpoint...');
      const response = await endpoints.gallery.getAllAdmin();
      console.log('📦 Gallery response:', response);
      
      if (response && response.success) {
        return { data: response.data || [] };
      }
      return { data: response?.data || [] };
    } catch (error) {
      console.error('❌ Error fetching gallery items:', error);
      return rejectWithValue(error.message || 'Failed to fetch gallery items');
    }
  }
);

export const fetchCategories = createAsyncThunk(
  'gallery/fetchCategories',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔍 Fetching categories...');
      const response = await api.get('/gallery/categories');
      console.log('📦 Categories response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      return rejectWithValue(error.message || 'Failed to fetch categories');
    }
  }
);

// ─── CATEGORY CRUD ACTIONS ───────────────────────────────────────────────

export const createCategory = createAsyncThunk(
  'gallery/createCategory',
  async (data, { rejectWithValue }) => {
    try {
      console.log('📤 Creating category:', data);
      const response = await api.post('/categories/admin', data);
      console.log('📦 Create category response:', response.data);
      if (response.data.success) {
        return response.data.data;
      }
      return rejectWithValue(response.data.error || 'Failed to create category');
    } catch (error) {
      console.error('❌ Error creating category:', error);
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const updateCategory = createAsyncThunk(
  'gallery/updateCategory',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      console.log(`📝 Updating category ${id}:`, data);
      const response = await api.put(`/categories/admin/${id}`, data);
      console.log('📦 Update category response:', response.data);
      if (response.data.success) {
        return response.data.data;
      }
      return rejectWithValue(response.data.error || 'Failed to update category');
    } catch (error) {
      console.error('❌ Error updating category:', error);
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const deleteCategory = createAsyncThunk(
  'gallery/deleteCategory',
  async (id, { rejectWithValue }) => {
    try {
      console.log(`🗑️ Deleting category ${id}...`);
      const response = await api.delete(`/categories/admin/${id}`);
      console.log('📦 Delete category response:', response.data);
      if (response.data.success) {
        return id;
      }
      return rejectWithValue(response.data.error || 'Failed to delete category');
    } catch (error) {
      console.error('❌ Error deleting category:', error);
      return rejectWithValue(error.response?.data?.error || error.message);
    }
  }
);

export const createGalleryItem = createAsyncThunk(
  'gallery/create',
  async (formData, { rejectWithValue }) => {
    try {
      console.log('📤 Creating gallery item...');
      const response = await endpoints.gallery.create(formData);
      console.log('📦 Create response:', response);
      
      if (response && response.success) {
        return { data: response.data };
      }
      return rejectWithValue(response?.error || 'Failed to create gallery item');
    } catch (error) {
      console.error('❌ Error creating gallery item:', error);
      return rejectWithValue(error.message || 'Failed to create gallery item');
    }
  }
);

export const updateGalleryItem = createAsyncThunk(
  'gallery/update',
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      console.log(`📝 Updating gallery item ${id}...`);
      const response = await endpoints.gallery.update(id, formData);
      console.log('📦 Update response:', response);
      
      if (response && response.success) {
        return { data: response.data };
      }
      return rejectWithValue(response?.error || 'Failed to update gallery item');
    } catch (error) {
      console.error('❌ Error updating gallery item:', error);
      return rejectWithValue(error.message || 'Failed to update gallery item');
    }
  }
);

export const deleteGalleryItem = createAsyncThunk(
  'gallery/delete',
  async (id, { rejectWithValue }) => {
    try {
      console.log(`🗑️ Deleting gallery item ${id}...`);
      await endpoints.gallery.delete(id);
      return id;
    } catch (error) {
      console.error('❌ Error deleting gallery item:', error);
      return rejectWithValue(error.message || 'Failed to delete gallery item');
    }
  }
);

export const reorderGalleryItems = createAsyncThunk(
  'gallery/reorder',
  async (items) => {
    const response = await endpoints.gallery.reorder(items);
    return response;
  }
);

const initialState = {
  items: [],
  categories: [],
  categoryCounts: {},
  isLoading: false,
  isSubmitting: false,
  error: null,
  lastUpdated: null,
};

const gallerySlice = createSlice({
  name: 'gallery',
  initialState,
  reducers: {
    clearGalleryError: (state) => {
      state.error = null;
    },
    resetGalleryState: (state) => {
      state.items = [];
      state.categories = [];
      state.error = null;
      state.isLoading = false;
      state.isSubmitting = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // ─── FETCH GALLERY ITEMS ──────────────────────────────────────────
      .addCase(fetchGalleryItems.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGalleryItems.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload?.data || [];
        state.categoryCounts = action.payload?.categories || {};
        state.lastUpdated = new Date().toISOString();
        console.log(`✅ Loaded ${state.items.length} gallery items`);
      })
      .addCase(fetchGalleryItems.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error?.message || 'Failed to fetch gallery items';
        state.items = [];
        console.error('❌ Failed to fetch gallery items:', state.error);
      })
      
      // ─── FETCH ADMIN GALLERY ITEMS ──────────────────────────────────
      .addCase(fetchGalleryItemsAdmin.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGalleryItemsAdmin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = Array.isArray(action.payload?.data) ? action.payload.data : [];
        state.lastUpdated = new Date().toISOString();
        console.log(`✅ Loaded ${state.items.length} gallery items (admin)`);
      })
      .addCase(fetchGalleryItemsAdmin.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error?.message || 'Failed to fetch gallery items';
        state.items = [];
        console.error('❌ Failed to fetch admin gallery items:', state.error);
      })
      
      // ─── FETCH CATEGORIES ─────────────────────────────────────────────
      .addCase(fetchCategories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categories = action.payload?.data || [];
        console.log(`✅ Loaded ${state.categories.length} categories`);
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload || action.error?.message || 'Failed to fetch categories';
        state.categories = [];
        console.error('❌ Failed to fetch categories:', state.error);
      })

      // ─── CREATE CATEGORY ─────────────────────────────────────────────
      .addCase(createCategory.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.isSubmitting = false;
        if (action.payload) {
          state.categories.push(action.payload);
          console.log(`✅ Created category: ${action.payload.name}`);
        }
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload || action.error?.message || 'Failed to create category';
        console.error('❌ Failed to create category:', state.error);
      })

      // ─── UPDATE CATEGORY ─────────────────────────────────────────────
      .addCase(updateCategory.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        state.isSubmitting = false;
        const updated = action.payload;
        if (updated) {
          const index = state.categories.findIndex(c => c._id === updated._id);
          if (index !== -1) {
            state.categories[index] = updated;
            console.log(`✅ Updated category: ${updated.name}`);
          }
        }
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload || action.error?.message || 'Failed to update category';
        console.error('❌ Failed to update category:', state.error);
      })

      // ─── DELETE CATEGORY ─────────────────────────────────────────────
      .addCase(deleteCategory.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.categories = state.categories.filter(c => c._id !== action.payload);
        console.log(`✅ Deleted category: ${action.payload}`);
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload || action.error?.message || 'Failed to delete category';
        console.error('❌ Failed to delete category:', state.error);
      })
      
      // ─── CREATE GALLERY ITEM ──────────────────────────────────────────
      .addCase(createGalleryItem.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(createGalleryItem.fulfilled, (state, action) => {
        state.isSubmitting = false;
        if (action.payload?.data) {
          state.items.unshift(action.payload.data);
          console.log(`✅ Created gallery item: ${action.payload.data.title}`);
        }
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(createGalleryItem.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload || action.error?.message || 'Failed to create gallery item';
        console.error('❌ Failed to create gallery item:', state.error);
      })
      
      // ─── UPDATE GALLERY ITEM ──────────────────────────────────────────
      .addCase(updateGalleryItem.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(updateGalleryItem.fulfilled, (state, action) => {
        state.isSubmitting = false;
        const updatedItem = action.payload?.data;
        if (updatedItem) {
          const index = state.items.findIndex(item => item._id === updatedItem._id);
          if (index !== -1) {
            state.items[index] = updatedItem;
            console.log(`✅ Updated gallery item: ${updatedItem.title}`);
          }
        }
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(updateGalleryItem.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload || action.error?.message || 'Failed to update gallery item';
        console.error('❌ Failed to update gallery item:', state.error);
      })
      
      // ─── DELETE GALLERY ITEM ──────────────────────────────────────────
      .addCase(deleteGalleryItem.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(deleteGalleryItem.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.items = state.items.filter(item => item._id !== action.payload);
        console.log(`✅ Deleted gallery item: ${action.payload}`);
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(deleteGalleryItem.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload || action.error?.message || 'Failed to delete gallery item';
        console.error('❌ Failed to delete gallery item:', state.error);
      });
  },
});

export const { clearGalleryError, resetGalleryState } = gallerySlice.actions;
export default gallerySlice.reducer;