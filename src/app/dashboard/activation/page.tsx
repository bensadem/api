'use client';

import { useState, useEffect } from 'react';
import { activationCodesApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { FiCopy, FiPlus, FiTrash2, FiCheck, FiX } from 'react-icons/fi';

interface ActivationCode {
  _id: string;
  code: string;
  isActive: boolean;
  maxDevices: number;
  activatedDevices: Array<{
    deviceId: string;
    deviceName: string;
    activatedAt: string;
  }>;
  expiresAt: string | null;
  notes: string;
  createdAt: string;
}

interface Stats {
  totalCodes: number;
  activeCodes: number;
  totalActivations: number;
}

export default function ActivationPage() {
  const [codes, setCodes] = useState<ActivationCode[]>([]);
  const [stats, setStats] = useState<Stats>({ totalCodes: 0, activeCodes: 0, totalActivations: 0 });
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [useCustomCode, setUseCustomCode] = useState(false);
  const [formData, setFormData] = useState({
    customCode: '',
    maxDevices: 1,
    expiresAt: '',
    notes: '',
  });

  useEffect(() => {
    fetchCodes();
  }, []);

  const fetchCodes = async () => {
    try {
      const response = await activationCodesApi.getAll();
      setCodes(response.data.data.codes);
      setStats(response.data.data.stats);
    } catch (error: any) {
      console.error('Failed to fetch codes:', error);
      toast.error('Failed to load activation codes');
    } finally {
      setLoading(false);
    }
  };

  const createCode = async () => {
    try {
      setCreating(true);

      const payload: any = {
        maxDevices: formData.maxDevices,
        notes: formData.notes,
      };

      if (formData.expiresAt) {
        payload.expiresAt = new Date(formData.expiresAt).toISOString();
      }

      await activationCodesApi.create(payload);

      toast.success('Activation code created successfully!');
      setShowCreateModal(false);
      setFormData({ customCode: '', maxDevices: 1, expiresAt: '', notes: '' });
      fetchCodes();
    } catch (error: any) {
      console.error('Failed to create code:', error);
      toast.error(error.response?.data?.message || 'Failed to create activation code');
    } finally {
      setCreating(false);
    }
  };

  const toggleCodeStatus = async (id: string, isActive: boolean) => {
    try {
      await activationCodesApi.update(id, { isActive: !isActive });
      toast.success(`Code ${!isActive ? 'activated' : 'deactivated'} successfully`);
      fetchCodes();
    } catch (error) {
      console.error('Failed to update code:', error);
      toast.error('Failed to update code status');
    }
  };

  const deleteCode = async (id: string) => {
    if (!confirm('Are you sure you want to delete this activation code?')) return;

    try {
      await activationCodesApi.delete(id);
      toast.success('Code deleted successfully');
      fetchCodes();
    } catch (error) {
      console.error('Failed to delete code:', error);
      toast.error('Failed to delete code');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Code copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Activation Codes</h1>
          <p className="text-gray-400 mt-1">Manage device activation codes</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <FiPlus />
          Generate New Code
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="text-gray-400 text-sm font-medium">Total Codes</div>
          <div className="text-3xl font-bold text-white mt-2">{stats.totalCodes}</div>
        </div>
        <div className="card">
          <div className="text-gray-400 text-sm font-medium">Active Codes</div>
          <div className="text-3xl font-bold text-green-500 mt-2">{stats.activeCodes}</div>
        </div>
        <div className="card">
          <div className="text-gray-400 text-sm font-medium">Total Activations</div>
          <div className="text-3xl font-bold text-primary-500 mt-2">{stats.totalActivations}</div>
        </div>
      </div>

      {/* Codes Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-200">
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Devices</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Expires</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Notes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-200">
              {codes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    No activation codes yet. Create one to get started!
                  </td>
                </tr>
              ) : (
                codes.map((code) => (
                  <tr key={code._id} className="hover:bg-dark-200/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-lg font-bold text-white">{code.code}</span>
                        <button
                          onClick={() => copyToClipboard(code.code)}
                          className="text-gray-400 hover:text-primary-500 transition-colors"
                          title="Copy code"
                        >
                          <FiCopy />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${code.isActive
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-red-500/10 text-red-500'
                        }`}>
                        {code.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {code.activatedDevices.length} / {code.maxDevices}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {code.expiresAt
                        ? new Date(code.expiresAt).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400 max-w-xs truncate">
                      {code.notes || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleCodeStatus(code._id, code.isActive)}
                          className={`${code.isActive
                            ? 'text-red-500 hover:text-red-400'
                            : 'text-green-500 hover:text-green-400'
                            } transition-colors`}
                          title={code.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {code.isActive ? <FiX /> : <FiCheck />}
                        </button>
                        <button
                          onClick={() => deleteCode(code._id)}
                          className="text-red-500 hover:text-red-400 transition-colors"
                          title="Delete"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-6">Create Activation Code</h2>

            <div className="space-y-4">
              {/* Custom Code Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="useCustomCode"
                  checked={useCustomCode}
                  onChange={(e) => setUseCustomCode(e.target.checked)}
                  className="w-4 h-4 text-primary-500 bg-dark-200 border-dark-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="useCustomCode" className="text-sm font-medium text-gray-300">
                  Use Custom Code
                </label>
              </div>

              {/* Custom Code Input */}
              {useCustomCode && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Your Custom Code
                  </label>
                  <input
                    type="text"
                    value={formData.customCode}
                    onChange={(e) => setFormData({ ...formData, customCode: e.target.value.toUpperCase() })}
                    className="w-full font-mono text-lg uppercase tracking-wider"
                    placeholder="e.g., BATH2024, PROMO123, VIPUSER..."
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Enter any code you want (letters and numbers, any length)
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Devices
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxDevices}
                  onChange={(e) => setFormData({ ...formData, maxDevices: parseInt(e.target.value) || 1 })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Expires At (Optional)
                </label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full"
                  rows={3}
                  placeholder="e.g., Customer name, subscription type..."
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={createCode}
                disabled={creating || (useCustomCode && !formData.customCode.trim())}
                className="flex-1 btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating...' : useCustomCode ? 'Create Custom Code' : 'Generate Random Code'}
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ customCode: '', maxDevices: 1, expiresAt: '', notes: '' });
                  setUseCustomCode(false);
                }}
                disabled={creating}
                className="flex-1 btn btn-secondary disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
