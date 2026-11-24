const CLAVE_CARRITO = "linuxCoreCart";

const listaProductos = document.getElementById("listaProductos");
const carritoVacio = document.getElementById("carritoVacio");

const subtotalElemento = document.getElementById("subtotal");
const ivaElemento = document.getElementById("iva");
const totalElemento = document.getElementById("total");

const formulario = document.getElementById("formularioCompra");
const mensaje = document.getElementById("mensajeFormulario");
const botonCompra = document.getElementById("btnCompra");


/* CATÁLOGO */

const catalogo = {
    procesador: {
        nombre: "Procesador AMD Ryzen 5 5600",
        precio: 2199
    },
    grafica: {
        nombre: "Tarjeta gráfica NVIDIA RTX 4060",
        precio: 6499
    },
    ram: {
        nombre: "Memoria RAM Corsair 16GB DDR4",
        precio: 799
    },
    ssd: {
        nombre: "SSD Kingston 1TB",
        precio: 1299
    },
    tarjetaMadre: {
        nombre: "Tarjeta madre ASUS B550",
        precio: 2099
    },
    fuente: {
        nombre: "Fuente de poder 650W",
        precio: 1099
    },
    gabinete: {
        nombre: "Gabinete Gamer RGB",
        precio: 1599
    },
    disipador: {
        nombre: "Disipador Cooler Master",
        precio: 899
    },
    monitor: {
        nombre: "Monitor Gamer 24 pulgadas",
        precio: 2499
    },
    teclado: {
        nombre: "Teclado Mecánico RGB",
        precio: 699
    }
};


/* CAMPOS */

const campos = {
    nombre: document.getElementById("nombre"),
    correo: document.getElementById("correo"),
    telefono: document.getElementById("telefono"),
    ubicacion: document.getElementById("ubicacion"),
    calle: document.getElementById("calle"),
    referencias: document.getElementById("referencias")
};


/* DINERO */

const formatoDinero = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN"
});


/* OBTENER CARRITO */

function obtenerCarrito() {
    try {
        const datos = JSON.parse(
            localStorage.getItem(CLAVE_CARRITO)
        );

        if (!Array.isArray(datos)) return [];

        return datos
            .filter(item =>
                item &&
                typeof item.id === "string" &&
                catalogo[item.id] &&
                Number.isInteger(item.quantity) &&
                item.quantity > 0 &&
                item.quantity <= 99
            )
            .map(item => ({
                id: item.id,
                quantity: item.quantity
            }));

    } catch (error) {
        console.error("Error al leer el carrito:", error);
        return [];
    }
}

let carrito = obtenerCarrito();


/* GUARDAR CARRITO */

function guardarCarrito() {
    localStorage.setItem(
        CLAVE_CARRITO,
        JSON.stringify(carrito)
    );
}


/* MOSTRAR PRODUCTOS */

function mostrarProductos() {
    listaProductos.replaceChildren();

    if (carrito.length === 0) {
        carritoVacio.hidden = false;
        listaProductos.hidden = true;
        botonCompra.disabled = true;
        calcularTotales();
        return;
    }

    carritoVacio.hidden = true;
    listaProductos.hidden = false;
    botonCompra.disabled = false;

    carrito.forEach(item => {
        const producto = catalogo[item.id];

        const contenedor = document.createElement("article");
        contenedor.className = "producto-carrito";

        const informacion = document.createElement("div");
        informacion.className = "producto-info";

        const nombre = document.createElement("h3");
        nombre.textContent = producto.nombre;

        const precio = document.createElement("p");
        precio.textContent =
            "Precio unitario: " +
            formatoDinero.format(producto.precio);

        const controles = document.createElement("div");
        controles.className = "cantidad-controles";

        const disminuir = document.createElement("button");
        disminuir.type = "button";
        disminuir.textContent = "−";
        disminuir.setAttribute("aria-label", "Disminuir cantidad");

        disminuir.addEventListener("click", () => {
            cambiarCantidad(item.id, -1);
        });

        const cantidad = document.createElement("span");
        cantidad.textContent = item.quantity;

        const aumentar = document.createElement("button");
        aumentar.type = "button";
        aumentar.textContent = "+";
        aumentar.setAttribute("aria-label", "Aumentar cantidad");

        aumentar.addEventListener("click", () => {
            cambiarCantidad(item.id, 1);
        });

        controles.append(disminuir, cantidad, aumentar);

        const eliminar = document.createElement("button");
        eliminar.type = "button";
        eliminar.className = "eliminar";
        eliminar.textContent = "Eliminar producto";

        eliminar.addEventListener("click", () => {
            eliminarProducto(item.id);
        });

        informacion.append(nombre, precio, controles, eliminar);

        const totalProducto = document.createElement("strong");
        totalProducto.className = "producto-precio";
        totalProducto.textContent = formatoDinero.format(
            producto.precio * item.quantity
        );

        contenedor.append(informacion, totalProducto);
        listaProductos.appendChild(contenedor);
    });

    calcularTotales();
}


/* CANTIDADES */

function cambiarCantidad(id, cambio) {
    const producto = carrito.find(item => item.id === id);

    if (!producto) return;

    const nuevaCantidad = producto.quantity + cambio;

    if (nuevaCantidad <= 0) {
        eliminarProducto(id);
        return;
    }

    if (nuevaCantidad > 99) return;

    producto.quantity = nuevaCantidad;

    guardarCarrito();
    mostrarProductos();
}


/* ELIMINAR */

function eliminarProducto(id) {
    carrito = carrito.filter(item => item.id !== id);

    guardarCarrito();
    mostrarProductos();
}


/* TOTALES */

function calcularTotales() {
    let subtotal = 0;

    carrito.forEach(item => {
        subtotal += catalogo[item.id].precio * item.quantity;
    });

    const iva = subtotal * 0.16;
    const total = subtotal + iva;

    subtotalElemento.textContent = formatoDinero.format(subtotal);
    ivaElemento.textContent = formatoDinero.format(iva);
    totalElemento.textContent = formatoDinero.format(total);
}


/* VALIDACIONES */

function obtenerValidacion(campo) {
    const valor = campo.value.trim();

    switch (campo.id) {
        case "nombre":
            return {
                valido: /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+(?:[ '-][A-Za-zÁÉÍÓÚáéíóúÑñÜü]+)+$/.test(valor)
                    && valor.length <= 100,
                error: "Escribe tu nombre y al menos un apellido.",
                correcto: "Nombre ingresado correctamente."
            };

        case "correo":
            return {
                valido: /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(valor)
                    && valor.length <= 254,
                error: "Ingresa un correo válido. Ejemplo: usuario@gmail.com",
                correcto: "Correo electrónico válido."
            };

        case "telefono":
            return {
                valido: /^[0-9]{10}$/.test(valor),
                error: "El teléfono debe contener exactamente 10 dígitos.",
                correcto: "Número telefónico válido."
            };

        case "ubicacion":
            return {
                valido: valor !== "",
                error: "Selecciona una ubicación de León, Guanajuato.",
                correcto: "Ubicación seleccionada correctamente."
            };

        case "calle":
            return {
                valido: valor.length >= 3 && valor.length <= 150,
                error: "Ingresa una calle y número de domicilio válidos.",
                correcto: "Dirección ingresada correctamente."
            };

        case "referencias":
            return {
                valido: valor.length <= 300,
                error: "No superes los 300 caracteres.",
                correcto: "Referencias correctas."
            };
    }
}


/* MOSTRAR ESTADO VERDE O ROJO */

function comprobarCampo(campo) {
    const resultado = obtenerValidacion(campo);

    const mensajeCampo = campo.parentElement.querySelector(
        ".mensaje-validacion"
    );

    campo.classList.remove("valido", "invalido");

    mensajeCampo.classList.remove(
        "error-campo",
        "correcto-campo"
    );

    if (resultado.valido) {
        void campo.offsetWidth;
        campo.classList.add("valido");

        mensajeCampo.textContent = "✓ " + resultado.correcto;
        mensajeCampo.classList.add("correcto-campo");
    } else {
        campo.classList.add("invalido");

        mensajeCampo.textContent = "✕ " + resultado.error;
        mensajeCampo.classList.add("error-campo");
    }

    return resultado.valido;
}


/* VALIDACIÓN EN TIEMPO REAL */

Object.values(campos).forEach(campo => {
    campo.addEventListener("input", () => comprobarCampo(campo));
    campo.addEventListener("change", () => comprobarCampo(campo));
    campo.addEventListener("blur", () => comprobarCampo(campo));
});


/* TELÉFONO: SOLO 10 DÍGITOS */

campos.telefono.addEventListener("input", () => {
    campos.telefono.value = campos.telefono.value
        .replace(/\D/g, "")
        .slice(0, 10);

});


/* VALIDAR FORMULARIO */

function validarFormularioCompleto() {
    let todoCorrecto = true;

    const camposObligatorios = [
        campos.nombre,
        campos.correo,
        campos.telefono,
        campos.ubicacion,
        campos.calle
    ];

    camposObligatorios.forEach(campo => {
        if (!comprobarCampo(campo)) {
            todoCorrecto = false;
        }
    });

    if (campos.referencias.value.trim() !== "") {
        if (!comprobarCampo(campos.referencias)) {
            todoCorrecto = false;
        }
    } else {
        campos.referencias.classList.remove("valido", "invalido");

        campos.referencias.parentElement.querySelector(
            ".mensaje-validacion"
        ).textContent = "";
    }

    return todoCorrecto;
}


/* ERRORES GENERALES */

function mostrarError(texto) {
    mensaje.textContent = texto;
    mensaje.className = "mensaje error";
}


/* CONFIRMAR PEDIDO */

formulario.addEventListener("submit", async evento => {
    evento.preventDefault();
    mensaje.textContent = "";
    mensaje.className = "mensaje";
    if (!carrito.length) return mostrarError("Agrega productos antes de continuar.");
    if (!validarFormularioCompleto()) {
        mostrarError("Revisa los campos marcados en rojo antes de continuar.");
        formulario.querySelector(".invalido")?.focus();
        return;
    }
    if (!window.supabaseClient) return mostrarError("No se pudo conectar con la base de datos. Recarga la página.");

    botonCompra.disabled = true;
    botonCompra.textContent = "Guardando pedido...";
    try {
        const { data: sesionData, error: sesionError } = await window.supabaseClient.auth.getUser();
        if (sesionError || !sesionData.user) {
            localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
            mostrarError("Para guardar tu pedido debes iniciar sesión. Te llevaremos al acceso.");
            setTimeout(() => window.location.href = "login.html", 1200);
            return;
        }

        const nombres = carrito.map(item => catalogo[item.id].nombre);
        const { data: productosDB, error: productosError } = await window.supabaseClient
            .from("productos").select("id_producto, nombre, precio")
            .eq("activo", true).in("nombre", nombres);
        if (productosError) throw productosError;

        const items = carrito.map(item => {
            const producto = productosDB.find(p => p.nombre.trim().toLowerCase() === catalogo[item.id].nombre.trim().toLowerCase());
            if (!producto) throw new Error(`No encontramos ${catalogo[item.id].nombre} en el catálogo. Actualiza la página.`);
            return { id_producto: producto.id_producto, cantidad: item.quantity };
        });

        // La disponibilidad se valida dentro de crear_pedido, en una sola transacción.
        // No consultar inventario directamente: RLS mantiene esa tabla privada.

        const { data: idVenta, error: pedidoError } = await window.supabaseClient.rpc("crear_pedido", {
            p_items: items,
            p_nombre: campos.nombre.value.trim(),
            p_correo: campos.correo.value.trim().toLowerCase(),
            p_telefono: campos.telefono.value.trim(),
            p_colonia: campos.ubicacion.value,
            p_calle: campos.calle.value.trim(),
            p_referencias: campos.referencias.value.trim()
        });
        if (pedidoError) throw pedidoError;

        localStorage.removeItem(CLAVE_CARRITO);
        mensaje.className = "mensaje exito";
        mensaje.textContent = `¡Pedido registrado correctamente! Número de pedido: ${idVenta}. El pago se acordará posteriormente.`;
        formulario.reset();
        carrito = [];
        mostrarProductos();
    } catch (error) {
        console.error("Error al registrar pedido:", error);
        mostrarError(error.message || "No fue posible registrar tu pedido. Intenta nuevamente.");
    } finally {
        botonCompra.disabled = carrito.length === 0;
        botonCompra.textContent = "Confirmar datos del pedido";
    }
});;


/* INICIAR */

mostrarProductos();
