import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "داشبورد", end: true },
  { to: "/contacts", label: "مخاطبین" },
  { to: "/deals", label: "قیف فروش" },
];

export default function NavBar() {
  return (
    <nav className="navbar">
      {links.map((link) => (
        <NavLink key={link.to} to={link.to} end={link.end}>
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
