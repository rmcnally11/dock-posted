import { cn } from "@/lib/utils";

const PHOTOS = {
  cover: "/brand/cover.jpg",
  board: "/brand/board.jpg",
  pump: "/brand/pump.jpg",
  storm: "/brand/storm.jpg",
  close: "/brand/close.jpg",
} as const;

export type BrandPhotoName = keyof typeof PHOTOS;

export function BrandPhoto({
  name,
  className = "",
}: {
  name: BrandPhotoName;
  className?: string;
}) {
  return (
    <figure className={cn("overflow-hidden rounded-2xl bg-[color:var(--navy)]", className)}>
      {/* Decorative. Empty alt keeps page copy tests from reading the frame. */}
      <img src={PHOTOS[name]} alt="" className="h-full w-full object-cover" />
    </figure>
  );
}
