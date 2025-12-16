require('dotenv').config();

const express = require('express');
const fetch = require('node-fetch'); 
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;
const CLAVE_IP_LOCATION = process.env.CLAVE_IP_LOCATION; 
const NETLIFY_DOMAIN = process.env.DOMINIO_NETLIFY || 'http://localhost:5173';

const URL_API_LOCATION = 'https://ipwho.is/';

const allowedOrigins = [
    // La URL pública de tu frontend en Netlify (¡DEBE SER HTTPS!)
    "https://ubicacion-ip.netlify.app/", 
    // Si necesitas probar localmente
    'http://localhost:5173' 
];

app.use(cors({
    origin: NETLIFY_DOMAIN,
    methods: ['GET'],
}));
app.use(express.json()); 

app.get('/api/localizar/:direccionIP', async (req, res) => {
    const { direccionIP } = req.params;

    if (!CLAVE_IP_LOCATION) {
         return res.status(500).json({ error: 'Falta la clave de IP Location en el servidor.' });
    }

    try {
        const urlCompleta  = `${URL_API_LOCATION}${direccionIP}?apikey=${CLAVE_IP_LOCATION}`;
        const respuesta = await fetch(urlCompleta); 

        if (!respuesta.ok) {
            return res.status(respuesta.status).json({ error: 'Fallo al obtener datos de la API externa' });
        }

        let data;
        try {
            data = await respuesta.json();
        } catch (jsonError) {
            console.error('Error al parsear JSON de la API:', jsonError);
            return res.status(502).json({ error: 'Respuesta inválida de la API de localización.' });
        }

        if (data.status === 'fail' || data.reserved === true) {
            // Si la IP es inválida o reservada (como 254.x.x.x)
            const mensajeError = data.message || 'La IP consultada es reservada o inválida.';
            return res.status(400).json({ error: mensajeError });
        }

        if (data.success === false) {
             return res.status(400).json({ error: 'IP no válida o límite alcanzado.' });
        }
        res.json({
            ip: data.ip,
            pais: data.country,
            ciudad: data.city,
            latitud: data.latitude,
            longitud: data.longitude,
        });

    } catch (error) {
        console.error('Error en el servidor:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});


app.listen(PORT, () => {
    console.log(`🚀 Servidor Express corriendo en ${PORT}`);
});