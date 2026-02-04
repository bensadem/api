'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { FiX, FiPlus, FiMinus } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { moviesApi } from '@/lib/api';
import { useState } from 'react';

interface Movie {
  _id?: string;
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
  category?: { _id: string; name: string } | string;
  isActive: boolean;
  isFeatured: boolean;
}

interface Category {
  _id: string;
  name: string;
}

interface Props {
  movie: Movie | null;
  categories: Category[];
  onClose: () => void;
  onSave: () => void;
}

export default function MovieModal({ movie, categories, onClose, onSave }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!movie?._id;

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<Movie & { genresInput: string; castInput: string }>({
    defaultValues: {
      title: movie?.title || '',
      description: movie?.description || '',
      poster: movie?.poster || '',
      backdrop: movie?.backdrop || '',
      streamUrl: movie?.streamUrl || '',
      trailerUrl: movie?.trailerUrl || '',
      duration: movie?.duration || undefined,
      releaseYear: movie?.releaseYear || undefined,
      rating: movie?.rating || undefined,
      genresInput: movie?.genres?.join(', ') || '',
      castInput: movie?.cast?.join(', ') || '',
      director: movie?.director || '',
      category: typeof movie?.category === 'object' ? movie.category._id : movie?.category || '',
      isActive: movie?.isActive ?? true,
      isFeatured: movie?.isFeatured ?? false,
    },
  });

  const onSubmit = async (data: Movie & { genresInput: string; castInput: string }) => {
    setIsLoading(true);
    try {
      const payload = {
        ...data,
        genres: data.genresInput ? data.genresInput.split(',').map(g => g.trim()) : [],
        cast: data.castInput ? data.castInput.split(',').map(c => c.trim()) : [],
      };
      delete (payload as any).genresInput;
      delete (payload as any).castInput;

      if (isEditing) {
        await moviesApi.update(movie!._id!, payload);
        toast.success('Movie updated');
      } else {
        await moviesApi.create(payload);
        toast.success('Movie created');
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
      <div className="bg-dark-200 rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-300">
          <h2 className="text-xl font-semibold text-white">
            {isEditing ? 'Edit Movie' : 'Add Movie'}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Title */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Title *
              </label>
              <input
                {...register('title', { required: 'Title is required' })}
                className="w-full"
                placeholder="Movie title"
              />
              {errors.title && (
                <p className="text-red-400 text-sm mt-1">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                {...register('description')}
                className="w-full h-24 resize-none"
                placeholder="Movie description..."
              />
            </div>

            {/* Stream URL */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Stream URL *
              </label>
              <input
                {...register('streamUrl', { required: 'Stream URL is required' })}
                className="w-full"
                placeholder="https://example.com/movie.m3u8"
              />
              {errors.streamUrl && (
                <p className="text-red-400 text-sm mt-1">{errors.streamUrl.message}</p>
              )}
            </div>

            {/* Trailer URL */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Trailer URL
              </label>
              <input
                {...register('trailerUrl')}
                className="w-full"
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>

            {/* Poster */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Poster URL
              </label>
              <input
                {...register('poster')}
                className="w-full"
                placeholder="https://example.com/poster.jpg"
              />
            </div>

            {/* Backdrop */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Backdrop URL
              </label>
              <input
                {...register('backdrop')}
                className="w-full"
                placeholder="https://example.com/backdrop.jpg"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category
              </label>
              <select {...register('category')} className="w-full">
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Director */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Director
              </label>
              <input
                {...register('director')}
                className="w-full"
                placeholder="Director name"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                {...register('duration', { valueAsNumber: true })}
                className="w-full"
                placeholder="120"
              />
            </div>

            {/* Release Year */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Release Year
              </label>
              <input
                type="number"
                {...register('releaseYear', { valueAsNumber: true })}
                className="w-full"
                placeholder="2024"
              />
            </div>

            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Rating (0-10)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                {...register('rating', { valueAsNumber: true })}
                className="w-full"
                placeholder="8.5"
              />
            </div>

            {/* Genres */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Genres (comma separated)
              </label>
              <input
                {...register('genresInput')}
                className="w-full"
                placeholder="Action, Drama, Thriller"
              />
            </div>

            {/* Cast */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Cast (comma separated)
              </label>
              <input
                {...register('castInput')}
                className="w-full"
                placeholder="Actor 1, Actor 2, Actor 3"
              />
            </div>

            {/* Switches */}
            <div className="md:col-span-2 flex flex-wrap gap-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('isActive')}
                  className="w-5 h-5 rounded border-dark-300 bg-dark-300 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-gray-300">Active</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('isFeatured')}
                  className="w-5 h-5 rounded border-dark-300 bg-dark-300 text-primary-500 focus:ring-primary-500"
                />
                <span className="text-gray-300">Featured</span>
              </label>
            </div>
          </div>

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
