// Control de inicio de sesión y registro de LINUX CORE.
document.addEventListener("DOMContentLoaded", () => {
    const botonLogin = document.getElementById("modoLogin");
    const botonRegistro = document.getElementById("modoRegistro");
    const vistaLogin = document.getElementById("vistaLogin");
    const vistaRegistro = document.getElementById("vistaRegistro");
    const mensaje = document.getElementById("mensaje");
    const clienteSupabase = window.supabaseClient;

    if (!botonLogin || !botonRegistro || !vistaLogin || !vistaRegistro || !mensaje) {
        console.error("No se encontraron los elementos del formulario de acceso.");
        return;
    }

    function mostrarMensaje(texto, exito = false) {
        mensaje.textContent = texto;
        mensaje.className = exito ? "mensaje exito" : "mensaje";
    }

    function cambiarModo(modo) {
        const mostrarLogin = modo === "login";

        // Se usa tanto hidden como display para evitar que otros estilos
        // de la página oculten el cambio de formulario.
        vistaLogin.hidden = !mostrarLogin;
        vistaRegistro.hidden = mostrarLogin;
        vistaLogin.style.display = mostrarLogin ? "block" : "none";
        vistaRegistro.style.display = mostrarLogin ? "none" : "block";

        botonLogin.classList.toggle("activo", mostrarLogin);
        botonRegistro.classList.toggle("activo", !mostrarLogin);
        botonLogin.setAttribute("aria-selected", String(mostrarLogin));
        botonRegistro.setAttribute("aria-selected", String(!mostrarLogin));
        mostrarMensaje("");
    }

    // Cambiar entre los dos formularios.
    botonLogin.addEventListener("click", (evento) => {
        evento.preventDefault();
        cambiarModo("login");
    });

    botonRegistro.addEventListener("click", (evento) => {
        evento.preventDefault();
        cambiarModo("registro");
    });

    // Asegurar que al abrir la página se muestre el inicio de sesión.
    cambiarModo("login");

    if (!clienteSupabase) {
        mostrarMensaje("No se pudo conectar con el servicio de cuentas. Recarga la página.");
    }

    const formularioRegistro = document.getElementById("formRegistro");
    formularioRegistro?.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        if (!clienteSupabase) {
            mostrarMensaje("Servicio de cuentas no disponible.");
            return;
        }

        const boton = evento.submitter || formularioRegistro.querySelector('button[type="submit"]');
        if (boton) boton.disabled = true;

        const nombre = document.getElementById("registroNombre").value.trim();
        const correo = document.getElementById("registroCorreo").value.trim().toLowerCase();
        const password = document.getElementById("registroPassword").value;

        try {
            const { data, error } = await clienteSupabase.auth.signUp({
                email: correo,
                password,
                options: { data: { nombre } }
            });
            if (error) throw error;

            formularioRegistro.reset();
            if (data.session) {
                mostrarMensaje("¡Cuenta creada! Ya puedes usar LINUX CORE.", true);
                window.setTimeout(() => window.location.href = "index.html", 900);
            } else {
                mostrarMensaje("Cuenta creada. Revisa tu correo y confirma el registro antes de iniciar sesión.", true);
                cambiarModo("login");
            }
        } catch (error) {
            mostrarMensaje(error.message || "No se pudo crear la cuenta.");
        } finally {
            if (boton) boton.disabled = false;
        }
    });

    const formularioLogin = document.getElementById("formLogin");
    formularioLogin?.addEventListener("submit", async (evento) => {
        evento.preventDefault();
        if (!clienteSupabase) {
            mostrarMensaje("Servicio de cuentas no disponible.");
            return;
        }

        const boton = evento.submitter || formularioLogin.querySelector('button[type="submit"]');
        if (boton) boton.disabled = true;

        const correo = document.getElementById("loginCorreo").value.trim().toLowerCase();
        const password = document.getElementById("loginPassword").value;

        try {
            const { data, error } = await clienteSupabase.auth.signInWithPassword({
                email: correo,
                password
            });
            if (error) throw error;

            mostrarMensaje(`¡Bienvenido, ${data.user.user_metadata?.nombre || data.user.email}!`, true);
            formularioLogin.reset();
            window.setTimeout(() => window.location.href = "index.html", 700);
        } catch (error) {
            mostrarMensaje(error.message || "No se pudo iniciar sesión. Verifica tus datos.");
        } finally {
            if (boton) boton.disabled = false;
        }
    });

    document.querySelectorAll(".mostrar-password").forEach((boton) => {
        boton.addEventListener("click", () => {
            const campo = document.getElementById(boton.dataset.target);
            if (campo) campo.type = campo.type === "password" ? "text" : "password";
        });
    });
});
