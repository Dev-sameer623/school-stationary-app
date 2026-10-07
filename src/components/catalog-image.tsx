import Image from "next/image";
import { cn } from "@/lib/utils";

export function CatalogImage({
  src,
  alt,
  className,
  sizes = "256px",
  preload = false,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  sizes?: string;
  preload?: boolean;
}) {
  if (!src) {
    return (
      <div
        className={cn("bg-muted", className)}
        role="img"
        aria-label={`${alt} has no image`}
      />
    );
  }

  return (
    <span className={cn("relative block overflow-hidden", className)}>
      <Image src={src} alt={alt} fill className="object-cover" sizes={sizes} preload={preload} />
    </span>
  );
}
