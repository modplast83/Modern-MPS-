import React from 'react';
import { SelectItem } from './ui/select';

interface SafeSelectItemProps {
  value: any;
  children: React.ReactNode;
  [key: string]: any;
}

/**
 * A safe wrapper for SelectItem that ensures value is never empty
 */
export const SafeSelectItem: React.FC<SafeSelectItemProps> = ({ value, children, ...props }) => {
  // Ensure value is never empty, null, or undefined
  const safeValue = value && value !== '' && value !== null && value !== undefined 
    ? String(value) 
    : `safe_${Math.random().toString(36).substr(2, 9)}`;

  return (
    <SelectItem value={safeValue} {...props}>
      {children}
    </SelectItem>
  );
};