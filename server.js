const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware para servir archivos estáticos
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Configuración de multer para guardar archivos en la carpeta uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + ext;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage: storage });

// Ruta para guardar confesiones con archivos
app.post('/confesar', upload.single('archivo'), (req, res) => {
  const confesion = req.body.confesion.trim();
  let textoFinal = confesion;

  if (!confesion) {
    return res.send('La confesión está vacía');
  }

  if (req.file) {
    textoFinal += ` /uploads/${req.file.filename}`; // ya sin salto de línea
  }

  fs.appendFile('data/confesiones.txt', textoFinal + '\n', (err) => {
    if (err) return res.status(500).send('Error al guardar');
    res.redirect('/');
  });
});

// Ruta para mostrar confesiones
app.get('/confesiones', (req, res) => {
  fs.readFile('data/confesiones.txt', 'utf8', (err, data) => {
    if (err) return res.json([]);
    const confesiones = data.trim().split('\n').reverse();
    res.json(confesiones);
  });
});

app.listen(PORT, () => {
  console.log( `Servidor escuchando en http://localhost:${PORT} `);
});