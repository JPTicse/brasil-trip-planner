import Image from "next/image";

/**
 * Wrapper around next/image with `fill` mode for cached, optimized images.
 * The parent element must have `position: relative` and explicit dimensions
 * (width/height). Use `className` for object-fit and rounding.
 *
 * Use `unoptimized` for ephemeral URLs that can't be proxied server-side
 * (e.g. Google Places JS API photo URLs with session tokens).
 */
export function CachedImage({
  src,
  alt,
  className,
  sizes,
  unoptimized = false,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  unoptimized?: boolean;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes ?? "100px"}
      className={className}
      unoptimized={unoptimized}
    />
  );
}
