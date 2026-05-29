import type { Strings } from './types';

// Edición en español. Mismo tono que en inglés: cálido, exacto, sobrio y
// literario. Bloques emparejados de longitud pareja. Trato neutro ("ustedes").
export const es: Strings = {
  meta: {
    title: 'Mari & Michael',
    description:
      'Una invitación a la boda de Mari y Michael — Magdalen College, Oxford y Weston Manor, Bicester.',
  },

  nav: {
    home: 'Bienvenida',
    weekend: 'El fin de semana',
    venues: 'Lugares',
    travel: 'Cómo llegar',
    questions: 'Preguntas',
    gifts: 'Sobre los regalos',
    story: 'Nuestra historia',
    today: 'El día',
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
      'Acompáñennos en Oxford y Bicester para un fin de semana de boda a la luz de las velas.',
    venueLine: 'Magdalen College, Oxford · Weston Manor, Bicester',
    scrollHint: 'El fin de semana',
  },

  quick: {
    title: 'Encuentre su camino',
    weekend: 'El fin de semana',
    venues: 'Los lugares',
    travel: 'Cómo llegar',
    questions: 'Preguntas',
    today: 'Ese día',
  },

  home: {
    welcome: {
      label: 'Bienvenida',
      title: 'Un fin de semana a la luz de las velas',
      body: [
        'Reuniremos a las personas que queremos en Oxford y, un poco más al norte, en Weston Manor, para una larga velada de velas, cena y baile.',
        'Aquí encontrará todo lo necesario: cuándo llegar, adónde ir y cómo dar con nosotros. Léalo con calma; el día sabrá esperar.',
      ],
    },
    weekend: {
      label: 'El fin de semana',
      title: 'Dos lugares, una velada',
      intro:
        'La ceremonia en Magdalen y, después, cena y baile en Weston Manor. Así transcurre el día, hora a hora.',
      cta: 'Ver el fin de semana',
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
      cta: 'Cómo llegar y dormir',
    },
    gifts: {
      label: 'Sobre los regalos',
      title: 'Su presencia',
      intro:
        'Lo único que de verdad pedimos es su compañía. Si desea hacer algo más, dentro hay unas palabras.',
      cta: 'Sobre los regalos',
    },
  },

  weekend: {
    label: 'El fin de semana',
    title: 'Cómo transcurre el día',
    intro:
      'Una tarde y una noche, en dos lugares hermosos. Los horarios son orientativos: llegue con tiempo y déjese llevar.',
    events: [
      {
        time: '13:30',
        title: 'Llegada de los invitados',
        venue: 'Magdalen College, Oxford',
        note: 'Por la conserjería (Porters’ Lodge), en la High Street.',
      },
      {
        time: '14:00',
        title: 'La ceremonia',
        venue: 'Capilla de Magdalen College',
        note: 'Tomen asiento un poco antes de las dos.',
      },
      {
        time: '15:00',
        title: 'Copas en el claustro',
        venue: 'Magdalen College',
        note: 'Champán y la luz larga de la tarde.',
      },
      {
        time: '17:00',
        title: 'Hacia Weston Manor',
        venue: 'Oxford → Bicester',
        note: 'Unos cuarenta minutos por carretera.',
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
        note: 'Los últimos coches y un adiós sin prisa.',
      },
    ],
    closing: 'Un programa más detallado les esperará en cada puerta.',
  },

  venues: {
    label: 'Los lugares',
    title: 'Dos lugares por descubrir',
    intro:
      'Nos casamos en Oxford y celebramos cerca de Bicester. Cada ficha trae la dirección, un mapa al instante y un cuadro de what3words para la puerta exacta.',
    roleCeremony: 'La ceremonia',
    roleReception: 'La celebración',
    arrivalLabel: 'Llegada',
    parkingLabel: 'Aparcamiento',
    addressLabel: 'Dirección',
    magdalen: {
      blurb:
        'Una capilla de piedra y velas en la High Street, donde el parque de los ciervos se encuentra con el río. Aquí nos casaremos, entre los claustros, al caer la tarde.',
      arrival: 'Entren por la conserjería (Porters’ Lodge), en la High Street; alguien les indicará.',
      parking: 'El College no tiene aparcamiento: usen el park-and-ride de Oxford o un taxi.',
    },
    weston: {
      blurb:
        'Un señorío con paneles de madera al norte de Oxford, cálido y de luz tenue, con mesas largas y viejos jardines. La cena y el baile nos llevarán entrada la noche.',
      arrival: 'La entrada está en Northampton Road; sigan las indicaciones por la verja hasta la casa.',
      parking: 'Hay amplio aparcamiento, y los coches pueden quedarse durante la noche con cuidado.',
    },
  },

  travel: {
    label: 'Cómo llegar',
    title: 'Llegar, y descansar',
    intro:
      'Oxford y Weston-on-the-Green distan unos cuarenta minutos. Esta es la forma más sencilla de llegar a cada uno, y algunos buenos lugares donde descansar.',
    sections: [
      {
        title: 'En coche',
        body: 'Ambos lugares son fáciles por carretera. Weston Manor está a dos millas de la salida 9 de la M40, junto a la A34. Para Magdalen, el park-and-ride de Oxford evita el tráfico.',
      },
      {
        title: 'En tren',
        body: 'La estación de Oxford tiene buenas conexiones desde Londres (Paddington y Marylebone), a diez minutos de Magdalen en taxi. Bicester es la parada más cercana a Weston Manor.',
      },
      {
        title: 'Entre los dos',
        body: 'Tras las copas en Magdalen iremos hacia el norte, a Weston Manor: unos cuarenta minutos. Los detalles del transporte se confirmarán más cerca del día.',
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
        q: '¿Puedo llevar a los niños?',
        a: 'Los queremos mucho, pero es una velada para adultos. Su invitación nombrará a quienes esperamos, para que puedan planificar con calma.',
      },
      {
        q: '¿Cómo confirmamos?',
        a: 'Todo lo necesario para responder está en su invitación. (Si no lo encuentran, escríbannos y les indicaremos.)',
      },
      {
        q: '¿Dónde aparco?',
        a: 'En Magdalen no hay aparcamiento: usen el park-and-ride de Oxford o un taxi. Weston Manor tiene espacio de sobra, y los coches pueden quedarse de noche.',
      },
      {
        q: '¿Hará frío?',
        a: 'Las tardes de septiembre son suaves, pero sin prisa. El claustro está al aire libre: traigan algo de abrigo para las copas y el camino a los coches.',
      },
      {
        q: '¿Cuándo debo llegar?',
        a: 'Un poco antes de las dos en Magdalen, para sentarse con tiempo. Las puertas de la capilla se cierran para la ceremonia y no querríamos que se la perdieran.',
      },
      {
        q: '¿Hay algún color que evitar?',
        a: 'Solo el evidente: dejaremos el blanco y el marfil para la novia. Todo lo demás, sobre todo los tonos profundos y cálidos, es bienvenido.',
      },
      {
        q: '¿Puedo hacer fotos?',
        a: 'Durante la ceremonia, acompáñennos de verdad: sin teléfonos. Después, fotografíen todo; nos encantaría ver la velada con sus ojos.',
      },
    ],
    note: '¿Sigue con alguna duda? Escríbannos: la dirección está en su invitación.',
  },

  gifts: {
    label: 'Sobre los regalos',
    title: 'Su presencia es el regalo',
    body: [
      'Tener en una misma sala, a la luz de las velas, a las personas que queremos es cuanto deseamos. De verdad, que vengan es más que suficiente.',
      'Si aun así desean marcar el día, una aportación para nuestro primer viaje juntos se recibirá con enorme cariño, y sin ninguna expectativa.',
    ],
    note: 'Con cariño y gratitud — Mari y Michael.',
  },

  story: {
    label: 'Nuestra historia',
    title: 'Unas palabras',
    body: [
      'Nos conocimos una tarde cualquiera que resultó ser de todo menos corriente, y desde entonces escribimos el mismo capítulo, largo y feliz.',
      'Buena parte se escribió en Oxford, así que nos pareció justo empezar aquí la siguiente: entre piedra antigua, buenos amigos y muchas velas.',
    ],
  },

  today: {
    label: 'El día',
    title: 'Ese día',
    intro: 'Todo lo que necesita, en un solo lugar. Llévelo en el bolsillo.',
    ceremonyTime: '14:00',
    receptionTime: '18:30',
    ceremonyLabel: 'La ceremonia',
    receptionLabel: 'La celebración',
    dressLabel: 'Vestimenta',
    dress: 'Etiqueta (black tie)',
    contactLabel: 'Contacto ese día',
    taxisLabel: 'Taxis',
    weatherLabel: 'El tiempo',
    weather: 'Suave, pero fresco al anochecer: traigan algo de abrigo para el claustro y el camino a los coches.',
    closing: 'Nos vemos allí.',
  },

  footer: {
    closing: 'Mari & Michael · Oxford y Bicester',
    backToTop: 'Volver arriba',
  },

  ui: {
    directions: 'Cómo llegar',
    appleMaps: 'Apple Maps',
    what3words: 'what3words',
    address: 'Dirección',
    call: 'Llamar',
    readMore: 'Leer más',
    languageName: 'Español',
  },
};
