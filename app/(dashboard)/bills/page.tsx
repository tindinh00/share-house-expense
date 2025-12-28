'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRoom } from '@/contexts/RoomContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import Link from 'next/link';

interface MonthSummary {
  year: number;
  month: number;
  totalAmount: number;
  transactionCount: number;
}

export default function BillsPage() {
  const supabase = createClient();
  const { currentRoom } = useRoom();
  const [months, setMonths] = useState<MonthSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentRoom) {
      loadMonthsSummary();
    }
  }, [currentRoom]);

  const loadMonthsSummary = async () => {
    if (!currentRoom) return;
    
    setLoading(true);
    try {
      // Lấy tất cả transactions của room
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('date, amount')
        .eq('room_id', currentRoom.id)
        .eq('is_deleted', false)
        .order('date', { ascending: false });

      if (error) throw error;

      // Group theo tháng
      const monthsMap = new Map<string, MonthSummary>();
      
      (transactions || []).forEach((t) => {
        const date = new Date(t.date);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const key = `${year}-${month}`;

        if (!monthsMap.has(key)) {
          monthsMap.set(key, {
            year,
            month,
            totalAmount: 0,
            transactionCount: 0,
          });
        }

        const summary = monthsMap.get(key)!;
        summary.totalAmount += Number(t.amount);
        summary.transactionCount += 1;
      });

      // Convert to array và sort
      const monthsArray = Array.from(monthsMap.values()).sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });

      setMonths(monthsArray);
    } catch (error) {
      console.error('Error loading months:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (month: number) => {
    const date = new Date(2000, month - 1, 1);
    return format(date, 'MMMM', { locale: vi });
  };

  if (!currentRoom) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Vui lòng chọn không gian để xem chi tiêu theo tháng</p>
      </div>
    );
  }

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
    <div className="space-y-4 md:space-y-6 pb-20 md:pb-6">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
          📅 Chi tiêu theo tháng
        </h1>
        <p className="text-sm md:text-base text-gray-600 mt-1">
          Không gian: {currentRoom.name}
        </p>
      </div>

      {/* Months List */}
      {months.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <span className="text-6xl">📋</span>
            <p className="text-muted-foreground mt-4 mb-6">
              Chưa có giao dịch nào
            </p>
            <p className="text-sm text-gray-500">
              Thêm giao dịch để xem chi tiêu theo tháng
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {months.map((monthData) => (
            <Link 
              key={`${monthData.year}-${monthData.month}`}
              href={`/bills/${monthData.year}/${monthData.month}`}
            >
              <Card className="hover:shadow-lg transition cursor-pointer hover:border-green-200">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg md:text-xl">
                        Tháng {monthData.month}/{monthData.year}
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        {getMonthName(monthData.month)} {monthData.year}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600">Tổng chi tiêu</p>
                      <p className="text-xl md:text-2xl font-bold text-green-600">
                        {monthData.totalAmount.toLocaleString('vi-VN')} ₫
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {monthData.transactionCount} giao dịch
                    </span>
                    <span className="text-green-600 font-medium">
                      Xem chi tiết →
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
