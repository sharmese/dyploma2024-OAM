const express = require('express');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const cors = require('cors');

const app = express();
const port = 3005;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'credentials',
  password: '444111444',
  port: 5432,
});
app.use(express.json());
app.use(cors());
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

const generateSalt = () => {
  return crypto.randomBytes(16).toString('hex');
};

const encryptPassword = (password, salt) => {
  const key = crypto.pbkdf2Sync(password, salt, 10000, 32, 'sha512');
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return {
    key: key.toString('hex'),
    iv: iv.toString('hex'),
    encryptedPassword: encrypted,
  };
};

const decryptPassword = (encryptedPassword, key, iv) => {
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(key, 'hex'),
    Buffer.from(iv, 'hex')
  );
  let decrypted = decipher.update(encryptedPassword, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};

function verifyToken(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  jwt.verify(token.split(' ')[1], 'secret', (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
    req.userId = decoded.userId;
    next();
  });
}
app.post('/api/autocomplete', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { website } = req.body;
    const query =
      'SELECT email,password_hash,salt FROM credentials WHERE user_id = $1 AND website = $2';
    const result = await pool.query(query, [userId, website]);
    const user = result.rows[0];
    const parts = user.password_hash.split('.');
    const iv = parts[0];
    const password = parts[1];
    const decryptedPassword = decryptPassword(password, user.salt, iv);
    const data = [];
    data.push({
      email: user.email,
      password: decryptedPassword,
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.get('/api/settings', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const query =
      'SELECT autocomplete, autosave FROM user_settings WHERE user_id = $1';
    const result = await pool.query(query, [userId]);
    const data = result.rows[0];
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.patch('/api/settings', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { autocomplete, autosave } = req.body;
    const query =
      'UPDATE user_settings SET autocomplete = $1, autosave = $2 WHERE user_id = $3';
    await pool.query(query, [autocomplete, autosave, userId]);
    res.status(200).json({ message: 'Updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.get('/api/credentials', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const query =
      'SELECT website,email,password_hash,salt FROM credentials WHERE user_id = $1';
    const { rows } = await pool.query(query, [userId]);

    const data = [];
    rows.forEach((item) => {
      const parts = item.password_hash.split('.');
      const iv = parts[0];
      const password = parts[1];
      if (item.salt) {
        const decryptedPassword = decryptPassword(password, item.salt, iv);
        data.push({
          website: item.website,
          email: item.email,
          password: decryptedPassword,
        });
      } else {
        data.push({
          website: item.website,
          email: item.email,
          password: item.password_hash,
        });
      }
    });
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.delete('/api/credentials', verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { website } = req.body;
    const query =
      'DELETE FROM credentials WHERE user_id = $1 AND website = $2 ';

    await pool.query(query, [userId, website]);
    console.log(userId, website);
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (err) {
    console.error('Error authenticating user', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const query =
      'SELECT user_id, username, password_hash, salt FROM users WHERE username = $1';
    const result = await pool.query(query, [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const user = result.rows[0];
    const parts = user.password_hash.split('.');
    const iv = parts[0];
    const neededPassword = parts[1];
    const decryptedPassword = decryptPassword(neededPassword, user.salt, iv);
    if (password !== decryptedPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    const token = jwt.sign({ userId: user.user_id }, 'secret', {
      expiresIn: '10min',
    });

    res.json({ token: token });
  } catch (err) {
    console.error('Error authenticating user', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.post('/api/users/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const SELECTquery =
      'SELECT COUNT(*) AS count FROM users WHERE username = $1';
    const result = await pool.query(SELECTquery, [email]);
    const count = parseInt(result.rows[0].count);
    if (count > 0) {
      res.status(409).json({ error: 'User already exists' });
    } else {
      const query =
        'INSERT INTO users (username,password_hash, salt) VALUES ($1,$2,$3)';
      const salt = generateSalt();
      const encryptedData = encryptPassword(password, salt);
      const storedPassword =
        encryptedData.iv + '.' + encryptedData.encryptedPassword;
      await pool.query(query, [email, storedPassword, encryptedData.key]);
      res.status(201).json({ message: 'User registered successfully' });
    }
  } catch (err) {
    console.error('Error authenticating user', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});
app.post('/api/credentials', verifyToken, async (req, res) => {
  try {
    const { website, email, password } = req.body;
    const userId = req.userId;
    const salt = generateSalt();
    const encryptedData = encryptPassword(password, salt);
    const storedPassword =
      encryptedData.iv + '.' + encryptedData.encryptedPassword;
    await pool.query(
      'INSERT INTO credentials (user_id, website, email, password_hash, salt) VALUES ($1, $2, $3, $4, $5)',
      [userId, website, email, storedPassword, encryptedData.key]
    );
    res.status(201).json({ message: 'Credentials added successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.use((req, res, next) => {
  res.status(404).json({ error: 'Resource not found' });
});
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(err.status || 500)
    .json({ error: err.message || 'Internal Server Error' });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
