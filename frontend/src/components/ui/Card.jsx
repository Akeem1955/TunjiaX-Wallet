import React from 'react';
import { motion } from 'framer-motion';

export function Card({ children, className = '', hoverEffect = false, ...props }) {
    const baseClasses = "bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl p-6 shadow-sm dark:shadow-none backdrop-blur-md";
    const hoverClasses = hoverEffect ? "hover:shadow-md dark:hover:bg-white/10 dark:hover:border-brand/30 transition-all duration-300" : "";

    return (
        <motion.div
            className={`${baseClasses} ${hoverClasses} ${className}`}
            {...props}
        >
            {children}
        </motion.div>
    );
}
