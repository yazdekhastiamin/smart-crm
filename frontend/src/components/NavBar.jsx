import { NavLink } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

const links = [
  { to: "/", label: "داشبورد", end: true },
  { to: "/contacts", label: "مخاطبین" },
  { to: "/deals", label: "قیف فروش" },
];

export default function NavBar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="navbar">
      <span className="navbar-brand">
        <span className="navbar-brand-mark" aria-hidden="true" />
        Smart CRM
      </span>
      {links.map((link) => (
        <NavLink key={link.to} to={link.to} end={link.end}>
          {link.label}
        </NavLink>
      ))}
      <button
        type="button"
        className="theme-toggle"
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "تغییر به تم روشن" : "تغییر به تم تیره"}
        title={theme === "dark" ? "تم روشن" : "تم تیره"}
      >
        {theme === "dark" ? "☀️" : "🌙"}
      </button>
    </nav>
  );
}
