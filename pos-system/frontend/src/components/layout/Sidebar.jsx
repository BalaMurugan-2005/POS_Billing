import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  HomeIcon,
  ShoppingCartIcon,
  UserGroupIcon,
  ChartBarIcon,
  CubeIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  QrCodeIcon,
} from '@heroicons/react/24/outline';

const Sidebar = ({ sidebarOpen }) => {
  const { user } = useAuth();

  const adminLinks = [
    { to: '/admin', icon: HomeIcon, label: 'Dashboard' },
    { to: '/admin/products', icon: CubeIcon, label: 'Products' },
    { to: '/admin/inventory', icon: ShoppingCartIcon, label: 'Inventory' },
    { to: '/admin/users', icon: UserGroupIcon, label: 'Users' },
    { to: '/admin/reports', icon: ChartBarIcon, label: 'Reports' },
    { to: '/admin/settings', icon: Cog6ToothIcon, label: 'Settings' },
  ];

  const cashierLinks = [
    { to: '/cashier', icon: HomeIcon, label: 'POS' },
    { to: '/cashier/transactions', icon: DocumentTextIcon, label: 'Transactions' },
    { to: '/cashier/customers', icon: QrCodeIcon, label: 'Customers' },
  ];

  const customerLinks = [
    { to: '/customer', icon: HomeIcon, label: 'Dashboard' },
    { to: '/customer/history', icon: DocumentTextIcon, label: 'Purchase History' },
    { to: '/customer/profile', icon: QrCodeIcon, label: 'My QR Code' },
  ];

  const getLinks = () => {
    switch (user?.role) {
      case 'admin':
        return adminLinks;
      case 'cashier':
        return cashierLinks;
      case 'customer':
        return customerLinks;
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <aside
      className={`fixed left-0 top-16 z-40 h-screen transition-transform ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-44'
      } bg-white border-r border-gray-200 dark:bg-gray-800 dark:border-gray-700`}
      style={{ width: sidebarOpen ? '16rem' : '5rem' }}
    >
      <div className="h-full px-3 py-4 overflow-y-auto">
        <ul className="space-y-2 font-medium">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group ${
                    isActive ? 'bg-gray-100 dark:bg-gray-700' : ''
                  }`
                }
              >
                <link.icon className="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                <span className={`ml-3 ${!sidebarOpen && 'hidden'}`}>{link.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;