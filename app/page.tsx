import Link from "next/link";
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect to dashboard if already logged in
  if (user) {
    redirect('/dashboard');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-gradient-to-b from-green-50 to-white">
      <div className="text-center space-y-6 max-w-md">
        <h1 className="text-4xl font-bold text-gray-900">
          🏠 Chi tiêu nhà chung
        </h1>
        <p className="text-lg text-gray-600">
          Quản lý chi tiêu minh bạch cho nhà ở ghép
        </p>
        
        <div className="space-y-3 pt-6">
          <Link href="/login" className="block">
            <Button className="w-full" size="lg">
              Đăng nhập
            </Button>
          </Link>
          <Link href="/signup" className="block">
            <Button variant="outline" className="w-full" size="lg">
              Tạo tài khoản
            </Button>
          </Link>
        </div>

        <div className="pt-8 space-y-2 text-sm text-gray-500">
          <p>✅ Phân biệt chi tiêu chung & riêng</p>
          <p>✅ Tính toán quyết toán tự động</p>
          <p>✅ Miễn phí 100%</p>
        </div>
      </div>
    </main>
  );
}
