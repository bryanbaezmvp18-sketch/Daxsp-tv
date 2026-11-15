/** Modelo de datos de Firestore. Solo el servidor (Admin SDK) lee y escribe. */

/** alumnos/{id}: compradores. No tienen contraseña: entran con un enlace privado. */
export interface Alumno {
  nombre: string;
  email: string;
  whatsapp: string;
  tieneAcceso: boolean;
  tokenAcceso?: string | null; // va dentro del enlace /acceso/{token}
  fechaRegistro: Date;
}

export type MetodoPago = "paypal" | "transferencia";
export type EstadoPedido = "pendiente" | "aprobado" | "rechazado" | "retirado";

/** pedidos/{id} */
export interface Pedido {
  id: string;
  alumnoId: string;
  nombre: string;
  email: string;
  whatsapp: string;
  metodo: MetodoPago;
  monto: number;
  moneda: "USD" | "DOP";
  estado: EstadoPedido;
  paypalOrderId?: string;
  comprobanteRuta?: string; // ruta privada en Storage (se ve con URL temporal)
  bancoOrigen?: string;
  fechaTransferencia?: string;
  referencia?: string;
  motivoRechazo?: string | null;
  creadoEn: Date;
  revisadoEn?: Date | null;
  revisadoPor?: string | null;
}

/** modulos/{id} */
export interface Leccion {
  id: string;
  titulo: string;
  tipo: "video" | "pdf";
  rutaArchivo: string; // ruta dentro de Storage, p. ej. curso/modulo1/leccion1.mp4
  duracion?: string;
}

export interface Modulo {
  id: string;
  titulo: string;
  orden: number;
  lecciones: Leccion[];
}
