-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'settlement')),
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Trigger Function for Settlements
CREATE OR REPLACE FUNCTION handle_settlement_notification()
RETURNS TRIGGER AS $$
DECLARE
    sender_name TEXT;
    receiver_name TEXT;
    member_record RECORD;
BEGIN
    SELECT name INTO sender_name FROM households WHERE id = NEW.from_household_id;
    SELECT name INTO receiver_name FROM households WHERE id = NEW.to_household_id;

    -- Case 1: New settlement request (Pending) -> Notify Receiver
    IF (TG_OP = 'INSERT' AND NEW.status = 'pending') THEN
        FOR member_record IN 
            SELECT user_id FROM household_members WHERE household_id = NEW.to_household_id
        LOOP
            INSERT INTO notifications (user_id, title, message, type, link)
            VALUES (
                member_record.user_id,
                'Yêu cầu thanh toán mới',
                'Hộ ' || sender_name || ' đã gửi yêu cầu xác nhận thanh toán ' || to_char(NEW.amount, 'FM999,999,999') || 'đ',
                'settlement',
                '/settlements'
            );
        END LOOP;
    END IF;

    -- Case 2: Settlement confirmed -> Notify Sender
    IF (TG_OP = 'UPDATE' AND NEW.status = 'confirmed' AND OLD.status = 'pending') THEN
         FOR member_record IN 
            SELECT user_id FROM household_members WHERE household_id = NEW.from_household_id
        LOOP
            INSERT INTO notifications (user_id, title, message, type, link)
            VALUES (
                member_record.user_id,
                'Thanh toán được xác nhận',
                'Hộ ' || receiver_name || ' đã xác nhận thanh toán của bạn.',
                'success',
                '/settlements'
            );
        END LOOP;
    END IF;

    -- Case 3: Settlement rejected -> Notify Sender
    IF (TG_OP = 'UPDATE' AND NEW.status = 'rejected' AND OLD.status = 'pending') THEN
         FOR member_record IN 
            SELECT user_id FROM household_members WHERE household_id = NEW.from_household_id
        LOOP
            INSERT INTO notifications (user_id, title, message, type, link)
            VALUES (
                member_record.user_id,
                'Thanh toán bị từ chối',
                'Hộ ' || receiver_name || ' đã từ chối yêu cầu thanh toán. Lý do: ' || COALESCE(NEW.rejected_reason, 'Không có'),
                'error',
                '/settlements'
            );
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Trigger
DROP TRIGGER IF EXISTS on_settlement_change ON settlements;
CREATE TRIGGER on_settlement_change
    AFTER INSERT OR UPDATE ON settlements
    FOR EACH ROW
    EXECUTE FUNCTION handle_settlement_notification();
