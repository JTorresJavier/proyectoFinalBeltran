// ── IMPORTS ──────────────────────────────────
const express   = require('express');              // Router de Express
const router    = express.Router();                // Creamos el router
const Recepcion = require('../models/recepcion.model'); // Modelo de Recepción
const Producto  = require('../models/producto.model');  // Modelo de Producto

// ── GET /api/recepciones ──────────────────────
// Obtiene el historial completo de recepciones, más recientes primero
router.get('/', async (req, res) => {
  try {
    const recepciones = await Recepcion.find().sort({ createdAt: -1 });
    res.json(recepciones);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo recepciones', detalle: err.message });
  }
});

// ── POST /api/recepciones ─────────────────────
// Registra una nueva recepción Y suma el stock al producto correspondiente.
// Ambas operaciones se hacen juntas para que el stock quede siempre
// consistente con el historial de recepciones.
router.post('/', async (req, res) => {
  try {
    const { producto, cantidad } = req.body;

    // Validamos la recepción completa antes de tocar el stock:
    // si falta un dato no se suma nada (antes sumaba y después fallaba)
    const recepcion = new Recepcion(req.body);
    await recepcion.validate();

    // Sumamos el stock al producto referenciado
    const productoActualizado = await Producto.findByIdAndUpdate(
      producto,
      { $inc: { stock: cantidad } }, // $inc suma de forma atómica, sin pisar el valor actual
      { new: true }
    );

    if (!productoActualizado) {
      return res.status(404).json({ error: 'El producto no existe' });
    }

    // Guardamos el registro de la recepción (ya validado)
    await recepcion.save();

    res.status(201).json(recepcion);
  } catch (err) {
    res.status(400).json({ error: 'Error creando recepción', detalle: err.message });
  }
});

// ── DELETE /api/recepciones/:id ───────────────
// Elimina un registro del historial (no afecta el stock ya sumado,
// es solo corrección de un registro mal cargado)
router.delete('/:id', async (req, res) => {
  try {
    const recepcion = await Recepcion.findByIdAndDelete(req.params.id);
    if (!recepcion) return res.status(404).json({ error: 'Recepción no encontrada' });
    res.json({ mensaje: 'Recepción eliminada correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error eliminando recepción', detalle: err.message });
  }
});

// ── EXPORTAMOS EL ROUTER ──────────────────────
module.exports = router;