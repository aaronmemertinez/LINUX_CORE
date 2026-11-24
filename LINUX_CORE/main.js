/* =========================================
   LINUX CORE - SISTEMA DE TIENDA
========================================= */

// La lógica de la tienda solo se ejecuta en páginas que contienen el catálogo.
if (document.querySelector('.producto')) {

const productosHTML = document.querySelectorAll(".producto");
const listaCarrito = document.getElementById("listaCarrito");
const carritoVacio = document.getElementById("carritoVacio");
const carritoContenido = document.getElementById("carritoContenido");
const cartCount = document.getElementById("cartCount");
const totalPrecio = document.getElementById("totalPrecio");
const notificacion = document.getElementById("notificacion");

const modal = document.getElementById("modalProducto");
const modalImagen = document.getElementById("modalImagen");
const modalNombre = document.getElementById("modalNombre");
const modalDescripcion = document.getElementById("modalDescripcion");
const modalPrecio = document.getElementById("modalPrecio");
const modalCaracteristicas = document.getElementById("modalCaracteristicas");

const formatoDinero = cantidad =>
    cantidad.toLocaleString("es-MX", {
        style: "currency",
        currency: "MXN"
    });

const productos = Array.from(productosHTML).map(elemento => ({
    id: Number(elemento.dataset.id),
    nombre: elemento.querySelector("h3").textContent,
    precio: Number(
        elemento.querySelector(".precio").textContent.replace(/[^\d.]/g, "")
    ),
    imagen: elemento.querySelector("img").src
}));

// Sincroniza nombre y precio visibles con el catálogo de Supabase.
(async () => {
    if (!window.supabaseClient) return;
    const { data, error } = await window.supabaseClient
        .from("productos").select("nombre, precio, imagen_url, inventario(existencias)").eq("activo", true);
    if (error) { console.warn("No se pudo actualizar el catálogo desde Supabase:", error.message); return; }
    productos.forEach(producto => {
        const registro = data.find(p => p.nombre.trim().toLowerCase() === producto.nombre.trim().toLowerCase());
        if (!registro) return;
        producto.precio = Number(registro.precio);
        producto.existencias = Number(registro.inventario?.[0]?.existencias ?? 0);
        const botonStock = tarjetaStock(producto.id);
        if (botonStock) {
            botonStock.textContent = producto.existencias > 0 ? `Existencias: ${producto.existencias}` : "Agotado";
            botonStock.classList.toggle("sin-stock", producto.existencias <= 0);
        }
        const tarjeta = Array.from(productosHTML).find(el => Number(el.dataset.id) === producto.id);
        if (tarjeta) tarjeta.querySelector(".precio").textContent = formatoDinero(producto.precio) + " MXN";
        if (registro.imagen_url) producto.imagen = registro.imagen_url;
    });
    actualizarCarrito();
})();

function tarjetaStock(id) {
    const tarjeta = Array.from(productosHTML).find(el => Number(el.dataset.id) === Number(id));
    if (!tarjeta) return null;
    let etiqueta = tarjeta.querySelector(".stock-disponible");
    if (!etiqueta) {
        etiqueta = document.createElement("p");
        etiqueta.className = "stock-disponible";
        tarjeta.querySelector(".precio").insertAdjacentElement("afterend", etiqueta);
    }
    return etiqueta;
}

let carrito = JSON.parse(localStorage.getItem("linuxcore_carrito")) || [];
let productoSeleccionado = null;
let temporizadorNotificacion;
let accionDeshacer = null;

function guardarCarrito() {
    localStorage.setItem("linuxcore_carrito", JSON.stringify(carrito));
}

function buscarProducto(id) {
    return productos.find(p => p.id === Number(id));
}

function mostrarNotificacion(mensaje, deshacer = null) {
    clearTimeout(temporizadorNotificacion);
    notificacion.replaceChildren();

    const texto = document.createElement("span");
    texto.textContent = mensaje;
    notificacion.appendChild(texto);

    accionDeshacer = deshacer;

    if (deshacer) {
        const boton = document.createElement("button");
        boton.textContent = "Deshacer";
        boton.className = "btn-deshacer";

        boton.addEventListener("click", () => {
            const accion = accionDeshacer;
            accionDeshacer = null;
            if (accion) accion();
            ocultarNotificacion();
        });

        notificacion.appendChild(boton);
    }

    notificacion.classList.add("mostrar");

    temporizadorNotificacion = setTimeout(
        ocultarNotificacion,
        4000
    );
}

function ocultarNotificacion() {
    notificacion.classList.remove("mostrar");
}

function agregarAlCarrito(id) {
    const producto = buscarProducto(id);
    if (!producto) return;
    if (Number.isFinite(producto.existencias)) {
        const enCarrito = carrito.find(p => p.id === producto.id)?.cantidad || 0;
        if (producto.existencias <= enCarrito) {
            mostrarNotificacion("No hay más existencias disponibles de este componente.");
            return;
        }
    }

    const existente = carrito.find(p => p.id === producto.id);

    if (existente) {
        existente.cantidad++;
    } else {
        carrito.push({ ...producto, cantidad: 1 });
    }

    actualizarCarrito();
    mostrarNotificacion("Producto agregado al carrito");
}

function actualizarCarrito() {
    listaCarrito.replaceChildren();

    let total = 0;
    let cantidadTotal = 0;

    carrito.forEach(producto => {
        const subtotal = producto.precio * producto.cantidad;
        total += subtotal;
        cantidadTotal += producto.cantidad;

        const articulo = document.createElement("article");
        articulo.className = "item-carrito";

        const imagen = document.createElement("img");
        imagen.src = producto.imagen;
        imagen.alt = producto.nombre;

        const informacion = document.createElement("div");
        informacion.className = "info-carrito";

        const nombre = document.createElement("h3");
        nombre.textContent = producto.nombre;

        const precio = document.createElement("p");
        precio.textContent = formatoDinero(producto.precio);

        const subtotalTexto = document.createElement("p");
        subtotalTexto.textContent = "Subtotal: " + formatoDinero(subtotal);

        informacion.append(nombre, precio, subtotalTexto);

        const controles = document.createElement("div");
        controles.className = "controles-carrito";

        const menos = document.createElement("button");
        menos.textContent = "−";
        menos.setAttribute("aria-label", "Disminuir cantidad");

        menos.addEventListener("click", evento => {
            evento.stopPropagation();
            cambiarCantidad(producto.id, -1);
        });

        const cantidad = document.createElement("span");
        cantidad.textContent = producto.cantidad;

        const mas = document.createElement("button");
        mas.textContent = "+";
        mas.setAttribute("aria-label", "Aumentar cantidad");

        mas.addEventListener("click", evento => {
            evento.stopPropagation();
            cambiarCantidad(producto.id, 1);
        });

        const eliminar = document.createElement("button");
        eliminar.textContent = "Eliminar";
        eliminar.className = "eliminar";

        eliminar.addEventListener("click", evento => {
            evento.stopPropagation();
            eliminarProducto(producto.id);
        });

        controles.append(menos, cantidad, mas, eliminar);
        articulo.append(imagen, informacion, controles);
        listaCarrito.appendChild(articulo);
    });

    cartCount.textContent = cantidadTotal;
    totalPrecio.textContent = formatoDinero(total);

    carritoVacio.hidden = carrito.length !== 0;
    carritoContenido.hidden = carrito.length === 0;

    guardarCarrito();
}

function cambiarCantidad(id, cambio) {
    const producto = carrito.find(p => p.id === id);
    if (!producto) return;

    if (cambio > 0) {
        const datosProducto = buscarProducto(id);
        if (Number.isFinite(datosProducto?.existencias) && producto.cantidad >= datosProducto.existencias) {
            mostrarNotificacion("No hay más existencias disponibles.");
            return;
        }
    }
    producto.cantidad += cambio;

    if (producto.cantidad <= 0) {
        eliminarProducto(id);
        return;
    }

    actualizarCarrito();
}

function eliminarProducto(id) {
    const posicion = carrito.findIndex(p => p.id === id);
    if (posicion === -1) return;

    const eliminado = carrito[posicion];
    carrito.splice(posicion, 1);

    actualizarCarrito();

    mostrarNotificacion("Producto eliminado", () => {
        carrito.splice(posicion, 0, eliminado);
        actualizarCarrito();
        mostrarNotificacion("Producto recuperado");
    });
}

document.getElementById("vaciarCarrito").addEventListener("click", () => {
    if (!carrito.length) return;

    const anterior = structuredClone(carrito);
    carrito = [];

    actualizarCarrito();

    mostrarNotificacion("Carrito vaciado", () => {
        carrito = anterior;
        actualizarCarrito();
        mostrarNotificacion("Carrito recuperado");
    });
});

// MODAL DE PRODUCTOS

function abrirModal(id) {
    const producto = buscarProducto(id);
    if (!producto) return;

    productoSeleccionado = producto;

    modalImagen.src = producto.imagen;
    modalImagen.alt = producto.nombre;
    modalNombre.textContent = producto.nombre;
    modalDescripcion.textContent =
        "Consulta este componente disponible en LINUX CORE.";

    modalPrecio.textContent = formatoDinero(producto.precio);
    modalCaracteristicas.replaceChildren();

    [
        "Producto disponible en el catálogo LINUX CORE",
        "Precio expresado en pesos mexicanos",
        "Componente para computadora"
    ].forEach(caracteristica => {
        const li = document.createElement("li");
        li.textContent = caracteristica;
        modalCaracteristicas.appendChild(li);
    });

    modal.classList.add("activo");
}

function cerrarModal() {
    modal.classList.remove("activo");
}

document.getElementById("cerrarModal").addEventListener("click", cerrarModal);

modal.addEventListener("click", evento => {
    if (evento.target === modal) cerrarModal();
});

document.addEventListener("keydown", evento => {
    if (evento.key === "Escape") cerrarModal();
});

// BOTONES DEL CATÁLOGO

productosHTML.forEach(elemento => {
    const id = Number(elemento.dataset.id);

    elemento.addEventListener("click", evento => {
        if (evento.target.closest(".comprar")) return;
        abrirModal(id);
    });

    elemento.querySelector(".comprar").addEventListener("click", evento => {
        evento.stopPropagation();
        agregarAlCarrito(id);
    });
});

document.getElementById("modalAgregar").addEventListener("click", () => {
    if (productoSeleccionado) {
        agregarAlCarrito(productoSeleccionado.id);
    }
});

document.getElementById("modalComprar").addEventListener("click", () => {
    if (!productoSeleccionado) return;

    agregarAlCarrito(productoSeleccionado.id);

    const equivalencias = {
        0: "procesador",
        1: "grafica",
        2: "ram",
        3: "ssd",
        4: "tarjetaMadre",
        5: "fuente",
        6: "gabinete",
        7: "disipador",
        8: "monitor",
        9: "teclado"
    };

    const carritoCompra = carrito.map(producto => ({
        id: equivalencias[producto.id],
        quantity: producto.cantidad
    }));

    localStorage.setItem("linuxCoreCart", JSON.stringify(carritoCompra));
    cerrarModal();
    window.location.href = "compra.html";
});

// BUSCADOR

const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const sinResultados = document.getElementById("sinResultados");

function buscarProductos() {
    const busqueda = searchInput.value.trim().toLowerCase();
    let encontrados = 0;

    productosHTML.forEach(elemento => {
        const nombre = elemento.querySelector("h3").textContent.toLowerCase();
        const coincide = nombre.includes(busqueda);

        elemento.hidden = !coincide;
        if (coincide) encontrados++;
    });

    sinResultados.hidden = encontrados !== 0;

    document.getElementById("productos").scrollIntoView({
        behavior: "smooth"
    });
}

searchForm.addEventListener("submit", evento => {
    evento.preventDefault();
    buscarProductos();
});

searchInput.addEventListener("input", buscarProductos);

// COMPRAS Y COMPROBANTES

document.getElementById("comprarCarrito").addEventListener("click", () => {
    if (!carrito.length) {
        mostrarNotificacion("Tu carrito está vacío");
        return;
    }

    const equivalencias = {
        0: "procesador",
        1: "grafica",
        2: "ram",
        3: "ssd",
        4: "tarjetaMadre",
        5: "fuente",
        6: "gabinete",
        7: "disipador",
        8: "monitor",
        9: "teclado"
    };

    const carritoCompra = carrito.map(producto => ({
        id: equivalencias[producto.id],
        quantity: producto.cantidad
    }));

    localStorage.setItem("linuxCoreCart", JSON.stringify(carritoCompra));
    window.location.href = "compra.html";
});

// INICIAR TIENDA

actualizarCarrito();
}

// MENÚ HAMBURGUESA (index.html)
const botonMenu = document.getElementById("btnMenu");
const menuNavegacion = document.getElementById("menuNavegacion");

if (botonMenu && menuNavegacion) {
    botonMenu.addEventListener("click", () => {
        const abierto = menuNavegacion.classList.toggle("menu-abierto");
        botonMenu.setAttribute("aria-expanded", String(abierto));
        botonMenu.setAttribute(
            "aria-label",
            abierto ? "Cerrar menú de navegación" : "Abrir menú de navegación"
        );
    });

    menuNavegacion.querySelectorAll("a").forEach(enlace => {
        enlace.addEventListener("click", () => {
            menuNavegacion.classList.remove("menu-abierto");
            botonMenu.setAttribute("aria-expanded", "false");
            botonMenu.setAttribute("aria-label", "Abrir menú de navegación");
        });
    });
}

// VALIDACIÓN DEL FORMULARIO DE CONTACTO EN TIEMPO REAL
const formularioContacto = document.getElementById("formContacto");

if (formularioContacto) {
    const nombre = document.getElementById("nombreContacto");
    const correo = document.getElementById("correoContacto");
    const telefono = document.getElementById("telefonoContacto");
    const tema = document.getElementById("temaContacto");
    const mensaje = document.getElementById("mensajeContacto");
    const respuesta = document.getElementById("respuestaContacto");
    const camposContacto = [nombre, correo, telefono, tema, mensaje];
    const vistos = new WeakSet();

    function validarContacto(campo) {
        const valor = campo.value.trim();
        let error = "";

        if (campo === nombre && (valor.length < 3 || valor.length > 80))
            error = "Escribe tu nombre (mínimo 3 y máximo 80 caracteres).";
        else if (campo === correo && (!/^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(valor) || valor.length > 254))
            error = "Ingresa un correo válido. Ejemplo: usuario@gmail.com.";
        else if (campo === telefono && !/^[0-9]{10}$/.test(valor))
            error = "El teléfono debe contener exactamente 10 dígitos.";
        else if (campo === tema && !valor)
            error = "Selecciona un motivo de contacto.";
        else if (campo === mensaje && (valor.length < 10 || valor.length > 1000))
            error = "El mensaje debe tener entre 10 y 1000 caracteres.";

        campo.classList.toggle("invalido", Boolean(error));
        campo.classList.toggle("valido", !error && valor.length > 0);
        campo.setAttribute("aria-invalid", error ? "true" : "false");

        let ayuda = campo.nextElementSibling;
        if (!ayuda || !ayuda.classList.contains("mensaje-validacion-contacto")) {
            ayuda = document.createElement("small");
            ayuda.className = "mensaje-validacion-contacto";
            campo.insertAdjacentElement("afterend", ayuda);
        }
        ayuda.textContent = error || (valor ? "✓ Campo correcto." : "");
        ayuda.classList.toggle("error-campo-contacto", Boolean(error));
        ayuda.classList.toggle("correcto-campo-contacto", !error && Boolean(valor));
        return !error;
    }

    camposContacto.forEach(campo => {
        campo.addEventListener("input", () => {
            vistos.add(campo);
            validarContacto(campo);
            respuesta.textContent = "";
        });
        campo.addEventListener("change", () => {
            vistos.add(campo);
            validarContacto(campo);
        });
        campo.addEventListener("blur", () => {
            vistos.add(campo);
            validarContacto(campo);
        });
    });

    telefono.addEventListener("input", () => {
        const limpio = telefono.value.replace(/\D/g, "").slice(0, 10);
        if (telefono.value !== limpio) telefono.value = limpio;
    });

    formularioContacto.addEventListener("submit", async evento => {
        evento.preventDefault();
        const resultados = camposContacto.map(campo => {
            vistos.add(campo);
            return validarContacto(campo);
        });
        if (resultados.includes(false)) {
            respuesta.textContent = "Revisa los campos marcados en rojo.";
            respuesta.style.color = "#c62828";
            camposContacto.find((campo, i) => !resultados[i])?.focus();
            return;
        }

        const boton = formularioContacto.querySelector('button[type="submit"]');
        boton.disabled = true;
        respuesta.textContent = "Enviando mensaje...";
        respuesta.style.color = "";

        try {
            if (!window.supabaseClient) throw new Error("No se pudo conectar con la base de datos. Recarga la página.");
            const { error } = await window.supabaseClient.from("mensajes_contacto").insert({
                nombre: nombre.value.trim(),
                correo: correo.value.trim().toLowerCase(),
                telefono: telefono.value.trim(),
                tema: tema.value,
                mensaje: mensaje.value.trim()
            });
            if (error) throw error;
            respuesta.textContent = "¡Gracias! Tu mensaje fue enviado correctamente.";
            respuesta.style.color = "#16803c";
            formularioContacto.reset();
            camposContacto.forEach(campo => {
                campo.classList.remove("valido", "invalido");
                campo.setAttribute("aria-invalid", "false");
                const ayuda = campo.nextElementSibling;
                if (ayuda?.classList.contains("mensaje-validacion-contacto")) ayuda.textContent = "";
            });
        } catch (error) {
            console.error("Error al guardar contacto:", error);
            respuesta.textContent = error.message || "No fue posible enviar tu mensaje. Intenta nuevamente.";
            respuesta.style.color = "#c62828";
        } finally {
            boton.disabled = false;
        }
    });
}
