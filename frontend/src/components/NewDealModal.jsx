import { useEffect, useState } from "react";
import Modal from "./Modal";
import ContactFormFields, { emptyContact } from "./ContactFormFields";
import { api } from "../services/api";

export default function NewDealModal({ stages, onClose, onCreated }) {
  const [contacts, setContacts] = useState([]);
  const [contactMode, setContactMode] = useState("existing"); // "existing" | "new"
  const [contactId, setContactId] = useState("");
  const [newContact, setNewContact] = useState(emptyContact);

  const openStages = stages.filter((stage) => !stage.isWon && !stage.isLost);
  const [stageId, setStageId] = useState(openStages[0]?.id ?? "");
  const [value, setValue] = useState("");
  const [title, setTitle] = useState("");

  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.contacts.list().then((list) => {
      setContacts(list);
      if (list.length > 0) setContactId(String(list[0].id));
      else setContactMode("new");
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!value || !stageId) return;
    if (contactMode === "existing" && !contactId) return;
    if (contactMode === "new" && !newContact.name.trim()) return;

    setSaving(true);
    setError(null);
    try {
      let resolvedContactId = contactId;
      let contactName = contacts.find((c) => String(c.id) === String(contactId))?.name;

      if (contactMode === "new") {
        const created = await api.contacts.create(newContact);
        resolvedContactId = created.id;
        contactName = created.name;
      }

      const deal = await api.deals.create({
        title: title.trim() || `فروش به ${contactName}`,
        value: Number(value),
        contactId: resolvedContactId,
        stageId,
      });
      onCreated(deal);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="فرصت فروش جدید" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="form-tabs">
          <button
            type="button"
            className={contactMode === "existing" ? "active" : ""}
            onClick={() => setContactMode("existing")}
          >
            مخاطب موجود
          </button>
          <button
            type="button"
            className={contactMode === "new" ? "active" : ""}
            onClick={() => setContactMode("new")}
          >
            مخاطب جدید
          </button>
        </div>

        {contactMode === "existing" ? (
          <label>
            مخاطب
            <select value={contactId} onChange={(e) => setContactId(e.target.value)}>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name} {contact.company ? `— ${contact.company}` : ""}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <ContactFormFields values={newContact} onChange={setNewContact} />
        )}

        <div className="form-grid">
          <label>
            مرحله اولیه
            <select value={stageId} onChange={(e) => setStageId(Number(e.target.value))}>
              {openStages.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            ارزش ریالی (تومان) *
            <input type="number" min="0" value={value} onChange={(e) => setValue(e.target.value)} required />
          </label>
          <label className="form-grid-full">
            عنوان (اختیاری)
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="فروش به ..." />
          </label>
        </div>

        {error && <p className="form-error">{error}</p>}
        <div className="form-actions">
          <button type="submit" disabled={saving}>
            {saving ? "در حال ذخیره..." : "ذخیره"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
