import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { PedidoService } from './pedido.service';
import { Producto } from './productos.service';

const producto = (nombre: string, precio: number, stock = 0): Producto => ({
  _id: nombre, nombre, categoria: 'Almacén', precio, stock,
  descripcion: '', icono: 'shopping_bag', oferta: false, descuento: 0,
});

describe('PedidoService', () => {
  let service: PedidoService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(PedidoService);
  });

  it('permite pedir productos sin stock y suma cantidades del mismo producto', async () => {
    const yerba = producto('Yerba', 3000, 0);
    service.agregar(yerba);
    service.agregar(yerba, 4);
    expect(service.cantidadDe(yerba)).toBe(5);
    expect(await firstValueFrom(service.cantidadTotal$)).toBe(5);
    expect(await firstValueFrom(service.totalEstimado$)).toBe(15000);
  });

  it('cambiar la cantidad a 0 quita el renglón', async () => {
    const leche = producto('Leche', 1500);
    service.agregar(leche, 2);
    service.cambiarCantidad('Leche', 0);
    expect(await firstValueFrom(service.lineas$)).toBe(0);
  });

  it('registrar mueve el pedido al historial y lo vacía', async () => {
    service.agregar(producto('Azúcar', 1200), 10);
    const pedido = service.registrar(' Distribuidora Norte ', '', 'Ana');

    expect(pedido?.proveedor).toBe('Distribuidora Norte');
    expect(pedido?.totalUnidades).toBe(10);
    expect(service.historial().length).toBe(1);
    expect(await firstValueFrom(service.lineas$)).toBe(0);
  });

  it('si no puede guardar el historial conserva el pedido en curso', async () => {
    service.agregar(producto('Harina', 900), 3);
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error('QuotaExceededError'); };
    try {
      expect(() => service.registrar('Proveedor', '', 'Ana')).toThrow();
    } finally {
      Storage.prototype.setItem = original;
    }
    expect(await firstValueFrom(service.lineas$)).toBe(1);
  });

  it('no registra un pedido vacío', () => {
    expect(service.registrar('Proveedor', '', 'Ana')).toBeNull();
    expect(service.historial().length).toBe(0);
  });
});
