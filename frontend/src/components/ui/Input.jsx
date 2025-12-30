import React, { forwardRef } from 'react';

export const Input = forwardRef(({
    label,
    error,
    helperText,
    icon,
    className = '',
    containerClassName = '',
    ...props
}, ref) => {
    const inputId = props.id || props.name || `input-${Math.random().toString(36).slice(2)}`;

    return (
        <div className={`w-full ${containerClassName}`}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="block text-sm font-medium text-slate-700 mb-1.5"
                >
                    {label}
                    {props.required && <span className="text-rose-500 ml-0.5">*</span>}
                </label>
            )}

            <div className="relative">
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {icon}
                    </div>
                )}

                <input
                    ref={ref}
                    id={inputId}
                    className={`
                        w-full px-4 py-3 
                        bg-white border rounded-xl
                        text-slate-900 placeholder-slate-400
                        transition-all duration-200
                        focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-500
                        disabled:bg-surface-100 disabled:text-slate-500 disabled:cursor-not-allowed
                        ${icon ? 'pl-10' : ''}
                        ${error
                            ? 'border-rose-300 focus:ring-rose-400 focus:border-rose-500'
                            : 'border-surface-300 hover:border-surface-400'
                        }
                        ${className}
                    `}
                    aria-invalid={error ? 'true' : 'false'}
                    aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
                    {...props}
                />
            </div>

            {error && (
                <p id={`${inputId}-error`} className="mt-1.5 text-sm text-rose-600" role="alert">
                    {error}
                </p>
            )}

            {helperText && !error && (
                <p id={`${inputId}-helper`} className="mt-1.5 text-sm text-slate-500">
                    {helperText}
                </p>
            )}
        </div>
    );
});

Input.displayName = 'Input';
