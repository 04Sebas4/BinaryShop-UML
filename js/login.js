"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const yaLogueado = Usuario.actual();
  if (yaLogueado) { location.replace(yaLogueado.paginaInicio); return; }

  document.getElementById("form-login").addEventListener("submit", e => {
    e.preventDefault();
    const d = new FormData(e.target);
    try {
      const usuario = Usuario.iniciarSesion(d.get("nickname"), d.get("contrasena"));
      location.href = usuario.paginaInicio;
    } catch (err) { mostrarAviso(err.message, false); }
  });
});
