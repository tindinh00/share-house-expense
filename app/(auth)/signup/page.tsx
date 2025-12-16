'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const supabase = createClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            username: username,
          },
        },
      });

      if (error) throw error;

      setMessage('✅ Kiểm tra email để hoàn tất đăng ký!');
    } catch (error: any) {
      setMessage(`❌ Lỗi: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      setMessage(`❌ Lỗi: ${error.message}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🏠 Chi tiêu nhà chung
          </h1>
          <p className="text-gray-600">Tạo tài khoản mới</p>
        </div>

        <Card>
          <CardContent className="pt-6 space-y-6">
          {/* Google Sign Up */}
          <Button
            onClick={handleGoogleSignup}
            disabled={loading}
            variant="outline"
            className="w-full"
            size="lg"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {loading ? 'Đang xử lý...' : 'Đăng ký với Google'}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Hoặc dùng email</span>
            </div>
          </div>

          {/* Email Signup */}
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Tên hiển thị</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Tín"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? 'Đang xử lý...' : 'Tạo tài khoản'}
            </Button>
          </form>

          {message && (
            <div className={`mt-4 p-4 rounded-lg text-sm ${
              message.includes('✅') 
                ? 'bg-green-50 text-green-800' 
                : 'bg-red-50 text-red-800'
            }`}>
              {message}
            </div>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Đã có tài khoản?{' '}
              <Link href="/login" className="text-green-600 font-medium hover:underline">
                Đăng nhập
              </Link>
            </p>
          </div>

          <p className="text-xs text-gray-500 text-center pt-4 border-t">
            💡 Không cần mật khẩu! Chúng tôi sẽ gửi link xác nhận qua email.
          </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
