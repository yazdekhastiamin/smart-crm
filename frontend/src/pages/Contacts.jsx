import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.contacts.list().then(setContacts).catch((err) => setError(err.message));
  }, []);

  return (
    <div>
      <h1>مخاطبین</h1>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <ul>
        {contacts.map((contact) => (
          <li key={contact.id}>
            {contact.name} {contact.company ? `— ${contact.company}` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}
