# Transaction Details in Reports

## Tổng quan

Phần Transaction Details hiển thị danh sách giao dịch chi tiết trong khoảng thời gian đã chọn, với khả năng filter và sort.

## Features

### 1. Transaction List
Mỗi transaction hiển thị:
- **Icon Category**: Icon và màu sắc của danh mục
- **Note**: Mô tả giao dịch
- **Amount**: Số tiền (VND format)
- **Date**: Ngày giao dịch (dd/MM/yyyy)
- **Category**: Tên danh mục
- **Paid by**: Người đã trả

### 2. Filter by Category
- Dropdown để chọn category
- Option "Tất cả danh mục" để xem tất cả
- Hiển thị icon + tên category trong dropdown
- Real-time filtering

### 3. Sort Options
- **Sắp xếp theo ngày**: Mới nhất trước (default)
- **Sắp xếp theo số tiền**: Lớn nhất trước
- Dropdown để chọn sort option
- Real-time sorting

### 4. UI/UX
- **Scrollable**: Max height 500px với scroll
- **Hover effect**: Highlight khi hover
- **Responsive**: Tự động wrap trên mobile
- **Empty state**: Hiển thị message khi không có data
- **Count**: Hiển thị số lượng transactions

## Implementation

### State Management
```typescript
const [transactions, setTransactions] = useState<TransactionDetail[]>([]);
const [filteredTransactions, setFilteredTransactions] = useState<TransactionDetail[]>([]);
const [selectedCategory, setSelectedCategory] = useState<string>('all');
const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
```

### Data Loading
```typescript
const loadTransactionDetails = async () => {
  const { data } = await supabase
    .from('transactions')
    .select(`
      id, date, amount, note,
      categories:category_id (name, icon, color),
      paid_by_user:paid_by (username, email)
    `)
    .eq('room_id', currentRoom.id)
    .gte('date', dateRange.from)
    .lte('date', dateRange.to)
    .eq('is_deleted', false)
    .order('date', { ascending: false });
};
```

### Filtering & Sorting
```typescript
useEffect(() => {
  let filtered = [...transactions];

  // Filter by category
  if (selectedCategory !== 'all') {
    filtered = filtered.filter(t => t.category.name === selectedCategory);
  }

  // Sort
  if (sortBy === 'date') {
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  } else {
    filtered.sort((a, b) => b.amount - a.amount);
  }

  setFilteredTransactions(filtered);
}, [transactions, selectedCategory, sortBy]);
```

## UI Components

### Transaction Card
```tsx
<div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
  {/* Icon */}
  <div style={{ backgroundColor: category.color + '20' }}>
    {category.icon}
  </div>
  
  {/* Content */}
  <div className="flex-1">
    <div className="flex justify-between">
      <p className="font-medium">{note}</p>
      <p className="font-bold">{amount} ₫</p>
    </div>
    <div className="text-sm text-gray-500">
      {date} • {category} • Trả bởi: {user}
    </div>
  </div>
</div>
```

### Filter Controls
```tsx
<div className="flex gap-2">
  {/* Category Filter */}
  <select value={selectedCategory} onChange={...}>
    <option value="all">Tất cả danh mục</option>
    {categories.map(cat => (
      <option value={cat.name}>{cat.icon} {cat.name}</option>
    ))}
  </select>

  {/* Sort */}
  <select value={sortBy} onChange={...}>
    <option value="date">Sắp xếp theo ngày</option>
    <option value="amount">Sắp xếp theo số tiền</option>
  </select>
</div>
```

## Use Cases

### 1. Xem tất cả giao dịch
- User chọn date range
- Xem tất cả transactions trong khoảng thời gian

### 2. Lọc theo category
- User chọn category từ dropdown
- Chỉ hiển thị transactions của category đó
- Useful để xem chi tiêu cho một mục đích cụ thể

### 3. Tìm giao dịch lớn nhất
- User chọn "Sắp xếp theo số tiền"
- Giao dịch lớn nhất hiển thị đầu tiên
- Useful để review chi tiêu lớn

### 4. Xem giao dịch gần đây
- Default sort by date
- Giao dịch mới nhất hiển thị đầu tiên
- Useful để track chi tiêu hàng ngày

## Benefits

1. **Transparency**: Mọi người thấy rõ từng khoản chi
2. **Accountability**: Biết ai đã trả cho gì
3. **Analysis**: Dễ dàng phân tích pattern chi tiêu
4. **Verification**: Kiểm tra lại các giao dịch
5. **Planning**: Lập kế hoạch chi tiêu tương lai

## Future Enhancements

1. **Search**: Tìm kiếm theo note
2. **Date Filter**: Lọc theo ngày cụ thể
3. **Amount Range**: Lọc theo khoảng số tiền
4. **Export**: Export danh sách ra CSV/Excel
5. **Pagination**: Phân trang khi có nhiều transactions
6. **Click to Edit**: Click vào transaction để edit (nếu có quyền)
