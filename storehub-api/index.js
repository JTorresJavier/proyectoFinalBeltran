require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');

// ── RUTAS ─────────────────────────────────────────────────────────────
const productosRoutes    = require('./src/routes/productos.routes');
const usuariosRoutes     = require('./src/routes/usuarios.routes');
const recepcionesRoutes  = require('./src/routes/recepciones.routes');
const movimientosRoutes  = require('./src/routes/movimientos.routes');

// ── MIDDLEWARE DE AUDITORÍA ───────────────────────────────────────────
const { auditoriaMiddleware } = require('./src/middleware/auditoria.middleware');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── MIDDLEWARES GLOBALES ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── AUDITORÍA AUTOMÁTICA ──────────────────────────────────────────────
app.use('/api', auditoriaMiddleware);

// ── PROXY DÓLAR ───────────────────────────────────────────────────────
// Angular no puede llamar a dolarapi.com directamente (CORS).
// El backend hace el fetch server-to-server y lo devuelve al frontend.
app.get('/api/dolar', async (req, res) => {
  try {
    const response = await fetch('https://dolarapi.com/v1/dolares');
    const data     = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'No se pudo obtener cotización del dólar' });
  }
});

// ── RUTAS ─────────────────────────────────────────────────────────────
app.use('/api/productos',   productosRoutes);
app.use('/api/usuarios',    usuariosRoutes);
app.use('/api/recepciones', recepcionesRoutes);
app.use('/api/movimientos', movimientosRoutes);

// ── CONEXIÓN A MONGODB ────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Conectado a MongoDB');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Error al conectar a MongoDB:', err.message);
    process.exit(1);
  });