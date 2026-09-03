export function SectionLabel({
  number,
  title,
}: {
  number: string;
  title?: string;
}) {
  return (
    <div className="section-label">
      <span className="section-num">{number}</span>
      {title && <span className="section-title">{title}</span>}
    </div>
  );
}
