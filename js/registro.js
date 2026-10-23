"use strict";

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("form-registro").addEventListener("submit", e => {
    e.preventDefault();
    try {
      const usuario = Usuario.registrarse(Object.fromEntries(new FormData(e.target)));
      mostrarAviso(`Listo: ${usuario.nickname} ya es ${usuario.rol}. Redirigiendo al inicio de sesión…`, true);
      setTimeout(() => (location.href = "login.html"), 1500);
    } catch (err) { mostrarAviso(err.message, false); }
  });
});
