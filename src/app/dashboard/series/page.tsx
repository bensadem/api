'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiTv, FiStar, FiList } from 'react-icons/fi';
import { seriesApi, categoriesApi } from '@/lib/api';
import toast from 'react-hot-toast';
import SeriesModal from './SeriesModal';

interface Series {
  _id: string;
  title: string;
  description?: string;
  poster?: string;
  backdrop?: string;
  trailerUrl?: string;
  releaseYear?: number;
  rating?: number;
  genres?: string[];
  cast?: string[];
  seasons: number;
  category?: { _id: string; name: string };
  isActive: boolean;
  isFeatured: boolean;
  views: number;
  createdAt: string;
}

interface Category {
  _id: string;
  name: string;
}

export default function SeriesPage() {
  const [series, setSeries] = useState<Series[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSeries, setEditingSeries] = useState<Series | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchSeries = async () => {
    try {
      const params: any = { page, limit: 10 };
      if (search) params.search = search;
      if (selectedCategory) params.category = selectedCategory;
      
      const response = await seriesApi.getAll(params);
      const data = response.data.data || response.data;
      setSeries(data.series || data || []);
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      toast.error('Failed to fetch series');
      setSeries([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.getAll({ type: 'series' });
      const data = response.data.data || response.data;
      setCategories(data.categories || data || []);
    } catch (error) {
      console.error('Failed to fetch categories');
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchSeries();
  }, [search, selectedCategory, page]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this series and all episodes?')) return;
    try {
      await seriesApi.delete(id);
      toast.success('Series deleted');
      fetchSeries();
    } catch (error) {
      toast.error('Failed to delete series');
    }
  };

  const handleEdit = (s: Series) => {
    setEditingSeries(s);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingSeries(null);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingSeries(null);
  };

  const handleSave = () => {
    setShowModal(false);
    setEditingSeries(null);
    fetchSeries();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Series</h1>
          <p className="text-gray-400 mt-1">Manage TV series library</p>
        </div>
        <button onClick={handleAdd} className="btn btn-primary flex items-center gap-2">
          <FiPlus className="w-4 h-4" />
          Add Series
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search series..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setPage(1);
          }}
          className="w-full sm:w-48"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Series Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {series.map((s) => (
              <div key={s._id} className="card group">
                {/* Poster */}
                <div className="relative aspect-[2/3] bg-dark-300 rounded-lg overflow-hidden mb-4">
                  {s.poster ? (
                    <img
                      src={s.poster}
                      alt={s.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FiTv className="w-12 h-12 text-gray-600" />
                    </div>
                  )}
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                      <button
                        onClick={() => handleEdit(s)}
                        className="flex-1 btn btn-secondary text-sm py-2"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(s._id)}
                        className="flex-1 btn bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm py-2"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="absolute top-2 left-2 right-2 flex justify-between">
                    {s.isFeatured && (
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full flex items-center gap-1">
                        <FiStar className="w-3 h-3" /> Featured
                      </span>
                    )}
                    <span className={`px-2 py-1 text-xs rounded-full ml-auto ${
                      s.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <h3 className="font-semibold text-white truncate">{s.title}</h3>
                <div className="flex items-center gap-3 mt-2 text-sm text-gray-400">
                  {s.releaseYear && <span>{s.releaseYear}</span>}
                  <span className="flex items-center gap-1">
                    <FiList className="w-3 h-3" />
                    {s.seasons} season{s.seasons !== 1 ? 's' : ''}
                  </span>
                  {s.rating && (
                    <span className="flex items-center gap-1 text-yellow-400">
                      <FiStar className="w-3 h-3" />
                      {s.rating.toFixed(1)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {(s.views || 0).toLocaleString()} views
                </p>
              </div>
            ))}
          </div>

          {series.length === 0 && (
            <div className="text-center py-12">
              <FiTv className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No series found</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="btn btn-secondary"
              >
                Previous
              </button>
              <span className="flex items-center px-4 text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="btn btn-secondary"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {showModal && (
        <SeriesModal
          series={editingSeries}
          categories={categories}
          onClose={handleModalClose}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
