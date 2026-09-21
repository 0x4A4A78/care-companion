"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="top-center"
      richColors
      closeButton
      visibleToasts={4}
      duration={4500}
      toastOptions={{
        classNames: {
          toast: "care-toast",
          title: "care-toast-title",
          description: "care-toast-description",
        },
      }}
      {...props}
    />
  );
}
