"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const yo = requerirRol(Rol.COMPRADOR);
  if (!yo) return;

  const buscador = document.getElementById("buscador");
  const rejilla = document.getElementById("rejilla");
  const panel = document.getElementById("carrito-panel");
  const dialogo = document.getElementById("dlg-pago");
  const formPago = document.getElementById("form-pago");

  let itemsEnPago = [];      // items que se estan pagando ahora
  let pagoDesdeCarrito = false;

  /* ---------------- Catalogo ---------------- */
  function pintarCatalogo() {
    const productos = yo.explorarCatalogo(buscador.value);
    const plantilla = document.getElementById("tpl-producto");
    rejilla.replaceChildren(...productos.map(p => {
      const tarjeta = plantilla.content.cloneNode(true);
      const img = tarjeta.querySelector("img");
      img.src = p.imagen;
      img.alt = p.nombre;
      img.title = p.obtenerDetalles();
      tarjeta.querySelector("h3").textContent = p.nombre;
      tarjeta.querySelector(".desc").textContent = p.descripcion;
      tarjeta.querySelector(".precio").textContent = dinero(p.precio);
      tarjeta.querySelector(".vend").textContent = "Vendedor: " + p.nombreVendedor;
      tarjeta.querySelector('[data-accion="carrito"]').addEventListener("click", () => {
        yo.agregarAlCarrito(p);
        mostrarAviso("Añadido al carrito.");
        pintarCarrito();
      });
      tarjeta.querySelector('[data-accion="comprar"]').addEventListener("click", () => {
        abrirPago([new ItemCarrito({ idProducto: p.idProducto, cantidad: 1 })], false);
      });
      return tarjeta;
    }));
    document.getElementById("vacio").hidden = productos.length > 0;
  }

  /* ---------------- Carrito ---------------- */
  function pintarCarrito() {
    const carrito = yo.carrito;
    document.getElementById("carrito-contador").textContent = carrito.cantidadTotal();

    panel.replaceChildren();
    if (!carrito.items.length) {
      panel.append(el("p", { class: "vacio" }, "Tu carrito está vacío."));
      return;
    }
    carrito.items.forEach(item => {
      const p = item.producto;
      panel.append(el("div", { class: "linea" },
        el("img", { src: p.imagen, alt: "" }),
        el("div", { class: "info" }, el("div", {}, p.nombre), el("small", {}, dinero(p.precio) + " c/u")),
        el("button", { class: "sec", onclick: () => { carrito.agregarItem(p, -1); pintarCarrito(); } }, "−"),
        el("b", {}, item.cantidad),
        el("button", { class: "sec", onclick: () => { carrito.agregarItem(p, 1); pintarCarrito(); } }, "+"),
        el("button", { class: "peligro", title: "Quitar", onclick: () => { carrito.eliminarItem(p.idProducto); pintarCarrito(); } }, "✕")));
    });
    panel.append(
      el("div", { class: "total" }, el("span", {}, `Total (${carrito.cantidadTotal()} artículos)`), el("span", {}, dinero(carrito.calcularTotal()))),
      el("button", { class: "ok", style: "width:100%", onclick: () => { panel.hidden = true; abrirPago(carrito.items, true); } }, "Pagar carrito"),
      el("button", { class: "sec", style: "width:100%;margin-top:.4rem", onclick: () => { carrito.vaciarCarrito(); pintarCarrito(); } }, "Vaciar"));
  }

  document.getElementById("btn-carrito").addEventListener("click", () => { panel.hidden = !panel.hidden; });
  document.addEventListener("click", e => { if (!e.target.closest(".carrito-wrap")) panel.hidden = true; });

  /* ---------------- Pago ---------------- */
  function abrirPago(items, desdeCarrito) {
    itemsEnPago = items;
    pagoDesdeCarrito = desdeCarrito;
    const total = items.reduce((s, i) => s + i.subtotal(), 0);
    document.getElementById("pago-resumen").replaceChildren(...items.map(i => el("div", { class: "linea" },
      el("div", { class: "info" }, `${i.producto.nombre} × ${i.cantidad}`), el("b", {}, dinero(i.subtotal())))));
    document.getElementById("pago-total").textContent = dinero(total);
    formPago.titular.value = yo.metodoPago ? yo.metodoPago.titular : yo.nombreCompleto;
    dialogo.showModal();
  }

  formPago.addEventListener("submit", e => {
    e.preventDefault();
    try {
      const metodo = new MetodoPago({ tipoPago: "Tarjeta", datosCapturados: Object.fromEntries(new FormData(formPago)) });
      yo.realizarCompra(itemsEnPago, metodo);
      yo.gestionarMetodosPago(metodo);
      if (pagoDesdeCarrito) yo.carrito.vaciarCarrito();
      formPago.reset();
      dialogo.close();
      mostrarAviso("¡Compra realizada con éxito!");
      pintarCarrito();
    } catch (err) { mostrarAviso(err.message, false); }
  });
  document.getElementById("btn-cancelar-pago").addEventListener("click", () => dialogo.close());

  buscador.addEventListener("input", pintarCatalogo);
  pintarCatalogo();
  pintarCarrito();
});
