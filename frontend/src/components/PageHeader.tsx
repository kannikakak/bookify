import { PAGE_TITLE_MAP } from "../constants";
import type { Section } from "../types/forms";

interface PageHeaderProps {
  section: Section;
}

export const PageHeader = ({ section }: PageHeaderProps) => {
  const { title, description } = PAGE_TITLE_MAP[section];

  return (
    <header className="page-header">
      <div>
        <p className="page-label">{section}</p>
        <h1>{title}</h1>
        <p className="page-copy">{description}</p>
      </div>
    </header>
  );
};
