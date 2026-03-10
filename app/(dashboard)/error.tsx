'use client';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="p-8">
      <h2 className="text-xl font-bold text-red-600 mb-2">Erro no Dashboard</h2>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <pre className="bg-gray-100 p-4 rounded text-sm mb-4 overflow-auto">
        {error.digest && `Digest: ${error.digest}`}
      </pre>
      <button
        onClick={reset}
        className="px-4 py-2 bg-[#1e3a5f] text-white rounded hover:bg-[#2a4f7f]"
      >
        Tentar novamente
      </button>
    </div>
  );
}
