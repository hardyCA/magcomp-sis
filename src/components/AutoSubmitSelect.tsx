"use client";

type Opcion = { value: string; label: string };

export function AutoSubmitSelect({
  name,
  defaultValue,
  opciones,
}: {
  name: string;
  defaultValue: string;
  opciones: Opcion[];
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="select select-bordered w-full"
      onChange={(e) => e.currentTarget.form?.submit()}
    >
      {opciones.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}