export const dynamic = 'force-dynamic';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
            <h1 className="text-6xl font-bold text-indigo-500">404</h1>
            <p className="mt-4 text-xl text-gray-400">Page Not Found</p>
            <a href="/" className="mt-6 text-indigo-400 hover:text-indigo-300">
                Return Home
            </a>
        </div>
    );
}
