/** Sugerencias para el formulario (se puede escribir cualquier otro banco). */
export const BANCOS_RD = [
  "Banco Popular",
  "Banreservas",
  "Banco BHD",
  "Scotiabank",
  "Banco Santa Cruz",
  "Banco Caribe",
  "Banco Promerica",
  "Banesco",
  "Banco López de Haro",
  "Banco Vimenca",
  "Asociación Popular (APAP)",
  "Asociación Cibao",
  "Qik",
];

export const TIPOS_CUENTA = ["Cuenta de ahorros", "Cuenta corriente"];

/** Datos de una cuenta que se pueden mostrar al cliente. */
export interface CuentaPublica {
  id: string;
  banco: string;
  tipo: string;
  numero: string;
  titular: string;
  documento: string;
}
