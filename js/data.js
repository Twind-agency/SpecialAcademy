const defaultCourses = [
  {
    id: "base-toelettatura-cani",
    titolo: "Corso Base Toelettatura Cani",
    livello: "Base",
    durata: "8 settimane",
    formato: "In presenza + laboratori pratici",
    descrizione:
      "Percorso introduttivo su igiene, bagno, asciugatura, taglio base e gestione del cliente.",
    coach: "Elena Rinaldi",
    calendario: [
      "Lunedì e Mercoledì • 18:00 - 21:00",
      "Sabato • pratica in salone 09:00 - 13:00"
    ]
  },
  {
    id: "gatto-sicuro",
    titolo: "Specializzazione Gatto Sicuro",
    livello: "Intermedio",
    durata: "4 settimane",
    formato: "Live + workshop dedicato",
    descrizione:
      "Tecniche di handling felino, riduzione stress e protocolli grooming specifici per il gatto.",
    coach: "Marco Vitale",
    calendario: ["Martedì • 19:00 - 22:00"]
  },
  {
    id: "styling-competition",
    titolo: "Styling & Competition Prep",
    livello: "Avanzato",
    durata: "6 settimane",
    formato: "Masterclass",
    descrizione:
      "Preparazione avanzata per razze da expo, finiture professionali e lettura standard di razza.",
    coach: "Sofia Neri",
    calendario: []
  }
];

const masters = [
  {
    nome: "Elena Rinaldi",
    ruolo: "Head Coach - Tecniche base",
    bio: "15 anni di esperienza in saloni premium e formatrice per nuovi professionisti.",
    specialita: "Taglio commerciale, accoglienza cliente"
  },
  {
    nome: "Marco Vitale",
    ruolo: "Coach comportamento & felini",
    bio: "Esperto in gestione animali sensibili e protocolli low stress.",
    specialita: "Gatti, gestione emozionale, sicurezza"
  },
  {
    nome: "Sofia Neri",
    ruolo: "Master Stylist",
    bio: "Pluripremiata in competition grooming, segue moduli avanzati di rifinitura.",
    specialita: "Styling da gara, razze complesse"
  },
  {
    nome: "Davide Ferri",
    ruolo: "Business Coach",
    bio: "Supporta gli allievi su pricing, vendita servizi e gestione agenda salone.",
    specialita: "Gestione attività, marketing locale"
  }
];

const liveEvents = [
  {
    titolo: "Open Day Academy",
    data: "2026-05-10",
    luogo: "Milano + Streaming",
    dettagli: "Presentazione percorsi, demo live e Q&A con i coach."
  },
  {
    titolo: "Workshop Taglio Teddy",
    data: "2026-05-24",
    luogo: "Roma",
    dettagli: "Sessione pratica su modelli toy e gestione mantello voluminoso."
  },
  {
    titolo: "Live Digital: Pricing dei Servizi",
    data: "2026-06-02",
    luogo: "Online",
    dettagli: "Strategie per creare listini sostenibili e aumentare marginalità."
  }
];

function getCourses() {
  const fromStorage = localStorage.getItem("specialAcademyCourses");
  if (!fromStorage) return defaultCourses;
  try {
    const parsed = JSON.parse(fromStorage);
    return Array.isArray(parsed) && parsed.length ? parsed : defaultCourses;
  } catch {
    return defaultCourses;
  }
}

function saveCourses(courses) {
  localStorage.setItem("specialAcademyCourses", JSON.stringify(courses));
}

function getCourseById(id) {
  return getCourses().find((c) => c.id === id);
}

function toItDate(dateString) {
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(dateString));
}
