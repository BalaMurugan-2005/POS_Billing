import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="text-center">
        <ShieldExclamationIcon className="mx-auto h-24 w-24 text-red-500" />
        <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">403 - Unauthorized</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          You don't have permission to access this page.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block btn-primary"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;