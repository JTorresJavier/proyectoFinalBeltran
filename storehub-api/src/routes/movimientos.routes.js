const express    = require('express');
const router     = express.Router();
const Movimiento = require('../models/movimiento.model');

// ── GET /api/movimientos ──────────────────────────────────────────────
// Devuelve el log de auditoría con filtros opcionales.
// Solo debe llamarse desde el panel admin (proteger en el frontend con adminGuard).
//
// Query params:
//   usuario     → filtrar por nombre de usuario exacto
//   rol         → filtrar por rol
//   accion      → filtrar por tipo de acción
//   fechaDesde  → ISO date string (ej: 2026-10-01)
//   fechaHasta  → ISO date string (ej: 2026-10-31)
//   page        → número de página (default: 1)
//   limit       → resultados por página (default: 50, máx: 200)
// ─────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const {
      usuario,
      rol,
      accion,
      fechaDesde,
      fechaHasta,
      page  = 1,
      limit = 50
    } = req.query;

    // ── CONSTRUIR FILTRO ──────────────────────────────────────────
    const filtro = {};

    if (usuario)    filtro.usuario = { $regex: usuario, $options: 'i' };
    if (rol)        filtro.rol     = rol;
    if (accion)     filtro.accion  = accion;

    if (fechaDesde || fechaHasta) {
      filtro.fecha = {};
      if (fechaDesde) filtro.fecha.$gte = new Date(fechaDesde);
      if (fechaHasta) {
        // Incluir todo el día final (hasta las 23:59:59)
        const hasta = new Date(fechaHasta);
        hasta.setHours(23, 59, 59, 999);
        filtro.fecha.$lte = hasta;
      }
    }

    // ── PAGINACIÓN ────────────────────────────────────────────────
    const limitNum = Math.min(parseInt(limit) || 50, 200);
    const pageNum  = Math.max(parseInt(page)  || 1,  1);
    const skip     = (pageNum - 1) * limitNum;

    // ── QUERY ─────────────────────────────────────────────────────
    const [movimientos, total] = await Promise.all([
      Movimiento.find(filtro)
        .sort({ fecha: -1 })    // Más recientes primero
        .skip(skip)
        .limit(limitNum)
        .lean(),                // Plain JS objects, más rápido
      Movimiento.countDocuments(filtro)
    ]);

    res.json({
      movimientos,
      total,
      pagina:       pageNum,
      totalPaginas: Math.ceil(total / limitNum),
      porPagina:    limitNum
    });

  } catch (err) {
    console.error('[Movimientos] Error al obtener movimientos:', err);
    res.status(500).json({ error: 'Error al obtener movimientos', detalle: err.message });
  }
});

// ── GET /api/movimientos/usuarios ─────────────────────────────────────
// Devuelve la lista de usuarios únicos que tienen movimientos registrados.
// Útil para poblar el selector de filtro en el frontend.
router.get('/usuarios', async (req, res) => {
  try {
    const usuarios = await Movimiento.distinct('usuario');
    res.json(usuarios.filter(Boolean).sort());
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener usuarios', detalle: err.message });
  }
});

// ── GET /api/movimientos/resumen ──────────────────────────────────────
// Devuelve conteos agrupados por acción (para estadísticas del dashboard).
router.get('/resumen', async (req, res) => {
  try {
    const resumen = await Movimiento.aggregate([
      {
        $group: {
          _id:   '$accion',
          total: { $sum: 1 },
          ultimo: { $max: '$fecha' }
        }
      },
      { $sort: { total: -1 } }
    ]);
    res.json(resumen);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener resumen', detalle: err.message });
  }
});

module.exports = router;