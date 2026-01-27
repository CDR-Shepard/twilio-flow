-- Store call recording metadata per call
alter table public.calls
  add column if not exists recording_url text,
  add column if not exists recording_sid text,
  add column if not exists recording_duration_seconds integer;
