'use client';

import { useEffect } from 'react';
import { Toaster, type ToastProps } from '@/components/ui/toast';
import { useToast } from '@/components/ui/use-toast';

export function ToastToaster() {
  const { toasts } = useToast();

  return (
    <>
      <Toaster toasts={toasts} />
    </>
  );
}
