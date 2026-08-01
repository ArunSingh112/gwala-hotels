// The attractions page exists partly to rank for the searches pilgrims
// actually type. Distances from each branch are shown only where the owner
// has entered them (hotel.distances map) — no invented claims.

export interface Attraction {
  slug: string;
  name: string;
  summary: string;
  detail: string;
}

export const ATTRACTIONS: Attraction[] = [
  {
    slug: "banke-bihari",
    name: "Banke Bihari Mandir",
    summary: "Vrindavan's most beloved temple, home of the swaying Bihariji.",
    detail:
      "The 19th-century temple of Banke Bihari — Krishna in his most endearing, tribhanga pose — draws lakhs of devotees for a darshan that lasts seconds at a time: the curtain closes and opens repeatedly, because tradition holds that no one can withstand Bihariji's gaze for long. Come for the morning shringar aarti if you can.",
  },
  {
    slug: "prem-mandir",
    name: "Prem Mandir",
    summary: "A white-marble marvel that glows in shifting colours at night.",
    detail:
      "Built by Jagadguru Kripaluji Maharaj and opened in 2012, Prem Mandir's carved Italian marble tells the stories of Radha-Krishna across its walls. Arrive at dusk: the temple's illumination cycles through colours, and the fountain show draws families onto the lawns.",
  },
  {
    slug: "iskcon-vrindavan",
    name: "ISKCON Vrindavan (Krishna Balaram Mandir)",
    summary: "The spiritual home of the Hare Krishna movement in Braj.",
    detail:
      "Sri Sri Krishna Balaram Mandir stands in Raman Reti where Krishna and Balaram are said to have played. The samadhi of Srila Prabhupada, ISKCON's founder, is here, and the temple's kirtan hall sings around the clock. The Sunday feast is famous.",
  },
  {
    slug: "nidhivan",
    name: "Nidhivan",
    summary: "The sacred grove where Krishna is said to dance each night.",
    detail:
      "A tangle of low, intertwined tulsi trees that locals say become gopis after dark, when Krishna dances the raas leela. The grove empties before nightfall — no one stays inside after the evening aarti — which is exactly the kind of story Vrindavan is made of.",
  },
  {
    slug: "radha-raman",
    name: "Radha Raman Mandir",
    summary: "A self-manifested deity served continuously for 480 years.",
    detail:
      "One of Vrindavan's seven original Goswami temples, where the deity of Radha Raman is said to have self-manifested from a shaligram shila in 1542. The seva here has continued unbroken ever since, and the temple's intimacy makes it many pilgrims' quiet favourite.",
  },
  {
    slug: "rangaji-mandir",
    name: "Rangaji Mandir",
    summary: "A South Indian gopuram rising unexpectedly over Braj.",
    detail:
      "Vrindavan's largest temple, built in 1851 in Dravidian style with a towering gopuram and a golden pillar in its courtyard. Dedicated to Lord Ranganatha, it hosts a grand Brahmotsav each spring when the deity processes on different vahanas for ten days.",
  },
  {
    slug: "kesi-ghat",
    name: "Kesi Ghat",
    summary: "The Yamuna ghat where evening aarti meets the river.",
    detail:
      "Where Krishna is said to have defeated the horse demon Kesi, and where Vrindavan still comes down to the Yamuna. The evening aarti — lamps circling against the water as bells ring from the Madan Mohan temple above — is the town at its most photogenic.",
  },
];

export function getAttraction(slug: string): Attraction | undefined {
  return ATTRACTIONS.find((a) => a.slug === slug);
}
