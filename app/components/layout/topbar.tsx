// app/components/layout/Topbar.jsx
import { FiRefreshCw, FiBell, FiUser } from 'react-icons/fi';

const Topbar = () => {
  return (
    <div className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Mobile sidebar button would go here */}
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="p-1 rounded-full text-gray-400 hover:text-gray-500">
              <FiRefreshCw className="h-6 w-6" />
            </button>
            
            <button className="p-1 rounded-full text-gray-400 hover:text-gray-500">
              <FiBell className="h-6 w-6" />
            </button>
            
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FiUser className="h-6 w-6 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topbar;