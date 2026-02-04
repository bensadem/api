'use client';

import { useForm } from 'react-hook-form';
import { FiX, FiImage, FiSmile } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { categoriesApi } from '@/lib/api';
import { useState } from 'react';

interface Category {
  _id?: string;
  name: string;
  type: 'channel' | 'movie' | 'series';
  icon?: string;
  logo?: string;
  color?: string;
  order?: number;
  isActive: boolean;
}

interface Props {
  category: Category | null;
  onClose: () => void;
  onSave: () => void;
}

const EMOJI_OPTIONS = ['📺', '🎬', '📽️', '🎭', '🎪', '🎵', '🎮', '📰', '⚽', '🏀', '🎾', '🏈', '🏎️', '🌍', '🌟', '❤️', '🔥', '👶', '🎨', '📚'];

const ICON_OPTIONS = [
  { name: 'sports', label: 'Sports', icon: '⚽' },
  { name: 'news', label: 'News', icon: '📰' },
  { name: 'entertainment', label: 'Entertainment', icon: '🎭' },
  { name: 'movies', label: 'Movies', icon: '🎬' },
  { name: 'documentary', label: 'Documentary', icon: '🌍' },
  { name: 'kids', label: 'Kids', icon: '👶' },
  { name: 'music', label: 'Music', icon: '🎵' },
  { name: 'lifestyle', label: 'Lifestyle', icon: '🌟' },
  { name: 'religious', label: 'Religious', icon: '🕌' },
  { name: 'education', label: 'Education', icon: '📚' },
  { name: 'food', label: 'Food', icon: '🍔' },
  { name: 'travel', label: 'Travel', icon: '✈️' },
  { name: 'science', label: 'Science', icon: '🔬' },
  { name: 'technology', label: 'Technology', icon: '💻' },
  { name: 'health', label: 'Health', icon: '🏥' },
  { name: 'fashion', label: 'Fashion', icon: '👗' },
  { name: 'gaming', label: 'Gaming', icon: '🎮' },
  { name: 'general', label: 'General', icon: '📺' },
];

export default function CategoryModal({ category, onClose, onSave }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [displayMode, setDisplayMode] = useState<'icon' | 'logo'>(
    category?.logo ? 'logo' : 'icon'
  );
  const isEditing = !!category?._id;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Category>({
    defaultValues: {
      name: category?.name || '',
      type: category?.type || 'channel',
      icon: category?.icon || '📺',
      logo: category?.logo || '',
      color: category?.color || '#6366f1',
      order: category?.order || 0,
      isActive: category?.isActive ?? true,
    },
  });

  const selectedIcon = watch('icon');
  const selectedLogo = watch('logo');
  const selectedColor = watch('color');

  const onSubmit = async (data: Category) => {
    setIsLoading(true);
    try {
      // Clear logo if using icon mode, or clear icon if using logo mode
      const submitData = {
        ...data,
        logo: displayMode === 'logo' ? data.logo : '',
        icon: displayMode === 'icon' ? data.icon : '',
      };

      if (isEditing) {
        await categoriesApi.update(category!._id!, submitData);
        toast.success('Category updated');
      } else {
        await categoriesApi.create(submitData);
        toast.success('Category created');
      }
      onSave();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-200 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-300 sticky top-0 bg-dark-200">
          <h2 className="text-xl font-semibold text-white">
            {isEditing ? 'Edit Category' : 'Add Category'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
          >
            <FiX className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Preview */}
          <div className="flex justify-center">
            <div
              className="w-24 h-24 rounded-2xl flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: selectedColor || '#374151' }}
            >
              {displayMode === 'logo' && selectedLogo ? (
                <img
                  src={selectedLogo}
                  alt="Category logo"
                  className="w-full h-full object-contain p-2"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                <span className="text-5xl">{selectedIcon || '📁'}</span>
              )}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Name *
            </label>
            <input
              {...register('name', { required: 'Name is required' })}
              className="w-full"
              placeholder="Category name"
            />
            {errors.name && (
              <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Type *
            </label>
            <select {...register('type', { required: true })} className="w-full">
              <option value="channel">Channels</option>
              <option value="movie">Movies</option>
              <option value="series">Series</option>
            </select>
          </div>

          {/* Display Mode Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Display Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDisplayMode('icon')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all ${
                  displayMode === 'icon'
                    ? 'border-primary-500 bg-primary-500/20 text-white'
                    : 'border-dark-300 bg-dark-300 text-gray-400 hover:border-dark-400'
                }`}
              >
                <FiSmile className="w-5 h-5" />
                <span>Icon</span>
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('logo')}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all ${
                  displayMode === 'logo'
                    ? 'border-primary-500 bg-primary-500/20 text-white'
                    : 'border-dark-300 bg-dark-300 text-gray-400 hover:border-dark-400'
                }`}
              >
                <FiImage className="w-5 h-5" />
                <span>Logo</span>
              </button>
            </div>
          </div>

          {/* Icon Selection (shown when displayMode is 'icon') */}
          {displayMode === 'icon' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Icon
              </label>
              
              {/* Preset Icons */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2">Preset Icons</p>
                <div className="grid grid-cols-6 gap-2">
                  {ICON_OPTIONS.map((opt) => (
                    <button
                      key={opt.name}
                      type="button"
                      onClick={() => setValue('icon', opt.icon)}
                      title={opt.label}
                      className={`w-full aspect-square rounded-lg text-2xl flex items-center justify-center transition-colors ${
                        selectedIcon === opt.icon
                          ? 'bg-primary-500/30 ring-2 ring-primary-500'
                          : 'bg-dark-300 hover:bg-dark-400'
                      }`}
                    >
                      {opt.icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Emoji */}
              <div>
                <p className="text-xs text-gray-500 mb-2">Or choose emoji</p>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setValue('icon', emoji)}
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-colors ${
                        selectedIcon === emoji
                          ? 'bg-primary-500/30 ring-2 ring-primary-500'
                          : 'bg-dark-300 hover:bg-dark-400'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Logo URL (shown when displayMode is 'logo') */}
          {displayMode === 'logo' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Logo URL
              </label>
              <input
                {...register('logo')}
                className="w-full"
                placeholder="https://example.com/logo.png"
                type="url"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter a direct URL to an image (PNG, JPG, SVG recommended)
              </p>
            </div>
          )}

          {/* Color */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Background Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                {...register('color')}
                className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-0"
              />
              <input
                type="text"
                {...register('color')}
                className="flex-1"
                placeholder="#6366f1"
              />
            </div>
            {/* Quick color presets */}
            <div className="flex gap-2 mt-2">
              {['#6366f1', '#ef4444', '#22c55e', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6'].map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue('color', color)}
                  className={`w-8 h-8 rounded-lg transition-transform hover:scale-110 ${
                    selectedColor === color ? 'ring-2 ring-white ring-offset-2 ring-offset-dark-200' : ''
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Order */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Order
            </label>
            <input
              type="number"
              {...register('order', { valueAsNumber: true })}
              className="w-full"
              placeholder="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Lower numbers appear first
            </p>
          </div>

          {/* Active */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register('isActive')}
              className="w-5 h-5 rounded border-dark-300 bg-dark-300 text-primary-500 focus:ring-primary-500"
            />
            <span className="text-gray-300">Active</span>
          </label>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-dark-300">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isLoading} className="btn btn-primary">
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isEditing ? (
                'Update'
              ) : (
                'Create'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
