import { Link } from "@tanstack/react-router";
import { Sparkles, Eye } from "lucide-react";
import { ProductImage } from "@/components/ProductImage";
import { Badge } from "@/components/ui/badge";
import { formatPriceRange, type Product } from "@/lib/artisan";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to="/product/$id"
      params={{ id: product.id }}
      className="group card-surface animate-rise overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
    >
      <div className="relative aspect-4/3 overflow-hidden">
        <ProductImage
          path={product.image_url}
          alt={product.title}
          className="h-full w-full transition-transform duration-500 group-hover:scale-105"
        />
        {product.ai_generated && (
          <span className="bg-gradient-indigo text-accent-foreground absolute top-3 left-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium">
            <Sparkles className="h-3 w-3" aria-hidden /> AI catalogued
          </span>
        )}
      </div>
      <div className="space-y-2 p-4">
        <p className="text-muted-foreground text-xs tracking-wide uppercase">{product.category}</p>
        <h3 className="line-clamp-1 text-base font-semibold">{product.title}</h3>
        <p className="text-muted-foreground line-clamp-2 text-sm">{product.description}</p>
        <div className="flex items-center justify-between pt-1">
          <span className="text-primary font-semibold">
            {formatPriceRange(product.price_min, product.price_max, product.currency)}
          </span>
          <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
            <Eye className="h-3.5 w-3.5" aria-hidden /> {product.views}
          </span>
        </div>
        {product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {product.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="font-normal">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
