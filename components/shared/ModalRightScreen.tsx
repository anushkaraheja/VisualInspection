import React from 'react';
import { IoMdClose } from 'react-icons/io';

interface ModalRightScreenProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
}

const ModalRightScreen = ({
  isOpen,
  onClose,
  children,
  width = 'w-1/2',
}: ModalRightScreenProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-end z-50">
      <div
        className={`bg-white dark:bg-surfaceColor ${width} h-full rounded-l-lg relative flex flex-col justify-between overflow-auto`}
      >
        <button
          onClick={onClose}
          className="flex items-center text-[#707070] mt-6 mx-4 gap-4"
        >
          <IoMdClose className="text-4xl font-thin" />
          <p className="text-md">Close</p>
        </button>
        <div className="flex flex-col flex-grow overflow-auto p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

// Header component
const Header = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={`space-y-3 mt-8 ${className}`}>
      <div className="flex justify-between items-center border-b-2 pb-3 border-b-[#707070]">
        {children}
      </div>
    </div>
  );
};

// Content component
const Content = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={`flex-grow overflow-auto mt-4 ${className}`}>
      {children}
    </div>
  );
};

// Footer component
const Footer = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={`flex gap-4 mt-auto pt-4 ${className}`}>{children}</div>
  );
};

// Title component
const Title = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <h2
      className={`text-2xl font-bold leading-none tracking-tight ${className}`}
    >
      {children}
    </h2>
  );
};

// Subtitle component
const Subtitle = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <p className={`text-md text-gray-500 dark:text-gray-400 ${className}`}>
      {children}
    </p>
  );
};

// Attach subcomponents to the main component
ModalRightScreen.Header = Header;
ModalRightScreen.Content = Content;
ModalRightScreen.Footer = Footer;
ModalRightScreen.Title = Title;
ModalRightScreen.Subtitle = Subtitle;

export default ModalRightScreen;
