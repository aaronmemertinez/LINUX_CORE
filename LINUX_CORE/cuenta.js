// Gestión de sesión y cambio de contraseña de LINUX CORE.
document.addEventListener("DOMContentLoaded", async () => {
    const client = window.supabaseClient;
    const form = document.getElementById("formCambiarPassword");
    const message = document.getElementById("cuentaMensaje");
    const emailLabel = document.getElementById("cuentaCorreo");
    const updateButton = document.getElementById("btnActualizar");
    const logoutButton = document.getElementById("btnCerrarSesion");

    function showMessage(text, success = false) {
        message.textContent = text;
        message.classList.toggle("exito", success);
    }

    if (!client) {
        showMessage("No se pudo conectar con el servicio de cuentas. Recarga la página.");
        return;
    }

    const { data: { session }, error: sessionError } = await client.auth.getSession();
    if (sessionError || !session) {
        window.location.replace("login.html");
        return;
    }
    emailLabel.textContent = "Sesión iniciada: " + (session.user.email || "");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const currentPassword = document.getElementById("passwordActual").value;
        const newPassword = document.getElementById("passwordNueva").value;
        const confirmPassword = document.getElementById("passwordConfirmar").value;

        if (newPassword.length < 6) {
            showMessage("La nueva contraseña debe tener al menos 6 caracteres.");
            return;
        }
        if (newPassword !== confirmPassword) {
            showMessage("La confirmación no coincide con la nueva contraseña.");
            return;
        }
        if (newPassword === currentPassword) {
            showMessage("La nueva contraseña debe ser diferente a la actual.");
            return;
        }

        updateButton.disabled = true;
        try {
            // Verifica la contraseña actual antes de permitir el cambio.
            const { error: verifyError } = await client.auth.signInWithPassword({
                email: session.user.email,
                password: currentPassword
            });
            if (verifyError) throw new Error("La contraseña actual es incorrecta.");

            const { error: updateError } = await client.auth.updateUser({ password: newPassword });
            if (updateError) throw updateError;

            form.reset();
            showMessage("Contraseña actualizada correctamente.", true);
        } catch (error) {
            showMessage(error.message || "No se pudo actualizar la contraseña.");
        } finally {
            updateButton.disabled = false;
        }
    });

    logoutButton.addEventListener("click", async () => {
        logoutButton.disabled = true;
        const { error } = await client.auth.signOut();
        if (error) {
            showMessage("No se pudo cerrar la sesión. Inténtalo nuevamente.");
            logoutButton.disabled = false;
            return;
        }
        window.location.replace("login.html");
    });
});
