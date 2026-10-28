import { Children, cloneElement, forwardRef, isValidElement } from 'react';

import { cn } from '@/lib/cn';

/** Merges its props into its only child (used by `asChild`, e.g. a Button that is a Link). */
export const Slot = forwardRef(function Slot({ children, className, ...props }, ref) {
  const child = Children.only(children);
  if (!isValidElement(child)) return null;
  return cloneElement(child, {
    ...props,
    ...child.props,
    ref,
    className: cn(className, child.props.className),
  });
});
