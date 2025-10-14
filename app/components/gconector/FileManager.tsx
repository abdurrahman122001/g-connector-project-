// src/app/components/gconector/FileManager.tsx
// (Adjust path as per your project structure)

import React, { useState, useEffect, useCallback, ChangeEvent, FormEvent } from 'react';
import { toast } from 'react-toastify'; // Assuming you want toast notifications here too

// --- Interfaces ---
interface FileItem {
  name: string;
  isDirectory: boolean;
  size?: number;
  lastModified?: string;
}

// --- Props for FileManager ---
interface FileManagerProps {
  onFileSelectForMapping: (filePath: string, fileName: string) => void;
}

// --- Configuration ---
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL + '/api/filemanager';

// --- Helper Functions ---
const formatBytes = (bytes: number = 0, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const normalizePath = (path: string): string => {
  let newPath = path.replace(/\/\//g, '/');
  if (newPath !== '/' && newPath.endsWith('/')) {
    newPath = newPath.slice(0, -1);
  }
  if (!newPath.startsWith('/')) {
    newPath = '/' + newPath;
  }
  return newPath;
};

// --- Component ---
const FileManager: React.FC<FileManagerProps> = ({ onFileSelectForMapping }) => {
  const DEFAULT_PATH = '/uploads/file-uploads';
  const [currentPath, setCurrentPath] = useState<string>(DEFAULT_PATH);
  const [items, setItems] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async (path: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}?path=${encodeURIComponent(path)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch items: ${response.statusText}`);
      }
      const data: FileItem[] = await response.json();
      data.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      });
      setItems(data);
    } catch (err) {
      console.error("Fetch error:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      toast.error(`Error fetching files: ${errorMessage}`);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems(currentPath);
  }, [currentPath, fetchItems]);

  const handleNavigate = (itemName: string, isDirectory: boolean) => {
    if (isDirectory) {
      const newPath = normalizePath(`${currentPath}/${itemName}`);
      setCurrentPath(newPath);
    }
  };

  const handleGoUp = () => {
    if (currentPath === '/') return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    const newPath = parts.length > 0 ? `/${parts.join('/')}` : '/';
    setCurrentPath(normalizePath(newPath));
  };

  const handleDownload = (itemName: string) => {
    const filePath = normalizePath(`${currentPath}/${itemName}`);
    const downloadUrl = `${API_BASE_URL}/download?path=${encodeURIComponent(filePath)}`;
    const anchor = document.createElement('a');
    anchor.href = downloadUrl;
    anchor.download = itemName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    toast.info(`Downloading ${itemName}...`);
  };

  const triggerFileSelectForMapping = (item: FileItem) => {
    if (!item.isDirectory) {
      const filePath = normalizePath(`${currentPath}/${item.name}`);
      onFileSelectForMapping(filePath, item.name);
      // The parent (FileUploadPage) will handle closing the modal.
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.navBar}>
        {DEFAULT_PATH !== currentPath && (
          <button onClick={handleGoUp} style={styles.navButton}>⬅ Back</button>
        )}

        <span style={styles.currentPathDisplay}>Current Path: {currentPath}</span>
      </div>

      {error && <div style={styles.errorBox}>{error}</div>}
      {isLoading && <div style={styles.loading}>Loading items...</div>}

      {!isLoading && (
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}> {/* Scrollable Table Area */}
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Type</th>
                <th style={styles.th}>Name</th>
                <th style={styles.th}>Size</th>
                <th style={styles.th}>Last Modified</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} style={styles.emptyText}>This directory is empty.</td>
                </tr>
              )}
              {items.map((item, index) => (
                <tr key={`${item.name}-${index}`} style={styles.tr}>
                  <td style={styles.td}>
                    {item.isDirectory ? '📁' : '📄'}
                  </td>
                  <td style={styles.td}>
                    {item.isDirectory ? (
                      <button onClick={() => handleNavigate(item.name, true)} style={styles.linkButton}>
                        {item.name}
                      </button>
                    ) : (
                      item.name
                    )}
                  </td>
                  <td style={styles.td}>{item.isDirectory ? '-' : formatBytes(item.size)}</td>
                  <td style={styles.td}>
                    {item.lastModified ? new Date(item.lastModified).toLocaleString() : '-'}
                  </td>
                  <td style={styles.td}>
                    {!item.isDirectory && (
                      <div className="inline-flex shadow-sm rounded-md overflow-hidden">
                        <button
                          onClick={() => handleDownload(item.name)}
                          className="cursor-pointer px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                        >
                          Download
                        </button>
                        <button
                          onClick={() => triggerFileSelectForMapping(item)}
                          className="cursor-pointer px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none"
                        >
                          Map this file
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// --- Basic Styles ---
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    fontFamily: 'Arial, sans-serif',
    padding: '10px', // Reduced padding for modal context
    width: '100%',
    margin: '0 auto',
    backgroundColor: '#f9f9f9',
    border: '1px solid #ccc',
    borderRadius: '8px',
    boxSizing: 'border-box',
  },
  header: { // This style might not be used if FileManager doesn't render its own header in modal
    textAlign: 'center',
    color: '#333',
    borderBottom: '1px solid #eee',
    paddingBottom: '10px',
    marginBottom: '15px',
  },
  navBar: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '10px',
    padding: '8px',
    backgroundColor: '#eee',
    borderRadius: '4px',
  },
  navButton: {
    padding: '6px 10px',
    marginRight: '10px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9em',
  },
  currentPathDisplay: {
    fontWeight: 'bold',
    color: '#555',
    wordBreak: 'break-all',
    fontSize: '0.9em',
  },
  errorBox: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '8px',
    borderRadius: '4px',
    marginBottom: '10px',
    border: '1px solid #f5c6cb',
    fontSize: '0.9em',
  },
  loading: {
    textAlign: 'center',
    padding: '15px',
    fontSize: '1em',
    color: '#555',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '10px',
    fontSize: '0.9em',
  },
  th: {
    borderBottom: '2px solid #ddd',
    padding: '8px 6px',
    textAlign: 'left',
    backgroundColor: '#e9ecef',
    color: '#495057',
    position: 'sticky', // Make headers sticky
    top: 0,             // Stick to the top of the scrollable container
    zIndex: 1,
  },
  tr: {
    // Basic hover, can be enhanced with CSS classes if needed
    // '&:hover': { backgroundColor: '#e9ecef' } // This pseudo-class won't work directly in inline styles
  },
  td: {
    borderBottom: '1px solid #ddd',
    padding: '8px 6px',
    wordBreak: 'break-word',
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#007bff',
    textDecoration: 'underline',
    cursor: 'pointer',
    padding: 0,
    fontSize: 'inherit',
  },
  emptyText: {
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#777',
    padding: '15px',
  },
};

export default FileManager;