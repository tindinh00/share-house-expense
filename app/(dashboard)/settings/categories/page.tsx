'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRoom } from '@/contexts/RoomContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ArrowLeft } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  is_system: boolean;
  created_by: string | null;
  room_id: string | null;
}

const EMOJI_OPTIONS = ['🍜', '🛒', '🚗', '🏠', '💊', '🎮', '📚', '👕', '💇', '🎁', '✈️', '📱', '💼', '🎬', '🏋️', '🐕', '👶', '💰', '📝', '⭐'];
const COLOR_OPTIONS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'];

export default function CategoriesPage() {
  const router = useRouter();
  const supabase = createClient();
  const { currentRoom } = useRoom();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  
  // Dialog states
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    icon: '📝',
    color: '#3b82f6',
    scope: 'personal' as 'personal' | 'room',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentRoom]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUserId(user.id);

      // Load categories
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('is_system', { ascending: false })
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Không thể tải danh mục');
    } finally {
      setLoading(false);
    }
  };


  const openCreateDialog = () => {
    setEditingCategory(null);
    setFormData({ name: '', icon: '📝', color: '#3b82f6', scope: 'personal' });
    setIsDialogOpen(true);
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      icon: category.icon,
      color: category.color,
      scope: category.room_id ? 'room' : 'personal',
    });
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (category: Category) => {
    setDeletingCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên danh mục');
      return;
    }

    setSubmitting(true);
    try {
      if (editingCategory) {
        // Update
        const { error } = await supabase
          .from('categories')
          .update({
            name: formData.name.trim(),
            icon: formData.icon,
            color: formData.color,
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
        toast.success('Đã cập nhật danh mục');
      } else {
        // Create
        const insertData: any = {
          name: formData.name.trim(),
          icon: formData.icon,
          color: formData.color,
          created_by: currentUserId,
          is_system: false,
        };

        // Nếu scope là room và có currentRoom
        if (formData.scope === 'room' && currentRoom) {
          insertData.room_id = currentRoom.id;
        }

        const { error } = await supabase
          .from('categories')
          .insert(insertData);

        if (error) throw error;
        toast.success('Đã tạo danh mục mới');
      }

      setIsDialogOpen(false);
      loadData();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Lỗi: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', deletingCategory.id);

      if (error) {
        if (error.message.includes('violates foreign key')) {
          toast.error('Không thể xóa danh mục đang được sử dụng');
        } else {
          throw error;
        }
        return;
      }

      toast.success('Đã xóa danh mục');
      setIsDeleteDialogOpen(false);
      setDeletingCategory(null);
      loadData();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Lỗi: ' + error.message);
    }
  };

  // Phân loại categories
  const systemCategories = categories.filter(c => c.is_system);
  const personalCategories = categories.filter(c => !c.is_system && !c.room_id && c.created_by === currentUserId);
  const roomCategories = categories.filter(c => !c.is_system && c.room_id && c.room_id === currentRoom?.id);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-24">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại
        </Button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Danh mục</h1>
            <p className="text-gray-600 mt-1">Quản lý danh mục chi tiêu</p>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm mới
          </Button>
        </div>
      </div>


      {/* System Categories */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            🏷️ Danh mục hệ thống
            <span className="text-sm font-normal text-gray-500">({systemCategories.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {systemCategories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50"
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: cat.color + '20' }}
                >
                  <span className="text-xl">{cat.icon}</span>
                </div>
                <span className="font-medium text-gray-700 truncate">{cat.name}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            * Danh mục hệ thống không thể chỉnh sửa hoặc xóa
          </p>
        </CardContent>
      </Card>

      {/* Personal Categories */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            👤 Danh mục cá nhân
            <span className="text-sm font-normal text-gray-500">({personalCategories.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {personalCategories.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Chưa có danh mục cá nhân</p>
              <Button variant="outline" className="mt-3" onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Tạo danh mục đầu tiên
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {personalCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: cat.color + '20' }}
                    >
                      <span className="text-xl">{cat.icon}</span>
                    </div>
                    <span className="font-medium text-gray-900">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(cat)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(cat)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Room Categories */}
      {currentRoom && currentRoom.type === 'SHARED' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              🏠 Danh mục của "{currentRoom.name}"
              <span className="text-sm font-normal text-gray-500">({roomCategories.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {roomCategories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>Chưa có danh mục riêng cho không gian này</p>
              </div>
            ) : (
              <div className="space-y-2">
                {roomCategories.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: cat.color + '20' }}
                      >
                        <span className="text-xl">{cat.icon}</span>
                      </div>
                      <span className="font-medium text-gray-900">{cat.name}</span>
                    </div>
                    {cat.created_by === currentUserId && (
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(cat)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openDeleteDialog(cat)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}


      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="p-0 max-h-[90vh]">
          <div className="flex-shrink-0 p-6 pb-4 border-b">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Chỉnh sửa danh mục' : 'Tạo danh mục mới'}
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label>Tên danh mục *</Label>
              <Input
                placeholder="VD: Cafe, Xăng xe..."
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                maxLength={50}
              />
            </div>

            {/* Scope (only for create) */}
            {!editingCategory && currentRoom?.type === 'SHARED' && (
              <div className="space-y-2">
                <Label>Phạm vi</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, scope: 'personal' })}
                    className={`p-3 rounded-lg border-2 transition text-center ${
                      formData.scope === 'personal'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xl block">👤</span>
                    <p className="font-medium mt-1 text-sm">Cá nhân</p>
                    <p className="text-xs text-gray-500">Chỉ bạn thấy</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, scope: 'room' })}
                    className={`p-3 rounded-lg border-2 transition text-center ${
                      formData.scope === 'room'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-xl block">🏠</span>
                    <p className="font-medium mt-1 text-sm">Không gian</p>
                    <p className="text-xs text-gray-500">Mọi người thấy</p>
                  </button>
                </div>
              </div>
            )}

            {/* Icon */}
            <div className="space-y-2">
              <Label>Biểu tượng</Label>
              <div className="grid grid-cols-6 gap-2">
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: emoji })}
                    className={`aspect-square rounded-lg flex items-center justify-center text-xl transition ${
                      formData.icon === emoji
                        ? 'bg-green-100 ring-2 ring-green-500'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label>Màu sắc</Label>
              <div className="grid grid-cols-8 gap-2">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`aspect-square rounded-full transition ${
                      formData.color === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="space-y-2">
              <Label>Xem trước</Label>
              <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-200">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: formData.color + '20' }}
                >
                  <span className="text-2xl">{formData.icon}</span>
                </div>
                <span className="font-medium text-gray-900 truncate">
                  {formData.name || 'Tên danh mục'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex-shrink-0 border-t p-4 bg-white">
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Hủy
              </Button>
              <Button onClick={handleSubmit} disabled={submitting || !formData.name.trim()}>
                {submitting ? 'Đang lưu...' : editingCategory ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa danh mục?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc muốn xóa danh mục "{deletingCategory?.name}"? 
              Hành động này không thể hoàn tác.
              <br /><br />
              <strong>Lưu ý:</strong> Nếu danh mục đang được sử dụng trong các giao dịch, 
              bạn sẽ không thể xóa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
