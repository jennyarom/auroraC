// Importa el framework Express
const express = require('express');
// Importa el middleware bodyParser para analizar datos de solicitud en formato JSON
const bodyParser = require('body-parser');
// Importa el módulo MySQL para interactuar con la base de datos MySQL
const mysql = require('mysql');
// Importa la biblioteca bcrypt para el cifrado de contraseñas
const bcrypt = require('bcrypt');
// Importa el módulo path para manejar rutas de archivos y directorios
const path = require('path');
// Importa el módulo CORS para permitir solicitudes desde otros dominios
const cors = require('cors');

//Importa PostgreSQL
const { Pool } = require('pg');

// Crea una instancia de la aplicación Express
const app = express();

// Habilita CORS para permitir solicitudes desde otros dominios
app.use(cors({
    origin: 'https://jennyarom.github.io'
}));

// Establece el puerto en el que el servidor escuchará las solicitudes
const port = 5432;

// Crea una conexión a la base de datos MySQL
const pool = new Pool({
    user: 'admin',
    host: 'dpg-cpb7t86n7f5s73f76pc0-a',
    database: 'usuario',
    password: 'lTLwyJSe48CO5JIvz5eicvl6TiT8S2sf',
    port: 5432, // Puerto predeterminado de PostgreSQL
  });


// Establece la conexión a la base de datos MySQL
pool.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Conexión a la base de datos establecida');
});

// Configura el middleware bodyParser para analizar datos de solicitud codificados en URL y JSON
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configura Express para servir archivos estáticos desde el directorio 'public'
app.use(express.static('public'));

// Define la ruta para la página de inicio
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Define la ruta para la página de inicio de sesión
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login', 'login.html'));
});

// Define la ruta para la página de registro
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register', 'registro.html'));
});

// Define la ruta para la página del carrito
app.get('/carrito', (req, res) => {
    res.sendFile(path.join(__dirname, 'carrito.html'));
});

app.get('/crud/delete', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'crud', 'delete.html'));
});

app.get('/crud/get', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'crud', 'get.html'));
});

app.get('/crud/put', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'crud', 'put.html'));
});

// Definir la ruta para el cierre de sesión
app.get('/logout', (req, res) => {
    res.redirect('/login/login.html');
});

// Maneja las solicitudes POST para iniciar sesión
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const query = 'SELECT * FROM usuario WHERE username = ?';
    console.log('Executing query:', query, 'with values:', [username]);
    pool.query(query, [username], (err, result) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        if (result.length > 0) {
            const hashedPassword = result[0].password;
            bcrypt.compare(password, hashedPassword, (err, bcryptResult) => {
                if (err) {
                    console.error('Error comparing passwords:', err);
                    res.status(500).json({ error: 'Internal server error' });
                    return;
                }
                if (bcryptResult) {
                    res.json({ exists: true });
                } else {
                    res.json({ exists: false });
                }
            });
        } else {
            res.json({ exists: false });
        }
    });
});

// Maneja las solicitudes POST para registrar un nuevo usuario
app.post('/register', (req, res) => {
    const { name, username, password } = req.body;
    const saltRounds = 10;
    const insertUserQuery = 'INSERT INTO usuario (name, username, password) VALUES (?, ?, ?)';
    const checkUsernameQuery = 'SELECT * FROM usuario WHERE username = ?';
    console.log('Executing query:', checkUsernameQuery, 'with values:', [username]);
    pool.query(checkUsernameQuery, [username], (err, result) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        if (result.length > 0) {
            return res.status(400).json({ error: 'Username already in use' });
        }
        bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
            if (err) {
                console.error('Error hashing password:', err);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }
            console.log('Executing query:', insertUserQuery, 'with values:', [name, username, hashedPassword]);
            pool.query(insertUserQuery, [name, username, hashedPassword], (err, result) => {
                if (err) {
                    console.error('Error inserting user:', err);
                    res.status(500).json({ error: 'Internal server error' });
                    return;
                }
                res.json({ registered: true });
            });
        });
    });
});

// Maneja las solicitudes GET para consultar personas
app.get('/crud/get', (req, res) => {
    const query = 'SELECT * FROM usuario';
    console.log('Executing query:', query);
    pool.query(query, (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        res.json(results);
    });
});

// Maneja las solicitudes PUT para actualizar una persona
app.put('/crud/put/:id', (req, res) => {
    const { id } = req.params;
    const { name, username } = req.body;
    if (!name || !username) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    const query = 'UPDATE usuario SET name = ?, username = ? WHERE id = ?';
    console.log('Executing query:', query, 'with values:', [name, username, id]);
    pool.query(query, [name, username, id], (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        if (results.affectedRows === 0) {
            res.status(404).json({ error: 'Persona not found' });
            return;
        }
        res.json({ message: 'Persona updated successfully' });
    });
});

app.delete('/crud/delete/:id', (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM usuario WHERE id = ?';
    console.log('Executing query:', query, 'with value:', [id]);
    pool.query(query, [id], (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            res.status(500).json({ error: 'Internal server error' });
            return;
        }
        res.json({ message: 'Persona deleted successfully' });
    });
});

// Manejo de errores para rutas no encontradas
app.use((req, res, next) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Manejador de errores genérico
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// Inicia el servidor
app.listen(port, () => {
    console.log(`Servidor escuchando en https://aurorac.onrender.com${port}`);
});