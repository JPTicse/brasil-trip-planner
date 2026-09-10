import Link from "next/link";

export function Logo({
  size = "md",
  href = "/",
}: {
  size?: "sm" | "md" | "lg";
  href?: string | null;
}) {
  const sizes = {
    sm: { box: "h-8 w-8", icon: "h-4 w-4" },
    md: { box: "h-10 w-10", icon: "h-5 w-5" },
    lg: { box: "h-20 w-20", icon: "h-10 w-10" },
  };
  const s = sizes[size];

  const content = (
    <div
      className={`flex ${s.box} items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-md transition group-hover:scale-105`}
    >
      <svg
        className={`${s.icon} text-white`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
      </svg>
    </div>
  );

  if (href === null) return content;

  return (
    <Link href={href} className="group">
      {content}
    </Link>
  );
}
