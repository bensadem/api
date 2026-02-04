'use client';

import { useEffect, useState } from 'react';
import { notificationsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { FiPlus, FiBell, FiTrash2, FiEdit, FiEye, FiEyeOff, FiAlertCircle, FiInfo, FiCheckCircle, FiAlertTriangle, FiGift } from 'react-icons/fi';

interface Notification {
    _id: string;
    title: string;
    body: string;
    type: 'info' | 'warning' | 'success' | 'error' | 'promo';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    imageUrl?: string;
    actionUrl?: string;
    actionText?: string;
    targetAudience: 'all' | 'active' | 'inactive' | 'premium';
    isActive: boolean;
    expiresAt?: string;
    createdAt: string;
}

const typeIcons = {
    info: FiInfo,
    warning: FiAlertTriangle,
    success: FiCheckCircle,
    error: FiAlertCircle,
    promo: FiGift,
};

const typeColors = {
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    success: 'bg-green-500/20 text-green-400 border-green-500/30',
    error: 'bg-red-500/20 text-red-400 border-red-500/30',
    promo: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const priorityColors = {
    low: 'bg-gray-500/20 text-gray-400',
    normal: 'bg-blue-500/20 text-blue-400',
    high: 'bg-orange-500/20 text-orange-400',
    urgent: 'bg-red-500/20 text-red-400',
};

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingNotification, setEditingNotification] = useState<Notification | null>(null);
    const [formData, setFormData] = useState<{
        title: string;
        body: string;
        type: 'info' | 'warning' | 'success' | 'error' | 'promo';
        priority: 'low' | 'normal' | 'high' | 'urgent';
        imageUrl: string;
        actionUrl: string;
        actionText: string;
        targetAudience: 'all' | 'active' | 'inactive' | 'premium';
        isActive: boolean;
        expiresAt: string;
    }>({
        title: '',
        body: '',
        type: 'info',
        priority: 'normal',
        imageUrl: '',
        actionUrl: '',
        actionText: '',
        targetAudience: 'all',
        isActive: true,
        expiresAt: '',
    });

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await notificationsApi.getAll();
            setNotifications(response.data.data || []);
        } catch (error: any) {
            toast.error('Failed to fetch notifications');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingNotification) {
                await notificationsApi.update(editingNotification._id, formData);
                toast.success('Notification updated!');
            } else {
                await notificationsApi.create(formData);
                toast.success('Notification created!');
            }
            setShowModal(false);
            resetForm();
            fetchNotifications();
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Failed to save notification');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this notification?')) return;
        try {
            await notificationsApi.delete(id);
            toast.success('Notification deleted!');
            fetchNotifications();
        } catch (error: any) {
            toast.error('Failed to delete notification');
        }
    };

    const handleToggleActive = async (notification: Notification) => {
        try {
            await notificationsApi.update(notification._id, { isActive: !notification.isActive });
            toast.success(`Notification ${notification.isActive ? 'deactivated' : 'activated'}!`);
            fetchNotifications();
        } catch (error: any) {
            toast.error('Failed to update notification');
        }
    };

    const handleEdit = (notification: Notification) => {
        setEditingNotification(notification);
        setFormData({
            title: notification.title,
            body: notification.body,
            type: notification.type,
            priority: notification.priority,
            imageUrl: notification.imageUrl || '',
            actionUrl: notification.actionUrl || '',
            actionText: notification.actionText || '',
            targetAudience: notification.targetAudience,
            isActive: notification.isActive,
            expiresAt: notification.expiresAt ? notification.expiresAt.split('T')[0] : '',
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setEditingNotification(null);
        setFormData({
            title: '',
            body: '',
            type: 'info',
            priority: 'normal',
            imageUrl: '',
            actionUrl: '',
            actionText: '',
            targetAudience: 'all',
            isActive: true,
            expiresAt: '',
        });
    };

    const openNewModal = () => {
        resetForm();
        setShowModal(true);
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                        <FiBell className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Notifications</h1>
                        <p className="text-gray-400 text-sm">Send messages to your app users</p>
                    </div>
                </div>
                <button
                    onClick={openNewModal}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all shadow-lg"
                >
                    <FiPlus className="w-5 h-5" />
                    New Notification
                </button>
            </div>

            {/* Notifications List */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                </div>
            ) : notifications.length === 0 ? (
                <div className="text-center py-20">
                    <FiBell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-white mb-2">No Notifications</h3>
                    <p className="text-gray-400 mb-6">Create your first notification to reach your users</p>
                    <button
                        onClick={openNewModal}
                        className="px-6 py-3 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors"
                    >
                        Create Notification
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {notifications.map((notification) => {
                        const TypeIcon = typeIcons[notification.type];
                        return (
                            <div
                                key={notification._id}
                                className={`bg-gray-800/50 backdrop-blur-sm border rounded-xl p-5 ${notification.isActive ? 'border-gray-700' : 'border-gray-700/50 opacity-60'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className={`p-3 rounded-xl border ${typeColors[notification.type]}`}>
                                            <TypeIcon className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-white truncate">
                                                    {notification.title}
                                                </h3>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[notification.priority]}`}>
                                                    {notification.priority}
                                                </span>
                                                {!notification.isActive && (
                                                    <span className="px-2 py-0.5 bg-gray-600/50 text-gray-400 rounded-full text-xs">
                                                        Inactive
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-gray-400 text-sm mb-3 line-clamp-2">{notification.body}</p>
                                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                                <span>Target: {notification.targetAudience}</span>
                                                <span>•</span>
                                                <span>Created: {new Date(notification.createdAt).toLocaleDateString()}</span>
                                                {notification.expiresAt && (
                                                    <>
                                                        <span>•</span>
                                                        <span>Expires: {new Date(notification.expiresAt).toLocaleDateString()}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleToggleActive(notification)}
                                            className={`p-2 rounded-lg transition-colors ${notification.isActive
                                                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                                : 'bg-gray-600/50 text-gray-400 hover:bg-gray-600'
                                                }`}
                                            title={notification.isActive ? 'Deactivate' : 'Activate'}
                                        >
                                            {notification.isActive ? <FiEye className="w-5 h-5" /> : <FiEyeOff className="w-5 h-5" />}
                                        </button>
                                        <button
                                            onClick={() => handleEdit(notification)}
                                            className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                                            title="Edit"
                                        >
                                            <FiEdit className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(notification._id)}
                                            className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                                            title="Delete"
                                        >
                                            <FiTrash2 className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-700">
                            <h2 className="text-xl font-bold text-white">
                                {editingNotification ? 'Edit Notification' : 'Create Notification'}
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="Notification title"
                                    required
                                    maxLength={100}
                                />
                            </div>

                            {/* Body */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Message *</label>
                                <textarea
                                    value={formData.body}
                                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                                    placeholder="Notification message"
                                    rows={3}
                                    required
                                    maxLength={500}
                                />
                            </div>

                            {/* Type & Priority */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="info">ℹ️ Info</option>
                                        <option value="success">✅ Success</option>
                                        <option value="warning">⚠️ Warning</option>
                                        <option value="error">❌ Error</option>
                                        <option value="promo">🎁 Promo</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
                                    <select
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="low">Low</option>
                                        <option value="normal">Normal</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>

                            {/* Target Audience & Expires */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Target Audience</label>
                                    <select
                                        value={formData.targetAudience}
                                        onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as any })}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="all">All Users</option>
                                        <option value="active">Active Users</option>
                                        <option value="inactive">Inactive Users</option>
                                        <option value="premium">Premium Users</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Expires At (optional)</label>
                                    <input
                                        type="date"
                                        value={formData.expiresAt}
                                        onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>
                            </div>

                            {/* Image URL */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Image URL (optional)</label>
                                <input
                                    type="url"
                                    value={formData.imageUrl}
                                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500"
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>

                            {/* Action URL & Text */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Action URL (optional)</label>
                                    <input
                                        type="url"
                                        value={formData.actionUrl}
                                        onChange={(e) => setFormData({ ...formData, actionUrl: e.target.value })}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500"
                                        placeholder="https://example.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Action Button Text</label>
                                    <input
                                        type="text"
                                        value={formData.actionText}
                                        onChange={(e) => setFormData({ ...formData, actionText: e.target.value })}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Learn More"
                                        maxLength={30}
                                    />
                                </div>
                            </div>

                            {/* Active Toggle */}
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-5 h-5 rounded bg-gray-700 border-gray-600 text-indigo-500 focus:ring-indigo-500"
                                />
                                <label htmlFor="isActive" className="text-gray-300">Active (visible to users)</label>
                            </div>

                            {/* Buttons */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 py-2.5 bg-gray-700 text-gray-300 rounded-xl hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all"
                                >
                                    {editingNotification ? 'Update' : 'Create'} Notification
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
