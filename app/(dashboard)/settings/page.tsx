'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';

const settingsItems = [
  {
    icon: '🏷️',
    title: 'Danh mục',
    description: 'Quản lý danh mục chi tiêu',
    href: '/settings/categories',
  },
  {
    icon: '👤',
    title: 'Tài khoản',
    description: 'Thông tin cá nhân',
    href: '/settings/profile',
    disabled: true,
  },
  {
    icon: '🔔',
    title: 'Thông báo',
    description: 'Cài đặt thông báo',
    href: '/settings/notifications',
    disabled: true,
  },
];

export default function SettingsPage() {
  const router = useRouter();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Cài đặt</h1>
        <p className="text-gray-600 mt-1">Quản lý ứng dụng của bạn</p>
      </div>

      <div className="space-y-3">
        {settingsItems.map((item) => (
          <Card
            key={item.href}
            className={`cursor-pointer transition ${
              item.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'
            }`}
            onClick={() => !item.disabled && router.push(item.href)}
          >
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                  <span className="text-2xl">{item.icon}</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{item.title}</p>
                  <p className="text-sm text-gray-500">{item.description}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
