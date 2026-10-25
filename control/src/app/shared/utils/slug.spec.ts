import { imagenProducto, slugProducto } from './slug';

describe('slugProducto', () => {
  it('pasa a minúsculas, quita tildes y une con guiones', () => {
    expect(slugProducto('Leche La Serenísima Entera 1L')).toBe('leche-la-serenisima-entera-1l');
  });

  it('reemplaza puntos y símbolos sin dejar guiones en los bordes', () => {
    expect(slugProducto('Coca-Cola Original 1.25L')).toBe('coca-cola-original-1-25l');
    expect(slugProducto("  Mayonesa Hellmann's 500g! ")).toBe('mayonesa-hellmann-s-500g');
  });

  it('arma la ruta pública de la foto', () => {
    expect(imagenProducto('Yerba Mate Taragüí 500g')).toBe('/productos/yerba-mate-taragui-500g.webp');
  });
});
