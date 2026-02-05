'use client';

import { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiFilter, FiChevronUp, FiChevronDown } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { channelsApi, categoriesApi } from '@/lib/api';
import ChannelModal from './ChannelModal';

interface Channel {
  _id: string;
  name: string;
  streamUrl: string;
  logoUrl?: string;
  category?: string;
  isActive: boolean;
  isFeatured: boolean;
}

interface Category {
  _id: string;
  name: string;
}

export default function ChannelsPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null);

  const fetchChannels = async () => {
    try {
      setIsLoading(true);
      const params: any = {};
      if (selectedCategory) params.category = selectedCategory;
      const response = await channelsApi.getAll(params);
      const data = response.data.data || response.data;
      setChannels(data.channels || data || []);
    } catch (error) {
      toast.error('Failed to fetch channels');
      setChannels([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesApi.getAll({ type: 'channel' });
      const data = response.data.data || response.data;
      setCategories(data.categories || data || []);
    } catch (error) {
      console.error('Failed to fetch categories');
    }
  };

  useEffect(() => {
    fetchChannels();
    fetchCategories();
  }, [selectedCategory]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this channel?')) return;

    try {
      await channelsApi.delete(id);
      toast.success('Channel deleted');
      fetchChannels();
    } catch (error) {
      toast.error('Failed to delete channel');
    }
  };

  const handleEdit = (channel: Channel) => {
    setEditingChannel(channel);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingChannel(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingChannel(null);
  };

  const handleModalSave = () => {
    handleModalClose();
    fetchChannels();
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    try {
      await channelsApi.reorder(id, direction);
      fetchChannels();
    } catch (error) {
      toast.error('Failed to reorder channel');
    }
  };

  const filteredChannels = channels.filter((channel) =>
    channel.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            Channels
            <span className="text-xs font-normal text-gray-500 bg-dark-300 px-2 py-1 rounded">v1.1</span>
          </h1>
          <p className="text-gray-400 mt-1">Manage your TV channels</p>
        </div>
        <button onClick={handleAdd} className="btn btn-primary flex items-center gap-2">
          <FiPlus className="w-5 h-5" />
          Add Channel
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <FiFilter className="text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="min-w-[150px]"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : filteredChannels.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            No channels found
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredChannels.map((channel) => (
                  <tr key={channel._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {(channel.logoUrl || (channel as any).logo) ? (
                          <img
                            src={channel.logoUrl || (channel as any).logo}
                            alt={channel.name}
                            className="w-10 h-10 rounded-lg object-cover bg-dark-300"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-dark-300 flex items-center justify-center">
                            <span className="text-gray-500 text-xs">No img</span>
                          </div>
                        )}
                        <div>
                          <p className="text-white font-medium">{channel.name}</p>
                          <p className="text-gray-400 text-sm truncate max-w-[200px]">
                            {channel.streamUrl || (channel as any).externalChannelId || '-'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="text-gray-300">
                      {typeof channel.category === 'object' ? (channel.category as any).name : (channel.category || '-')}
                    </td>

                    <td>
                      <span
                        className={`px-2 py-1 rounded text-sm ${channel.isActive
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                          }`}
                      >
                        {channel.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleReorder(channel._id, 'up')}
                          className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
                          title="Move Up"
                        >
                          <FiChevronUp className="w-4 h-4 text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleReorder(channel._id, 'down')}
                          className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
                          title="Move Down"
                        >
                          <FiChevronDown className="w-4 h-4 text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleEdit(channel)}
                          className="p-2 hover:bg-dark-300 rounded-lg transition-colors"
                        >
                          <FiEdit2 className="w-4 h-4 text-gray-400" />
                        </button>
                        <button
                          onClick={() => handleDelete(channel._id)}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                        >
                          <FiTrash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <ChannelModal
          channel={editingChannel}
          categories={categories}
          onClose={handleModalClose}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
}
