"use client"

import { Toaster as Sonner } from "sonner"

const Toaster = () => {
  return (
    <Sonner
      position="top-center"
      richColors
      closeButton={false}
      expand={false}
      duration={3000}
    />
  )
}

export { Toaster }
