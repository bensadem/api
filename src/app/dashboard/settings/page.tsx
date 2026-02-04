'use client';

import { useState, useEffect } from 'react';
import { FiSave, FiServer, FiShield, FiSmartphone, FiRefreshCw } from 'react-icons/fi';
import { configApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface AppConfig {
  appName: string;
  appVersion: string;
  minAppVersion: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  forceUpdate: boolean;
  updateUrl: string;
  streamTokenSecret: string;
  streamTokenExpiry: number;
  maxDevicesPerUser: number;
  enableRegistration: boolean;
  enableGuestAccess: boolean;
  defaultUserRole: string;
  apiRateLimit: number;
  enableAnalytics: boolean;
}

export default function SettingsPage() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchConfig = async () => {
    try {
      const response = await configApi.get();
      const data = response.data.data || response.data;
      setConfig(data.config || data || null);
    } catch (error) {
      toast.error('Failed to fetch settings');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setIsSaving(true);
    try {
      await configApi.update(config);
      toast.success('Settings saved');
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (key: keyof AppConfig, value: any) => {
    setConfig((prev) => prev ? { ...prev, [key]: value } : null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Failed to load settings</p>
        <button onClick={fetchConfig} className="btn btn-primary mt-4">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 mt-1">Configure application settings</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="btn btn-primary flex items-center gap-2"
        >
          {isSaving ? (
            <FiRefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <FiSave className="w-4 h-4" />
          )}
          Save Changes
        </button>
      </div>

      {/* App Settings */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
            <FiSmartphone className="w-5 h-5 text-primary-400" />
          </div>
          <div>
            <h2 className="font-semibold text-white">App Settings</h2>
            <p className="text-sm text-gray-400">General application configuration</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              App Name
            </label>
            <input
              type="text"
              value={config.appName}
              onChange={(e) => handleChange('appName', e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              App Version
            </label>
            <input
              type="text"
              value={config.appVersion}
              onChange={(e) => handleChange('appVersion', e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Minimum App Version
            </label>
            <input
              type="text"
              value={config.minAppVersion}
              onChange={(e) => handleChange('minAppVersion', e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Update URL
            </label>
            <input
              type="text"
              value={config.updateUrl}
              onChange={(e) => handleChange('updateUrl', e.target.value)}
              className="w-full"
              placeholder="https://play.google.com/store/apps/..."
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-dark-300">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.maintenanceMode}
              onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
              className="w-5 h-5 rounded border-dark-300 bg-dark-300 text-primary-500 focus:ring-primary-500"
            />
            <span className="text-gray-300">Maintenance Mode</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.forceUpdate}
              onChange={(e) => handleChange('forceUpdate', e.target.checked)}
              className="w-5 h-5 rounded border-dark-300 bg-dark-300 text-primary-500 focus:ring-primary-500"
            />
            <span className="text-gray-300">Force Update</span>
          </label>
        </div>

        {config.maintenanceMode && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Maintenance Message
            </label>
            <textarea
              value={config.maintenanceMessage}
              onChange={(e) => handleChange('maintenanceMessage', e.target.value)}
              className="w-full h-24 resize-none"
              placeholder="We are currently undergoing maintenance..."
            />
          </div>
        )}
      </div>

      {/* Security Settings */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
            <FiShield className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Security Settings</h2>
            <p className="text-sm text-gray-400">Authentication and stream protection</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Stream Token Secret
            </label>
            <input
              type="password"
              value={config.streamTokenSecret}
              onChange={(e) => handleChange('streamTokenSecret', e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Stream Token Expiry (hours)
            </label>
            <input
              type="number"
              value={config.streamTokenExpiry}
              onChange={(e) => handleChange('streamTokenExpiry', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Max Devices Per User
            </label>
            <input
              type="number"
              value={config.maxDevicesPerUser}
              onChange={(e) => handleChange('maxDevicesPerUser', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              API Rate Limit (req/min)
            </label>
            <input
              type="number"
              value={config.apiRateLimit}
              onChange={(e) => handleChange('apiRateLimit', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-6 mt-6 pt-6 border-t border-dark-300">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.enableRegistration}
              onChange={(e) => handleChange('enableRegistration', e.target.checked)}
              className="w-5 h-5 rounded border-dark-300 bg-dark-300 text-primary-500 focus:ring-primary-500"
            />
            <span className="text-gray-300">Enable Registration</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.enableGuestAccess}
              onChange={(e) => handleChange('enableGuestAccess', e.target.checked)}
              className="w-5 h-5 rounded border-dark-300 bg-dark-300 text-primary-500 focus:ring-primary-500"
            />
            <span className="text-gray-300">Enable Guest Access</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.enableAnalytics}
              onChange={(e) => handleChange('enableAnalytics', e.target.checked)}
              className="w-5 h-5 rounded border-dark-300 bg-dark-300 text-primary-500 focus:ring-primary-500"
            />
            <span className="text-gray-300">Enable Analytics</span>
          </label>
        </div>
      </div>

      {/* Server Info */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
            <FiServer className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Server Information</h2>
            <p className="text-sm text-gray-400">System status and information</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-dark-300 rounded-lg p-4">
            <p className="text-sm text-gray-400">Environment</p>
            <p className="text-lg font-semibold text-white">Production</p>
          </div>
          <div className="bg-dark-300 rounded-lg p-4">
            <p className="text-sm text-gray-400">Node Version</p>
            <p className="text-lg font-semibold text-white">v20.x</p>
          </div>
          <div className="bg-dark-300 rounded-lg p-4">
            <p className="text-sm text-gray-400">Database</p>
            <p className="text-lg font-semibold text-green-400">Connected</p>
          </div>
          <div className="bg-dark-300 rounded-lg p-4">
            <p className="text-sm text-gray-400">Uptime</p>
            <p className="text-lg font-semibold text-white">99.9%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
