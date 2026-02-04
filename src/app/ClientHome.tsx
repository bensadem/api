'use client';

export default function ClientHome() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white font-mono">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-500 mb-4">⚠️ ACCESS DENIED</h1>
        <p className="text-xl text-gray-400 mb-2">You are not supposed to be here.</p>
        <p className="text-sm text-gray-600">This is a private API server.</p>
      </div>
    </div>
  );
}
