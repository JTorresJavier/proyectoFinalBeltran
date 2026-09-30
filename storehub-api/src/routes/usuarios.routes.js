// ── IMPORTS ──────────────────────────────────
const express  = require('express');          // Router de Express
const router   = express.Router();            // Creamos el router
const Usuario  = require('../models/usuario.model'); // Modelo de Usuario

// ── GET /api/usuarios ─────────────────────────
// Obtiene todos los usuarios
router.get('/', async (req, res) => {
  try {
    // Excluimos el password por seguridad
    const usuarios = await Usuario.find().select('-password');
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo usuarios', detalle: err.message });
  }
});

// ── GET /api/usuarios/login ───────────────────
// Busca un usuario por nombre de usuario para el login
router.get('/login', async (req, res) => {
  try {
    const { usuario } = req.query; // Recibe ?usuario=admin

    // Buscamos el usuario incluyendo el password para verificar
    const usuarioEncontrado = await Usuario.findOne({ usuario });

    if (!usuarioEncontrado) {
      return res.json([]); // Devuelve array vacío si no existe
    }

    // Devolvemos en array para mantener compatibilidad con el frontend
    res.json([usuarioEncontrado]);
  } catch (err) {
    res.status(500).json({ error: 'Error en login', detalle: err.message });
  }
});

// ── GET /api/usuarios/:id ─────────────────────
// Obtiene un usuario por ID
router.get('/:id', async (req, res) => {
  try {
    const usuario = await Usuario.findById(req.params.id).select('-password');
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo usuario', detalle: err.message });
  }
});

// ── POST /api/usuarios ────────────────────────
// Crea un nuevo usuario
router.post('/', async (req, res) => {
  try {
    const usuario = new Usuario(req.body);
    await usuario.save();
    res.status(201).json(usuario);
  } catch (err) {
    res.status(400).json({ error: 'Error creando usuario', detalle: err.message });
  }
});

// ── PUT /api/usuarios/:id ─────────────────────
// Actualiza un usuario existente
router.put('/:id', async (req, res) => {
  try {
    const usuario = await Usuario.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(usuario);
  } catch (err) {
    res.status(400).json({ error: 'Error actualizando usuario', detalle: err.message });
  }
});

// ── DELETE /api/usuarios/:id ──────────────────
// Elimina un usuario
router.delete('/:id', async (req, res) => {
  try {
    const usuario = await Usuario.findByIdAndDelete(req.params.id);
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ error: 'Error eliminando usuario', detalle: err.message });
  }
});

// ── EXPORTAMOS EL ROUTER ──────────────────────
module.exports = router;