let datosApp = { sectores: [], rutas: [], alertas: [] };
let rutasCalculadasActuales = [];

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await fetch('datos.json');
        datosApp = await res.json();
        cargarFavoritos();
    } catch (error) {
        console.error(error);
    }
});

const themeBtn = document.getElementById('theme-toggle');
themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    themeBtn.textContent = document.body.classList.contains('dark-mode') ? "Modo Claro" : "Modo Oscuro";
});

function calcularTotalesTramo(ruta) {
    let tiempoBase = 0;
    let costoBase = 0;
    ruta.tramos.forEach(tramo => {
        tiempoBase += tramo.tiempo_min;
        costoBase += tramo.costo;
    });
    return { tiempoBase, costoBase, transbordos: ruta.tramos.length - 1 };
}

const form = document.getElementById('ruta-form');
form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const origen = document.getElementById('origen').value;
    const destino = document.getElementById('destino').value;
    const criterioOrden = document.getElementById('criterio_orden').value;
    
    const alertasSeleccionadas = Array.from(document.querySelectorAll('.alerta-cb:checked')).map(cb => cb.value);

    const rutasPosibles = datosApp.rutas.filter(r => 
        (r.origen === origen && r.destino === destino) || 
        (r.origen === destino && r.destino === origen)
    );

    if (rutasPosibles.length === 0) {
        document.getElementById('resultados').innerHTML = `<p style="color: red; text-align: center; font-weight: bold; background: white; padding: 10px; border-radius: 8px;">Ruta no encontrada. Intenta otra combinación.</p>`;
        return;
    }

    rutasCalculadasActuales = rutasPosibles.map(ruta => {
        let { tiempoBase, costoBase, transbordos } = calcularTotalesTramo(ruta);
        let tiempoEstimado = tiempoBase;
        let costoTotal = costoBase;

        alertasSeleccionadas.forEach(alertaId => {
            const alertaDatos = datosApp.alertas.find(a => a.id === alertaId);
            if (alertaDatos) {
                tiempoEstimado = tiempoEstimado * (1 + (alertaDatos.tiempo_pct / 100));
                costoTotal += alertaDatos.costo_extra;
            }
        });

        tiempoEstimado = Math.round(tiempoEstimado);

        return { 
            ...ruta, 
            displayOrigen: origen, 
            displayDestino: destino, 
            tiempoEstimado, 
            costoTotal, 
            transbordos 
        };
    });

    renderizarResultados(criterioOrden);
});

document.getElementById('criterio_orden').addEventListener('change', (e) => {
    if (rutasCalculadasActuales.length > 0) {
        renderizarResultados(e.target.value);
    }
});

function renderizarResultados(criterio) {
    const resultadosDiv = document.getElementById('resultados');
    
    rutasCalculadasActuales.sort((a, b) => {
        if (criterio === 'tiempo') return a.tiempoEstimado - b.tiempoEstimado;
        if (criterio === 'costo') return a.costoTotal - b.costoTotal;
        if (criterio === 'transbordos') return a.transbordos - b.transbordos;
        return 0;
    });

    resultadosDiv.innerHTML = rutasCalculadasActuales.map(ruta => `
        <article class="card result-card">
            <h3>🚌 ${ruta.tipo}: ${ruta.nombre}</h3>
            <p>📍 <strong>Ruta:</strong> ${ruta.displayOrigen} ➡️ ${ruta.displayDestino}</p>
            <p>⏱️ <strong>Tiempo:</strong> ${ruta.tiempoEstimado} min</p>
            <p>💰 <strong>Costo:</strong> RD$ ${ruta.costoTotal}</p>
            <p>🔄 <strong>Transbordos:</strong> ${ruta.transbordos}</p>
            <button class="btn--fav" onclick="guardarFavorito('${ruta.id}')">⭐ Guardar Favorita</button>
        </article>
    `).join('');
}

function guardarFavorito(rutaId) {
    let favoritos = JSON.parse(localStorage.getItem('guagua_favoritos')) || [];
    if (!favoritos.includes(rutaId)) {
        favoritos.push(rutaId);
        localStorage.setItem('guagua_favoritos', JSON.stringify(favoritos));
        cargarFavoritos();
        alert('Ruta guardada exitosamente.');
    } else {
        alert('Esta ruta ya está en tus favoritos.');
    }
}

function cargarFavoritos() {
    const contenedor = document.getElementById('lista-favoritos');
    let favoritosIds = JSON.parse(localStorage.getItem('guagua_favoritos')) || [];
    
    if (favoritosIds.length === 0) {
        contenedor.innerHTML = '<p>No tienes rutas guardadas.</p>';
        return;
    }

    if(datosApp.rutas.length > 0) {
        const rutasFavs = favoritosIds.map(id => datosApp.rutas.find(r => r.id === id)).filter(Boolean);
        contenedor.innerHTML = rutasFavs.map(ruta => `
            <div style="padding: 10px; border-bottom: 1px solid var(--border-color);">
                <strong>${ruta.nombre}</strong>
                <button onclick="eliminarFavorito('${ruta.id}')" style="color:red; float:right; background:none; border:none; cursor:pointer;">X</button>
            </div>
        `).join('');
    }
}

function eliminarFavorito(rutaId) {
    let favoritos = JSON.parse(localStorage.getItem('guagua_favoritos')) || [];
    favoritos = favoritos.filter(id => id !== rutaId);
    localStorage.setItem('guagua_favoritos', JSON.stringify(favoritos));
    cargarFavoritos();
}