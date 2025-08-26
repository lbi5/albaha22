require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'products.json');

// middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));

// static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/', express.static(path.join(__dirname, 'public')));

// storage for images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, 'img_' + Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// helpers
const readJSON = () => {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
};
const writeJSON = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

// auth
const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || "").split(',').map(e => e.trim());
const ACCESS_KEY = process.env.ACCESS_KEY;
const JWT_SECRET = process.env.JWT_SECRET;

function authMiddleware(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'مطلوب توكن' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'توكن غير صالح' });
  }
}

// routes
app.post('/api/login', (req, res) => {
  const { email, accessKey } = req.body;
  if (!ALLOWED_EMAILS.includes(email) || accessKey !== ACCESS_KEY) {
    return res.status(403).json({ message: 'غير مصرح' });
  }
  const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '12h' });
  res.json({ token });
});

app.get('/api/products', (req, res) => {
  res.json(readJSON());
});

app.post('/api/products', authMiddleware, upload.single('image'), (req, res) => {
  const items = readJSON();
  const { title, description, specs, imageAlt } = req.body;
  const item = {
    id: uuidv4(),
    title,
    description,
    specs,
    imageAlt,
    imageUrl: req.file ? '/uploads/' + req.file.filename : null,
    createdAt: new Date().toISOString()
  };
  items.unshift(item);
  writeJSON(items);
  res.json(item);
});

app.put('/api/products/:id', authMiddleware, upload.single('image'), (req, res) => {
  const items = readJSON();
  const idx = items.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'غير موجود' });
  const { title, description, specs, imageAlt } = req.body;
  if (title) items[idx].title = title;
  if (description) items[idx].description = description;
  if (specs) items[idx].specs = specs;
  if (imageAlt) items[idx].imageAlt = imageAlt;
  if (req.file) items[idx].imageUrl = '/uploads/' + req.file.filename;
  writeJSON(items);
  res.json(items[idx]);
});

app.delete('/api/products/:id', authMiddleware, (req, res) => {
  const items = readJSON();
  const idx = items.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: 'غير موجود' });
  const removed = items.splice(idx, 1);
  writeJSON(items);
  res.json({ removed });
});

app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://0.0.0.0:${PORT}`));