import { PROMOCIONES, comoSeAplica, promocionesDelDia, textoDias } from './promociones';

describe('promociones', () => {
  it('cada día tiene al menos una promo (el 2x1 de gaseosas corre toda la semana)', () => {
    for (let dia = 0; dia < 7; dia++) {
      expect(promocionesDelDia(dia).length).toBeGreaterThan(0);
    }
  });

  it('el miércoles aplica Mercado Pago y el lunes no', () => {
    expect(promocionesDelDia(3).some(p => p.id === 'mp-miercoles')).toBe(true);
    expect(promocionesDelDia(1).some(p => p.id === 'mp-miercoles')).toBe(false);
  });

  it('las bancarias son reintegro del banco y el resto se aplica a mano en caja', () => {
    const bancaria = PROMOCIONES.find(p => p.tipo === 'bancaria')!;
    const enCaja   = PROMOCIONES.find(p => p.tipo !== 'bancaria')!;
    expect(comoSeAplica(bancaria).enCaja).toBe(false);
    expect(comoSeAplica(bancaria).texto).toContain('no se descuenta en caja');
    expect(comoSeAplica(enCaja).enCaja).toBe(true);
  });

  it('describe los días en texto', () => {
    expect(textoDias([3])).toBe('Miércoles');
    expect(textoDias([4, 5])).toBe('Jueves y viernes');
    expect(textoDias([0, 1, 2, 3, 4, 5, 6])).toBe('Todos los días');
  });

  it('todas las promos tienen ids únicos y productos para el banner', () => {
    const ids = new Set(PROMOCIONES.map(p => p.id));
    expect(ids.size).toBe(PROMOCIONES.length);
    expect(PROMOCIONES.every(p => p.productos.length === 3)).toBe(true);
  });
});
