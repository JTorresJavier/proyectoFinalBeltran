// ── IMPORTS ──────────────────────────────────
import { Injectable } from '@angular/core';

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

// ── INTERFACE: REGISTRO DE TURNO ──────────────
// Guarda quién abrió y cerró la caja y cuándo
export interface RegistroTurno {
  cajero: string;          // Nombre del cajero
  fechaApertura: string;   // Cuándo abrió la caja
  fechaCierre: string;     // Cuándo cerró la caja
  totalVendido: number;    // Total vendido en el turno
  cantidadVentas: number;  // Cantidad de ventas del turno
}

// ── DECORADOR ────────────────────────────────
// Servicio que maneja toda la lógica de caja.
// Guarda ventas, diferencias y estado en LocalStorage.
@Injectable({
  providedIn: 'root'
})
export class CajaService {

  // ── CLAVES DE LOCALSTORAGE ────────────────
  private claveVentas    = 'storehub_ventas';         // Historial de ventas
  private claveEstado    = 'storehub_caja_estado';    // Estado de la caja
  private claveAcumulado = 'storehub_acumulado';      // Diferencia acumulada
  private claveTurnos    = 'storehub_turnos';         // Registro de turnos

  // ── MÉTODO: REDONDEAR A $50 ───────────────
  // Redondea el total al múltiplo de $50 más cercano.
  // Si acumulado > 0 (cobramos de más) → redondea hacia abajo
  // Si acumulado < 0 (cobramos de menos) → redondea hacia arriba
  // Si acumulado = 0 → redondea al más cercano
  redondearA50(total: number, acumulado: number): number {
    const abajo  = Math.floor(total / 50) * 50;
    const arriba = Math.ceil(total / 50) * 50;

    if (abajo === arriba) return total;

    if (acumulado > 0) {
      return abajo;
    } else if (acumulado < 0) {
      return arriba;
    } else {
      return (total - abajo < arriba - total) ? abajo : arriba;
    }
  }

  // ── MÉTODO: OBTENER ACUMULADO ─────────────
  obtenerAcumulado(): number {
    const datos = localStorage.getItem(this.claveAcumulado);
    return datos ? JSON.parse(datos) : 0;
  }

  // ── MÉTODO: ACTUALIZAR ACUMULADO ──────────
  actualizarAcumulado(diferencia: number): void {
    const actual = this.obtenerAcumulado();
    localStorage.setItem(
      this.claveAcumulado,
      JSON.stringify(actual + diferencia)
    );
  }

  // ── MÉTODO: GUARDAR VENTA ─────────────────
  guardarVenta(venta: Venta): void {
    const ventas = this.obtenerVentas();
    ventas.push(venta);
    localStorage.setItem(this.claveVentas, JSON.stringify(ventas));

    if (venta.metodoPago === 'efectivo') {
      this.actualizarAcumulado(venta.diferencia);
    }
  }

  // ── MÉTODO: OBTENER VENTAS ────────────────
  obtenerVentas(): Venta[] {
    const datos = localStorage.getItem(this.claveVentas);
    return datos ? JSON.parse(datos) : [];
  }

  // ── MÉTODO: OBTENER VENTAS DE HOY ─────────
  obtenerVentasDeHoy(): Venta[] {
    const hoy = new Date().toLocaleDateString('es-AR');
    return this.obtenerVentas().filter(v =>
      new Date(v.fecha).toLocaleDateString('es-AR') === hoy
    );
  }

  // ── MÉTODO: TOTAL VENDIDO HOY ─────────────
  totalVendidoHoy(): number {
    return this.obtenerVentasDeHoy()
      .reduce((acc, v) => acc + v.total, 0);
  }

  // ── MÉTODO: TOTAL POR MÉTODO DE PAGO ──────
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
  obtenerEstado(): EstadoCaja | null {
    const datos = localStorage.getItem(this.claveEstado);
    return datos ? JSON.parse(datos) : null;
  }

  // ── MÉTODO: ABRIR CAJA ────────────────────
  // Registra la apertura y guarda fecha/hora y cajero
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
  // Cierra la caja, guarda el registro del turno y limpia el historial
  cerrarCaja(): void {
    const estado = this.obtenerEstado();

    // ── GUARDAMOS EL REGISTRO DEL TURNO ──────
    // Antes de limpiar guardamos quién trabajó y cuánto vendió
    if (estado) {
      const turno: RegistroTurno = {
        cajero:          estado.cajero,
        fechaApertura:   estado.fechaApertura,
        fechaCierre:     new Date().toISOString(),
        totalVendido:    this.totalVendidoHoy(),
        cantidadVentas:  this.obtenerVentasDeHoy().length,
      };
      const turnos = this.obtenerTurnos();
      turnos.push(turno);
      localStorage.setItem(this.claveTurnos, JSON.stringify(turnos));

      // Marcamos la caja como cerrada
      estado.abierta = false;
      localStorage.setItem(this.claveEstado, JSON.stringify(estado));
    }

    // ── LIMPIAMOS EL HISTORIAL Y ACUMULADO ────
    // Se limpian al cerrar para que la próxima apertura empiece limpia
    localStorage.removeItem(this.claveVentas);
    localStorage.setItem(this.claveAcumulado, JSON.stringify(0));
  }

  // ── MÉTODO: OBTENER TURNOS ────────────────
  // Obtiene todos los registros de turnos guardados
  obtenerTurnos(): RegistroTurno[] {
    const datos = localStorage.getItem(this.claveTurnos);
    return datos ? JSON.parse(datos) : [];
  }

  // ── MÉTODO: GENERAR ID ────────────────────
  generarId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // ── MÉTODO: CALCULAR BILLETES ─────────────
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