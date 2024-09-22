const { addonBuilder } = require("stremio-addon-sdk");
const fetch = require("node-fetch");
const argv = require('minimist')(process.argv.slice(2)); // Manejador de argumentos

// Obtener manifest.id desde la línea de comandos o usar un valor predeterminado
const manifestId = argv['id'] || 'org.stremio.m3u';

// Crea el objeto base del addon
const manifest = {
    "id": manifestId, // Asignar el manifest.id desde el argumento
    "version": "1.0.0",
    "name": "M3U Playlist Addon",
    "description": "Addon para reproducir listas M3U en Stremio",
    "catalogs": [],
    "resources": ["stream"],
    "types": ["tv"],
    "idPrefixes": ["m3u"]
};

const builder = new addonBuilder(manifest);

// Función para procesar la lista M3U
async function procesarM3U(url) {
    const response = await fetch(url);
    const text = await response.text();
    const lines = text.split("\n").filter(line => line.trim() && !line.startsWith("#"));

    return lines.map((line, index) => ({
        name: `Canal ${index + 1}`,
        url: line
    }));
}

// Define el manejo de streams
builder.defineStreamHandler(async (args) => {
    if (args.type === "tv" && args.id.startsWith("m3u:")) {
        const m3uUrl = decodeURIComponent(args.id.split(":")[1]);
        const canales = await procesarM3U(m3uUrl);

        const streams = canales.map(canal => ({
            title: canal.name,
            url: canal.url
        }));

        return { streams };
    } else {
        return { streams: [] }; // Si no es del tipo esperado
    }
});

// Iniciar el servidor del addon
const addonInterface = builder.getInterface();
const { serveHTTP } = require("stremio-addon-sdk");

serveHTTP(addonInterface, { port: 7000 });
console.log(`Addon escuchando en el puerto 7000 con id: ${manifestId}`);
