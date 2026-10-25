// ── SLUG DE PRODUCTO ──────────────────────────
// Convierte el nombre de un producto en un nombre de archivo seguro.
// "Coca-Cola Original 1.25L" → "coca-cola-original-1-25l"
// Las fotos de /public/productos usan este mismo formato.
export function slugProducto(nombre: string): string {
  return nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // Quita tildes
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')     // Todo lo que no es letra o número → guion
    .replace(/^-|-$/g, '');          // Sin guiones al principio ni al final
}

// Ruta pública de la foto de un producto
export function imagenProducto(nombre: string): string {
  return `/productos/${slugProducto(nombre)}.webp`;
}
