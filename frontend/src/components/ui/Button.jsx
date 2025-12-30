import React from 'react';
import { motion } from 'framer-motion';

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    loading = false,
    icon,
    ...props
}) {
    const variants = {
        primary: "bg-brand text-white dark:text-black font-semibold hover:bg-brand-dark dark:hover:bg-brand-light shadow-[0_4px_14px_0_rgba(6,182,212,0.39)] dark:shadow-[0_0_20px_rgba(6,182,212,0.3)]",
        secondary: "bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 border border-gray-200 dark:border-white/10",
        danger: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 border border-red-100 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-500/20",
        ghost: "bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-sm",
        md: "px-6 py-3 text-base",
        lg: "px-8 py-4 text-lg",
        icon: "p-3"
    };

    return (
        <motion.button
            whileHover={!props.disabled && { scale: 1.02 }}
            whileTap={!props.disabled && { scale: 0.98 }}
            className={`
        rounded-xl flex items-center justify-center gap-2 transition-all duration-200
        ${variants[variant]} 
        ${sizes[size]} 
        ${props.disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
            disabled={props.disabled || loading}
            {...props}
        >
            {loading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
                <>
                    {icon && <span className="text-xl">{icon}</span>}
                    {children}
                </>
            )}
        </motion.button>
    );
}
