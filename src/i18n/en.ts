import type { Strings } from './types';

// English edition. Voice: warm, exact, elegantly spare, literary, never
// wedding-blog. Paired blocks are length-matched for symmetry. Facts that are
// still placeholders are noted in README's "Details to confirm".
export const en: Strings = {
  meta: {
    title: 'Mari & Michael',
    description:
      'An invitation to the wedding of Mari & Michael: Magdalen College, Oxford and Weston Manor, Bicester.',
  },

  nav: {
    home: 'Welcome',
    weekend: 'The Day',
    weekendShort: 'The Day',
    venues: 'Venues',
    travel: 'Travel & Stay',
    travelShort: 'Travel',
    questions: 'Questions',
    gifts: 'A Note on Gifts',
    story: 'Our Story',
    today: 'Essentials',
    rsvp: 'RSVP',
    menu: 'Menu',
    close: 'Close',
  },

  lang: {
    label: 'Language',
    english: 'English',
    spanish: 'Español',
    switchTo: 'Leer en español',
  },

  hero: {
    eyebrow: 'An invitation',
    invitation: 'Please join us in Oxford and Bicester for a candlelit September wedding.',
    venueLine: 'Magdalen College, Oxford · Weston Manor, Bicester',
    // The hero's scroll cue lands on the wayfinding band (#find), so it names
    // the act of continuing, not a section it doesn't go to.
    scrollHint: 'Read on',
  },

  quick: {
    title: 'Find your way',
    weekend: 'The Day',
    venues: 'The Venues',
    travel: 'Travel & Stay',
    questions: 'Questions',
    today: 'Essentials',
    story: 'Our Story',
    rsvp: 'RSVP',
  },

  rsvp: {
    label: 'Reply',
    title: 'Will you join us?',
    intro:
      'We would be glad of your reply. A few short questions below — tell us whether you can come, who is in your party, and anything we should know.',
    deadlineNote: 'Kindly send your reply by {date}.',

    emailLabel: 'Email',
    emailHint: 'So we can reach you about your reply.',
    attendingLegend: 'Will you be able to join us?',
    attendingYes: 'Joyfully, yes',
    attendingNo: 'Sadly, no',
    dietaryLabel: 'Dietary needs or allergies',
    dietaryHint: 'Anything the kitchen should know.',
    messageLabel: 'A message to us',
    messageHint: 'Optional — a note, a song, a word.',

    mealsLabel: 'Who’s coming & meals',
    mealsHint: 'Tell us who can make it and choose each person’s meal — it helps us with the place cards.',
    mealChoose: '— choose a meal —',
    comingLabel: 'Attending',
    comingChoose: '— choose —',
    comingYes: 'Coming',
    comingNo: 'Can’t come',
    plusOneName: 'Name of your guest',
    plusOneNote: 'Your invitation includes a guest — add their name above if they’ll join you.',

    required: 'Required',
    optional: 'Optional',
    submit: 'Send your reply',
    submitting: 'Sending…',
    noscriptNote:
      'This form works without JavaScript — once you submit, a confirmation page will appear.',

    successTitle: 'Thank you — your reply is in.',
    successBody:
      'A confirmation is on its way by email. We can’t wait to celebrate with you.',
    successBodyDecline: 'A confirmation is on its way by email. Thank you for letting us know.',
    successReview: 'Here’s what you sent us — please check it over:',
    successNotComing: 'Can’t come:',
    successNoMeal: 'no meal chosen yet',
    successDecline: 'You’ve let us know you can’t make it — we’ll miss you.',
    successChangeHint: 'Spotted a mistake?',
    successChange: 'Change my answer',
    errorSummary: 'Please check the highlighted fields and try again.',
    errorEmail: 'Please enter a valid email address.',
    errorAttending: 'Please let us know if you can come.',
    errorChoose: 'Please choose “Coming” or “Can’t come” for each guest.',
    submitError: 'Sorry — that didn’t go through. Please try again, or get in touch with us.',

    closedTitle: 'Replies are now closed',
    closedBody:
      'The date for replies has passed. If you still need to reach us, email us at {email} — we’ll do our best.',

    thanksTitle: 'Thank you — your reply is in.',
    thanksBody:
      'We’ve received it, and a confirmation is on its way by email. Thank you for letting us know.',
    thanksBackHome: 'Back to the invitation',

    editNote: 'You’ve already replied — update your answer below and resend.',
    consentNote:
      'By sending this you agree we may store these details — including any dietary needs — to plan the day.',
    noCodeTitle: 'Your link is in your invitation email',
    noCodeBody:
      'It’s personal to you, so it isn’t shown here — open the link from the email we sent you. Can’t find it? Reply to that invitation, or write to us at {email}, and we’ll resend it.',
  },

  home: {
    welcome: {
      label: 'Welcome',
      title: 'From college to candlelight',
      body: [
        'We are gathering the people we love in Oxford for the afternoon, then north to Weston Manor for an evening of candlelight, dinner and dancing.',
        'Everything you need is here: when to arrive, where to go, and how to find us. Read it at your leisure; the day will keep.',
      ],
      cta: 'Our story',
    },
    weekend: {
      label: 'The Day',
      title: 'Two places, one day',
      intro:
        'The ceremony at Magdalen, then dinner and dancing at Weston Manor. Here is how the day unfolds, hour by hour.',
      cta: 'See the day',
    },
    venues: {
      label: 'The Venues',
      title: 'Magdalen & Weston Manor',
      intro:
        'An old college chapel in Oxford, and a candlelit manor near Bicester. Addresses, maps, and how to arrive at each.',
      cta: 'Venue details',
    },
    travel: {
      label: 'Travel & Stay',
      title: 'Getting there, and resting',
      intro:
        'How to reach each place, where to spend the night, and the simplest way across from Oxford to Bicester.',
      cta: 'Travel & stay',
    },
    gifts: {
      label: 'A Note on Gifts',
      title: 'Your presence',
      intro:
        'Your company is the thing we are truly asking for. If you would like to do more, a few quiet words are inside.',
      cta: 'A note on gifts',
    },
  },

  weekend: {
    label: 'The Day',
    title: 'How the day unfolds',
    intro:
      'One afternoon and evening, in two beautiful places. Times are a guide: come a little early, and let the rest carry you.',
    events: [
      {
        time: '2:30 pm',
        title: 'Guests arrive',
        venue: 'Magdalen College, Oxford',
        note: 'Through the Porters’ Lodge on the High Street.',
      },
      {
        time: '3:00 pm',
        title: 'The ceremony',
        venue: 'Magdalen College Chapel',
        note: 'Please be seated a little before three.',
      },
      {
        time: '4:00 pm',
        title: 'Drinks in the cloisters',
        venue: 'Magdalen College',
        note: 'Champagne, and the long light of afternoon.',
      },
      {
        time: '5:00 pm',
        title: 'Onward to Weston Manor',
        venue: 'Oxford → Bicester',
        note: 'About twenty-five minutes by road.',
      },
      {
        time: '6:30 pm',
        title: 'Dinner',
        venue: 'Weston Manor, Bicester',
        note: 'Candlelight, a long table, a few words.',
      },
      {
        time: '8:30 pm',
        title: 'Dancing',
        venue: 'Weston Manor',
        note: 'Until late.',
      },
      {
        time: '12:00 am',
        title: 'Carriages',
        venue: 'Weston Manor',
        note: 'The last cars, and a slow goodnight.',
      },
    ],
    closing: 'A fuller order of the day will be waiting for you at each door.',
  },

  venues: {
    label: 'The Venues',
    title: 'Two places to find',
    intro:
      'We marry in Oxford and celebrate near Bicester. Each card has the address, a one-tap map, and directions to the exact door.',
    roleCeremony: 'The ceremony',
    roleReception: 'The reception',
    arrivalLabel: 'Arrival',
    parkingLabel: 'Parking',
    addressLabel: 'Address',
    magdalen: {
      blurb:
        'A chapel of stone and candlelight on the High Street, where the deer park meets the river. We will marry here, among the cloisters, in the afternoon.',
      arrival: 'Enter through the Porters’ Lodge on the High Street; someone will point the way.',
      parking: 'There is no parking at the College: use the Oxford Park & Ride (Thornhill is closest) or a taxi.',
    },
    weston: {
      blurb:
        'A panelled manor a little north of Oxford, warm and low-lit, with long tables and old gardens. Dinner and dancing will carry us well into the night.',
      arrival: 'The drive is off Northampton Road, two miles from M40 Junction 9; follow signs to the house.',
      parking: 'There is parking on site at the manor.',
    },
  },

  travel: {
    label: 'Travel & Stay',
    title: 'Getting there, and resting',
    intro:
      'Oxford and Weston-on-the-Green sit around 25 to 35 minutes apart by road, depending on traffic. Here is the simplest way to each, and a few good places to rest.',
    sections: [
      {
        title: 'By car',
        body: 'Both places are easy by road. Magdalen has no parking: the Oxford Park & Ride (Thornhill is closest) spares the city traffic. Weston Manor is two miles from Junction 9 of the M40, off the A34.',
      },
      {
        title: 'By train',
        body: 'Oxford station is well served from Paddington and Marylebone, a short taxi from Magdalen. For Weston Manor, Bicester Village is easiest — direct from Marylebone, then a taxi; Islip is nearer but barely served.',
      },
      {
        title: 'Between the two',
        body: 'After drinks at Magdalen we make our way north to Weston Manor: allow around 25 to 35 minutes by road, and a little more if traffic is slow. Final transport details will be confirmed closer to the day.',
      },
    ],
    stayTitle: 'Where to stay',
    stayIntro:
      'A handful of places, from the manor itself to rooms in Oxford. Book early: September is a busy season in the city.',
    stays: [
      {
        name: 'Weston Manor',
        note: 'Rooms at the venue itself: the gentlest way to end the night.',
        distance: 'At the reception',
      },
      {
        name: 'Central Oxford',
        note: 'Hotels and townhouses within reach of Magdalen and the High Street.',
        distance: 'By the ceremony',
      },
      {
        name: 'Bicester & around',
        note: 'Inns and lodges near Weston-on-the-Green, a short drive from the manor.',
        distance: 'Near the reception',
      },
    ],
    distanceLabel: 'Where',
  },

  questions: {
    label: 'Questions',
    title: 'A few questions',
    intro:
      'The small practical things, answered plainly. If something is still unclear, do reach out. We would rather you asked.',
    faqs: [
      {
        q: 'What should I wear?',
        a: 'Black tie, worn happily. Candlelight does the rest. If black tie is not for you, a dark suit or an evening dress will be perfectly at home.',
      },
      {
        q: 'How do we reply?',
        a: 'Everything you need to reply is on your invitation. (If you cannot find it, send us a note at {email} and we will point the way.)',
      },
      {
        q: 'Where do I park?',
        a: 'There is no parking at Magdalen: use the Oxford Park & Ride or a taxi. Thornhill is a practical option for guests arriving from London or the M40. Weston Manor has parking on site.',
      },
      {
        q: 'Will it be cold?',
        a: 'September days are mild, the evenings cooler. The cloisters are open to the air, so bring a wrap for drinks and the walk to the cars.',
      },
      {
        q: 'When should I arrive?',
        a: 'A little before three at Magdalen, so you are seated in good time. The chapel doors close for the ceremony, and we would hate for you to miss it.',
      },
      {
        q: 'Is there a colour to avoid?',
        a: 'Only the obvious one: we will leave white and ivory to the bride. Everything else, especially deep and candlelit tones, is warmly welcome.',
      },
      {
        q: 'Can I take photographs?',
        a: 'Of course. We simply ask that you keep it subtle during the ceremony, so the moment stays unhurried. Afterwards, photograph as much as you like; we would love to see the evening through your eyes.',
      },
    ],
    note: 'Still wondering about something? Write to us at {email}.',
  },

  gifts: {
    label: 'A Note on Gifts',
    title: 'Your presence is the gift',
    body: [
      'Having the people we love in one room, by candlelight, is everything we are hoping for. Truly, your being there is more than enough.',
      'If you would nonetheless like to mark the day, a contribution toward our first journey together would be received with great warmth, and never any expectation.',
    ],
    note: 'With love and our thanks, Mari & Michael.',
  },

  story: {
    label: 'Our Story',
    title: 'A few words',
    body: [
      'We met in Norwich, and found before long that we had wandered the same imagined worlds for years: a shared love of literature and fantasy, and a fond, faintly competitive devotion to Terry Pratchett.',
      'Michael spent his university years at Magdalen, so to be married there is a quiet kind of full circle: old stone, good friends, and a great deal of candlelight.',
      'We look forward, more than we can say, to your witnessing the beginning of our new story together.',
    ],
    caption: 'A tale of our own: bells, books, and a little magic.',
  },

  today: {
    label: 'Essentials',
    title: 'For the day',
    intro: 'Everything you need, in one place. Keep this open in your pocket.',
    ceremonyTime: '3:00 pm',
    receptionTime: '6:30 pm',
    ceremonyLabel: 'The ceremony',
    receptionLabel: 'The reception',
    dressLabel: 'Dress',
    dress: 'Black tie',
    contactLabel: 'On-the-day contact',
    taxisLabel: 'Taxis',
    weatherLabel: 'Weather',
    weather: 'Mild but cool by evening: bring a wrap for the cloisters and the walk to the cars.',
    closing: 'See you there.',
  },

  footer: {
    closing: 'Mari & Michael · Oxford & Bicester',
    backToTop: 'Back to top',
  },

  ui: {
    directions: 'Google Maps',
    appleMaps: 'Apple Maps',
    what3words: 'what3words',
    address: 'Address',
    call: 'Call',
    readMore: 'Read more',
    languageName: 'English',
  },
};
