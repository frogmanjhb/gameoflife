import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2, Pin } from 'lucide-react';
import { usePlugins } from '../../contexts/PluginContext';
import { noticeBoardApi } from '../../services/api';
import { NoticeBoardPublicView } from '../../types';

const NoticeBoardPlugin: React.FC = () => {
  const { plugins, loading: pluginsLoading } = usePlugins();
  const noticeBoardPlugin = plugins.find((p) => p.route_path === '/notice-board');
  const [data, setData] = useState<NoticeBoardPublicView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!noticeBoardPlugin?.enabled) return;
    const fetchPosters = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await noticeBoardApi.getPosters();
        setData(res.data);
      } catch (err: unknown) {
        setError(
          (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
            'Failed to load notice board'
        );
      } finally {
        setLoading(false);
      }
    };
    fetchPosters();
  }, [noticeBoardPlugin?.enabled]);

  if (pluginsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!noticeBoardPlugin || !noticeBoardPlugin.enabled) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-rose-600 to-orange-600 rounded-2xl p-6 text-white">
        <div className="flex items-center space-x-3">
          <div className="text-4xl">📌</div>
          <div>
            <h1 className="text-2xl font-bold">Notice Board</h1>
            <p className="text-rose-100">
              {data?.designer_name
                ? `Posters and advertising by ${data.designer_name}`
                : 'Posters and advertising from your town'}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="h-10 w-10 animate-spin text-rose-600" />
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8 text-center text-red-700">
          {error}
        </div>
      ) : !data?.posters.length ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <Pin className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No posters yet</h2>
          <p className="text-gray-600">Your town graphic designer has not uploaded any posters yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.posters.map((poster) => (
            <div
              key={poster.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
            >
              <img
                src={poster.image_data}
                alt={poster.title || 'Town poster'}
                className="w-full aspect-[3/4] object-cover bg-gray-100"
              />
              {poster.title && (
                <div className="p-4 border-t border-gray-100">
                  <h3 className="font-semibold text-gray-900">{poster.title}</h3>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NoticeBoardPlugin;
