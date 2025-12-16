'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface Household {
  id: string;
  name: string;
  created_at: string;
  member_count?: number;
  is_owner?: boolean;
}

export default function HouseholdsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [households, setHouseholds] = useState<Household[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHouseholds();
  }, []);

  const loadHouseholds = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Get households where user is a member
      const { data: memberData, error: memberError } = await supabase
        .from('household_members')
        .select('household_id, role')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      if (!memberData || memberData.length === 0) {
        setHouseholds([]);
        setLoading(false);
        return;
      }

      const householdIds = memberData.map(m => m.household_id);

      // Get household details
      const { data: householdsData, error: householdsError } = await supabase
        .from('households')
        .select('*')
        .in('id', householdIds);

      if (householdsError) throw householdsError;

      // Get member counts
      const householdsWithCounts = await Promise.all(
        (householdsData || []).map(async (household) => {
          const { count } = await supabase
            .from('household_members')
            .select('*', { count: 'exact', head: true })
            .eq('household_id', household.id);

          const memberInfo = memberData.find(m => m.household_id === household.id);

          return {
            ...household,
            member_count: count || 0,
            is_owner: memberInfo?.role === 'owner',
          };
        })
      );

      setHouseholds(householdsWithCounts);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('❌ Không thể tải danh sách hộ gia đình');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">
            Hộ gia đình
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Quản lý các hộ gia đình của bạn
          </p>
        </div>
        <Link href="/households/create" className="w-full sm:w-auto">
          <Button size="lg" className="w-full sm:w-auto">
            <span className="mr-2">➕</span>
            Tạo hộ mới
          </Button>
        </Link>
      </div>

      {/* Households List */}
      {households.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {households.map((household) => (
            <Card key={household.id} className="hover:shadow-lg transition">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">👨‍👩‍👧‍👦</span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">{household.name}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        {household.member_count} thành viên
                      </p>
                    </div>
                  </div>
                  {household.is_owner && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      Chủ hộ
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <Link href={`/households/${household.id}`}>
                  <Button variant="outline" className="w-full">
                    Xem chi tiết →
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <span className="text-6xl">👨‍👩‍👧‍👦</span>
            <p className="text-gray-600 mt-4 mb-6">
              Bạn chưa có hộ gia đình nào
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Tạo hộ gia đình để chia chi tiêu theo hộ thay vì theo từng người
            </p>
            <Link href="/households/create">
              <Button size="lg">
                <span className="mr-2">➕</span>
                Tạo hộ gia đình đầu tiên
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
