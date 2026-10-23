"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const yo = requerirRol(Rol.VENDEDOR);
  if (!yo) return;

  const form = document.getElementById("form-producto");
  const vistaPrevia = document.getElementById("vista-previa");
  let imagen = null;

  document.getElementById("imagen").addEventListener("change", async e => {
    try {
      imagen = await comprimirImagen(e.target.files[0]);
      vistaPrevia.src = imagen;
      vistaPrevia.hidden = false;
    } catch (err) {
      imagen = null;
      vistaPrevia.hidden = true;
      mostrarAviso(err.message, false);
    }
  });

  form.addEventListener("submit", e => {
    e.preventDefault();
    const d = new FormData(form);
    try {
      yo.agregarNuevoProducto({ nombre: d.get("nombre"), descripcion: d.get("descripcion"), precio: d.get("precio"), imagen });
      form.reset();
      imagen = null;
      vistaPrevia.hidden = true;
      mostrarAviso("Producto publicado.");
      pintar();
    } catch (err) {
      mostrarAviso(err.name === "QuotaExceededError" ? "Almacenamiento lleno. Usa una imagen más pequeña." : err.message, false);
    }
  });

  function pintar() {
    const productos = yo.misProductos();
    document.getElementById("titulo-productos").textContent = `Mis productos (${productos.length})`;
    document.getElementById("mis-productos").replaceChildren(...productos.map(p => el("tr", {},
      el("td", {}, el("img", { class: "miniatura", src: p.imagen, alt: "" })),
      el("td", {}, p.nombre),
      el("td", {}, dinero(p.precio)),
      el("td", {}, el("button", { class: "peligro", onclick: () => { yo.eliminarProducto(p.idProducto); pintar(); } }, "Quitar")))));
    document.getElementById("sin-productos").hidden = productos.length > 0;

    const ventas = yo.historialVentas();
    const total = ventas.reduce((s, v) => s + v.detalle.subtotal(), 0);
    document.getElementById("titulo-ventas").textContent = `Historial de ventas — total ${dinero(total)}`;
    document.getElementById("historial").replaceChildren(...ventas.map(v => el("tr", {},
      el("td", {}, fechaLocal(v.fecha)),
      el("td", {}, v.detalle.nombreProducto),
      el("td", {}, v.detalle.cantidad),
      el("td", {}, dinero(v.detalle.subtotal())),
      el("td", {}, v.comprador))));
    document.getElementById("sin-ventas").hidden = ventas.length > 0;
  }

  pintar();
});
