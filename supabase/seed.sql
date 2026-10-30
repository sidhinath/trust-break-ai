truncate table public.scan_history restart identity cascade;
truncate table public.scam_reports restart identity cascade;

insert into public.scan_history (
  scan_type,
  input_content,
  fraud_score,
  risk_level,
  ai_analysis,
  reasons,
  screenshot_url,
  source,
  metadata,
  created_at
) values
('message', 'Your account is locked. Verify now at secure-paypa1-check.com', 92, 'scam', 'Classic credential phishing language with urgency and fake domain patterns.', array['Urgency pressure', 'Credential harvesting', 'Lookalike domain'], null, 'web', '{"channel":"sms"}'::jsonb, now() - interval '2 days'),
('link', 'https://bit.ly/3fakebankverify', 81, 'scam', 'Shortener plus suspicious banking verification path.', array['Short URL', 'Bank impersonation'], null, 'web', '{"channel":"browser"}'::jsonb, now() - interval '1 day 20 hours'),
('message', 'Reminder: your parcel is delayed. Pay customs fee to release.', 67, 'suspicious', 'Delivery pretext and payment request likely social engineering.', array['Payment pressure', 'Delivery scam pattern'], null, 'web', '{"channel":"whatsapp"}'::jsonb, now() - interval '1 day 12 hours'),
('link', 'https://github.com/supabase/supabase', 8, 'safe', 'Legitimate well-known domain and benign path.', array['Trusted host signals'], null, 'web', '{"channel":"browser"}'::jsonb, now() - interval '1 day 8 hours'),
('screenshot', 'Screenshot scan', 55, 'suspicious', 'Image included suspicious language but limited confidence from OCR-less mode.', array['Image-only analysis'], 'https://ysvmcaeyffxzwyjwiyka.supabase.co/storage/v1/object/public/evidence/demo-1.png', 'web', '{"channel":"image"}'::jsonb, now() - interval '1 day 4 hours'),
('message', 'Congratulations! You won a reward, share OTP to claim instantly.', 89, 'scam', 'Prize lure + OTP request is a high-confidence fraud pattern.', array['Reward scam', 'OTP theft'], null, 'web', '{"channel":"telegram"}'::jsonb, now() - interval '22 hours'),
('link', 'http://secure-update-wallet-login.net/auth', 84, 'scam', 'Non-HTTPS and wallet login lure with suspicious domain.', array['No HTTPS', 'Credential lure'], null, 'web', '{"channel":"browser"}'::jsonb, now() - interval '20 hours'),
('message', 'Team meeting moved to 4 PM. Please confirm.', 3, 'safe', 'No scam markers detected.', array[]::text[], null, 'web', '{"channel":"email"}'::jsonb, now() - interval '18 hours'),
('message', 'Tax refund pending. Submit card details today to avoid penalty.', 86, 'scam', 'Government pretext and sensitive data request.', array['Government impersonation', 'Sensitive data request'], null, 'web', '{"channel":"sms"}'::jsonb, now() - interval '16 hours'),
('link', 'https://accounts.google.com/signin/v2', 6, 'safe', 'Expected Google auth endpoint structure.', array['Trusted host signals'], null, 'web', '{"channel":"browser"}'::jsonb, now() - interval '14 hours'),
('message', 'Your UPI payment to John of INR 12,000 is processing. Report if not you.', 58, 'suspicious', 'Could be social engineering pretext, needs user verification.', array['Financial trigger language'], null, 'web', '{"channel":"sms"}'::jsonb, now() - interval '10 hours'),
('link', 'https://amaz0n-security-check.example.com/login', 95, 'scam', 'High confidence brand impersonation and credential trap.', array['Brand impersonation', 'Credential lure'], null, 'web', '{"channel":"browser"}'::jsonb, now() - interval '6 hours'),
('screenshot', 'Screenshot scan', 42, 'suspicious', 'Moderate social engineering indicators in visual content.', array['Suspicious call to action'], 'https://ysvmcaeyffxzwyjwiyka.supabase.co/storage/v1/object/public/evidence/demo-2.png', 'web', '{"channel":"image"}'::jsonb, now() - interval '4 hours'),
('message', 'Security alert: unusual login from Moscow, reset password here.', 78, 'scam', 'Account compromise scare tactic with malicious reset link.', array['Fear tactic', 'Password reset lure'], null, 'web', '{"channel":"email"}'::jsonb, now() - interval '2 hours'),
('link', 'https://news.ycombinator.com', 4, 'safe', 'No suspicious link structure detected.', array[]::text[], null, 'web', '{"channel":"browser"}'::jsonb, now() - interval '40 minutes');

insert into public.scam_reports (
  report_type,
  scam_content,
  phone_number,
  url,
  screenshot_url,
  fraud_score,
  ai_analysis,
  risk_level,
  region,
  country,
  upvotes,
  status,
  metadata,
  created_at
) values
('message', 'Caller claimed to be bank support and asked for OTP.', '+1-202-555-0101', null, null, 88, 'Bank impersonation with OTP extraction objective.', 'scam', 'New York', 'USA', 14, 'verified', '{"source":"community"}'::jsonb, now() - interval '2 days'),
('link', 'Phishing page pretending to be courier tracking portal.', null, 'https://track-delivery-fast-help.com', null, 83, 'Delivery scam using fake tracking and payment step.', 'scam', 'London', 'UK', 10, 'verified', '{"source":"community"}'::jsonb, now() - interval '1 day 18 hours'),
('phone', 'Automated call threatening SIM block unless number is verified.', '+91-90000-12345', null, null, 72, 'Telephony pressure tactic consistent with fraud campaigns.', 'suspicious', 'Delhi', 'India', 8, 'pending', '{"source":"community"}'::jsonb, now() - interval '1 day 9 hours'),
('website', 'Investment site promised 5x return in 7 days.', null, 'https://fastdouble-asset.pro', null, 90, 'Unrealistic returns and urgency indicate scam funnel.', 'scam', 'Mumbai', 'India', 22, 'verified', '{"source":"community"}'::jsonb, now() - interval '1 day 3 hours'),
('screenshot', 'Instagram DM asks to pay shipping before receiving giveaway prize.', null, null, 'https://ysvmcaeyffxzwyjwiyka.supabase.co/storage/v1/object/public/evidence/demo-3.png', 69, 'Giveaway pretext with payment ask is high risk.', 'suspicious', 'Toronto', 'Canada', 5, 'pending', '{"source":"community"}'::jsonb, now() - interval '20 hours'),
('message', 'Tax department notice threatening arrest for unpaid dues.', null, null, null, 87, 'Fear-based government impersonation scam pattern.', 'scam', 'Sydney', 'Australia', 12, 'verified', '{"source":"community"}'::jsonb, now() - interval '16 hours'),
('link', 'Fake account recovery page for social media login.', null, 'http://secure-social-recover.net', null, 80, 'Credential theft intent with weak domain trust markers.', 'scam', 'Berlin', 'Germany', 9, 'pending', '{"source":"community"}'::jsonb, now() - interval '11 hours'),
('other', 'Unknown sender asked for gift card codes to release customs parcel.', null, null, null, 74, 'Gift-card payout request is common fraud indicator.', 'suspicious', 'Lagos', 'Nigeria', 7, 'pending', '{"source":"community"}'::jsonb, now() - interval '7 hours'),
('message', 'WhatsApp message from fake HR offering remote job after fee payment.', null, null, null, 85, 'Advance-fee employment scam profile.', 'scam', 'Sao Paulo', 'Brazil', 15, 'verified', '{"source":"community"}'::jsonb, now() - interval '3 hours'),
('website', 'Clone checkout page copied from major electronics store.', null, 'https://shop-secure-checkout-now.com', null, 91, 'Checkout clone and payment diversion suggest full phishing operation.', 'scam', 'Tokyo', 'Japan', 18, 'verified', '{"source":"community"}'::jsonb, now() - interval '50 minutes');
