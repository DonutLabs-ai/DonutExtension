import React from 'react';
import { cn } from '@/utils/shadcn';

interface ResultMessageProps {
  message: string | null;
  isExecuting: boolean;
  className?: string;
}

const ResultMessage: React.FC<ResultMessageProps> = ({ message, isExecuting, className }) => {
  if (!message) return null;

  return (
    <div className={cn('text-sm mt-2', isExecuting ? 'text-blue-500' : 'text-gray-500', className)}>
      {message}
    </div>
  );
};

export default ResultMessage;
