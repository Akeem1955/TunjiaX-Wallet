import React from 'react';
import { motion } from 'framer-motion';

export function Card({
    children,
    className = '',
    variant = 'default',
    padding = 'default',
    hoverable = false,
    ...props
}) {
    const variants = {
        default: 'bg-white border border-surface-300 shadow-soft',
        elevated: 'bg-white border border-surface-200 shadow-medium',
        flat: 'bg-surface-100 border border-surface-200',
        brand: 'bg-gradient-to-br from-brand-600 to-brand-700 text-white border-0 shadow-brand',
    };

    const paddings = {
        none: '',
        sm: 'p-4',
        default: 'p-6',
        lg: 'p-8',
    };

    const hoverStyles = hoverable
        ? 'hover:shadow-medium hover:border-brand-200 transition-all duration-300 cursor-pointer'
        : '';

    return (
        <motion.div
            className={`
                rounded-2xl
                ${variants[variant]}
                ${paddings[padding]}
                ${hoverStyles}
                ${className}
            `}
            {...props}
        >
            {children}
        </motion.div>
    );
}
