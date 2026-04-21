export const TopBar = () => {
  return (
    <header className="topbar">
      <button type="button" className="menu-button" aria-label="Toggle menu">
        =
      </button>
      <span>Stock Management System - Bookify - Admin</span>
      <div className="admin-pill">
        <span className="admin-avatar">A</span>
        Administrator Admin
      </div>
    </header>
  );
};
