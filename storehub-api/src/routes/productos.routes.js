// ── IMPORTS ──────────────────────────────────
const express  = require('express');           // Router de Express
const router   = express.Router();             // Creamos el router
const Producto = require('../models/producto.model'); // Modelo de Producto

// ── GET /api/productos ────────────────────────
// Obtiene todos los productos de la base de datos
router.get('/', async (req, res) => {
  try {
    const productos = await Producto.find(); // Busca todos los documentos
    res.json(productos);                     // Devuelve el array en JSON
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo productos', detalle: err.message });
  }
});

// ── GET /api/productos/:id ────────────────────
// Obtiene un producto por su ID
router.get('/:id', async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id); // Busca por ID
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(producto);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo producto', detalle: err.message });
  }
});

// ── POST /api/productos ───────────────────────
// Crea un nuevo producto
router.post('/', async (req, res) => {
  try {
    const producto = new Producto(req.body); // Crea el documento con los datos del body
    await producto.save();                   // Guarda en MongoDB
    res.status(201).json(producto);          // Devuelve el producto creado
  } catch (err) {
    res.status(400).json({ error: 'Error creando producto', detalle: err.message });
  }
});

// ── PUT /api/productos/:id ────────────────────
// Actualiza un producto existente
router.put('/:id', async (req, res) => {
  try {
    const producto = await Producto.findByIdAndUpdate(
      req.params.id,  // ID del producto a actualizar
      req.body,       // Nuevos datos
      { new: true }   // Devuelve el documento actualizado
    );
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(producto);
  } catch (err) {
    res.status(400).json({ error: 'Error actualizando producto', detalle: err.message });
  }
});

// ── DELETE /api/productos/:id ─────────────────
// Elimina un producto
router.delete('/:id', async (req, res) => {
  try {
    const producto = await Producto.findByIdAndDelete(req.params.id);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ mensaje: 'Producto eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error eliminando producto', detalle: err.message });
  }
});

// ── EXPORTAMOS EL ROUTER ──────────────────────
module.exports = router;