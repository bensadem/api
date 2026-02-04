'use client';

import { useForm } from 'react-hook-form';
import { FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { usersApi } from '@/lib/api';
import { useState } from 'react';

interface User {
  _id?: string;
  name: string;
  email: string;
  password?: string;
  role: 'user' | 'admin' | 'superadmin';
  isActive: boolean;
  subscription?: {
    plan: string;
    expiresAt: string;
  };
}

interface Props {
  user: User | null;
  onClose: () => void;
  onSave: () => void;
}

export default function UserModal({ user, onClose, onSave }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!user?._id;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<User & { subscriptionPlan: string; subscriptionExpiry: string }>({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      password: '',
      role: user?.role || 'user',
      isActive: user?.isActive ?? true,
      subscriptionPlan: user?.subscription?.plan || '',
      subscriptionExpiry: user?.subscription?.expiresAt ? user.subscription.expiresAt.split('T')[0] : '',
    },
  });

  const onSubmit = async (data: User & { subscriptionPlan: string; subscriptionExpiry: string }) => {
    setIsLoading(true);
    try {
      const payload: any = {
        name: data.name,
        email: data.email,
        role: data.role,
        isActive: data.isActive,
      };

      if (data.password) {
        payload.password = data.password;
      }

      if (data.subscriptionPlan && data.subscriptionExpiry) {
        payload.subscription = {
          plan: data.subscriptionPlan,
          expiresAt: new Date(data.subscriptionExpiry).toISOString(),
        };
      }

      if (isEditing) {
        await usersApi.update(user!._id!, payload);
        toast.success('User updated');
      } else {
        if (!data.password) {
          toast.error('Password is required');
          setIsLoading(false);
          return;
        }
        await usersApi.create(payload);
        toast.success('User created');
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
      <div className="bg-dark-200 rounded-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-dark-300">
          <h2 className="text-xl font-semibold text-white">
            {isEditing ? 'Edit User' : 'Add User'}
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
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Name *
            </label>
            <input
              {...register('name', { required: 'Name is required' })}
              className="w-full"
              placeholder="User name"
            />
            {errors.name && (
              <p className="text-red-400 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email *
            </label>
            <input
              type="email"
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: 'Invalid email address'
                }
              })}
              className="w-full"
              placeholder="user@example.com"
            />
            {errors.email && (
              <p className="text-red-400 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password {!isEditing && '*'}
            </label>
            <input
              type="password"
              {...register('password', { 
                required: !isEditing ? 'Password is required' : false,
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                }
              })}
              className="w-full"
              placeholder={isEditing ? 'Leave blank to keep current' : 'Password'}
            />
            {errors.password && (
              <p className="text-red-400 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Role
            </label>
            <select {...register('role')} className="w-full">
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="superadmin">Super Admin</option>
            </select>
          </div>

          {/* Subscription */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Subscription Plan
              </label>
              <select {...register('subscriptionPlan')} className="w-full">
                <option value="">No Plan</option>
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
                <option value="vip">VIP</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Expiry Date
              </label>
              <input
                type="date"
                {...register('subscriptionExpiry')}
                className="w-full"
              />
            </div>
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
