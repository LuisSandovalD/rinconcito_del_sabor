"use client";

import { AlertCircle, Clock, CreditCard, FileText, Fish, HelpCircle, Scale, ShieldAlert, Sparkles, Truck, Utensils } from "lucide-react";

export const TERMS_SECTIONS = [
  { id: "ambito", title: "1. Ámbito de Aplicación y Titularidad", icon: Scale },
  { id: "modalidades", title: "2. Modalidades de Pedido", icon: Utensils },
  { id: "precios-cartas", title: "3. Precios, Disponibilidad y Pesca del Día", icon: Fish },
  { id: "cuentas", title: "4. Cuentas de Usuario y Seguridad", icon: FileText },
  { id: "pagos-comprobantes", title: "5. Pagos y Comprobantes SUNAT", icon: CreditCard },
  { id: "tiempos-entrega", title: "6. Tiempos de Preparación y Delivery", icon: Truck },
  { id: "cancelaciones", title: "7. Cancelaciones, Cambios y Devoluciones", icon: AlertCircle },
  { id: "alergenos", title: "8. Alérgenos y Observaciones", icon: ShieldAlert },
  { id: "libro-reclamaciones", title: "9. Libro de Reclamaciones y Defensa del Consumidor", icon: HelpCircle },
  { id: "propiedad-modificaciones", title: "10. Propiedad Intelectual y Modificaciones", icon: Sparkles },
];

export function TermsContent({ restaurantName }: { restaurantName: string }) {
  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Introduction Card */}
      <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50/50 p-6 backdrop-blur-xs dark:border-neutral-800 dark:bg-neutral-900/40 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950">
            <Scale size={20} />
          </span>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-neutral-950 dark:text-white sm:text-2xl">
              Bienvenido a {restaurantName}
            </h2>
            <p className="text-sm leading-7 text-neutral-600 dark:text-neutral-300">
              Al acceder, navegar o realizar pedidos a través de nuestro sitio web y servicios digitales (en mesa, recojo o entrega a domicilio), usted declara haber leído, comprendido y aceptado en su totalidad estos Términos y Condiciones. Si no está de acuerdo con alguno de los puntos establecidos, le solicitamos abstenerse de utilizar nuestra plataforma digital.
            </p>
          </div>
        </div>
      </div>

      {/* Section 1 */}
      <section id="ambito" className="scroll-mt-28 space-y-4 border-b border-neutral-200 pb-10 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white font-mono text-xs font-semibold text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white">
            01
          </span>
          <h3 className="text-xl font-semibold text-neutral-950 dark:text-white">
            Ámbito de Aplicación y Titularidad
          </h3>
        </div>
        <div className="space-y-3.5 text-sm leading-7 text-neutral-600 dark:text-neutral-300">
          <p>
            El presente documento regula el uso de los servicios de comercio electrónico y comandas digitales ofrecidos por <strong>{restaurantName}</strong>, establecimiento gastronómico dedicado a la cocina marina y tradicional peruana, con operaciones en Lima, República del Perú.
          </p>
          <p>
            Estos términos aplican a cualquier usuario que interactúe con el sitio web, ya sea en calidad de visitante no registrado o como usuario registrado con cuenta de comensal.
          </p>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs leading-6 text-emerald-900 dark:text-emerald-200">
            <strong>Capacidad legal:</strong> Para efectuar compras en la plataforma, el usuario debe tener al menos 18 años de edad o contar con la debida supervisión y consentimiento de sus padres o tutores legales.
          </div>
        </div>
      </section>

      {/* Section 2 */}
      <section id="modalidades" className="scroll-mt-28 space-y-4 border-b border-neutral-200 pb-10 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white font-mono text-xs font-semibold text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white">
            02
          </span>
          <h3 className="text-xl font-semibold text-neutral-950 dark:text-white">
            Modalidades de Pedido
          </h3>
        </div>
        <div className="space-y-4 text-sm leading-7 text-neutral-600 dark:text-neutral-300">
          <p>
            En {restaurantName} brindamos tres canales digitales de atención para adaptarnos a tu momento de consumo:
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white">
                <Utensils size={18} />
              </span>
              <h4 className="mt-3 font-semibold text-neutral-950 dark:text-white">En Salón (Mesa)</h4>
              <p className="mt-2 text-xs leading-6 text-neutral-500 dark:text-neutral-400">
                Escanea el código QR de tu mesa física. Tu pedido ingresa al sistema de cocina de forma inmediata y es servido directamente en tu ubicación.
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white">
                <Clock size={18} />
              </span>
              <h4 className="mt-3 font-semibold text-neutral-950 dark:text-white">Para Llevar (Takeaway)</h4>
              <p className="mt-2 text-xs leading-6 text-neutral-500 dark:text-neutral-400">
                Pide desde donde estés y retira tu orden empacada en nuestro local a la hora programada, sin colas ni demoras.
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white">
                <Truck size={18} />
              </span>
              <h4 className="mt-3 font-semibold text-neutral-950 dark:text-white">Delivery a Domicilio</h4>
              <p className="mt-2 text-xs leading-6 text-neutral-500 dark:text-neutral-400">
                Recibe tus platos favoritos en tu casa u oficina dentro de nuestro radio de cobertura, con seguimiento en tiempo real.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3 */}
      <section id="precios-cartas" className="scroll-mt-28 space-y-4 border-b border-neutral-200 pb-10 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white font-mono text-xs font-semibold text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white">
            03
          </span>
          <h3 className="text-xl font-semibold text-neutral-950 dark:text-white">
            Precios, Disponibilidad y Pesca del Día
          </h3>
        </div>
        <div className="space-y-3.5 text-sm leading-7 text-neutral-600 dark:text-neutral-300">
          <ul className="list-inside list-disc space-y-2">
            <li>
              <strong>Moneda oficial:</strong> Todos los precios publicados en la carta están expresados en Soles peruanos (PEN / S/) e incluyen el Impuesto General a las Ventas (IGV - 18%).
            </li>
            <li>
              <strong>Insumos marinos y pesca fresca:</strong> Debido a que priorizamos ingredientes frescos del litoral peruano, ciertos productos (como pesca del día, conchas de abanico, pulpo o langostinos) pueden agotarse de acuerdo a la temporada y captura diaria.
            </li>
            <li>
              <strong>Sustitución o ajuste:</strong> Si algún plato solicitado no cuenta con existencias al momento de su preparación, nuestro equipo de atención se comunicará de inmediato para ofrecer una alternativa de igual o superior categoría, o proceder con el ajuste correspondiente en la cuenta sin penalidad alguna.
            </li>
            <li>
              <strong>Imágenes referenciales:</strong> Las fotografías presentadas en nuestra plataforma tienen fines ilustrativos sobre la presentación sugerida del plato; las proporciones y guarniciones respetan rigurosamente nuestra receta estándar de salón.
            </li>
          </ul>
        </div>
      </section>

      {/* Section 4 */}
      <section id="cuentas" className="scroll-mt-28 space-y-4 border-b border-neutral-200 pb-10 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white font-mono text-xs font-semibold text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white">
            04
          </span>
          <h3 className="text-xl font-semibold text-neutral-950 dark:text-white">
            Cuentas de Usuario y Seguridad
          </h3>
        </div>
        <div className="space-y-3.5 text-sm leading-7 text-neutral-600 dark:text-neutral-300">
          <p>
            Para gestionar tus pedidos con entrega o para llevar, puedes registrar una cuenta de cliente con tu correo electrónico y número de teléfono celular.
          </p>
          <ul className="list-inside list-disc space-y-2">
            <li>
              El cliente es el único responsable de la confidencialidad de sus credenciales de acceso y de cualquier actividad efectuada desde su cuenta.
            </li>
            <li>
              El cliente se compromete a suministrar información verídica, exacta y actualizada (nombre, teléfono y dirección de entrega verídicos). {restaurantName} se reserva el derecho de suspender cuentas ante indicios de fraude o datos manifiestamente falsos.
            </li>
          </ul>
        </div>
      </section>

      {/* Section 5 */}
      <section id="pagos-comprobantes" className="scroll-mt-28 space-y-4 border-b border-neutral-200 pb-10 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white font-mono text-xs font-semibold text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white">
            05
          </span>
          <h3 className="text-xl font-semibold text-neutral-950 dark:text-white">
            Pagos y Comprobantes SUNAT
          </h3>
        </div>
        <div className="space-y-3.5 text-sm leading-7 text-neutral-600 dark:text-neutral-300">
          <p>
            Aceptamos los métodos de pago habilitados en nuestra pasarela y en salón:
          </p>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <h5 className="font-semibold text-neutral-900 dark:text-white">Métodos electrónicos:</h5>
                <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                  Tarjetas de crédito o débito (Visa, Mastercard, Amex), billeteras digitales (Yape, Plin) y transferencias verificadas.
                </p>
              </div>
              <div>
                <h5 className="font-semibold text-neutral-900 dark:text-white">Pago en salón / contra entrega:</h5>
                <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                  POS inalámbrico o efectivo exacto conforme a la disponibilidad indicada en el checkout.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-xs leading-6 text-blue-900 dark:text-blue-200">
            <strong>Comprobantes electrónicos de pago:</strong> Conforme al Reglamento de Comprobantes de Pago de la SUNAT, emitimos Boleta de Venta Electrónica y Factura Electrónica. Si requiere factura con RUC, deberá indicarlo antes de finalizar la orden ingresando el número de RUC y la Razón Social correspondiente. No se realizan cambios de Boleta a Factura una vez emitida la comanda fiscal.
          </div>
        </div>
      </section>

      {/* Section 6 */}
      <section id="tiempos-entrega" className="scroll-mt-28 space-y-4 border-b border-neutral-200 pb-10 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white font-mono text-xs font-semibold text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white">
            06
          </span>
          <h3 className="text-xl font-semibold text-neutral-950 dark:text-white">
            Tiempos de Preparación y Delivery
          </h3>
        </div>
        <div className="space-y-3.5 text-sm leading-7 text-neutral-600 dark:text-neutral-300">
          <p>
            Nuestros platos son preparados al momento para garantizar la frescura y el sabor característico de nuestra cocina marina.
          </p>
          <ul className="list-inside list-disc space-y-2">
            <li>
              <strong>Tiempos estimados:</strong> El tiempo aproximado de despacho se muestra al momento de confirmar el pedido y puede variar según la afluencia en cocina, la distancia al punto de entrega y el tráfico vial.
            </li>
            <li>
              <strong>Tolerancia de espera en destino:</strong> En pedidos de delivery, el repartidor aguardará un máximo de <strong>10 minutos</strong> en la dirección acordada mientras intenta contactar al cliente vía telefónica o WhatsApp.
            </li>
            <li>
              <strong>Inasistencia del cliente:</strong> Si transcurrido el tiempo de tolerancia el cliente no responde ni recibe el pedido, la orden retornará al local. Al tratarse de alimentos cocidos perecibles preparados a pedido, no procederá reembolso ni reenvío sin costo.
            </li>
          </ul>
        </div>
      </section>

      {/* Section 7 */}
      <section id="cancelaciones" className="scroll-mt-28 space-y-4 border-b border-neutral-200 pb-10 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white font-mono text-xs font-semibold text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white">
            07
          </span>
          <h3 className="text-xl font-semibold text-neutral-950 dark:text-white">
            Cancelaciones, Cambios y Devoluciones
          </h3>
        </div>
        <div className="space-y-3.5 text-sm leading-7 text-neutral-600 dark:text-neutral-300">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs leading-6 text-amber-900 dark:text-amber-200">
            <strong>Naturaleza perecible de los alimentos:</strong> Debido a que todos nuestros platos se elaboran al momento y no son susceptibles de almacenamiento posterior, una vez que una orden pasa al estado <em>"EN PREPARACIÓN"</em> en cocina, <strong>no se admiten cancelaciones unilaterales ni devoluciones de dinero</strong>.
          </div>
          <p>
            <strong>Reclamos por inconformidad o producto no correspondiente:</strong> Si su pedido llega incompleto, con un producto equivocado o con deterioro evidente en el empaque durante el traslado:
          </p>
          <ol className="list-inside list-decimal space-y-1.5 pl-2">
            <li>Debe notificarlo en un plazo máximo de <strong>2 horas</strong> tras la recepción del pedido.</li>
            <li>Envíe una fotografía o video legible del producto recibido a nuestro canal oficial de WhatsApp.</li>
            <li>Verificada la incidencia, coordinaremos la reposición inmediata del plato o la emisión de una nota de crédito o reembolso por el valor del ítem afectado.</li>
          </ol>
        </div>
      </section>

      {/* Section 8 */}
      <section id="alergenos" className="scroll-mt-28 space-y-4 border-b border-neutral-200 pb-10 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white font-mono text-xs font-semibold text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white">
            08
          </span>
          <h3 className="text-xl font-semibold text-neutral-950 dark:text-white">
            Alérgenos y Observaciones Nutricionales
          </h3>
        </div>
        <div className="space-y-3.5 text-sm leading-7 text-neutral-600 dark:text-neutral-300">
          <p>
            Nuestra cocina procesa pescados, mariscos (crustáceos y moluscos), ajíes, cítricos, gluten, huevo y derivados lácteos.
          </p>
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs leading-6 text-rose-900 dark:text-rose-200">
            <strong>Advertencia de alergias:</strong> Es responsabilidad exclusiva del cliente consignar cualquier alergia, intolerancia o restricción médica en el campo de <em>"Notas especiales"</em> al momento de armar su orden. Si tiene una alergia severa o anafiláctica, le recomendamos consultar previamente con nuestro personal antes de ordenar.
          </div>
        </div>
      </section>

      {/* Section 9 */}
      <section id="libro-reclamaciones" className="scroll-mt-28 space-y-4 border-b border-neutral-200 pb-10 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white font-mono text-xs font-semibold text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white">
            09
          </span>
          <h3 className="text-xl font-semibold text-neutral-950 dark:text-white">
            Libro de Reclamaciones y Defensa del Consumidor
          </h3>
        </div>
        <div className="space-y-3.5 text-sm leading-7 text-neutral-600 dark:text-neutral-300">
          <p>
            Conforme a lo dispuesto por el <strong>Código de Protección y Defensa del Consumidor (Ley N° 29571)</strong> y las disposiciones del INDECOPI, {restaurantName} pone a disposición de sus clientes el <strong>Libro de Reclamaciones</strong> físico en nuestras instalaciones y canal virtual para el registro de cualquier queja o reclamo.
          </p>
          <p>
            Nos comprometemos a dar respuesta formal a las incidencias registradas en un plazo máximo de 15 días hábiles conforme lo estipula la ley peruana.
          </p>
        </div>
      </section>

      {/* Section 10 */}
      <section id="propiedad-modificaciones" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white font-mono text-xs font-semibold text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white">
            10
          </span>
          <h3 className="text-xl font-semibold text-neutral-950 dark:text-white">
            Propiedad Intelectual y Modificaciones
          </h3>
        </div>
        <div className="space-y-3.5 text-sm leading-7 text-neutral-600 dark:text-neutral-300">
          <p>
            Todos los contenidos incluidos en esta plataforma web —incluyendo logotipos, nombres comerciales, fotografías de platos, textos descriptivos, recetas de autor y software— son propiedad exclusiva de <strong>{restaurantName}</strong> o cuentan con las licencias correspondientes, estando protegidos por la legislación de propiedad intelectual peruana e internacional.
          </p>
          <p>
            {restaurantName} se reserva el derecho de modificar o actualizar estos Términos y Condiciones en cualquier momento. Cualquier actualización entrará en vigencia inmediatamente tras su publicación en este sitio web.
          </p>
        </div>
      </section>
    </div>
  );
}
