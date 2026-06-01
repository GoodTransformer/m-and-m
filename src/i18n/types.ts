// ============================================================
// The content contract. en.ts and es.ts both implement `Strings`, so a
// missing or renamed key in either language is a TypeScript error — the two
// editions can never drift out of sync.
// ============================================================

export interface NavStrings {
  home: string;
  weekend: string;
  weekendShort: string; // compact label for the masthead bar
  venues: string;
  travel: string;
  travelShort: string; // compact label for the masthead bar
  questions: string;
  gifts: string;
  story: string;
  today: string;
  rsvp: string;
  menu: string;
  close: string;
}

// The RSVP page + form. Paired blocks (intro/closing, success/thanks) are
// length-matched across languages for balanced rendering.
export interface RsvpStrings {
  label: string;
  title: string;
  intro: string;
  deadlineNote: string; // contains a {date} token, filled in at render time

  namesLabel: string;
  namesHint: string;
  emailLabel: string;
  emailHint: string;
  attendingLegend: string;
  attendingYes: string;
  attendingNo: string;
  partyLabel: string;
  partyHint: string;
  dietaryLabel: string;
  dietaryHint: string;
  messageLabel: string;
  messageHint: string;

  required: string;
  optional: string;
  submit: string;
  submitting: string;
  noscriptNote: string;

  successTitle: string;
  successBody: string;
  errorSummary: string;
  errorNames: string;
  errorEmail: string;
  errorAttending: string;
  errorParty: string;
  submitError: string;

  closedTitle: string;
  closedBody: string;

  thanksTitle: string;
  thanksBody: string;
  thanksBackHome: string;

  editNote: string;
  consentNote: string;
  noCodeTitle: string;
  noCodeBody: string;
}

export interface ScheduleEvent {
  time: string; // locale-formatted ("2:00 pm" / "14:00")
  title: string;
  venue: string;
  note: string;
}

export interface Faq {
  q: string;
  a: string;
}

export interface Stay {
  name: string;
  note: string;
  distance: string;
  url?: string;
}

export interface TravelSection {
  title: string;
  body: string;
}

export interface Strings {
  meta: { title: string; description: string };
  nav: NavStrings;
  lang: { label: string; english: string; spanish: string; switchTo: string };

  hero: {
    eyebrow: string;
    invitation: string;
    venueLine: string;
    scrollHint: string;
  };

  quick: {
    title: string;
    weekend: string;
    venues: string;
    travel: string;
    questions: string;
    today: string;
    rsvp: string;
  };

  // Homepage chapter previews. The four `intro` strings are length-matched.
  home: {
    welcome: { label: string; title: string; body: string[] };
    weekend: { label: string; title: string; intro: string; cta: string };
    venues: { label: string; title: string; intro: string; cta: string };
    travel: { label: string; title: string; intro: string; cta: string };
    gifts: { label: string; title: string; intro: string; cta: string };
  };

  weekend: {
    label: string;
    title: string;
    intro: string;
    events: ScheduleEvent[];
    closing: string;
  };

  venues: {
    label: string;
    title: string;
    intro: string;
    roleCeremony: string;
    roleReception: string;
    arrivalLabel: string;
    parkingLabel: string;
    addressLabel: string;
    magdalen: { blurb: string; arrival: string; parking: string };
    weston: { blurb: string; arrival: string; parking: string };
  };

  travel: {
    label: string;
    title: string;
    intro: string;
    sections: TravelSection[];
    stayTitle: string;
    stayIntro: string;
    stays: Stay[];
    distanceLabel: string;
  };

  questions: {
    label: string;
    title: string;
    intro: string;
    faqs: Faq[];
    note: string;
  };

  gifts: {
    label: string;
    title: string;
    body: string[];
    note: string;
  };

  story: {
    label: string;
    title: string;
    body: string[];
    caption: string;
  };

  today: {
    label: string;
    title: string;
    intro: string;
    ceremonyTime: string;
    receptionTime: string;
    ceremonyLabel: string;
    receptionLabel: string;
    dressLabel: string;
    dress: string;
    contactLabel: string;
    taxisLabel: string;
    weatherLabel: string;
    weather: string;
    closing: string;
  };

  rsvp: RsvpStrings;

  footer: {
    closing: string;
    backToTop: string;
  };

  ui: {
    directions: string;
    appleMaps: string;
    what3words: string;
    address: string;
    call: string;
    readMore: string;
    languageName: string;
  };
}
