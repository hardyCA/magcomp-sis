import Link from "next/link";

export function Paginador({
  pagina,
  totalPaginas,
  path,
}: {
  pagina: number;
  totalPaginas: number;
  path: string;
}) {
  if (totalPaginas <= 1) return null;

  const enlaces: (number | "…")[] = [];
  const inicio = Math.max(1, pagina - 1);
  const fin = Math.min(totalPaginas, pagina + 1);

  if (inicio > 1) enlaces.push(1);
  if (inicio > 2) enlaces.push("…");
  for (let i = inicio; i <= fin; i++) enlaces.push(i);
  if (fin < totalPaginas - 1) enlaces.push("…");
  if (fin < totalPaginas) enlaces.push(totalPaginas);

  const url = (p: number) => (p === 1 ? path : `${path}?pagina=${p}`);

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Paginación">
      {pagina > 1 ? (
        <Link href={url(pagina - 1)} className="btn btn-ghost btn-sm">
          ← Anterior
        </Link>
      ) : (
        <span className="btn btn-ghost btn-sm btn-disabled">← Anterior</span>
      )}

      <div className="join">
        {enlaces.map((enlace, i) =>
          enlace === "…" ? (
            <span key={`e${i}`} className="join-item btn btn-sm btn-disabled">
              …
            </span>
          ) : (
            <Link
              key={enlace}
              href={url(enlace)}
              className={`join-item btn btn-sm ${
                enlace === pagina ? "btn-primary" : "btn-ghost"
              }`}
            >
              {enlace}
            </Link>
          )
        )}
      </div>

      {pagina < totalPaginas ? (
        <Link href={url(pagina + 1)} className="btn btn-ghost btn-sm">
          Siguiente →
        </Link>
      ) : (
        <span className="btn btn-ghost btn-sm btn-disabled">Siguiente →</span>
      )}
    </nav>
  );
}