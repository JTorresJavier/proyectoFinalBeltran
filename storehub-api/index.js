// ── IMPORTS ──────────────────────────────────
const express  = require('express');  // Servidor web
const mongoose = require('mongoose'); // Conexión a MongoDB
const cors     = require('cors');     // Permite peticiones desde Angular
const dotenv   = require('dotenv');   // Lee el archivo .env

// ── CONFIGURACIÓN ─────────────────────────────
// Carga las variables del archivo .env
dotenv.config();

// Creamos la app de Express
const app  = express();
const PORT = process.env.PORT || 3000;

// ── MIDDLEWARES ───────────────────────────────
// Permite peticiones desde cualquier origen (Angular en localhost:4200)
app.use(cors());

// Permite recibir JSON en el body de las peticiones
app.use(express.json());

// ── CONEXIÓN A MONGODB ────────────────────────
// Conectamos a MongoDB Atlas usando la URL del .env
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Conectado a MongoDB Atlas'))
  .catch(err => console.error('❌ Error conectando a MongoDB:', err));

// ── RUTAS ─────────────────────────────────────
// Importamos y registramos las rutas de la API
const productosRoutes = require('./src/routes/productos.routes');
const usuariosRoutes  = require('./src/routes/usuarios.routes');

// Registramos las rutas con su prefijo
app.use('/api/productos', productosRoutes); // /api/productos
app.use('/api/usuarios',  usuariosRoutes);  // /api/usuarios

// ── RUTA DE PRUEBA ────────────────────────────
// Para verificar que la API está funcionando
app.get('/', (req, res) => {
  res.json({
    mensaje: '🏪 StoreHub API funcionando',
    version: '1.0.0',
    endpoints: [
      '/api/productos',
      '/api/usuarios'
    ]
  });
});

// ── INICIAR SERVIDOR ──────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});