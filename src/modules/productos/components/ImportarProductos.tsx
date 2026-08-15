"use client";

import { useActionState, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  importarProductos,
  type ImportarProductosState,
} from "@/modules/productos/actions";

const MAX_FILAS = 1000;

const ALIASES: Record<string, string> = {
  nombre: "nombre",
  producto: "nombre",
  name: "nombre",
  descripcion: "nombre",
  codigo_barras: "codigo_barras",
  codigo: "codigo_barras",
  codigo_de_barras: "codigo_barras",
  code: "codigo_barras",
  categoria: "categoria",
  categoria_id: "categoria",
  category: "categoria",
  marca: "marca",
  brand: "marca",
  precio: "precio",
  precio_venta: "precio",
  precio_de_venta: "precio",
  price: "precio",
  stock: "stock",
  cantidad: "stock",
  existencia: "stock",
  stock_minimo: "stock_minimo",
  stock_min: "stock_minimo",
  minimo: "stock_minimo",
  activo: "activo",
  estado: "activo",
};

type FilaProducto = {
  nombre?: unknown;
  codigo_barras?: unknown;
  categoria?: unknown;
  marca?: unknown;
  precio?: unknown;
  stock?: unknown;
  stock_minimo?: unknown;
  activo?: unknown;
};

function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_");
}

function filaValida(f: FilaProducto): boolean {
  const nombre = String(f.nombre ?? "").trim();
  const precio = Number(f.precio);
  const stock = Number(f.stock);
  const stockMinimo = Number(f.stock_minimo);
  return (
    Boolean(nombre) &&
    Number.isFinite(precio) &&
    precio >= 0 &&
    Number.isInteger(stock) &&
    stock >= 0 &&
    Number.isInteger(stockMinimo) &&
    stockMinimo >= 0
  );
}

export function ImportarProductos() {
  const [state, formAction, pending] = useActionState<
    ImportarProductosState,
    FormData
  >(importarProductos, undefined);
  const [filas, setFilas] = useState<FilaProducto[] | null>(null);
  const [nombreArchivo, setNombreArchivo] = useState("");
  const [errorArchivo, setErrorArchivo] = useState("");
  const [enviado, setEnviado] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const modalId = "modal-importar-productos";

  const cerrar = () => {
    (document.getElementById(modalId) as HTMLDialogElement | null)?.close();
  };

  const abrir = () => {
    setFilas(null);
    setNombreArchivo("");
    setErrorArchivo("");
    setEnviado(false);
    if (inputRef.current) inputRef.current.value = "";
    (document.getElementById(modalId) as HTMLDialogElement | null)?.showModal();
  };

  async function manejarArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setErrorArchivo("");
    setEnviado(false);

    try {
      const buf = await archivo.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const hoja = wb.Sheets[wb.SheetNames[0]];
      if (!hoja) {
        setErrorArchivo("El archivo no tiene hojas con datos.");
        return;
      }
      const filasRaw = XLSX.utils.sheet_to_json<unknown[]>(hoja, {
        header: 1,
        defval: "",
      }) as unknown[][];

      const filasConDatos = filasRaw.filter((fila) =>
        fila.some((c) => String(c).trim() !== "")
      );
      if (filasConDatos.length < 2) {
        setErrorArchivo("El archivo no tiene productos. Revisa la primera hoja.");
        return;
      }

      const headers = filasConDatos[0].map((h) => normalizar(String(h)));
      const filasProducto = filasConDatos
        .slice(1)
        .map((fila) => {
          const obj: Record<string, unknown> = {};
          headers.forEach((h, i) => {
            const campo = ALIASES[h];
            if (campo) obj[campo] = fila[i];
          });
          return obj as unknown as FilaProducto;
        })
        .filter(
          (f) =>
            String(f.nombre ?? "").trim() !== "" ||
            String(f.codigo_barras ?? "").trim() !== ""
        );

      if (filasProducto.length === 0) {
        setErrorArchivo(
          "No se encontraron productos. La primera fila debe tener encabezados como Nombre, Precio, Stock."
        );
        return;
      }
      if (filasProducto.length > MAX_FILAS) {
        setErrorArchivo(
          `El archivo tiene más de ${MAX_FILAS} productos. Divide el archivo en partes.`
        );
        return;
      }

      setFilas(filasProducto);
      setNombreArchivo(archivo.name);
    } catch {
      setErrorArchivo(
        "No se pudo leer el archivo. Usa un Excel (.xlsx/.xls) o CSV válido."
      );
    }
  }

  function confirmar() {
    if (!filas || filas.length === 0) return;
    const fd = new FormData();
    fd.set("filas", JSON.stringify(filas));
    formAction(fd);
    setEnviado(true);
  }

  function descargarPlantilla() {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      [
        "Nombre",
        "Código de barras",
        "Categoría",
        "Marca",
        "Precio",
        "Stock",
        "Stock mínimo",
        "Activo",
      ],
      [
        "Laptop ASUS VivoBook 15 i7",
        "1234567890123",
        "Laptops",
        "ASUS",
        "3500",
        "10",
        "2",
        "si",
      ],
      [
        "Mouse inalámbrico",
        "9876543210987",
        "Accesorios",
        "Logitech",
        "150",
        "25",
        "5",
        "si",
      ],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "Productos");
    XLSX.writeFile(wb, "plantilla-productos.xlsx");
  }

  const invalidas = filas ? filas.length - filas.filter(filaValida).length : 0;

  return (
    <>
      <button type="button" onClick={abrir} className="btn btn-outline">
        Importar Excel
      </button>

      <dialog id={modalId} className="modal">
        <div className="modal-box max-w-2xl">
          <h3 className="text-lg font-bold">Importar productos desde Excel</h3>
          <p className="mt-2 text-sm text-base-content/60">
            Sube un archivo <strong>.xlsx</strong>, <strong>.xls</strong> o{" "}
            <strong>.csv</strong>. La primera fila debe contener los encabezados:
            Nombre (obligatorio), Código de barras, Categoría, Marca, Precio,
            Stock, Stock mínimo y Activo.
          </p>

          <div className="mt-4">
            <button
              type="button"
              onClick={descargarPlantilla}
              className="btn btn-outline btn-sm"
            >
              Descargar plantilla
            </button>
          </div>

          <div className="mt-4">
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
              onChange={manejarArchivo}
              className="file-input file-input-bordered w-full"
            />
          </div>

          {errorArchivo ? (
            <div role="alert" className="alert alert-error mt-3 py-2 text-sm">
              <span>{errorArchivo}</span>
            </div>
          ) : null}

          {filas && !errorArchivo ? (
            <div className="mt-4">
              <p className="text-sm">
                <strong>{nombreArchivo}</strong> · se leyeron{" "}
                <strong>{filas.length}</strong> producto
                {filas.length === 1 ? "" : "s"}
                {invalidas > 0 ? (
                  <span className="text-warning">
                    {" "}
                    · {invalidas} con errores (se omitirán)
                  </span>
                ) : null}
              </p>
              <div className="mt-2 max-h-56 overflow-y-auto rounded-box border border-base-300">
                <table className="table table-xs">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Código</th>
                      <th>Categoría</th>
                      <th>Marca</th>
                      <th>Precio</th>
                      <th>Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filas.slice(0, 8).map((f, i) => (
                      <tr key={i} className={filaValida(f) ? "" : "opacity-50"}>
                        <td className="font-medium">{String(f.nombre ?? "")}</td>
                        <td className="font-mono">
                          {String(f.codigo_barras ?? "")}
                        </td>
                        <td>{String(f.categoria ?? "")}</td>
                        <td>{String(f.marca ?? "")}</td>
                        <td>{String(f.precio ?? "")}</td>
                        <td>{String(f.stock ?? "")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {enviado && state?.importados !== undefined ? (
            <div
              role="alert"
              className={`alert mt-4 py-2 text-sm ${
                state.errores?.length ? "alert-warning" : "alert-success"
              }`}
            >
              <span>
                Se importaron <strong>{state.importados}</strong> producto
                {state.importados === 1 ? "" : "s"}
                {state.errores?.length
                  ? ` y hubo ${state.errores.length} fila(s) con errores`
                  : " correctamente"}
                .
              </span>
            </div>
          ) : null}

          {enviado && state?.error ? (
            <div role="alert" className="alert alert-error mt-4 py-2 text-sm">
              <span>{state.error}</span>
            </div>
          ) : null}

          {enviado && state?.errores?.length ? (
            <ul className="mt-2 max-h-40 space-y-0.5 overflow-y-auto rounded-box bg-error/5 p-2 text-xs text-error">
              {state.errores.slice(0, 15).map((e, i) => (
                <li key={i}>{e}</li>
              ))}
              {state.errores.length > 15 ? (
                <li className="text-base-content/50">
                  …y {state.errores.length - 15} más
                </li>
              ) : null}
            </ul>
          ) : null}

          <div className="modal-action">
            <button type="button" className="btn btn-ghost" onClick={cerrar}>
              Cerrar
            </button>
            <button
              type="button"
              onClick={confirmar}
              disabled={!filas || filas.length === 0 || pending}
              className="btn btn-primary"
            >
              {pending
                ? "Importando..."
                : `Importar ${filas?.length ?? 0} producto${
                    filas?.length === 1 ? "" : "s"
                  }`}
            </button>
          </div>
        </div>

        <form method="dialog" className="modal-backdrop">
          <button type="submit">Cerrar</button>
        </form>
      </dialog>
    </>
  );
}
