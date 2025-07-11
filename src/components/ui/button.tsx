import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'default' | 'outline' | 'destructive' | 'ghost' | 'link';
type ButtonSize = 'sm' | 'default' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'default',
      size = 'default',
      isLoading = false,
      icon,
      iconPosition = 'left',
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none';

    const sizeStyles = {
      sm: 'h-8 px-3 text-sm',
      default: 'h-10 px-4 py-2',
      lg: 'h-12 px-6 text-lg',
    };

    const variantStyles = {
      default: 'bg-blue-600 text-white hover:bg-blue-700 shadow',
      outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 shadow-sm',
      destructive: 'bg-red-600 text-white hover:bg-red-700 shadow',
      ghost: 'hover:bg-gray-100 text-gray-700',
      link: 'text-blue-600 hover:underline hover:text-blue-700 p-0 h-auto',
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          icon && iconPosition === 'left' && (
            <span className="mr-2">{icon}</span>
          )
        )}
        {children}
        {!isLoading && icon && iconPosition === 'right' && (
          <span className="ml-2">{icon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };