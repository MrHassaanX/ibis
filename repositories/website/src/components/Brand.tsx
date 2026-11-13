import Image from "next/image";
export function Brand({
  variant = "horizontal",
  className = "",
}: {
  variant?: "horizontal" | "stacked" | "white" | "icon" | "black";
  className?: string;
}) {
  const sizes =
    variant === "horizontal"
      ? [2048, 682]
      : variant === "icon"
        ? [1254, 1254]
        : [1122, 1402];
  return (
    <Image
      className={`brand brand-${variant} ${className}`}
      src={`/brand/optimized/${variant}.webp`}
      alt="IbisPanel"
      width={sizes[0]}
      height={sizes[1]}
      sizes={variant === "horizontal" ? "200px" : "300px"}
    />
  );
}
