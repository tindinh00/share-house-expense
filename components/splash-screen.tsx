"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";

export function SplashScreen() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Ẩn splash screen sau khi app đã load xong
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500); // Thời gian tối thiểu hiển thị splash

    return () => clearTimeout(timer);
  }, []);

  if (!isLoading) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-green-600 transition-opacity duration-300"
      style={{
        opacity: isLoading ? 1 : 0,
        pointerEvents: isLoading ? "auto" : "none",
      }}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="relative h-24 w-24">
          <Image
            src="/iconIOS.png"
            alt="Chi tiêu nhà chung"
            fill
            className="rounded-2xl"
            priority
          />
        </div>
        <h1 className="text-2xl font-bold text-white">Chi tiêu nhà chung</h1>
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    </div>
  );
}
