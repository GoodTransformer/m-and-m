import type { Strings } from './types';

// Edición en español (latinoamericano). Mismo tono que en inglés: cálido,
// exacto, sobrio y literario. Bloques emparejados de longitud pareja.
// Trato de "ustedes" en todo el sitio; léxico neutro sudamericano.
export const es: Strings = {
  meta: {
    title: 'Mari & Michael',
    description:
      'Una invitación a la boda de Mari y Michael: Magdalen College, Oxford y Weston Manor, Bicester.',
  },

  nav: {
    home: 'Bienvenida',
    weekend: 'El día',
    weekendShort: 'El día',
    venues: 'Lugares',
    travel: 'Cómo llegar',
    travelShort: 'Cómo llegar',
    questions: 'Preguntas',
    gifts: 'Sobre los regalos',
    story: 'Nuestra historia',
    today: 'Esencial',
    rsvp: 'Confirmar',
    menu: 'Menú',
    close: 'Cerrar',
  },

  lang: {
    label: 'Idioma',
    english: 'English',
    spanish: 'Español',
    switchTo: 'Read in English',
  },

  hero: {
    eyebrow: 'Una invitación',
    invitation:
      'Acompáñennos en Oxford y Bicester para una boda de septiembre a la luz de las velas.',
    venueLine: 'Magdalen College, Oxford · Weston Manor, Bicester',
    scrollHint: 'El día',
  },

  quick: {
    title: 'Encuentren su camino',
    weekend: 'El día',
    venues: 'Los lugares',
    travel: 'Cómo llegar',
    questions: 'Preguntas',
    today: 'Esencial',
    story: 'Nuestra historia',
    rsvp: 'Confirmar',
  },

  rsvp: {
    label: 'Respuesta',
    title: '¿Nos acompañan?',
    intro:
      'Nos alegraría recibir su respuesta. Unas pocas preguntas abajo: díganos si pueden venir, quién los acompaña y cualquier cosa que debamos saber.',
    deadlineNote: 'Por favor, envíen su respuesta antes del {date}.',

    emailLabel: 'Correo electrónico',
    emailHint: 'Para poder escribirles sobre su respuesta.',
    attendingLegend: '¿Podrán acompañarnos?',
    attendingYes: 'Sí, con alegría',
    attendingNo: 'No podremos, lo sentimos',
    dietaryLabel: 'Alergias o necesidades dietéticas',
    dietaryHint: 'Lo que la cocina deba saber.',
    messageLabel: 'Un mensaje para nosotros',
    messageHint: 'Opcional — una nota, una canción, unas palabras.',

    mealsLabel: 'Quiénes vienen y menú',
    mealsHint: 'Díganos quién podrá venir y elijan el plato de cada persona — nos ayuda con las tarjetas.',
    mealChoose: '— elegir plato —',
    comingLabel: 'Asistencia',
    comingChoose: '— elegir —',
    comingYes: 'Viene',
    comingNo: 'No viene',
    plusOneName: 'Nombre de su acompañante',
    plusOneNote: 'Su invitación incluye un acompañante — añadan su nombre arriba si les acompañará.',

    required: 'Obligatorio',
    optional: 'Opcional',
    submit: 'Enviar respuesta',
    submitting: 'Enviando…',
    noscriptNote:
      'Este formulario funciona sin JavaScript: al enviarlo verán una página de confirmación.',

    successTitle: 'Gracias — su respuesta quedó registrada.',
    successBody:
      'Les enviamos una confirmación por correo. Tenemos muchas ganas de celebrar con ustedes.',
    successBodyDecline: 'Les enviamos una confirmación por correo. Gracias por avisarnos.',
    successReview: 'Esto es lo que nos enviaron — por favor, revísenlo:',
    successNotComing: 'No podrán venir:',
    successNoMeal: 'sin plato elegido',
    successDecline: 'Nos avisaron que no podrán acompañarnos — los echaremos de menos.',
    successChangeHint: '¿Vieron un error?',
    successChange: 'Cambiar mi respuesta',
    errorSummary: 'Por favor, revisen los campos marcados e inténtenlo de nuevo.',
    errorEmail: 'Introduzcan un correo electrónico válido.',
    errorAttending: 'Indíquennos si pueden venir, por favor.',
    errorChoose: 'Por favor, elijan “Viene” o “No viene” para cada invitado.',
    submitError: 'Lo sentimos — no se pudo enviar. Inténtenlo de nuevo o escríbannos.',

    closedTitle: 'Las respuestas están cerradas',
    closedBody:
      'La fecha para responder ya pasó. Si aún necesitan localizarnos, escríbannos a {email} — haremos lo posible.',

    thanksTitle: 'Gracias — su respuesta quedó registrada.',
    thanksBody:
      'La recibimos, y les enviamos una confirmación por correo. Gracias por avisarnos.',
    thanksBackHome: 'Volver a la invitación',

    editNote: 'Ya respondieron — actualicen su respuesta abajo y vuelvan a enviarla.',
    consentNote:
      'Al enviar, aceptan que guardemos estos datos —incluidas las necesidades dietéticas— para planificar el día.',
    noCodeTitle: 'Su enlace está en su correo de invitación',
    noCodeBody:
      'Es personal, por eso no aparece aquí — abran el enlace del correo que les enviamos. ¿No lo encuentran? Respondan a esa invitación, o escríbannos a {email}, y se lo reenviaremos.',
  },

  home: {
    welcome: {
      label: 'Bienvenida',
      title: 'De la capilla a la luz de las velas',
      body: [
        'Reuniremos a las personas que queremos en Oxford por la tarde y, más al norte, en Weston Manor, para una velada a la luz de las velas, con cena y baile.',
        'Aquí encontrarán todo lo necesario: cuándo llegar, adónde ir y cómo dar con nosotros. Léanlo con calma; el día sabrá esperar.',
      ],
      cta: 'Nuestra historia',
    },
    weekend: {
      label: 'El día',
      title: 'Dos lugares, un día',
      intro:
        'La ceremonia en Magdalen y, después, cena y baile en Weston Manor. Así transcurre el día, hora a hora.',
      cta: 'Ver el día',
    },
    venues: {
      label: 'Los lugares',
      title: 'Magdalen y Weston Manor',
      intro:
        'Una vieja capilla universitaria en Oxford y un señorío a la luz de las velas cerca de Bicester. Direcciones y mapas.',
      cta: 'Ver los lugares',
    },
    travel: {
      label: 'Cómo llegar',
      title: 'Llegar, y descansar',
      intro:
        'Cómo llegar a cada lugar, dónde pasar la noche y la forma más sencilla de ir de Oxford a Bicester.',
      cta: 'Cómo llegar y dónde dormir',
    },
    gifts: {
      label: 'Sobre los regalos',
      title: 'Su presencia',
      intro:
        'Lo único que de verdad pedimos es su compañía. Si desean hacer algo más, dentro hay unas palabras.',
      cta: 'Sobre los regalos',
    },
  },

  weekend: {
    label: 'El día',
    title: 'Cómo transcurre el día',
    intro:
      'Una tarde y una noche, en dos lugares hermosos. Los horarios son orientativos: lleguen con tiempo y déjense llevar.',
    events: [
      {
        time: '14:30',
        title: 'Llegada de los invitados',
        venue: 'Magdalen College, Oxford',
        note: 'Por la conserjería (Porters’ Lodge), en la High Street.',
      },
      {
        time: '15:00',
        title: 'La ceremonia',
        venue: 'Capilla de Magdalen College',
        note: 'Tomen asiento un poco antes de las tres.',
      },
      {
        time: '16:00',
        title: 'Copas en el claustro',
        venue: 'Magdalen College',
        note: 'Champagne y la luz larga de la tarde.',
      },
      {
        time: '17:00',
        title: 'Hacia Weston Manor',
        venue: 'Oxford → Bicester',
        note: 'Unos veinticinco minutos por carretera.',
      },
      {
        time: '18:30',
        title: 'La cena',
        venue: 'Weston Manor, Bicester',
        note: 'Velas, una mesa larga y unas palabras.',
      },
      {
        time: '20:30',
        title: 'El baile',
        venue: 'Weston Manor',
        note: 'Hasta tarde.',
      },
      {
        time: '00:00',
        title: 'Despedida',
        venue: 'Weston Manor',
        note: 'Los últimos autos y un adiós sin prisa.',
      },
    ],
    closing: 'Un programa más detallado les esperará en cada puerta.',
  },

  venues: {
    label: 'Los lugares',
    title: 'Dos lugares por descubrir',
    intro:
      'Nos casamos en Oxford y celebramos cerca de Bicester. Cada ficha trae la dirección, un mapa al instante y las indicaciones para llegar a la puerta exacta.',
    roleCeremony: 'La ceremonia',
    roleReception: 'La celebración',
    arrivalLabel: 'Llegada',
    parkingLabel: 'Estacionamiento',
    addressLabel: 'Dirección',
    magdalen: {
      blurb:
        'Una capilla de piedra y velas en la High Street, donde el parque de los ciervos se encuentra con el río. Aquí nos casaremos, entre los claustros, por la tarde.',
      arrival: 'Entren por la conserjería (Porters’ Lodge), en la High Street; alguien les indicará.',
      parking: 'El College no tiene estacionamiento: usen el Park & Ride de Oxford (Thornhill es el más cercano) o un taxi.',
    },
    weston: {
      blurb:
        'Un señorío con paneles de madera al norte de Oxford, cálido y de luz tenue, con mesas largas y viejos jardines. La cena y el baile nos llevarán entrada la noche.',
      arrival: 'La entrada está en Northampton Road, a dos millas de la salida 9 de la M40; sigan las indicaciones hasta la casa.',
      parking: 'Hay estacionamiento propio en el señorío.',
    },
  },

  travel: {
    label: 'Cómo llegar',
    title: 'Llegar, y descansar',
    intro:
      'Oxford y Weston-on-the-Green están a unos 25 o 35 minutos por carretera, según el tráfico. Esta es la forma más sencilla de llegar a cada uno, y algunos buenos lugares donde descansar.',
    sections: [
      {
        title: 'En auto',
        body: 'Ambos lugares son fáciles por carretera. Magdalen no tiene estacionamiento: el Park & Ride de Oxford (Thornhill es el más cercano) evita el tráfico. Weston Manor está a dos millas de la salida 9 de la M40, junto a la A34.',
      },
      {
        title: 'En tren',
        body: 'Oxford tiene buenas conexiones desde Paddington y Marylebone, a corto trayecto en taxi de Magdalen. Para Weston Manor, Bicester Village es la más práctica —directa desde Marylebone—, luego un taxi; Islip está más cerca, pero con pocos trenes.',
      },
      {
        title: 'Entre los dos',
        body: 'Tras las copas en Magdalen iremos hacia el norte, a Weston Manor: calculen unos 25 o 35 minutos por carretera, y algo más si el tráfico va lento. Los detalles del transporte se confirmarán más cerca del día.',
      },
    ],
    stayTitle: 'Dónde dormir',
    stayIntro:
      'Unos cuantos lugares, desde el propio señorío hasta habitaciones en Oxford. Reserven pronto: septiembre es temporada alta en la ciudad.',
    stays: [
      {
        name: 'Weston Manor',
        note: 'Habitaciones en el propio lugar: la forma más serena de terminar la noche.',
        distance: 'En la celebración',
      },
      {
        name: 'Centro de Oxford',
        note: 'Hoteles y casas a un paso de Magdalen y la High Street.',
        distance: 'Junto a la ceremonia',
      },
      {
        name: 'Bicester y alrededores',
        note: 'Posadas y alojamientos cerca de Weston-on-the-Green, a poca distancia del señorío.',
        distance: 'Cerca de la celebración',
      },
    ],
    distanceLabel: 'Dónde',
  },

  questions: {
    label: 'Preguntas',
    title: 'Algunas preguntas',
    intro:
      'Las pequeñas cuestiones prácticas, contestadas con sencillez. Si algo no queda claro, escríbannos: preferimos que pregunten.',
    faqs: [
      {
        q: '¿Cómo debo vestir?',
        a: 'Etiqueta (black tie), de buena gana; las velas hacen el resto. Si la etiqueta no es lo suyo, un traje oscuro o un vestido de noche encajarán a la perfección.',
      },
      {
        q: '¿Cómo confirmamos?',
        a: 'Todo lo necesario para responder está en su invitación. (Si no lo encuentran, escríbannos a {email} y les indicaremos.)',
      },
      {
        q: '¿Dónde estaciono?',
        a: 'En Magdalen no hay estacionamiento: usen el Park & Ride de Oxford o un taxi. Thornhill es una opción práctica para quienes llegan desde Londres o la M40. Weston Manor tiene estacionamiento propio.',
      },
      {
        q: '¿Hará frío?',
        a: 'Los días de septiembre son suaves; las noches, más frescas. El claustro está al aire libre: traigan algo de abrigo para las copas y el camino a los autos.',
      },
      {
        q: '¿Cuándo debo llegar?',
        a: 'Un poco antes de las tres en Magdalen, para sentarse con tiempo. Las puertas de la capilla se cierran para la ceremonia y no querríamos que se la perdieran.',
      },
      {
        q: '¿Hay algún color que evitar?',
        a: 'Solo el evidente: dejaremos el blanco y el marfil para la novia. Todo lo demás, sobre todo los tonos profundos y cálidos, es bienvenido.',
      },
      {
        q: '¿Puedo hacer fotos?',
        a: 'Por supuesto. Solo pedimos discreción durante la ceremonia, para que el momento transcurra sin prisa. Después, fotografíen cuanto quieran; nos encantaría ver la velada con sus ojos.',
      },
    ],
    note: '¿Siguen con alguna duda? Escríbannos a {email}.',
  },

  gifts: {
    label: 'Sobre los regalos',
    title: 'Su presencia es el regalo',
    body: [
      'Tener en una misma sala, a la luz de las velas, a las personas que queremos es cuanto deseamos. De verdad, que vengan es más que suficiente.',
      'Si aun así desean marcar el día, un aporte para nuestro primer viaje juntos se recibirá con enorme cariño, y sin ninguna expectativa.',
    ],
    note: 'Con cariño y gratitud, Mari y Michael.',
  },

  story: {
    label: 'Nuestra historia',
    title: 'Unas palabras',
    body: [
      'Nos conocimos en Norwich y pronto descubrimos que llevábamos años recorriendo los mismos mundos imaginarios: un amor compartido por la literatura y la fantasía, y una devoción tierna, y algo competitiva, por Terry Pratchett.',
      'Michael pasó sus años de universidad en Magdalen, así que casarnos allí es una especie de círculo que se cierra: piedra antigua, buenos amigos y mucha luz de velas.',
      'Esperamos, más de lo que podemos decir, que nos acompañen para presenciar el comienzo de nuestra nueva historia juntos.',
    ],
    caption: 'Un cuento nuestro: campanas, libros y un poco de magia.',
  },

  today: {
    label: 'Esencial',
    title: 'Para el día',
    intro: 'Todo lo que necesitan, en un solo lugar. Llévenlo en el bolsillo.',
    ceremonyTime: '15:00',
    receptionTime: '18:30',
    ceremonyLabel: 'La ceremonia',
    receptionLabel: 'La celebración',
    dressLabel: 'Vestimenta',
    dress: 'Etiqueta (black tie)',
    contactLabel: 'Contacto ese día',
    taxisLabel: 'Taxis',
    weatherLabel: 'El clima',
    weather: 'Suave, pero fresco al anochecer: traigan algo de abrigo para el claustro y el camino a los autos.',
    closing: 'Nos vemos allí.',
  },

  footer: {
    closing: 'Mari & Michael · Oxford y Bicester',
    backToTop: 'Volver arriba',
  },

  ui: {
    directions: 'Google Maps',
    appleMaps: 'Apple Maps',
    what3words: 'what3words',
    address: 'Dirección',
    call: 'Llamar',
    readMore: 'Leer más',
    languageName: 'Español',
  },
};
