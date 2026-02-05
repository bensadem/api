'use client';

import { useForm } from 'react-hook-form';
import { FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { channelsApi } from '@/lib/api';
import { useState } from 'react';

interface Channel {
  _id?: string;
  name: string;
  streamUrl: string;
  externalChannelId?: string;
  streamUrls?: {
    auto?: string;
    fhd?: string;
    hd?: string;
    sd?: string;
    ld?: string;
  };
  logoUrl?: string;
  description?: string;
  category?: { _id: string; name: string } | string;
  isActive: boolean;
  order?: number;
}

interface Category {
  _id: string;
  name: string;
}

interface Props {
  channel: Channel | null;
  categories: Category[];
  onClose: () => void;
  onSave: () => void;
}

export default function ChannelModal({ channel, categories, onClose, onSave }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const isEditing = !!channel?._id;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Channel>({
    defaultValues: {
      name: channel?.name || '',
      streamUrl: channel?.streamUrl || '',
      externalChannelId: channel?.externalChannelId || '',
      streamUrls: channel?.streamUrls || { auto: '', fhd: '', hd: '', sd: '', ld: '' },
      logoUrl: channel?.logoUrl || '',
      description: channel?.description || '',
      category: typeof channel?.category === 'object' ? channel.category.name : channel?.category || '',
      isActive: channel?.isActive ?? true,
      order: channel?.order || 0,
    },
  });

  const [showQualityUrls, setShowQualityUrls] = useState(
    !!(channel?.streamUrls?.auto || channel?.streamUrls?.fhd || channel?.streamUrls?.hd || channel?.streamUrls?.sd || channel?.streamUrls?.ld)
  );

  const streamUrl = watch('streamUrl');
  const externalChannelId = watch('externalChannelId');

  const handleParseM3U8 = async () => {
    if (!streamUrl) {
      toast.error('Please enter a stream URL first');
      return;
    }

    setIsParsing(true);
    try {
      const response = await channelsApi.parseM3U8(streamUrl);
      const data = response.data.data;

      if (data.variants && Object.keys(data.variants).length > 0) {
        // Update form values with extracted URLs
        setValue('streamUrls.auto', data.variants.auto || '');
        setValue('streamUrls.fhd', data.variants.fhd || '');
        setValue('streamUrls.hd', data.variants.hd || '');
        setValue('streamUrls.sd', data.variants.sd || '');
        setValue('streamUrls.ld', data.variants.ld || '');

        setShowQualityUrls(true);

        const count = Object.keys(data.variants).length;
        toast.success(`Found ${count} quality variant${count > 1 ? 's' : ''}`);
      } else {
        toast.success(data.message || 'No quality variants found, using single stream.');
      }
    } catch (error: any) {
      console.error('Parse error:', error);
      toast.error(error.response?.data?.message || 'Failed to parse M3U8');
    } finally {
      setIsParsing(false);
    }
  };

  const onSubmit = async (data: Channel) => {
    setIsLoading(true);
    try {
      // Clean up empty streamUrls if not needed
      if (data.streamUrls) {
        const hasAnyQualityUrl = Object.values(data.streamUrls).some(url => url && url.trim() !== '');
        if (!hasAnyQualityUrl) {
          delete data.streamUrls;
        }
      }

      console.log('Submitting channel data:', data);

      if (isEditing) {
        await channelsApi.update(channel!._id!, data);
        toast.success('Channel updated');
      } else {
        await channelsApi.create(data);
        toast.success('Channel created');
      }
      onSave();
    } catch (error: any) {
      console.error('Error saving channel:', error);
      toast.error(error.response?.data?.message || 'Operation failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-200 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-300">
          <h2 className="text-xl font-semibold text-white">
            {isEditing ? 'Edit Channel' : 'Add Channel'}
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
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Name *
              </label>
              <input
                {...register('name', { required: 'Name is required' })}
                className="w-full"
                placeholder="Channel name"
              />
              {errors.name && (
                <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Category *
              </label>
              <select {...register('category', { required: 'Category is required' })} className="w-full">
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-red-400 text-sm mt-1">{errors.category.message}</p>
              )}
            </div>

            {/* Stream URL */}
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-300">
                  Stream URL *
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleParseM3U8}
                    disabled={isParsing || !streamUrl}
                    className="text-xs px-3 py-1 bg-primary-500 hover:bg-primary-600 disabled:bg-dark-400 disabled:text-gray-500 text-white rounded transition-colors flex items-center gap-1"
                  >
                    {isParsing ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Parsing...
                      </>
                    ) : (
                      '🔍 Extract Qualities'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowQualityUrls(!showQualityUrls)}
                    className="text-xs text-primary-400 hover:text-primary-300"
                  >
                    {showQualityUrls ? 'Hide' : 'Add'} Quality URLs
                  </button>
                </div>
              </div>

              <input
                {...register('streamUrl', {
                  validate: value => {
                    if (!value && !externalChannelId) {
                      return 'Either Stream URL or External Channel ID is required';
                    }
                    return true;
                  }
                })}
                className="w-full"
                placeholder="https://example.com/stream.m3u8"
              />
              {errors.streamUrl && (
                <p className="text-red-400 text-sm mt-1">{errors.streamUrl.message}</p>
              )}

              {/* External Channel ID */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  External Channel ID (IPTV Proxy)
                </label>
                <input
                  {...register('externalChannelId')}
                  className="w-full"
                  placeholder="e.g. 12345 (Leave Stream URL empty if using this)"
                />
                <p className="text-xs text-gray-400 mt-1">
                  If set, the server will resolve the stream URL using the configured proxy.
                </p>
              </div>

              {/* Multiple Quality URLs */}
              {showQualityUrls && (
                <div className="mt-4 p-4 bg-dark-300 rounded-lg space-y-3">
                  <p className="text-xs text-gray-400 mb-3">
                    Quality URLs extracted from M3U8 or manually entered. Leave empty to use main URL.
                  </p>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Auto Quality</label>
                    <input
                      {...register('streamUrls.auto')}
                      className="w-full text-sm"
                      placeholder="Auto adaptive URL"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">1080p (FHD)</label>
                    <input
                      {...register('streamUrls.fhd')}
                      className="w-full text-sm"
                      placeholder="1080p stream URL"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">720p (HD)</label>
                    <input
                      {...register('streamUrls.hd')}
                      className="w-full text-sm"
                      placeholder="720p stream URL"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">480p (SD)</label>
                    <input
                      {...register('streamUrls.sd')}
                      className="w-full text-sm"
                      placeholder="480p stream URL"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">360p (LD)</label>
                    <input
                      {...register('streamUrls.ld')}
                      className="w-full text-sm"
                      placeholder="360p stream URL"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Logo */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Logo URL
              </label>
              <input
                {...register('logoUrl')}
                className="w-full"
                placeholder="https://example.com/logo.png"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                {...register('description')}
                className="w-full h-24 resize-none"
                placeholder="Channel description..."
              />
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
      </div >
    </div >
  );
}
