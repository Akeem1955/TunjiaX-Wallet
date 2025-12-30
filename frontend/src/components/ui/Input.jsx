import React from 'react';

export function Input({ label, error, className = '', ...props }) {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2 font-medium">
                    {label}
                </label>
            )}
            <input
                className={`
          w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 
          text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600
          focus:outline-none focus:border-brand focus:bg-white dark:focus:bg-white/10 ring-0 focus:ring-2 focus:ring-brand/20 dark:focus:ring-brand/10
          transition-all duration-200
          ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
          ${className}
        `}
                {...props}
            />
            {error && (
                <p className="mt-1 text-xs text-red-400">{error}</p>
            )}
        </div>
    );
}
