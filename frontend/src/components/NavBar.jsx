import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "داشبورد", end: true },
  { to: "/contacts", label: "مخاطبین" },
  { to: "/deals", label: "قیف فروش" },
];

export default function NavBar() {
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
    </nav>
  );
}
