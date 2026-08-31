import { useState } from "react";
import Modal from "./Modal";
import ContactFormFields, { emptyContact } from "./ContactFormFields";
import { api } from "../services/api";

export default function NewContactModal({ onClose, onCreated }) {
  const [values, setValues] = useState(emptyContact);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!values.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const contact = await api.contacts.create(values);
      onCreated(contact);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="مخاطب جدید" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <ContactFormFields values={values} onChange={setValues} />
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
