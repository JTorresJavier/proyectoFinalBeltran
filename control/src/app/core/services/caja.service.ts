// ── IMPORTS ──────────────────────────────────
import { Injectable } from '@angular/core'; // Decorador de servicio

// ── INTERFACES ────────────────────────────────

// Define una venta completa registrada en caja
export interface Venta {
  id: string;            // ID único de la venta
  fecha: string;         // Fecha y hora de la venta
  cajero: string;        // Nombre del cajero
  items: ItemVenta[];    // Productos vendidos
  total: number;         // Total real de la venta
  totalCobrado: number;  // Total redondeado que se cobró
  diferencia: number;    // Diferencia (totalCobrado - total)
  metodoPago: string;    // Método de pago usado
}

// Define un item dentro de una venta
export interface ItemVenta {
  nombre: string;   // Nombre del producto
  cantidad: number; // Cantidad vendida
  precio: number;   // Precio unitario
  subtotal: number; // precio * cantidad
}

// Define el estado de la caja del día
export interface EstadoCaja {
  abierta: boolean;       // Si la caja está abierta
  montoInicial: number;   // Monto con el que se abrió
  fechaApertura: string;  // Fecha y hora de apertura
  cajero: string;         // Cajero que abrió la caja
}

// ── DECORADOR ────────────────────────────────
// Servicio que maneja toda la lógica de caja.
// Guarda ventas, diferencias y estado en LocalStorage.
@Injectable({
  providedIn: 'root'
})
export class CajaService {

  // ── CLAVES DE LOCALSTORAGE ────────────────
  // Claves para guardar datos en el navegador
  private claveVentas  = 'storehub_ventas';       // Historial de ventas
  private claveEstado  = 'storehub_caja_estado';  // Estado de la caja
  private claveAcumulado = 'storehub_acumulado';  // Diferencia acumulada

  // ── MÉTODO: REDONDEAR A $50 ───────────────
  // Redondea el total al múltiplo de $50 más cercano.
  // Decide si redondear arriba o abajo según el acumulado:
  // Si acumulado > 0 (cobramos de más) → redondea hacia abajo
  // Si acumulado < 0 (cobramos de menos) → redondea hacia arriba
  // Si acumulado = 0 → redondea al más cercano
  redondearA50(total: number, acumulado: number): number {
    const abajo  = Math.floor(total / 50) * 50;  // Múltiplo de 50 hacia abajo
    const arriba = Math.ceil(total / 50) * 50;   // Múltiplo de 50 hacia arriba

    // Si el total ya es múltiplo de 50 → no hay diferencia
    if (abajo === arriba) return total;

    // Decidimos según el acumulado del día
    if (acumulado > 0) {
      // Cobramos de más → redondeamos hacia abajo para compensar
      return abajo;
    } else if (acumulado < 0) {
      // Cobramos de menos → redondeamos hacia arriba para compensar
      return arriba;
    } else {
      // Acumulado en 0 → redondeamos al más cercano
      return (total - abajo < arriba - total) ? abajo : arriba;
    }
  }

  // ── MÉTODO: OBTENER ACUMULADO ─────────────
  // Obtiene la diferencia acumulada del día desde LocalStorage
  obtenerAcumulado(): number {
    const datos = localStorage.getItem(this.claveAcumulado);
    return datos ? JSON.parse(datos) : 0;
  }

  // ── MÉTODO: ACTUALIZAR ACUMULADO ──────────
  // Suma la diferencia de la venta al acumulado del día
  actualizarAcumulado(diferencia: number): void {
    const actual = this.obtenerAcumulado();
    localStorage.setItem(
      this.claveAcumulado,
      JSON.stringify(actual + diferencia)
    );
  }

  // ── MÉTODO: GUARDAR VENTA ─────────────────
  // Guarda una venta en el historial de LocalStorage
  guardarVenta(venta: Venta): void {
    const ventas = this.obtenerVentas();
    ventas.push(venta);
    localStorage.setItem(this.claveVentas, JSON.stringify(ventas));

    // Actualizamos el acumulado solo si fue en efectivo
    if (venta.metodoPago === 'efectivo') {
      this.actualizarAcumulado(venta.diferencia);
    }
  }

  // ── MÉTODO: OBTENER VENTAS ────────────────
  // Obtiene todas las ventas del día desde LocalStorage
  obtenerVentas(): Venta[] {
    const datos = localStorage.getItem(this.claveVentas);
    return datos ? JSON.parse(datos) : [];
  }

  // ── MÉTODO: OBTENER VENTAS DE HOY ─────────
  // Filtra las ventas del día actual
  obtenerVentasDeHoy(): Venta[] {
    const hoy    = new Date().toLocaleDateString('es-AR');
    return this.obtenerVentas().filter(v =>
      new Date(v.fecha).toLocaleDateString('es-AR') === hoy
    );
  }

  // ── MÉTODO: TOTAL VENDIDO HOY ─────────────
  // Suma el total de todas las ventas del día
  totalVendidoHoy(): number {
    return this.obtenerVentasDeHoy()
      .reduce((acc, v) => acc + v.total, 0);
  }

  // ── MÉTODO: TOTAL POR MÉTODO DE PAGO ──────
  // Suma las ventas agrupadas por método de pago
  totalPorMetodo(): { efectivo: number; debito: number; credito: number; transferencia: number } {
    const ventas = this.obtenerVentasDeHoy();
    return {
      efectivo:      ventas.filter(v => v.metodoPago === 'efectivo').reduce((a, v) => a + v.totalCobrado, 0),
      debito:        ventas.filter(v => v.metodoPago === 'debito').reduce((a, v) => a + v.total, 0),
      credito:       ventas.filter(v => v.metodoPago === 'credito').reduce((a, v) => a + v.total, 0),
      transferencia: ventas.filter(v => v.metodoPago === 'transferencia').reduce((a, v) => a + v.total, 0),
    };
  }

  // ── MÉTODO: ESTADO DE CAJA ────────────────
  // Obtiene el estado actual de la caja
  obtenerEstado(): EstadoCaja | null {
    const datos = localStorage.getItem(this.claveEstado);
    return datos ? JSON.parse(datos) : null;
  }

  // ── MÉTODO: ABRIR CAJA ────────────────────
  // Registra la apertura de caja con monto inicial
  abrirCaja(montoInicial: number, cajero: string): void {
    const estado: EstadoCaja = {
      abierta:       true,
      montoInicial,
      fechaApertura: new Date().toISOString(),
      cajero,
    };
    localStorage.setItem(this.claveEstado, JSON.stringify(estado));
  }

  // ── MÉTODO: CERRAR CAJA ───────────────────
  // Cierra la caja y resetea el acumulado del día
  cerrarCaja(): void {
    const estado = this.obtenerEstado();
    if (estado) {
      estado.abierta = false;
      localStorage.setItem(this.claveEstado, JSON.stringify(estado));
    }
    // Reseteamos el acumulado al cerrar la caja
    localStorage.setItem(this.claveAcumulado, JSON.stringify(0));
  }

  // ── MÉTODO: GENERAR ID ────────────────────
  // Genera un ID único para cada venta
  generarId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // ── MÉTODO: CALCULAR BILLETES ─────────────
  // Calcula los billetes necesarios para dar el vuelto
  calcularBilletes(monto: number): { billete: number; cantidad: number }[] {
    const billetes = [10000, 5000, 2000, 1000, 500, 200, 100, 50];
    const resultado: { billete: number; cantidad: number }[] = [];
    let restante = Math.abs(monto);

    billetes.forEach(billete => {
      const cantidad = Math.floor(restante / billete);
      if (cantidad > 0) {
        resultado.push({ billete, cantidad });
        restante -= billete * cantidad;
      }
    });

    return resultado;
  }
}