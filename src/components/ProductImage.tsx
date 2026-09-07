import { useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";
import { resolveImageUrl } from "@/lib/artisan";
import { cn } from "@/lib/utils";

/** Renders a product photo stored in the private bucket via a signed URL. */
export function ProductImage({
  path,
  alt,
  className,
}: {
  path: string | null;
  alt: string;
  className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setUrl(null);
    setFailed(false);
    void resolveImageUrl(path).then((next) => {
      if (active) setUrl(next);
    });
    return () => {
      active = false;
    };
  }, [path]);

  if (!path || failed) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-muted text-muted-foreground",
          className,
        )}
      >
        <ImageIcon className="h-8 w-8 opacity-50" aria-hidden />
      </div>
    );
  }

  if (!url) {
    return <div className={cn("bg-muted animate-pulse", className)} aria-hidden />;
  }

  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
    />
  );
}
