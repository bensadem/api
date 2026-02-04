'use client';

import { useEffect, useState } from 'react';
import { FiTv, FiFilm, FiUsers, FiTrendingUp, FiActivity, FiEye } from 'react-icons/fi';
import { analyticsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ElementType;
  color: string;
}

function StatCard({ title, value, change, icon: Icon, color }: StatCardProps) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-gray-400 text-sm">{title}</p>
          <p className="text-3xl font-bold text-white mt-2">{value}</p>
          {change && (
            <p className={`text-sm mt-2 ${change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
              {change} from last month
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState({
    channels: 0,
    movies: 0,
    series: 0,
    users: 0,
    todayViews: 0,
    last24HoursViews: 0,
    last7DaysViews: 0,
    last30DaysViews: 0,
    totalViews: 0,
    activeViewers: 0,
    activeUsers: 0,
  });
  const [popularChannels, setPopularChannels] = useState<any[]>([]);
  const [mostViewedChannel, setMostViewedChannel] = useState<any>(null);
  const [viewersByCountry, setViewersByCountry] = useState<any[]>([]);
  const [deviceBreakdown, setDeviceBreakdown] = useState<any[]>([]);
  const [hourlyViews, setHourlyViews] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const response = await analyticsApi.getDashboard();
      const data = response.data.data;
      
      setStats(data.stats);
      setPopularChannels(data.popularChannels || []);
      setMostViewedChannel(data.mostViewedChannel);
      setViewersByCountry(data.viewersByCountry || []);
      setDeviceBreakdown(data.deviceBreakdown || []);
      setHourlyViews(data.hourlyViews || []);
      setRecentActivity(data.recentActivity || []);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const viewsData = {
    labels: hourlyViews.map(h => `${h.hour}:00`),
    datasets: [
      {
        label: 'Views per Hour',
        data: hourlyViews.map(h => h.count),
        borderColor: '#1e88e5',
        backgroundColor: 'rgba(30, 136, 229, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const countryData = {
    labels: viewersByCountry.slice(0, 5).map(c => c.country),
    datasets: [
      {
        data: viewersByCountry.slice(0, 5).map(c => c.count),
        backgroundColor: ['#1e88e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
        borderWidth: 0,
      },
    ],
  };

  const contentData = {
    labels: ['Channels', 'Movies', 'Series'],
    datasets: [
      {
        data: [stats.channels, stats.movies, stats.series],
        backgroundColor: ['#1e88e5', '#10b981', '#f59e0b'],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#9ca3af',
        },
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
        ticks: {
          color: '#9ca3af',
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#9ca3af',
          padding: 20,
        },
      },
    },
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Welcome back! Here's what's happening.</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            <StatCard
              title="Live Viewers"
              value={stats.activeViewers}
              icon={FiActivity}
              color="bg-red-500"
            />
            <StatCard
              title="Active Users"
              value={stats.activeUsers}
              icon={FiUsers}
              color="bg-green-500"
            />
            <StatCard
              title="Total Channels"
              value={stats.channels}
              icon={FiTv}
              color="bg-blue-500"
            />
            <StatCard
              title="Total Movies"
              value={stats.movies}
              icon={FiFilm}
              color="bg-purple-500"
            />
            <StatCard
              title="Total Series"
              value={stats.series}
              icon={FiTrendingUp}
              color="bg-yellow-500"
            />
            <StatCard
              title="Today's Views"
              value={stats.todayViews.toLocaleString()}
              icon={FiEye}
              color="bg-indigo-500"
            />
          </div>

          {/* Most Viewed Channel Card */}
          {mostViewedChannel && (
            <div className="card bg-gradient-to-br from-primary-500 to-primary-700">
              <div className="flex items-center gap-4">
                {mostViewedChannel.logoUrl && (
                  <img
                    src={mostViewedChannel.logoUrl}
                    alt={mostViewedChannel.name}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <p className="text-white/80 text-sm">🏆 Most Viewed Channel (24h)</p>
                  <h3 className="text-2xl font-bold text-white mt-1">{mostViewedChannel.name}</h3>
                  <p className="text-white/90 mt-1">
                    {mostViewedChannel.recentViews} views in last 24 hours • Total: {mostViewedChannel.viewCount}
                  </p>
                </div>
              </div>
            </div>
          )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hourly Views Chart */}
        <div className="card lg:col-span-2">
          <h3 className="text-lg font-semibold text-white mb-4">Today's Hourly Views</h3>
          <div className="h-72">
            {hourlyViews.length > 0 ? (
              <Line data={viewsData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No data available
              </div>
            )}
          </div>
        </div>

        {/* Country Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Viewers by Country</h3>
          <div className="h-72">
            {viewersByCountry.length > 0 ? (
              <Doughnut data={countryData} options={doughnutOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No data available
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Popular Channels */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Top 10 Channels</h3>
          <div className="space-y-3">
            {popularChannels.slice(0, 10).map((channel, index) => (
              <div key={channel._id} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-yellow-500 text-white' :
                  index === 1 ? 'bg-gray-400 text-white' :
                  index === 2 ? 'bg-orange-600 text-white' :
                  'bg-dark-300 text-gray-400'
                }`}>
                  {index + 1}
                </div>
                {channel.logoUrl && (
                  <img src={channel.logoUrl} alt={channel.name} className="w-10 h-10 rounded object-cover" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white truncate">{channel.name}</p>
                  <p className="text-gray-400 text-xs">{channel.category}</p>
                </div>
                <span className="text-primary-400 font-semibold">{channel.viewCount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Device Breakdown */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Device Types</h3>
          <div className="space-y-4">
            {deviceBreakdown.map((device, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white">{device.device}</span>
                  <span className="text-primary-400">{device.count}</span>
                </div>
                <div className="h-2 bg-dark-300 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary-500 rounded-full"
                    style={{ 
                      width: `${(device.count / deviceBreakdown[0]?.count * 100) || 0}%` 
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Content Stats</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-dark-300 rounded-lg">
              <div>
                <p className="text-gray-400 text-sm">Total Content</p>
                <p className="text-2xl font-bold text-white">{stats.channels + stats.movies + stats.series}</p>
              </div>
              <FiTv className="w-8 h-8 text-primary-400" />
            </div>
            <div className="flex items-center justify-between p-4 bg-dark-300 rounded-lg">
              <div>
                <p className="text-gray-400 text-sm">Total Views</p>
                <p className="text-2xl font-bold text-white">{stats.totalViews?.toLocaleString() || 0}</p>
              </div>
              <FiEye className="w-8 h-8 text-green-400" />
            </div>
            <div className="flex items-center justify-between p-4 bg-dark-300 rounded-lg">
              <div>
                <p className="text-gray-400 text-sm">Last 7 Days</p>
                <p className="text-2xl font-bold text-white">{stats.last7DaysViews?.toLocaleString() || 0}</p>
              </div>
              <FiTrendingUp className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {recentActivity.length > 0 ? (
            recentActivity.slice(0, 10).map((activity: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between py-3 border-b border-dark-300 last:border-0"
              >
                <div>
                  <p className="text-white capitalize">{activity.contentType} viewed</p>
                  <p className="text-gray-400 text-sm">
                    {activity.user?.email || 'Anonymous'} • {activity.deviceInfo || 'Unknown device'}
                  </p>
                </div>
                <p className="text-gray-500 text-sm">
                  {new Date(activity.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-400">
              No recent activity
            </div>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
}
