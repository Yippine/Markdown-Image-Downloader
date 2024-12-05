import React from 'react';
import { ProcessingStatus } from '../types';

interface ProgressBarProps {
  status: ProcessingStatus;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ status }) => {
  const percentage = (status.processed / status.total) * 100;

  return (
    <div className="w-full">
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="mt-2 text-sm text-gray-600 flex justify-between">
        <span>Processed: {status.processed}/{status.total}</span>
        <span className="text-green-600">Success: {status.successful}</span>
        <span className="text-red-600">Failed: {status.failed}</span>
      </div>
    </div>
  );
};