-- ENUMS
CREATE TYPE public.app_role AS ENUM ('artisan','buyer','admin');
CREATE TYPE public.product_status AS ENUM ('draft','published');

-- updated_at helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  role public.app_role NOT NULL DEFAULT 'artisan',
  phone TEXT,
  location TEXT,
  craft_specialty TEXT,
  bio TEXT,
  avatar_url TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'role',''), 'artisan')::public.app_role
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- PRODUCTS
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artisan_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'Handicraft',
  craft_type TEXT,
  materials TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  price_min NUMERIC(10,2) NOT NULL DEFAULT 0,
  price_max NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  image_url TEXT,
  status public.product_status NOT NULL DEFAULT 'published',
  location TEXT,
  ai_generated BOOLEAN NOT NULL DEFAULT false,
  views INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX products_artisan_idx ON public.products(artisan_id);
CREATE INDEX products_status_idx ON public.products(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT ON public.products TO anon;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_public_read" ON public.products FOR SELECT USING (status = 'published');
CREATE POLICY "products_owner_read" ON public.products FOR SELECT TO authenticated USING (auth.uid() = artisan_id);
CREATE POLICY "products_owner_insert" ON public.products FOR INSERT TO authenticated WITH CHECK (auth.uid() = artisan_id);
CREATE POLICY "products_owner_update" ON public.products FOR UPDATE TO authenticated USING (auth.uid() = artisan_id) WITH CHECK (auth.uid() = artisan_id);
CREATE POLICY "products_owner_delete" ON public.products FOR DELETE TO authenticated USING (auth.uid() = artisan_id);
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- TRANSLATIONS
CREATE TABLE public.product_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (product_id, language)
);
CREATE INDEX product_translations_product_idx ON public.product_translations(product_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_translations TO authenticated;
GRANT SELECT ON public.product_translations TO anon;
GRANT ALL ON public.product_translations TO service_role;
ALTER TABLE public.product_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "translations_public_read" ON public.product_translations FOR SELECT USING (true);
CREATE POLICY "translations_owner_write" ON public.product_translations FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.artisan_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND p.artisan_id = auth.uid()));

-- BUYER INTEREST
CREATE TABLE public.buyer_interest (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artisan_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'save',
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX buyer_interest_buyer_idx ON public.buyer_interest(buyer_id);
CREATE INDEX buyer_interest_artisan_idx ON public.buyer_interest(artisan_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.buyer_interest TO authenticated;
GRANT ALL ON public.buyer_interest TO service_role;
ALTER TABLE public.buyer_interest ENABLE ROW LEVEL SECURITY;
CREATE POLICY "interest_buyer_read" ON public.buyer_interest FOR SELECT TO authenticated USING (auth.uid() = buyer_id);
CREATE POLICY "interest_artisan_read" ON public.buyer_interest FOR SELECT TO authenticated USING (auth.uid() = artisan_id);
CREATE POLICY "interest_buyer_insert" ON public.buyer_interest FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "interest_buyer_delete" ON public.buyer_interest FOR DELETE TO authenticated USING (auth.uid() = buyer_id);

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX notifications_user_idx ON public.notifications(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_own_read" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications_own_update" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notifications_insert_authenticated" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

-- notify artisan on buyer interest
CREATE OR REPLACE FUNCTION public.notify_artisan_on_interest()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE p_title TEXT;
BEGIN
  SELECT title INTO p_title FROM public.products WHERE id = NEW.product_id;
  INSERT INTO public.notifications (user_id, title, body, link)
  VALUES (NEW.artisan_id,
    CASE WHEN NEW.kind = 'save' THEN 'A buyer saved your product' ELSE 'New buyer enquiry' END,
    COALESCE(NEW.message, p_title), '/product/' || NEW.product_id);
  RETURN NEW;
END; $$;
CREATE TRIGGER on_buyer_interest AFTER INSERT ON public.buyer_interest
FOR EACH ROW EXECUTE FUNCTION public.notify_artisan_on_interest();

-- product view counter
CREATE OR REPLACE FUNCTION public.increment_product_views(_product_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE public.products SET views = views + 1 WHERE id = _product_id AND status = 'published';
$$;
GRANT EXECUTE ON FUNCTION public.increment_product_views(UUID) TO anon, authenticated;

-- STORAGE POLICIES (bucket created separately)
CREATE POLICY "product_images_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
CREATE POLICY "product_images_upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "product_images_update_own" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "product_images_delete_own" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);