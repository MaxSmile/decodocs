import React from 'react';
import { Link } from 'react-router-dom';

const variants = {
    // added border-transparent to ensure same height as bordered buttons
    primary: 'bg-slate-900 text-white border border-transparent hover:bg-slate-800 shadow-lg shadow-slate-900/20',
    secondary: 'bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 shadow-sm',
    outline: 'bg-transparent text-slate-600 border border-slate-200 hover:border-slate-300 hover:text-slate-900',
    ghost: 'bg-transparent text-slate-600 border border-transparent hover:bg-slate-100 hover:text-slate-900',
};

const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
};

const Button = ({
    variant = 'primary',
    size = 'md',
    className = '',
    href,
    to,
    onClick,
    children,
    type = 'button',
    ...props
}) => {
    // Removed focus ring for cleaner look if desired, or kept it. 
    // Added 'inline-flex items-center justify-center' for alignment.
    const baseStyles = 'inline-flex items-center justify-center font-bold rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
    const variantStyles = variants[variant] || variants.primary;
    const sizeStyles = sizes[size] || sizes.md;

    const combinedClasses = `${baseStyles} ${variantStyles} ${sizeStyles} ${className}`;

    if (to) {
        return (
            <Link to={to} className={combinedClasses} {...props}>
                {children}
            </Link>
        );
    }

    if (href) {
        return (
            <a href={href} className={combinedClasses} {...props}>
                {children}
            </a>
        );
    }

    return (
        <button type={type} onClick={onClick} className={combinedClasses} {...props}>
            {children}
        </button>
    );
};

export default Button;
