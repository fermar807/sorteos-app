"use client";

type CsvRow = {
  nombre: string;
  correo: string;
  codigo: string;
  estadoCanje: string;
  premioGanado: string;
  casilla: string;
  fechaCanje: string;
};

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export default function ExportarCsvButton({
  rows,
  eventoNombre,
}: {
  rows: CsvRow[];
  eventoNombre: string;
}) {
  function handleExport() {
    const header = [
      "Nombre",
      "Correo",
      "Código",
      "Estado Canje",
      "Premio Ganado",
      "Casilla",
      "Fecha Canje",
    ];
    const lines = [header.join(",")];
    for (const row of rows) {
      lines.push(
        [
          escapeCsv(row.nombre),
          escapeCsv(row.correo),
          escapeCsv(row.codigo),
          escapeCsv(row.estadoCanje),
          escapeCsv(row.premioGanado),
          escapeCsv(row.casilla),
          escapeCsv(row.fechaCanje),
        ].join(",")
      );
    }
    const csv = "\uFEFF" + lines.join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `participantes_${eventoNombre.replace(/\s+/g, "_")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={rows.length === 0}
      className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-60"
    >
      Exportar CSV
    </button>
  );
}