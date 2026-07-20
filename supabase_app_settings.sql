CREATE TABLE IF NOT EXISTS public.app_settings (
  id text PRIMARY KEY DEFAULT 'default',
  app_name text NOT NULL DEFAULT 'Gosball',
  app_handle text NOT NULL DEFAULT '@GOSBALL',
  app_logo_url text NOT NULL DEFAULT '/brand/gosball-alt.png',
  app_subtitle text NOT NULL DEFAULT 'MEDIA APP',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.app_settings (id, app_name, app_handle, app_logo_url, app_subtitle)
VALUES ('default', 'Gosball', '@GOSBALL', '/brand/gosball-alt.png', 'MEDIA APP')
ON CONFLICT (id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.set_app_settings_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS app_settings_updated_at ON public.app_settings;
CREATE TRIGGER app_settings_updated_at
BEFORE UPDATE ON public.app_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_app_settings_updated_at();

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read app settings" ON public.app_settings;
CREATE POLICY "Read app settings"
ON public.app_settings
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Service role manage app settings" ON public.app_settings;
CREATE POLICY "Service role manage app settings"
ON public.app_settings
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-logos', 'brand-logos', true)
ON CONFLICT (id) DO UPDATE SET public = excluded.public;

DROP POLICY IF EXISTS "Read brand logos" ON storage.objects;
CREATE POLICY "Read brand logos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'brand-logos');

DROP POLICY IF EXISTS "Service role manage brand logos" ON storage.objects;
CREATE POLICY "Service role manage brand logos"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'brand-logos')
WITH CHECK (bucket_id = 'brand-logos');
