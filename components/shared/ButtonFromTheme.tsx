import useOrgTheme from 'hooks/useOrgTheme';
import useColors from 'hooks/useColors';
import { useRouter } from 'next/router';
import { ShimmerButton } from 'react-shimmer-effects';
import React, { useMemo } from 'react';
import classNames from 'classnames';
import Spinner from './Spinner';

interface ButtonFromThemeProps {
  className?: string;
  onClick?: (
    e?:
      | React.MouseEvent<HTMLButtonElement>
      | React.FormEvent<HTMLFormElement>
      | any
  ) => void;
  children: React.ReactNode;
  primaryColor?: string;
  secondaryColor?: string;
  outline?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  loading?: boolean;
  icon?: React.ReactNode;
  iconClassName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const ButtonFromTheme: React.FC<ButtonFromThemeProps> = ({
  className = '',
  onClick,
  children,
  primaryColor: propPrimaryColor,
  secondaryColor: propSecondaryColor,
  outline = false,
  disabled = false,
  type = 'button',
  loading = false,
  icon,
  iconClassName = '',
  size = 'md',
}) => {
  const router = useRouter();
  const { slug } = router.query;
  const {
    theme: {
      primaryColor: themePrimaryColor,
      secondaryColor: themeSecondaryColor,
    },
    loading: themeLoading,
  } = useOrgTheme((slug as string) || '');

  const {
    primaryColor: selectedPrimaryColor,
    secondaryColor: selectedSecondaryColor,
  } = useColors();

  // Calculate final colors with proper priority (props > selected > theme)
  const primaryColor = useMemo(
    () => propPrimaryColor || selectedPrimaryColor || themePrimaryColor,
    [propPrimaryColor, selectedPrimaryColor, themePrimaryColor]
  );

  const secondaryColor = useMemo(
    () => propSecondaryColor || selectedSecondaryColor || themeSecondaryColor,
    [propPrimaryColor, selectedPrimaryColor, themePrimaryColor]
  );

  // Button styles based on outline and color props
  const baseStyles = {
    backgroundColor: outline ? 'transparent' : primaryColor,
    borderColor: primaryColor,
    color: outline ? primaryColor : 'white',
  };

  // Hover styles for onMouseEnter
  const hoverStyles = {
    backgroundColor: secondaryColor,
    borderColor: secondaryColor,
    color: 'white',
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      Object.assign(e.currentTarget.style, hoverStyles);
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !loading) {
      Object.assign(e.currentTarget.style, baseStyles);
    }
  };

  if (themeLoading) {
    return <ShimmerButton size="md" />;
  }

  return (
    <button
      disabled={disabled || loading}
      className={classNames(
        'btn dark:text-textColor text-textColor border',
        {
          'opacity-60 cursor-not-allowed': disabled || loading,
          'btn-sm text-xs px-2 py-1': size === 'sm',
          'btn-md text-sm px-3 py-1.5': size === 'md',
          'btn-lg text-base px-4 py-2': size === 'lg',
          'btn-xl text-lg px-6 py-3': size === 'xl',
        },
        className
      )}
      style={baseStyles}
      type={type}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      {loading ? (
        <Spinner />
      ) : (
        <>
          {icon && <span className={`icon ${iconClassName}`}>{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

export default ButtonFromTheme;
