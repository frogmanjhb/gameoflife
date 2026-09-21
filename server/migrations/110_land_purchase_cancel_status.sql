-- Allow students to cancel pending land purchase (buy) requests

ALTER TABLE land_purchase_requests DROP CONSTRAINT IF EXISTS land_purchase_requests_status_check;

ALTER TABLE land_purchase_requests
ADD CONSTRAINT land_purchase_requests_status_check
CHECK (status IN (
  'pending_fm',
  'pending_engineer',
  'pending_teacher',
  'approved',
  'denied',
  'cancelled'
));
