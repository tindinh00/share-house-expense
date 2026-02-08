-- Migration: Create settlements table for tracking payment confirmations
-- Created: 2026-02-08
-- Description: Enables 2-way confirmation flow between households

-- Bảng settlements: Theo dõi các yêu cầu thanh toán giữa các hộ gia đình
CREATE TABLE settlements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES rooms ON DELETE CASCADE NOT NULL,
  
  -- Ai trả cho ai
  from_household_id UUID REFERENCES households ON DELETE CASCADE NOT NULL,
  to_household_id UUID REFERENCES households ON DELETE CASCADE NOT NULL,
  
  -- Danh sách transaction IDs được thanh toán
  transaction_ids UUID[] NOT NULL,
  
  -- Tổng số tiền thanh toán
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  
  -- Trạng thái: pending (chờ xác nhận) / confirmed (đã xác nhận) / rejected (từ chối)
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected')),
  
  -- Người yêu cầu thanh toán
  requested_by UUID REFERENCES profiles NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  -- Người xác nhận (null nếu chưa xác nhận)
  confirmed_by UUID REFERENCES profiles,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  
  -- Lý do từ chối (null nếu không reject)
  rejected_reason TEXT,
  
  -- Ghi chú
  note TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Indexes for performance
CREATE INDEX idx_settlements_room ON settlements(room_id);
CREATE INDEX idx_settlements_status ON settlements(status);
CREATE INDEX idx_settlements_from_household ON settlements(from_household_id);
CREATE INDEX idx_settlements_to_household ON settlements(to_household_id);
CREATE INDEX idx_settlements_requested_by ON settlements(requested_by);

-- Enable Row Level Security
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view settlements in rooms they belong to (via household membership)
CREATE POLICY "Users can view settlements in their rooms"
  ON settlements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_members rm
      JOIN household_members hm ON rm.household_id = hm.household_id
      WHERE rm.room_id = settlements.room_id
      AND hm.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM room_members rm
      WHERE rm.room_id = settlements.room_id
      AND rm.user_id = auth.uid()
    )
  );

-- Users can create settlements if they are in the from_household
CREATE POLICY "Users can create settlements for their household"
  ON settlements FOR INSERT
  WITH CHECK (
    requested_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = from_household_id
      AND hm.user_id = auth.uid()
    )
  );

-- Users can update settlements if they are in the to_household (to confirm/reject)
CREATE POLICY "Receivers can update settlement status"
  ON settlements FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = to_household_id
      AND hm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM household_members hm
      WHERE hm.household_id = to_household_id
      AND hm.user_id = auth.uid()
    )
  );

-- Function to mark transactions as settled when settlement is confirmed
CREATE OR REPLACE FUNCTION handle_settlement_confirmed()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run when status changes to 'confirmed'
  IF NEW.status = 'confirmed' AND OLD.status = 'pending' THEN
    -- Update all transactions in the settlement to is_settled = true
    UPDATE transactions
    SET is_settled = TRUE
    WHERE id = ANY(NEW.transaction_ids);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-update transactions when settlement is confirmed
CREATE TRIGGER on_settlement_confirmed
  AFTER UPDATE ON settlements
  FOR EACH ROW
  EXECUTE FUNCTION handle_settlement_confirmed();
