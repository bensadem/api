'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiGrid, FiTv, FiFilm, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import { categoriesApi } from '@/lib/api';
import toast from 'react-hot-toast';
import CategoryModal from './CategoryModal';

interface Category {
  _id: string;
  name: string;
  type: 'channel' | 'movie' | 'series';
  icon?: string;
  logo?: string;
  color?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const fetchCategories = async () => {
    try {
      const params: any = {};
      if (search) params.search = search;
      if (selectedType) params.type = selectedType;

      const response = await categoriesApi.getAll(params);
      const data = response.data.data || response.data;
      setCategories(data.categories || data || []);
    } catch (error) {
      toast.error('Failed to fetch categories');
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [search, selectedType]);

  const handleDelete = async (id: string, force = false) => {
    if (!force && !confirm('Delete this category?')) return;
    try {
      await categoriesApi.delete(id, { force });
      toast.success('Category deleted');
      fetchCategories();
    } catch (error: any) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('used by')) {
        if (confirm(`${error.response.data.message}\n\nDo you want to force delete it?`)) {
          handleDelete(id, true);
          return;
        }
      }
      toast.error(error.response?.data?.message || 'Failed to delete category');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingCategory(null);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingCategory(null);
  };

  const handleSave = () => {
    setShowModal(false);
    setEditingCategory(null);
    fetchCategories();
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    try {
      await categoriesApi.reorder(id, direction);
      fetchCategories();
    } catch (error) {
      toast.error('Failed to reorder category');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'channel':
        return <FiTv className="w-4 h-4" />;
      case 'movie':
        return <FiFilm className="w-4 h-4" />;
      case 'series':
        return <FiGrid className="w-4 h-4" />;
      default:
        return <FiGrid className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'channel':
        return 'bg-blue-500/20 text-blue-400';
      case 'movie':
        return 'bg-purple-500/20 text-purple-400';
      case 'series':
        return 'bg-green-500/20 text-green-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Categories</h1>
          <p className="text-gray-400 mt-1">Organize content by categories</p>
        </div>
        <button onClick={handleAdd} className="btn btn-primary flex items-center gap-2">
          <FiPlus className="w-4 h-4" />
          Add Category
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10"
          />
        </div>
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-full sm:w-48"
        >
          <option value="">All Types</option>
          <option value="channel">Channels</option>
          <option value="movie">Movies</option>
          <option value="series">Series</option>
        </select>
      </div>

      {/* Categories Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {categories.map((category) => (
              <div
                key={category._id}
                className="card flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl overflow-hidden"
                    style={{ backgroundColor: category.color || '#374151' }}
                  >
                    {category.logo ? (
                      <img
                        src={category.logo}
                        alt={category.name}
                        className="w-full h-full object-contain p-1"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement!.innerHTML = category.icon || '📁';
                        }}
                      />
                    ) : (
                      category.icon || '📁'
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{category.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 text-xs rounded-full flex items-center gap-1 ${getTypeColor(category.type)}`}>
                        {getTypeIcon(category.type)}
                        {category.type}
                      </span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${category.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleReorder(category._id, 'up')}
                    className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
                    title="Move Up"
                  >
                    <FiChevronUp className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleReorder(category._id, 'down')}
                    className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
                    title="Move Down"
                  >
                    <FiChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleEdit(category)}
                    className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
                  >
                    <FiEdit2 className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(category._id)}
                    className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
                  >
                    <FiTrash2 className="w-4 h-4 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {categories.length === 0 && (
            <div className="text-center py-12">
              <FiGrid className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No categories found</p>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <CategoryModal
          category={editingCategory}
          onClose={handleModalClose}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
