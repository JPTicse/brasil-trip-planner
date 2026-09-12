import Image from "next/image";

/**
 * Wrapper around next/image with `fill` mode for cached, optimized images.
 * The parent element must have `position: relative` and explicit dimensions
 * (width/height). Use `className` for object-fit and rounding.
 */
export function CachedImage({
  src,
  alt,
  className,
  sizes,
}: {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes ?? "100px"}
      className={className}
    />
  );
}
