"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const yo = requerirRol(Rol.COMPRADOR);
  if (!yo) return;

  const compras = yo.consultarHistorialCompras();
  document.getElementById("cuerpo").replaceChildren(...compras.map(c => el("tr", {},
    el("td", {}, fechaLocal(c.fecha)),
    el("td", {}, c.detalles.map(d => `${d.nombreProducto} × ${d.cantidad}`).join(", ")),
    el("td", {}, dinero(c.montoTotal)),
    el("td", {}, c.estado),
    el("td", {}, "**** " + c.tarjeta))));
  document.getElementById("vacio").hidden = compras.length > 0;
});
