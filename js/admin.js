"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const yo = requerirRol(Rol.ADMIN);
  if (!yo) return;

  function pintar() {
    const usuarios = yo.gestionarUsuarios();
    document.getElementById("usuarios").replaceChildren(...usuarios.map(u => el("tr", {},
      el("td", {}, u.nickname),
      el("td", {}, u.nombreCompleto),
      el("td", {}, u.rol),
      el("td", {}, el("button", { class: "peligro", onclick: () => {
        if (!confirm(`¿Eliminar la cuenta de ${u.nickname}${u instanceof Vendedor ? " y todos sus productos" : ""}?`)) return;
        yo.eliminarCuenta(u.idUsuario);
        mostrarAviso("Cuenta eliminada.");
        pintar();
      } }, "Eliminar")))));
    document.getElementById("sin-usuarios").hidden = usuarios.length > 0;

    const productos = Producto.todos();
    document.getElementById("productos").replaceChildren(...productos.map(p => el("tr", {},
      el("td", {}, el("img", { class: "miniatura", src: p.imagen, alt: "" })),
      el("td", {}, p.nombre),
      el("td", {}, dinero(p.precio)),
      el("td", {}, p.nombreVendedor),
      el("td", {}, el("button", { class: "peligro", onclick: () => {
        if (!confirm(`¿Remover "${p.nombre}"?`)) return;
        yo.quitarProducto(p.idProducto);
        mostrarAviso("Producto removido.");
        pintar();
      } }, "Remover")))));
    document.getElementById("sin-productos").hidden = productos.length > 0;
  }

  pintar();
});
