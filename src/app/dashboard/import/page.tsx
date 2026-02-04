'use client';

import { useState } from 'react';
import { FiUpload, FiFile, FiCheck, FiAlertCircle, FiDownload } from 'react-icons/fi';
import { channelsApi } from '@/lib/api';
import toast from 'react-hot-toast';

interface ParsedChannel {
  name: string;
  streamUrl: string;
  logo?: string;
  group?: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [m3uContent, setM3uContent] = useState('');
  const [parsedChannels, setParsedChannels] = useState<ParsedChannel[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importMethod, setImportMethod] = useState<'file' | 'url' | 'paste'>('file');
  const [playlistUrl, setPlaylistUrl] = useState('');

  const parseM3U = (content: string): ParsedChannel[] => {
    const lines = content.split('\n');
    const channels: ParsedChannel[] = [];
    let currentChannel: Partial<ParsedChannel> = {};

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('#EXTINF:')) {
        // Parse EXTINF line
        const nameMatch = line.match(/,(.+)$/);
        const logoMatch = line.match(/tvg-logo="([^"]+)"/);
        const groupMatch = line.match(/group-title="([^"]+)"/);

        currentChannel = {
          name: nameMatch ? nameMatch[1].trim() : 'Unknown',
          logo: logoMatch ? logoMatch[1] : undefined,
          group: groupMatch ? groupMatch[1] : undefined,
        };
      } else if (line && !line.startsWith('#') && currentChannel.name) {
        // This is the stream URL
        currentChannel.streamUrl = line;
        channels.push(currentChannel as ParsedChannel);
        currentChannel = {};
      }
    }

    return channels;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setM3uContent(content);
        const channels = parseM3U(content);
        setParsedChannels(channels);
        setImportResult(null);
      };
      reader.readAsText(selectedFile);
    }
  };

  const handlePasteContent = () => {
    const channels = parseM3U(m3uContent);
    setParsedChannels(channels);
    setImportResult(null);
  };

  const handleFetchUrl = async () => {
    if (!playlistUrl) return;
    try {
      toast.loading('Fetching playlist...');
      // In production, this would go through your backend to avoid CORS
      const response = await fetch(playlistUrl);
      const content = await response.text();
      setM3uContent(content);
      const channels = parseM3U(content);
      setParsedChannels(channels);
      setImportResult(null);
      toast.dismiss();
      toast.success(`Parsed ${channels.length} channels`);
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to fetch playlist. Try pasting the content directly.');
    }
  };

  const handleImport = async () => {
    if (parsedChannels.length === 0) return;

    setIsImporting(true);
    const result: ImportResult = { success: 0, failed: 0, errors: [] };

    for (const channel of parsedChannels) {
      try {
        await channelsApi.create({
          name: channel.name,
          streamUrl: channel.streamUrl,
          logo: channel.logo,
          // You could map group to category here
          isActive: true,
          isFeatured: false,
        });
        result.success++;
      } catch (error: any) {
        result.failed++;
        result.errors.push(`${channel.name}: ${error.response?.data?.message || 'Unknown error'}`);
      }
    }

    setImportResult(result);
    setIsImporting(false);

    if (result.success > 0) {
      toast.success(`Successfully imported ${result.success} channels`);
    }
    if (result.failed > 0) {
      toast.error(`Failed to import ${result.failed} channels`);
    }
  };

  const downloadSample = () => {
    const sample = `#EXTM3U
#EXTINF:-1 tvg-logo="https://example.com/logo1.png" group-title="News",Channel 1
http://example.com/stream1.m3u8
#EXTINF:-1 tvg-logo="https://example.com/logo2.png" group-title="Sports",Channel 2
http://example.com/stream2.m3u8
#EXTINF:-1 tvg-logo="https://example.com/logo3.png" group-title="Entertainment",Channel 3
http://example.com/stream3.m3u8`;

    const blob = new Blob([sample], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_playlist.m3u';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Import Channels</h1>
          <p className="text-gray-400 mt-1">Bulk import channels from M3U playlist</p>
        </div>
        <button onClick={downloadSample} className="btn btn-secondary flex items-center gap-2">
          <FiDownload className="w-4 h-4" />
          Sample M3U
        </button>
      </div>

      {/* Import Method */}
      <div className="card">
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setImportMethod('file')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              importMethod === 'file' ? 'bg-primary-500 text-white' : 'bg-dark-300 text-gray-400 hover:text-white'
            }`}
          >
            Upload File
          </button>
          <button
            onClick={() => setImportMethod('url')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              importMethod === 'url' ? 'bg-primary-500 text-white' : 'bg-dark-300 text-gray-400 hover:text-white'
            }`}
          >
            From URL
          </button>
          <button
            onClick={() => setImportMethod('paste')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              importMethod === 'paste' ? 'bg-primary-500 text-white' : 'bg-dark-300 text-gray-400 hover:text-white'
            }`}
          >
            Paste Content
          </button>
        </div>

        {/* File Upload */}
        {importMethod === 'file' && (
          <div className="border-2 border-dashed border-dark-300 rounded-xl p-8 text-center">
            <input
              type="file"
              accept=".m3u,.m3u8,.txt"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <FiUpload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-white font-medium mb-2">
                {file ? file.name : 'Click to upload M3U file'}
              </p>
              <p className="text-sm text-gray-400">
                Supports .m3u, .m3u8, .txt files
              </p>
            </label>
          </div>
        )}

        {/* URL Input */}
        {importMethod === 'url' && (
          <div className="flex gap-4">
            <input
              type="url"
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              className="flex-1"
              placeholder="https://example.com/playlist.m3u"
            />
            <button onClick={handleFetchUrl} className="btn btn-primary">
              Fetch
            </button>
          </div>
        )}

        {/* Paste Content */}
        {importMethod === 'paste' && (
          <div className="space-y-4">
            <textarea
              value={m3uContent}
              onChange={(e) => setM3uContent(e.target.value)}
              className="w-full h-64 font-mono text-sm resize-none"
              placeholder="#EXTM3U&#10;#EXTINF:-1 tvg-logo=&quot;...&quot; group-title=&quot;...&quot;,Channel Name&#10;http://stream-url.m3u8"
            />
            <button onClick={handlePasteContent} className="btn btn-primary">
              Parse Content
            </button>
          </div>
        )}
      </div>

      {/* Parsed Channels Preview */}
      {parsedChannels.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">
              Parsed Channels ({parsedChannels.length})
            </h2>
            <button
              onClick={handleImport}
              disabled={isImporting}
              className="btn btn-primary flex items-center gap-2"
            >
              {isImporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <FiUpload className="w-4 h-4" />
                  Import All
                </>
              )}
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto scrollbar-thin">
            <table className="w-full">
              <thead className="sticky top-0 bg-dark-200">
                <tr className="border-b border-dark-300">
                  <th className="text-left p-3 text-sm font-medium text-gray-400">#</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-400">Name</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-400">Group</th>
                  <th className="text-left p-3 text-sm font-medium text-gray-400">Stream URL</th>
                </tr>
              </thead>
              <tbody>
                {parsedChannels.slice(0, 100).map((channel, index) => (
                  <tr key={index} className="border-b border-dark-300/50">
                    <td className="p-3 text-gray-400">{index + 1}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        {channel.logo && (
                          <img src={channel.logo} alt="" className="w-6 h-6 rounded object-cover" />
                        )}
                        <span className="text-white">{channel.name}</span>
                      </div>
                    </td>
                    <td className="p-3 text-gray-400">{channel.group || '-'}</td>
                    <td className="p-3 text-gray-400 truncate max-w-xs" title={channel.streamUrl}>
                      {channel.streamUrl}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedChannels.length > 100 && (
              <p className="text-center py-4 text-gray-400">
                Showing first 100 of {parsedChannels.length} channels
              </p>
            )}
          </div>
        </div>
      )}

      {/* Import Result */}
      {importResult && (
        <div className="card">
          <h2 className="font-semibold text-white mb-4">Import Result</h2>
          <div className="flex gap-4 mb-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 rounded-lg">
              <FiCheck className="w-5 h-5 text-green-400" />
              <span className="text-green-400">{importResult.success} Success</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 rounded-lg">
              <FiAlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400">{importResult.failed} Failed</span>
            </div>
          </div>

          {importResult.errors.length > 0 && (
            <div className="bg-dark-300 rounded-lg p-4 max-h-48 overflow-y-auto">
              <p className="text-sm font-medium text-gray-300 mb-2">Errors:</p>
              {importResult.errors.slice(0, 20).map((error, index) => (
                <p key={index} className="text-sm text-red-400">
                  • {error}
                </p>
              ))}
              {importResult.errors.length > 20 && (
                <p className="text-sm text-gray-400 mt-2">
                  ...and {importResult.errors.length - 20} more errors
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
