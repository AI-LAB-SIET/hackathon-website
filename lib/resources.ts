export interface ResourceCard {
  title: string;
  description: string;
  tags: string[];
  url: string;
  badge?: string;
  badgeColor?: string;
}

export const pptTemplates: ResourceCard[] = [
  {
    title: "Official AI Hackathon 2026 Pitch Deck",
    description:
      "The official presentation template for the AI Hackathon. Use this to prepare your final 5-minute prototype presentation.",
    tags: ["Google Slides", "Pitch Deck", "Official"],
    url: "https://docs.google.com/presentation/d/1yKqH7lhY8p3cKk_aNnO_PjK6k1q_y-xO/copy",
    badge: "Official",
    badgeColor: "bg-emerald-100 text-emerald-700",
  },
  {
    title: "PowerPoint Pitch Deck Template (PPTX)",
    description:
      "Offline PowerPoint template format structured around problem definition, system architecture, core AI models, and demos.",
    tags: ["PPTX", "Download", "Presentation"],
    url: "https://assets.office.com/templates/en-us/standard-presentation.potx",
    badge: "Download",
    badgeColor: "bg-blue-100 text-blue-700",
  },
];

export const datasets: ResourceCard[] = [
  {
    title: "Kaggle Datasets Hub",
    description:
      "Over 50,000 public datasets spanning healthcare, NLP, computer vision, and city planning. Ideal for fast model training.",
    tags: ["All Domains", "CSV", "Images"],
    url: "https://www.kaggle.com/datasets",
    badge: "Massive",
    badgeColor: "bg-amber-100 text-amber-700",
  },
  {
    title: "Hugging Face Datasets",
    description:
      "100,000+ curated NLP, audio, and computer vision datasets. Can be loaded instantly in Python using the datasets library.",
    tags: ["NLP", "Vision", "Audio"],
    url: "https://huggingface.co/datasets",
    badge: "Recommended",
    badgeColor: "bg-emerald-100 text-emerald-700",
  },
  {
    title: "Google Dataset Search",
    description:
      "Google's search engine for open-source datasets. Find scientific datasets from researchers and global labs.",
    tags: ["Discovery", "All Domains"],
    url: "https://datasetsearch.research.google.com",
  },
  {
    title: "NIH Biomedical Image Data",
    description:
      "Large-scale medical imaging databases, clinical trial records, and genomics datasets for healthcare AI projects.",
    tags: ["Healthcare", "Imaging", "Genomics"],
    url: "https://www.nlm.nih.gov/NIHbmic/nih_data_sharing_repositories.html",
    badge: "Healthcare",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    title: "Google Open Buildings Dataset",
    description:
      "A massive geospatial datasetcontaining 1.8 billion building footprints, perfect for smart infrastructure tracking.",
    tags: ["Geospatial", "Smart City"],
    url: "https://sites.research.google/open-buildings/",
  },
  {
    title: "UC Irvine Machine Learning Repository",
    description:
      "Classic benchmarks for ML. Includes 650+ tabular and time-series datasets for regression, clustering, and classification.",
    tags: ["Benchmark", "Classic ML"],
    url: "https://archive.ics.uci.edu",
  },
];
