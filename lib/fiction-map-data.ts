export type FictionBook = {
  title: string;
  author: string;
  summary: string;
};

export type FictionPlace = {
  id: string;
  name: string;
  state: string;
  x: number;
  y: number;
  description: string;
  books: FictionBook[];
};

export const fictionPlaces: FictionPlace[] = [
  {
    id: 'delhi',
    name: 'Delhi',
    state: 'Delhi',
    x: 182,
    y: 112,
    description: 'Imperial memory, partition, and modern urban life converge here in a large body of fiction.',
    books: [
      {
        title: 'Twilight in Delhi',
        author: 'Ahmed Ali',
        summary: 'A portrait of a fading old Delhi household as political change and colonial pressure reshape the city.'
      },
      {
        title: 'Clear Light of Day',
        author: 'Anita Desai',
        summary: 'A family drama rooted in Old Delhi that uses the city’s atmosphere to explore memory, resentment, and intimacy.'
      },
      {
        title: 'Delhi: A Novel',
        author: 'Khushwant Singh',
        summary: 'A sweeping, irreverent narrative that moves across eras to show Delhi as sensual, violent, and endlessly layered.'
      }
    ]
  },
  {
    id: 'lucknow',
    name: 'Lucknow',
    state: 'Uttar Pradesh',
    x: 220,
    y: 138,
    description: 'Nawabi culture, refinement, decline, and social change make Lucknow a rich fictional setting.',
    books: [
      {
        title: 'A Mirror of Beauty',
        author: 'Shamsur Rahman Faruqi',
        summary: 'An expansive novel of late nineteenth-century North India that captures Lucknow’s aesthetics, etiquette, and political fragility.'
      },
      {
        title: 'Fire Under Ashes',
        author: 'Rashmi Narzary',
        summary: 'A contemporary literary novel that traces personal and political tensions through urban North Indian life, including Lucknow.'
      }
    ]
  },
  {
    id: 'kolkata',
    name: 'Kolkata',
    state: 'West Bengal',
    x: 292,
    y: 164,
    description: 'Kolkata appears in fiction as intellectual center, migrant city, and site of intense historical memory.',
    books: [
      {
        title: 'The Shadow Lines',
        author: 'Amitav Ghosh',
        summary: 'A novel of borders and memory in which Kolkata anchors a family’s emotional and historical imagination.'
      },
      {
        title: 'The Calcutta Chromosome',
        author: 'Amitav Ghosh',
        summary: 'A literary thriller that turns Kolkata into a mysterious network of science, secrecy, and alternate histories.'
      },
      {
        title: 'City of Joy',
        author: 'Dominique Lapierre',
        summary: 'A dramatic novel centered on the lives, hardship, and resilience of people in Kolkata’s poorer neighborhoods.'
      }
    ]
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    state: 'Maharashtra',
    x: 136,
    y: 212,
    description: 'Mumbai fiction often focuses on ambition, crime, migration, and the city’s relentless pace.',
    books: [
      {
        title: 'Sacred Games',
        author: 'Vikram Chandra',
        summary: 'A sprawling crime epic that maps Mumbai through gang networks, police work, politics, and private obsession.'
      },
      {
        title: 'Shantaram',
        author: 'Gregory David Roberts',
        summary: 'A fast-moving novel of exile and reinvention set against Mumbai’s underworld, streets, and informal communities.'
      },
      {
        title: 'Last Man in Tower',
        author: 'Aravind Adiga',
        summary: 'A sharp novel about redevelopment and moral pressure in Mumbai’s housing society culture.'
      }
    ]
  },
  {
    id: 'kerala',
    name: 'Ayemenem',
    state: 'Kerala',
    x: 172,
    y: 314,
    description: 'Kerala settings often carry lush sensory detail alongside caste, family, and political tension.',
    books: [
      {
        title: 'The God of Small Things',
        author: 'Arundhati Roy',
        summary: 'A deeply atmospheric family novel set in Kerala, where love, caste, and childhood memory shape tragedy.'
      }
    ]
  },
  {
    id: 'mysuru',
    name: 'Malgudi / Mysuru region',
    state: 'Karnataka',
    x: 162,
    y: 270,
    description: 'Though fictional, Malgudi is widely associated with South Indian small-town life and often linked to the Mysuru region.',
    books: [
      {
        title: 'Malgudi Days',
        author: 'R. K. Narayan',
        summary: 'A classic story cycle that builds a vivid small-town world through ordinary lives, humor, and gentle irony.'
      },
      {
        title: 'The Guide',
        author: 'R. K. Narayan',
        summary: 'A novel of performance, reinvention, and faith unfolding in the wider imaginative world associated with Malgudi.'
      }
    ]
  },
  {
    id: 'kashmir',
    name: 'Srinagar / Kashmir',
    state: 'Jammu and Kashmir',
    x: 144,
    y: 48,
    description: 'Kashmir fiction often carries beauty and conflict together, treating landscape as inseparable from history.',
    books: [
      {
        title: 'The Collaborator',
        author: 'Mirza Waheed',
        summary: 'A stark coming-of-age novel about fear, violence, and compromised survival in conflict-ridden Kashmir.'
      },
      {
        title: 'Shalimar the Clown',
        author: 'Salman Rushdie',
        summary: 'A tragic, wide-ranging novel that begins in Kashmir and ties intimate betrayal to political upheaval.'
      }
    ]
  }
];
