import { MENU_ITEMS } from "../constants";
import type { Section } from "../types/forms";

interface SidebarProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
}

export const Sidebar = ({ activeSection, onSectionChange }: SidebarProps) => {
  return (
    <aside className="sidebar">
      <div className="logo">
        <img src="/logo.jpg" alt="" className="sidebar-logo-mark" aria-hidden="true" />
        <div className="brand-copy">
          <strong>BOOKIFY</strong>
          <span>Bookshop</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {MENU_ITEMS.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`nav-item ${activeSection === item.key ? "active" : ""}`}
            onClick={() => onSectionChange(item.key)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="sidebar-note">
        <strong>Product records</strong>
        <span>Books, stock quantity, buy price, sell price, and expenses are stored in MySQL.</span>
      </div>
    </aside>
  );
};
