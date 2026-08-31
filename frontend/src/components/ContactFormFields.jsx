export default function ContactFormFields({ values, onChange }) {
  function set(field) {
    return (e) => onChange({ ...values, [field]: e.target.value });
  }

  return (
    <div className="form-grid">
      <label>
        نام مشتری / شرکت *
        <input value={values.name} onChange={set("name")} required autoFocus />
      </label>
      <label>
        شرکت
        <input value={values.company} onChange={set("company")} />
      </label>
      <label>
        سمت
        <input value={values.position} onChange={set("position")} />
      </label>
      <label>
        شهر
        <input value={values.city} onChange={set("city")} />
      </label>
      <label>
        تلفن
        <input value={values.phone} onChange={set("phone")} />
      </label>
      <label>
        ایمیل
        <input type="email" value={values.email} onChange={set("email")} />
      </label>
      <label className="form-grid-full">
        یادداشت
        <textarea value={values.notes} onChange={set("notes")} rows={2} />
      </label>
    </div>
  );
}

export const emptyContact = {
  name: "",
  company: "",
  position: "",
  city: "",
  phone: "",
  email: "",
  notes: "",
};
