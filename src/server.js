const express = require('express');
const cors = require('cors');
//Permite hacer consultas a servidores externos
const fs = require('fs');
const app = express();

//Middleware (Capa extra de configuración de tu servidor)
//función que tiene acceso al objeto de solicitud (req), al objeto de respuesta (res)
app.use(cors());
//Formato de respuestas res en formato json()
app.use(express.json());

const usuariosFile = './usuarios.json';
const mensajesFile = './mensajes.json';

//Leer los archivos JSON
const leerArchivo = (file) => {
    return new Promise((resolve, reject) => {
        fs.readFile(file, 'utf8', (err, data) => {
            if (err) reject(err);
            resolve(JSON.parse(data || '[]'));
        });
    });
};

//Guardar en los archivos JSON
const escribirArchivo = (file, data) => {
    return new Promise((resolve, reject) => {
        fs.writeFile(file, JSON.stringify(data, null, 2), (err) => {
            if (err) reject(err);
            resolve();
        });
    });
};

// ============================
//  Rutas para Usuarios
// ============================

// Obtener todos los usuarios
app.get('/usuarios', async (req, res) => {
    const usuarios = await leerArchivo(usuariosFile);
    res.json({usuarios: usuarios});
});

// Crear un nuevo usuario
app.post('/usuarios', async (req, res) => {
    const { nombre = 'Usuario Desconocido', email = 'sin-email@ejemplo.com', status= 'activado' } = req.body;
    
    const usuarios = await leerArchivo(usuariosFile);
    //Sino uuidv4 para no repetir id
    const nuevoUsuario = {
        id: usuarios.length ? usuarios[usuarios.length - 1].id + 1 : 1,
        nombre,
        email,
        status
    }
    usuarios.push(nuevoUsuario);
    await escribirArchivo(usuariosFile, usuarios);

    res.status(201).json(nuevoUsuario);
});

// Obtener un usuario por ID
// http://localhost:3000/usuarios/id=1
// v2 http://localhost:3000/usuarios?id=1

app.get('/usuarios/:id/', async (req, res) => {
    const usuarios = await leerArchivo(usuariosFile);
    const usuario = usuarios.find(u => u.id === parseInt(req.params.id));

    if (!usuario) {
        return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }
    res.json(usuario);
});

// Actualizar un usuario por ID
app.put('/usuarios/:id', async (req, res) => {
    const { nombre, email } = req.body;
    const usuarios = await leerArchivo(usuariosFile);
    const usuarioIndex = usuarios.findIndex(u => u.id === parseInt(req.params.id));

    if (usuarioIndex === -1) {
        return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    usuarios[usuarioIndex] = {
        ...usuarios[usuarioIndex],
        nombre: nombre || usuarios[usuarioIndex].nombre,
        email: email || usuarios[usuarioIndex].email
    };
    await escribirArchivo(usuariosFile, usuarios);

    res.json(usuarios[usuarioIndex]);
});

// Eliminar un usuario por ID
app.delete('/usuarios/:id', async (req, res) => {
    let usuarios = await leerArchivo(usuariosFile);
    usuarios = usuarios.filter(u => u.id !== parseInt(req.params.id));
    await escribirArchivo(usuariosFile, usuarios);

    res.json({ mensaje: 'Usuario eliminado' });
});



// ============================
//  Rutas para Mensajes
// ============================

// Obtener todos los mensajes
app.get('/mensajes', async (req, res) => {
    const mensajes = await leerArchivo(mensajesFile);
    res.json(mensajes);
});

// Crear un nuevo mensaje
app.post('/mensajes', async (req, res) => {
    const { usuarioId, contenido = 'Mensaje vacío' } = req.body;
    const usuarios = await leerArchivo(usuariosFile);

    // Verificar que el usuario exista
    if (!usuarios.find(u => u.id === usuarioId)) {
        return res.status(400).json({ mensaje: 'Usuario no válido' });
    }

    const mensajes = await leerArchivo(mensajesFile);
    const nuevoMensaje = {
        id: mensajes.length ? mensajes[mensajes.length - 1].id + 1 : 1,
        usuarioId,
        contenido,
        fecha: new Date().toISOString()
    };
    mensajes.push(nuevoMensaje);
    await escribirArchivo(mensajesFile, mensajes);

    res.status(201).json(nuevoMensaje);
});

// Obtener un mensaje por ID
app.get('/mensajes/:id', async (req, res) => {
    const mensajes = await leerArchivo(mensajesFile);
    const mensaje = mensajes.find(m => m.id === parseInt(req.params.id));

    if (!mensaje) {
        return res.status(404).json({ mensaje: 'Mensaje no encontrado' });
    }
    res.json(mensaje);
});

// Actualizar un mensaje por ID
app.put('/mensajes/:id', async (req, res) => {
    const { contenido } = req.body;
    const mensajes = await leerArchivo(mensajesFile);
    const mensajeIndex = mensajes.findIndex(m => m.id === parseInt(req.params.id));

    if (mensajeIndex === -1) {
        return res.status(404).json({ mensaje: 'Mensaje no encontrado' });
    }

    mensajes[mensajeIndex].contenido = contenido || mensajes[mensajeIndex].contenido;
    await escribirArchivo(mensajesFile, mensajes);

    res.json(mensajes[mensajeIndex]);
});

// Eliminar un mensaje por ID
app.delete('/mensajes/:id', async (req, res) => {
    let mensajes = await leerArchivo(mensajesFile);
    mensajes = mensajes.filter(m => m.id !== parseInt(req.params.id));
    await escribirArchivo(mensajesFile, mensajes);

    res.json({ mensaje: 'Mensaje eliminado' });
});

// ============================
//  Configuración del servidor
// ============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});
