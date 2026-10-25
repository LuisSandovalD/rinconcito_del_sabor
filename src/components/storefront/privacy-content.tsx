"use client";

import { CheckCircle2, Cookie, Database, Eye, FileSpreadsheet, Lock, Mail, Server, ShieldCheck, UserCheck } from "lucide-react";

export const PRIVACY_SECTIONS = [
  { id: "marco-legal", title: "1. Marco Normativo y Responsable", icon: ShieldCheck },
  { id: "datos-recopilados", title: "2. Información y Datos que Recopilamos", icon: Database },
  { id: "finalidades", title: "3. Finalidades del Tratamiento", icon: Eye },
  { id: "seguridad", title: "4. Seguridad y Almacenamiento", icon: Lock },
  { id: "transferencia", title: "5. Transferencia y Terceros", icon: Server },
  { id: "derechos-arco", title: "6. Ejercicio de Derechos ARCO", icon: UserCheck },
  { id: "cookies", title: "7. Cookies y Tecnologías Web", icon: Cookie },
  { id: "conservacion", title: "8. Plazos de Conservación de Datos", icon: FileSpreadsheet },
  { id: "contacto-privacidad", title: "9. Canales de Contacto y Modificaciones", icon: Mail },
];

export function PrivacyContent({ restaurantName }: { restaurantName: string }) {
  return (
    <div className="space-y-12 sm:space-y-16">
      {/* Introduction Card */}
      <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50/50 p-6 backdrop-blur-xs dark:border-neutral-800 dark:bg-neutral-900/40 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-950">
            <ShieldCheck size={20} />
          </span>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-neutral-950 dark:text-white sm:text-2xl">
              Tu privacidad y confianza son nuestra prioridad
            </h2>
            <p className="text-sm leading-7 text-neutral-600 dark:text-neutral-300">
              En <strong>{restaurantName}</strong> protegemos rigurosamente tus datos personales. Esta Política de Privacidad explica de forma transparente qué datos recopilamos cuando nos visitas, cuando pides desde tu mesa o solicitas delivery, con qué fines los procesamos y cuáles son tus derechos conforme a la legislación peruana vigente.
            </p>
          </div>
        </div>
      </div>

      {/* Section 1 */}
      <section id="marco-legal" className="scroll-mt-28 space-y-4 border-b border-neutral-200 pb-10 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white font-mono text-xs font-semibold text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white">
            01
          </span>
          <h3 className="text-xl font-semibold text-neutral-950 dark:text-white">
            Marco Normativo y Responsable del Tratamiento
          </h3>
        </div>
        <div className="space-y-3.5 text-sm leading-7 text-neutral-600 dark:text-neutral-300">
          <p>
            El tratamiento de datos personales efectuado a través de esta plataforma digital se rige por la <strong>Ley N° 29733 (Ley de Protección de Datos Personales del Perú)</strong>, su Reglamento aprobado mediante <strong>Decreto Supremo N° 003-2013-JUS</strong>, y las directivas emitidas por la Autoridad Nacional de Protección de Datos Personales (ANPD).
          </p>
          <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
            <h4 className="font-semibold text-neutral-900 dark:text-white">Titular del Banco de Datos:</h4>
            <p className="mt-1 text-xs leading-6 text-neutral-600 dark:text-neutral-400">
              <strong>Razón Comercial:</strong> {restaurantName}<br />
              <strong>Actividad:</strong> Restaurante y cevichería marina con servicio presencial, recojo y delivery.<br />
              <strong>Jurisdicción:</strong> Lima, República del Perú.
            </p>
          </div>
        </div>
      </section>

      {/* Section 2 */}
      <section id="datos-recopilados" className="scroll-mt-28 space-y-4 border-b border-neutral-200 pb-10 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white font-mono text-xs font-semibold text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white">
            02
          </span>
          <h3 className="text-xl font-semibold text-neutral-950 dark:text-white">
            Información y Datos que Recopilamos
          </h3>
        </div>
        <div className="space-y-4 text-sm leading-7 text-neutral-600 dark:text-neutral-300">
          <p>
            Recopilamos únicamente los datos pertinentes y necesarios para gestionar tus pedidos y brindarte una atención culinaria de excelencia:
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <h5 className="font-semibold text-neutral-900 dark:text-white">Identificación y Contacto</h5>
              <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                Nombres y apellidos, número de teléfono móvil o WhatsApp, dirección de correo electrónico, y RUC o DNI en caso de solicitar comprobantes fiscales (Boleta o Factura).
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <h5 className="font-semibold text-neutral-900 dark:text-white">Entrega y Geolocalización</h5>
              <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                Dirección exacta de destino, referencias particulares y coordenadas de geolocalización (GPS) proporcionadas voluntariamente por el usuario para optimizar la ruta de entrega.
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <h5 className="font-semibold text-neutral-900 dark:text-white">Preferencias y Comandas</h5>
              <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                Historial de pedidos, platos preferidos, observaciones de preparación (por ejemplo: sin picante, sin culantro) y número de mesa física al ordenar en salón.
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <h5 className="font-semibold text-neutral-900 dark:text-white">Datos Técnicos y Sesión</h5>
              <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
                Dirección IP de conexión, tipo de dispositivo, navegador web utilizado y tokens de sesión para mantener el carrito de compras activo.
              </p>
            </div>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs leading-6 text-emerald-900 dark:text-emerald-200">
            <strong>Protección de datos de tarjetas:</strong> {restaurantName} <em>nunca almacena ni tiene acceso</em> a los números completos de tus tarjetas de crédito o débito ni a códigos CVV. Los pagos electrónicos son procesados de forma cifrada mediante pasarelas de pago certificadas con el estándar internacional PCI-DSS.
          </div>
        </div>
      </section>

      {/* Section 3 */}
      <section id="finalidades" className="scroll-mt-28 space-y-4 border-b border-neutral-200 pb-10 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white font-mono text-xs font-semibold text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white">
            03
          </span>
          <h3 className="text-xl font-semibold text-neutral-950 dark:text-white">
            Finalidades del Tratamiento de Datos
          </h3>
        </div>
        <div className="space-y-3.5 text-sm leading-7 text-neutral-600 dark:text-neutral-300">
          <p>
            Los datos personales facilitados serán tratados para las siguientes finalidades:
          </p>
          <ul className="space-y-2.5">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="mt-1 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span><strong>Gestión y despacho de pedidos:</strong> Preparar tu comanda en cocina, coordinar la mesa o programar el recojo y entrega por delivery.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="mt-1 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span><strong>Comunicaciones de estado en tiempo real:</strong> Informarte vía WhatsApp o correo electrónico el estado de tu pedido (recibido, en cocina, en camino, entregado).</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="mt-1 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span><strong>Obligaciones tributarias y legales:</strong> Emisión de comprobantes electrónicos válidos ante la SUNAT (Boleta o Factura) y registro en libros contables.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="mt-1 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span><strong>Atención al cliente y reclamos:</strong> Atender consultas, requerimientos del Libro de Reclamaciones y asegurar la calidad del servicio gastronómico.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Section 4 */}
      <section id="seguridad" className="scroll-mt-28 space-y-4 border-b border-neutral-200 pb-10 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white font-mono text-xs font-semibold text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white">
            04
          </span>
          <h3 className="text-xl font-semibold text-neutral-950 dark:text-white">
            Seguridad y Almacenamiento
          </h3>
        </div>
        <div className="space-y-3.5 text-sm leading-7 text-neutral-600 dark:text-neutral-300">
          <p>
            {restaurantName} adopta medidas de seguridad técnicas, organizativas y legales para evitar la pérdida, alteración, tratamiento o acceso no autorizado a los bancos de datos:
          </p>
          <ul className="list-inside list-disc space-y-2">
            <li><strong>Cifrado SSL/TLS:</strong> Toda la comunicación entre tu navegador y nuestra plataforma se transmite de forma cifrada mediante protocolos HTTPS de alta seguridad.</li>
            <li><strong>Contraseñas seguras:</strong> Las contraseñas de las cuentas de cliente son procesadas mediante funciones hash criptográficas irreversibles de última generación (Argon2).</li>
            <li><strong>Control de acceso:</strong> El personal de cocina y despacho accede únicamente a los datos pertinentes de la comanda activa, sin acceso a información sensible innecesaria.</li>
          </ul>
        </div>
      </section>

      {/* Section 5 */}
      <section id="transferencia" className="scroll-mt-28 space-y-4 border-b border-neutral-200 pb-10 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white font-mono text-xs font-semibold text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white">
            05
          </span>
          <h3 className="text-xl font-semibold text-neutral-950 dark:text-white">
            Transferencia y Terceros
          </h3>
        </div>
        <div className="space-y-3.5 text-sm leading-7 text-neutral-600 dark:text-neutral-300">
          <p>
            <strong>No comercializamos, no alquilamos ni transferimos tus datos personales a empresas de publicidad de terceros.</strong>
          </p>
          <p>
            Tus datos únicamente podrán ser comunicados a los siguientes destinatarios bajo estricto encargo de tratamiento:
          </p>
          <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
            <ul className="list-inside list-disc space-y-1.5 text-xs text-neutral-700 dark:text-neutral-300">
              <li><strong>Personal de reparto (motorizados):</strong> Para la entrega de tu pedido, se facilita únicamente tu nombre, teléfono y dirección de destino correspondiente a la entrega en curso.</li>
              <li><strong>Proveedores de tecnología y pasarelas de pago:</strong> Encargados de procesar cobros y alojar la infraestructura del servidor de forma protegida.</li>
              <li><strong>Autoridades tributarias o judiciales:</strong> Exclusivamente en cumplimiento de órdenes legales válidas (SUNAT, Poder Judicial, INDECOPI).</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Section 6 */}
      <section id="derechos-arco" className="scroll-mt-28 space-y-4 border-b border-neutral-200 pb-10 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white font-mono text-xs font-semibold text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white">
            06
          </span>
          <h3 className="text-xl font-semibold text-neutral-950 dark:text-white">
            Ejercicio de los Derechos ARCO
          </h3>
        </div>
        <div className="space-y-3.5 text-sm leading-7 text-neutral-600 dark:text-neutral-300">
          <p>
            Como titular de tus datos personales, puedes ejercer ante {restaurantName} los derechos de <strong>Acceso, Rectificación, Cancelación y Oposición (ARCO)</strong> garantizados por la Ley N° 29733:
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-neutral-200 bg-white p-3.5 dark:border-neutral-800 dark:bg-neutral-900">
              <h6 className="font-semibold text-neutral-900 dark:text-white">Acceso</h6>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Derecho a solicitar qué información conservamos sobre tu persona y el origen de los datos.</p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-3.5 dark:border-neutral-800 dark:bg-neutral-900">
              <h6 className="font-semibold text-neutral-900 dark:text-white">Rectificación</h6>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Derecho a corregir o actualizar datos inexactos, erróneos o desactualizados.</p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-3.5 dark:border-neutral-800 dark:bg-neutral-900">
              <h6 className="font-semibold text-neutral-900 dark:text-white">Cancelación</h6>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Derecho a solicitar la supresión de tus datos cuando hayan dejado de ser necesarios para el servicio.</p>
            </div>
            <div className="rounded-xl border border-neutral-200 bg-white p-3.5 dark:border-neutral-800 dark:bg-neutral-900">
              <h6 className="font-semibold text-neutral-900 dark:text-white">Oposición</h6>
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Derecho a negarte al tratamiento de tus datos para finalidades no indispensables (promociones o encuestas).</p>
            </div>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            <strong>¿Cómo ejercer tus derechos ARCO?</strong> Envíanos una comunicación a través de nuestro WhatsApp oficial o correo de atención al cliente con el asunto <em>"Derechos ARCO"</em>, adjuntando una copia legible de tu DNI o documento de identidad. Responderemos dentro de los plazos legales fijados por la normativa peruana.
          </p>
        </div>
      </section>

      {/* Section 7 */}
      <section id="cookies" className="scroll-mt-28 space-y-4 border-b border-neutral-200 pb-10 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white font-mono text-xs font-semibold text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white">
            07
          </span>
          <h3 className="text-xl font-semibold text-neutral-950 dark:text-white">
            Cookies y Tecnologías Web
          </h3>
        </div>
        <div className="space-y-3.5 text-sm leading-7 text-neutral-600 dark:text-neutral-300">
          <p>
            Nuestra web utiliza cookies y almacenamiento local (<em>localStorage</em> y <em>sessionStorage</em>) exclusivamente con fines funcionales y de experiencia de usuario:
          </p>
          <ul className="list-inside list-disc space-y-1.5 text-xs">
            <li>Guardar temporalmente los platos que vas agregando al carrito de compras durante tu visita.</li>
            <li>Recordar tu preferencia visual de modo oscuro o modo claro.</li>
            <li>Mantener activa tu sesión iniciada de cliente sin necesidad de ingresar credenciales en cada página.</li>
          </ul>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Puedes configurar tu navegador web para rechazar o eliminar cookies en cualquier momento, aunque esto podría afectar la retención de los platos en tu carrito al recargar la página.
          </p>
        </div>
      </section>

      {/* Section 8 */}
      <section id="conservacion" className="scroll-mt-28 space-y-4 border-b border-neutral-200 pb-10 dark:border-neutral-800">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white font-mono text-xs font-semibold text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white">
            08
          </span>
          <h3 className="text-xl font-semibold text-neutral-950 dark:text-white">
            Plazos de Conservación de Datos
          </h3>
        </div>
        <div className="space-y-3.5 text-sm leading-7 text-neutral-600 dark:text-neutral-300">
          <p>
            Conservaremos tus datos personales únicamente durante el tiempo necesario para cumplir las finalidades descritas o durante los plazos legalmente exigidos por la normativa tributaria peruana (comprobantes de pago y auditorías contables de SUNAT hasta por un mínimo de 5 años).
          </p>
        </div>
      </section>

      {/* Section 9 */}
      <section id="contacto-privacidad" className="scroll-mt-28 space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white font-mono text-xs font-semibold text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-white">
            09
          </span>
          <h3 className="text-xl font-semibold text-neutral-950 dark:text-white">
            Canales de Contacto y Modificaciones
          </h3>
        </div>
        <div className="space-y-3.5 text-sm leading-7 text-neutral-600 dark:text-neutral-300">
          <p>
            Nos reservamos el derecho de modificar esta Política de Privacidad para adecuarla a nuevas exigencias normativas o mejoras en nuestras operaciones. Las versiones actualizadas se publicarán siempre en este apartado web con indicación expresa de su fecha de entrada en vigencia.
          </p>
          <p>
            Para consultas sobre la presente política o el tratamiento de tus datos personales, puedes contactarnos a través de los canales informados en el pie de página de nuestro portal web.
          </p>
        </div>
      </section>
    </div>
  );
}
