/**
 * Shared domain types, constants and helpers for ArtisanLink.
 * Keeps UI components free of data-shape knowledge.
 */
import { supabase } from "@/integrations/supabase/client";

export const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "kn", label: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

export const CATEGORIES = [
  "Textiles & Weaving",
  "Pottery & Ceramics",
  "Woodcraft",
  "Metalwork",
  "Jewellery",
  "Painting & Art",
  "Bamboo & Cane",
  "Leathercraft",
  "Stone Carving",
  "Home Decor",
] as const;

export type Product = {
  id: string;
  artisan_id: string;
  title: string;
  description: string;
  category: string;
  craft_type: string | null;
  materials: string[];
  tags: string[];
  price_min: number;
  price_max: number;
  currency: string;
  image_url: string | null;
  status: "draft" | "published";
  location: string | null;
  ai_generated: boolean;
  views: number;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  full_name: string;
  role: "artisan" | "buyer" | "admin";
  phone: string | null;
  location: string | null;
  craft_specialty: string | null;
  bio: string | null;
  avatar_url: string | null;
  preferred_language: string;
};

export type Translation = {
  language: string;
  title: string;
  description: string;
  category: string | null;
};

/** Price range formatted the way buyers expect: ₹450 - ₹650 */
export function formatPriceRange(min: number, max: number, currency = "INR") {
  const symbol = currency === "INR" ? "₹" : "";
  const round = (n: number) => Math.round(Number(n)).toLocaleString("en-IN");
  if (!min && !max) return "Price on request";
  if (!max || min === max) return `${symbol}${round(min)}`;
  return `${symbol}${round(min)} - ${symbol}${round(max)}`;
}

const signedUrlCache = new Map<string, string>();

/**
 * Product photos live in a private bucket, so we mint short-lived signed URLs.
 * Read access is still governed by storage policies.
 */
export async function resolveImageUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const cached = signedUrlCache.get(path);
  if (cached) return cached;
  const { data, error } = await supabase.storage
    .from("product-images")
    .createSignedUrl(path, 60 * 60);
  if (error || !data?.signedUrl) return null;
  signedUrlCache.set(path, data.signedUrl);
  return data.signedUrl;
}

/** Reads a File into a base64 data URL for the AI vision call. */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the image file"));
    reader.readAsDataURL(file);
  });
}
