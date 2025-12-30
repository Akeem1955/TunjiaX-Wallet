import React from 'react';
import { motion } from 'framer-motion';

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    className = '',
    loading = false,
    icon,
    fullWidth = false,
    ...props
}) {
    const variants = {
        primary: `
            bg-brand-600 text-white font-semibold 
            hover:bg-brand-700 active:bg-brand-800
            shadow-brand hover:shadow-brand-lg
            focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2
        `,
        secondary: `
            bg-surface-100 text-slate-700 font-medium
            border border-surface-300
            hover:bg-surface-200 hover:border-surface-400 active:bg-surface-300
            focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2
        `,
        outline: `
            bg-transparent text-brand-600 font-medium
            border-2 border-brand-600
            hover:bg-brand-50 active:bg-brand-100
            focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2
        `,
        danger: `
            bg-rose-50 text-rose-600 font-medium
            border border-rose-200
            hover:bg-rose-100 hover:border-rose-300 active:bg-rose-200
            focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2
        `,
        success: `
            bg-emerald-50 text-emerald-700 font-medium
            border border-emerald-200
            hover:bg-emerald-100 hover:border-emerald-300 active:bg-emerald-200
            focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2
        `,
        ghost: `
            bg-transparent text-slate-600 font-medium
            hover:bg-surface-100 hover:text-slate-900 active:bg-surface-200
            focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2
        `,
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-sm rounded-lg gap-1.5',
        md: 'px-5 py-2.5 text-base rounded-xl gap-2',
        lg: 'px-7 py-3.5 text-lg rounded-xl gap-2.5',
        icon: 'p-2.5 rounded-xl',
    };

    return (
        <motion.button
            whileHover={!props.disabled && { scale: 1.01 }}
            whileTap={!props.disabled && { scale: 0.98 }}
            className={`
                inline-flex items-center justify-center
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                ${variants[variant]}
                ${sizes[size]}
                ${fullWidth ? 'w-full' : ''}
                ${className}
            `}
            disabled={props.disabled || loading}
            {...props}
        >
            {loading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
                <>
                    {icon && <span className="flex-shrink-0">{icon}</span>}
                    {children}
                </>
            )}
        </motion.button>
    );
}
