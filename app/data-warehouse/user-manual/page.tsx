"use client"
import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiEye, FiImage, FiVideo } from 'react-icons/fi';
import { getUserManualArticles, createUserManualArticle, updateUserManualArticle, deleteUserManualArticle, UserManualArticle } from '../../services/dataWarehouseApi';

const isAdmin = true; // TODO: Replace with real role check

export default function UserManualPage() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [articles, setArticles] = useState<UserManualArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState<UserManualArticle | null>(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUserManualArticles();
      setArticles(data);
    } catch (err) {
      setError('Failed to load user manual articles');
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this article?')) {
      try {
        await deleteUserManualArticle(id);
        await fetchArticles(); // Refresh the list
      } catch (err) {
        console.error('Error deleting article:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user manual articles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 bg-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchArticles}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 bg-white min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Data Warehouse User Manual</h1>
      {isAdmin && (
        <button 
          className="mb-4 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => setShowCreateModal(true)}
        >
          <FiPlus /> Add Article
        </button>
      )}
      
      {articles.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No articles found. {isAdmin && 'Create your first article to get started.'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <div key={article.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-center cursor-pointer" onClick={() => setExpanded(expanded === article.id ? null : article.id)}>
                <span className="font-semibold text-lg">{article.question}</span>
                <span>{expanded === article.id ? '-' : '+'}</span>
              </div>
              {expanded === article.id && (
                <div className="mt-2">
                  <div className="mb-2 text-gray-700">{article.answer}</div>
                  <div className="flex gap-2 mb-2">
                    {article.images.map((img, idx) => (
                      <img key={idx} src={img} alt="manual-img" className="w-16 h-16 object-cover rounded" />
                    ))}
                    {article.videos.map((vid, idx) => (
                      <video key={idx} src={vid} controls className="w-24 h-16 rounded" />
                    ))}
                  </div>
                  {isAdmin && (
                    <div className="flex gap-2 mt-2">
                      <button 
                        className="flex items-center gap-1 text-blue-600 hover:underline"
                        onClick={() => setEditingArticle(article)}
                      >
                        <FiEdit /> Edit
                      </button>
                      <button 
                        className="flex items-center gap-1 text-red-600 hover:underline"
                        onClick={() => handleDelete(article.id)}
                      >
                        <FiTrash2 /> Delete
                      </button>
                      <button className="flex items-center gap-1 text-green-600 hover:underline">
                        <FiImage /> Attach Image
                      </button>
                      <button className="flex items-center gap-1 text-purple-600 hover:underline">
                        <FiVideo /> Attach Video
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal would go here */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Create New Article</h3>
            {/* Form fields would go here */}
            <div className="flex justify-end gap-2 mt-4">
              <button 
                className="px-4 py-2 rounded bg-gray-200 text-gray-700"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button className="px-4 py-2 rounded bg-blue-600 text-white">
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 