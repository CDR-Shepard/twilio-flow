-- Add greeting and voicemail config to tracked numbers
alter table public.tracked_numbers
  add column if not exists greeting_text text,
  add column if not exists voicemail_enabled boolean default false,
  add column if not exists voicemail_prompt text;

-- Store voicemail recording reference on calls
alter table public.calls
  add column if not exists voicemail_url text,
  add column if not exists voicemail_sid text;
