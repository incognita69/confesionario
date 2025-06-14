const express = require('express'); 
const bodyParser = require('body-parser'); 
const multer = require('multer'); 
const fs = require('fs'); 
const path = require('path'); 
const session = require('express-session'); 
const bcrypt = require('bcrypt');

const app = express(); 
const PORT = 3000;

// Middleware para servir archivos estáticos
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Configurar sesiones
 app.use(session({ secret: 'secreto-super-seguro', resave: false, saveUninitialized: false }));

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

// Ruta para guardar confesiones con archivos//
app.post('/confesar', upload.single('archivo'), (req, res) => { const confesion = req.body.confesion.trim(); let textoFinal = confesion;

if (!confesion) { return res.send('La confesión está vacía'); }

if (req.file) { textoFinal += ` /uploads/${req.file.filename}`; }

fs.appendFile('data/confesiones.txt', textoFinal + '\n', (err) => { if (err) return res.status(500).send('Error al guardar'); res.redirect('/'); }); });

// Ruta para mostrar confesiones//
app.get('/confesiones', (req, res) => { fs.readFile('data/confesiones.txt', 'utf8', (err, data) => { if (err) return res.json([]); const confesiones = data.trim().split('\n').reverse(); res.json(confesiones); }); });

// Ruta para registrar usuario//
app.post('/registro', async (req, res) => { const { username, password } = req.body; const usuariosPath = path.join(__dirname, 'data', 'usuarios.json');

if (!username || !password) { return res.status(400).send('Faltan datos'); }

let usuarios = []; if (fs.existsSync(usuariosPath)) { usuarios = JSON.parse(fs.readFileSync(usuariosPath, 'utf8')); }

if (usuarios.find(u => u.username === username)) { return res.status(400).send('Usuario ya existe'); }

const hashedPassword = await bcrypt.hash(password, 10); usuarios.push({ username, password: hashedPassword });

fs.writeFileSync(usuariosPath, JSON.stringify(usuarios, null, 2)); res.send('Registrado correctamente'); });

// Ruta para login //
app.post('/login', async (req, res) => { const { username, password } = req.body; const usuariosPath = path.join(__dirname, 'data', 'usuarios.json');

if (!username || !password) { return res.status(400).send('Faltan datos'); }

if (!fs.existsSync(usuariosPath)) { return res.status(400).send('Usuario o contraseña incorrectos'); }

const usuarios = JSON.parse(fs.readFileSync(usuariosPath, 'utf8')); const usuario = usuarios.find(u => u.username === username); if (!usuario) { return res.status(400).send('Usuario o contraseña incorrectos'); }

const esValida = await bcrypt.compare(password, usuario.password); if (!esValida) { return res.status(400).send('Usuario o contraseña incorrectos'); }

req.session.usuario = usuario.username; res.send('Sesión iniciada'); });

// Ruta para cerrar sesión //
app.get('/logout', (req, res) => { req.session.destroy(); res.send('Sesión cerrada'); });

app.listen(PORT, () => { console.log(`Servidor escuchando en http://localhost:${PORT}`); });