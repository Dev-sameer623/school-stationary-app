import Image from "next/image";
import { cn } from "@/lib/utils";

export function CatalogImage({
  src,
  alt,
  className,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
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
      <Image src={src} alt={alt} fill className="object-cover" sizes="256px" />
    </span>
  );
}
