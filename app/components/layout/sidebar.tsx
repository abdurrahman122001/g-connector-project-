// app/components/layout/Sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '../../../store/store';
import {
  FiChevronDown,
  FiSettings,
  FiLogOut,
} from 'react-icons/fi';
import * as Fi from 'react-icons/fi';
import { useState, useEffect } from 'react';

interface SubItem {
  _id: string;
  name: string;
  href: string;
  icon: string;
  order: number;
  roles?: string[];
}

interface NavItem {
  _id: string;
  name: string;
  href?: string; // href optional for parent
  icon: string;
  order: number;
  roles?: string[];
  subItems?: SubItem[];
}

const Sidebar = () => {
  const pathname = usePathname();
  const { user } = useSelector((state: RootState) => state.userLogin);

  const [items, setItems] = useState<NavItem[]>([]);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  // Fetch sidebar items from API
  useEffect(() => {
    const fetchSidebar = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/sidebar`,
          { credentials: 'include' }
        );
        const data = await res.json();
        setItems(data);
      } catch (err) {
        console.error('Failed to fetch sidebar', err);
      }
    };
    fetchSidebar();
  }, []);

  const toggleMenu = (id: string) => {
    setOpenMenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const IconPreview = ({
    name,
    className = 'h-5 w-5',
  }: {
    name: string;
    className?: string;
  }) => {
    const Comp = (Fi as any)[name] ?? Fi.FiCircle;
    return <Comp className={className} />;
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/logout`,
        {
          method: 'POST',
          credentials: 'include',
        }
      );

      if (!response.ok) throw new Error(`Logout failed: ${response.status}`);

      localStorage.removeItem('token');
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/';
    }
  };

  /* ----------------- Role-based filtering ----------------- */
  const filterByRole = (items: NavItem[]) => {
    if (!user?.role) return items; // fallback, show all if no role

    return items
      .filter(
        (item) =>
          !item.roles ||
          item.roles.length === 0 ||
          item.roles.includes(user.role)
      )
      .map((item) => ({
        ...item,
        subItems:
          item.subItems?.filter(
            (sub) =>
              !sub.roles ||
              sub.roles.length === 0 ||
              sub.roles.includes(user.role)
          ) || [],
      }));
  };

  const visibleItems = filterByRole(items);

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-4 py-5">
            <h1 className="text-xl font-bold text-gray-900">
              Data Capturing
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 space-y-1">
            {visibleItems
              .sort((a, b) => a.order - b.order)
              .map((item) => {
                const hasSub = item.subItems && item.subItems.length > 0;

                // Active if parent itself matches OR any sub is active
                const activeParent =
                  isActive(item.href) ||
                  item.subItems?.some((sub) => isActive(sub.href));

                return (
                  <div key={item._id}>
                    {hasSub ? (
                      <>
                        {/* Parent menu with toggle */}
                        <button
                          type="button"
                          className={`group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                            activeParent || openMenus[item._id]
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                          onClick={() => toggleMenu(item._id)}
                        >
                          <span
                            className={`mr-3 flex-shrink-0 ${
                              activeParent || openMenus[item._id]
                                ? 'text-blue-500'
                                : 'text-gray-400 group-hover:text-gray-500'
                            }`}
                          >
                            <IconPreview name={item.icon} />
                          </span>
                          {item.name}
                          <span className="ml-auto">
                            <FiChevronDown
                              className={`h-4 w-4 transition-transform ${
                                openMenus[item._id] ? 'rotate-180' : ''
                              }`}
                            />
                          </span>
                        </button>

                        {/* Sub items */}
                        {openMenus[item._id] && (
                          <div className="ml-6 mt-1 space-y-1">
                            {item.subItems
                              ?.sort((a, b) => a.order - b.order)
                              .map((sub) => (
                                <Link
                                  key={sub._id}
                                  href={sub.href}
                                  className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                                    isActive(sub.href)
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                  }`}
                                >
                                  <span
                                    className={`mr-3 flex-shrink-0 ${
                                      isActive(sub.href)
                                        ? 'text-blue-500'
                                        : 'text-gray-400 group-hover:text-gray-500'
                                    }`}
                                  >
                                    <IconPreview
                                      name={sub.icon}
                                      className="h-4 w-4"
                                    />
                                  </span>
                                  {sub.name}
                                </Link>
                              ))}
                          </div>
                        )}
                      </>
                    ) : (
                      // Single parent (no sub)
                      <Link
                        href={item.href || '#'}
                        onClick={
                          item.name === 'Logout'
                            ? () => handleLogout()
                            : undefined
                        }
                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                          activeParent
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <span
                          className={`mr-3 flex-shrink-0 ${
                            activeParent
                              ? 'text-blue-500'
                              : 'text-gray-400 group-hover:text-gray-500'
                          }`}
                        >
                          <IconPreview name={item.icon} />
                        </span>
                        {item.name}
                      </Link>
                    )}
                  </div>
                );
              })}
          </nav>

          {/* Bottom section (Settings & Logout if not from API) */}
          <div className="px-2 py-4 border-t border-gray-200">
            <Link
              href="/settings"
              className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive('/settings')
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span
                className={`mr-3 flex-shrink-0 ${
                  isActive('/settings')
                    ? 'text-blue-500'
                    : 'text-gray-400 group-hover:text-gray-500'
                }`}
              >
                <FiSettings className="h-5 w-5" />
              </span>
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <FiLogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
