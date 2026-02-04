'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiFilm, FiStar, FiClock } from 'react-icons/fi';
import { moviesApi, categoriesApi } from '@/lib/api';
import toast from 'react-hot-toast';
import MovieModal from './MovieModal';

interface Movie {
  _id: string;
  title: string;
  description?: string;
  poster?: string;
  backdrop?: string;
  streamUrl: string;
  trailerUrl?: string;
  duration?: number;
  releaseYear?: number;
  rating?: number;
  genres?: string[];
  cast?: string[];
  director?: string;
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

export default function MoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchMovies = async () => {
    try {
      const params: any = { page, limit: 10 };
      if (search) params.search = search;
      if (selectedCategory) params.category = selectedCategory;
      
      const response = await moviesApi.getAll(params);
      const data = response.data.data || response.data;
      setMovies(data.movies || data || []);
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      toast.error('Failed to fetch movies');
      setMovies([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.getAll({ type: 'movie' });
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
    fetchMovies();
  }, [search, selectedCategory, page]);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this movie?')) return;
    try {
      await moviesApi.delete(id);
      toast.success('Movie deleted');
      fetchMovies();
    } catch (error) {
      toast.error('Failed to delete movie');
    }
  };

  const handleEdit = (movie: Movie) => {
    setEditingMovie(movie);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingMovie(null);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingMovie(null);
  };

  const handleSave = () => {
    setShowModal(false);
    setEditingMovie(null);
    fetchMovies();
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '-';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Movies</h1>
          <p className="text-gray-400 mt-1">Manage movie library</p>
        </div>
        <button onClick={handleAdd} className="btn btn-primary flex items-center gap-2">
          <FiPlus className="w-4 h-4" />
          Add Movie
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search movies..."
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

      {/* Movies Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {movies.map((movie) => (
              <div key={movie._id} className="card group">
                {/* Poster */}
                <div className="relative aspect-[2/3] bg-dark-300 rounded-lg overflow-hidden mb-4">
                  {movie.poster ? (
                    <img
                      src={movie.poster}
                      alt={movie.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FiFilm className="w-12 h-12 text-gray-600" />
                    </div>
                  )}
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                      <button
                        onClick={() => handleEdit(movie)}
                        className="flex-1 btn btn-secondary text-sm py-2"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(movie._id)}
                        className="flex-1 btn bg-red-500/20 text-red-400 hover:bg-red-500/30 text-sm py-2"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="absolute top-2 left-2 right-2 flex justify-between">
                    {movie.isFeatured && (
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full flex items-center gap-1">
                        <FiStar className="w-3 h-3" /> Featured
                      </span>
                    )}
                    <span className={`px-2 py-1 text-xs rounded-full ml-auto ${
                      movie.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {movie.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <h3 className="font-semibold text-white truncate">{movie.title}</h3>
                <div className="flex items-center gap-3 mt-2 text-sm text-gray-400">
                  {movie.releaseYear && <span>{movie.releaseYear}</span>}
                  {movie.duration && (
                    <span className="flex items-center gap-1">
                      <FiClock className="w-3 h-3" />
                      {formatDuration(movie.duration)}
                    </span>
                  )}
                  {movie.rating && (
                    <span className="flex items-center gap-1 text-yellow-400">
                      <FiStar className="w-3 h-3" />
                      {movie.rating.toFixed(1)}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {(movie.views || 0).toLocaleString()} views
                </p>
              </div>
            ))}
          </div>

          {movies.length === 0 && (
            <div className="text-center py-12">
              <FiFilm className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No movies found</p>
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
        <MovieModal
          movie={editingMovie}
          categories={categories}
          onClose={handleModalClose}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
