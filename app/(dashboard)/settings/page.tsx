'use client';

import EmptyState from '@/components/EmptyState';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();

  return (
    <EmptyState
      icon="⚙️"
      title="Cài đặt"
      description="Trang cài đặt đang được phát triển. Bạn có thể quay lại trang chủ hoặc khám phá các tính năng khác."
      action={{
        label: 'Về trang chủ',
        onClick: () => router.push('/dashboard'),
      }}
    />
  );
}
