import React from 'react';

interface EmptyDataMessageProps {
  message: string;
}

const EmptyDataMessage: React.FC<EmptyDataMessageProps> = ({ message }) => {
  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-[#5E6C84]">{message}</p>
    </div>
  );
};

export default EmptyDataMessage;
