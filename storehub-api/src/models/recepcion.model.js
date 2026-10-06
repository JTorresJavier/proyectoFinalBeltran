// ── IMPORTS ──────────────────────────────────
const mongoose = require('mongoose'); // ODM para MongoDB

// ── SCHEMA ────────────────────────────────────
// Define la estructura de un documento Recepción en MongoDB.
// Registra el ingreso de stock de un producto desde un proveedor.
const recepcionSchema = new mongoose.Schema({

  // ── CAMPOS ────────────────────────────────
  producto: {
    type: mongoose.Schema.Types.ObjectId, // Referencia al _id de un Producto
    ref: 'Producto',                       // Nombre del modelo referenciado
    required: true
  },
  productoNombre: {
    type: String,       // Guardamos el nombre aparte, para no tener
    required: true,      // que buscarlo siempre que se liste el historial
    trim: true
  },
  cantidad: {
    type: Number,
    required: true,
    min: 1              // Tiene que recibirse al menos 1 unidad
  },
  proveedor: {
    type: String,
    required: true,
    trim: true
  },
  observaciones: {
    type: String,
    trim: true,
    default: ''
  },
  usuario: {
    type: String,        // Nombre de quien registró la recepción
    required: true,
    trim: true
  }

}, {
  // ── OPCIONES ──────────────────────────────
  timestamps: true       // Agrega createdAt (fecha de recepción) y updatedAt
});

// ── EXPORTAMOS EL MODELO ──────────────────────
// "Recepcion" es el nombre de la colección (se guarda como "recepcions")
module.exports = mongoose.model('Recepcion', recepcionSchema);