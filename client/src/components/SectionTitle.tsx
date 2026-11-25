type SectionTitleProps = {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "center" | "left";
  tone?: "light" | "dark";
};

export default function SectionTitle({
  eyebrow,
  title,
  description,
  align = "center",
  tone = "light",
}: SectionTitleProps) {
  const isCenter = align === "center";
  const isDark = tone === "dark";

  return (
    <div className={`${isCenter ? "mx-auto text-center" : ""} max-w-2xl`}>
      <span
        className={`inline-flex items-center gap-3 text-xs font-medium uppercase tracking-[0.3em] ${
          isDark ? "text-sand" : "text-primary"
        }`}
      >
        <span className={`h-px w-8 ${isDark ? "bg-sand/60" : "bg-primary/40"}`} aria-hidden="true" />
        {eyebrow}
        {isCenter && (
          <span className={`h-px w-8 ${isDark ? "bg-sand/60" : "bg-primary/40"}`} aria-hidden="true" />
        )}
      </span>
      <h2
        className={`mt-5 font-serif text-4xl font-medium leading-[1.1] md:text-5xl lg:text-[3.5rem] ${
          isDark ? "text-white" : "text-foreground"
        }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-5 text-base leading-relaxed md:text-lg ${
            isDark ? "text-white/75" : "text-muted-foreground"
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}
