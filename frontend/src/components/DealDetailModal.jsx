import { useEffect, useState } from "react";
import Modal from "./Modal";
import ContactFormFields from "./ContactFormFields";
import { api } from "../services/api";
import { formatPercent } from "../utils/format";

const ACTIVITY_TYPES = [
  { value: "call", label: "تماس" },
  { value: "meeting", label: "جلسه" },
  { value: "note", label: "یادداشت" },
  { value: "email", label: "ایمیل" },
  { value: "task", label: "یادآور/تسک" },
];

function toDateInputValue(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().slice(0, 10);
}

export default function DealDetailModal({ dealId, onClose, onChanged }) {
  const [deal, setDeal] = useState(null);
  const [stages, setStages] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState(null);
  const [editingContact, setEditingContact] = useState(false);
  const [contactForm, setContactForm] = useState(null);
  const [savingContact, setSavingContact] = useState(false);

  const [activityType, setActivityType] = useState("call");
  const [activityContent, setActivityContent] = useState("");
  const [loggingActivity, setLoggingActivity] = useState(false);

  useEffect(() => {
    Promise.all([api.deals.get(dealId), api.stages.list(), api.users.list()])
      .then(([loadedDeal, loadedStages, loadedUsers]) => {
        setDeal(loadedDeal);
        setStages(loadedStages);
        setUsers(loadedUsers);
        setForm({
          value: loadedDeal.value,
          stageId: loadedDeal.stageId,
          expectedCloseDate: toDateInputValue(loadedDeal.expectedCloseDate),
          ownerId: loadedDeal.ownerId ?? "",
        });
        setContactForm({ ...loadedDeal.contact });
      })
      .catch((err) => setError(err.message));
  }, [dealId]);

  async function refetchDeal() {
    const fresh = await api.deals.get(dealId);
    setDeal(fresh);
  }

  async function handleSaveDeal(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (Number(form.stageId) !== deal.stageId) {
        await api.deals.updateStage(dealId, Number(form.stageId));
      }
      await api.deals.update(dealId, {
        value: Number(form.value),
        ownerId: form.ownerId === "" ? null : Number(form.ownerId),
        expectedCloseDate: form.expectedCloseDate || null,
      });
      await refetchDeal();
      onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveContact(e) {
    e.preventDefault();
    setSavingContact(true);
    setError(null);
    try {
      const updatedContact = await api.contacts.update(deal.contactId, contactForm);
      setDeal((prev) => ({ ...prev, contact: updatedContact }));
      setEditingContact(false);
      onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingContact(false);
    }
  }

  async function handleLogActivity(e) {
    e.preventDefault();
    setLoggingActivity(true);
    setError(null);
    try {
      await api.activities.create({
        type: activityType,
        content: activityContent.trim() || undefined,
        dealId,
        contactId: deal.contactId,
        ownerId: deal.ownerId || undefined,
      });
      setActivityContent("");
      await refetchDeal();
      onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoggingActivity(false);
    }
  }

  if (!deal || !form) {
    return (
      <Modal title="جزئیات فرصت فروش" onClose={onClose} wide>
        {error ? <p className="form-error">{error}</p> : <p>در حال بارگذاری...</p>}
      </Modal>
    );
  }

  const salesReps = users.filter((user) => user.role === "sales_rep");

  return (
    <Modal title={deal.title} onClose={onClose} wide>
      <div className="deal-detail">
        <section className="deal-detail-section">
          <form onSubmit={handleSaveDeal} className="form-grid">
            <label>
              ارزش ریالی (تومان)
              <input
                type="number"
                min="0"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
              />
            </label>
            <label>
              مرحله
              <select value={form.stageId} onChange={(e) => setForm({ ...form, stageId: e.target.value })}>
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              تاریخ تخمینی بسته‌شدن
              <input
                type="date"
                value={form.expectedCloseDate}
                onChange={(e) => setForm({ ...form, expectedCloseDate: e.target.value })}
              />
            </label>
            <label>
              کارشناس فروش
              <select value={form.ownerId} onChange={(e) => setForm({ ...form, ownerId: e.target.value })}>
                <option value="">بدون تخصیص</option>
                {salesReps.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-grid-full form-actions form-actions-between">
              <span className="deal-detail-probability">
                احتمال فعلی: <strong>{formatPercent(deal.probability)}</strong>
              </span>
              <button type="submit" disabled={saving}>
                {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </button>
            </div>
          </form>
        </section>

        <section className="deal-detail-section">
          <div className="deal-detail-section-header">
            <h3>مخاطب</h3>
            <button type="button" className="link-button" onClick={() => setEditingContact((v) => !v)}>
              {editingContact ? "انصراف" : "ویرایش"}
            </button>
          </div>
          {editingContact ? (
            <form onSubmit={handleSaveContact}>
              <ContactFormFields values={contactForm} onChange={setContactForm} />
              <div className="form-actions">
                <button type="submit" disabled={savingContact}>
                  {savingContact ? "در حال ذخیره..." : "ذخیره مخاطب"}
                </button>
              </div>
            </form>
          ) : (
            <div className="contact-summary">
              <div>
                {deal.contact.name}
                {deal.contact.company ? ` — ${deal.contact.company}` : ""}
              </div>
              {deal.contact.phone && <div>{deal.contact.phone}</div>}
              {deal.contact.email && <div>{deal.contact.email}</div>}
              {deal.contact.city && <div>{deal.contact.city}</div>}
            </div>
          )}
        </section>

        <section className="deal-detail-section">
          <h3>ثبت تعامل جدید</h3>
          <form onSubmit={handleLogActivity} className="activity-form">
            <select value={activityType} onChange={(e) => setActivityType(e.target.value)}>
              {ACTIVITY_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            <input
              value={activityContent}
              onChange={(e) => setActivityContent(e.target.value)}
              placeholder="توضیح کوتاه..."
            />
            <button type="submit" disabled={loggingActivity}>
              {loggingActivity ? "..." : "ثبت"}
            </button>
          </form>
        </section>

        <section className="deal-detail-section">
          <h3>تاریخچه تعاملات</h3>
          {deal.activities.length === 0 && <p className="pipeline-empty">هنوز تعاملی ثبت نشده</p>}
          <ul className="activity-timeline">
            {deal.activities.map((activity) => (
              <li key={activity.id}>
                <span className="activity-type">
                  {ACTIVITY_TYPES.find((type) => type.value === activity.type)?.label || activity.type}
                </span>
                <span className="activity-content">{activity.content}</span>
                <span className="activity-date">
                  {new Date(activity.createdAt).toLocaleDateString("fa-IR")}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {error && <p className="form-error">{error}</p>}
      </div>
    </Modal>
  );
}
