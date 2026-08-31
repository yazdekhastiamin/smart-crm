import { useEffect, useState } from "react";
import { api } from "../services/api";
import NewContactModal from "../components/NewContactModal";

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [error, setError] = useState(null);
  const [showNewContact, setShowNewContact] = useState(false);

  useEffect(() => {
    api.contacts.list().then(setContacts).catch((err) => setError(err.message));
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>مخاطبین</h1>
        <button onClick={() => setShowNewContact(true)}>+ مخاطب جدید</button>
      </div>
      {error && <p className="form-error">{error}</p>}
      <ul className="plain-list">
        {contacts.map((contact) => (
          <li key={contact.id}>
            {contact.name} {contact.company ? `— ${contact.company}` : ""}
          </li>
        ))}
      </ul>
      {showNewContact && (
        <NewContactModal
          onClose={() => setShowNewContact(false)}
          onCreated={(contact) => setContacts((prev) => [contact, ...prev])}
        />
      )}
    </div>
  );
}
