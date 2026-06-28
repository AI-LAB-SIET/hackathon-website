export interface ResourceCard {
  title: string;
  description: string;
  tags: string[];
  url: string;
  badge?: string;
  badgeColor?: string;
}

export const apis: ResourceCard[] = [
  {
    title: "Groq Cloud",
    description:
      "Ultra-fast inference for Llama 3, Mixtral, and Gemma models. Free tier includes 14,400 requests/day with millisecond latency.",
    tags: ["LLM", "Free Tier", "REST"],
    url: "https://console.groq.com",
    badge: "Recommended",
    badgeColor: "bg-emerald-100 text-emerald-700",
  },
  {
    title: "Google Gemini API",
    description:
      "Access Gemini 1.5 Flash and Pro for multimodal tasks — vision, audio, code, and text. 1M context window.",
    tags: ["Multimodal", "Free Tier", "Vision"],
    url: "https://aistudio.google.com",
    badge: "Free",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    title: "Hugging Face Inference API",
    description:
      "Serverless access to 200,000+ open-source models — BERT, Stable Diffusion, Whisper, and more.",
    tags: ["Open Source", "NLP", "Vision"],
    url: "https://huggingface.co/inference-api",
    badge: "Free",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    title: "Together AI",
    description:
      "Run open-source LLMs like Llama 3, Code Llama, and Mistral with fast inference and generous free credits.",
    tags: ["LLM", "Code Gen", "Credits"],
    url: "https://www.together.ai",
  },
  {
    title: "Cohere API",
    description:
      "Enterprise-grade NLP — embeddings, reranking, chat, and command models. Developer tier is free.",
    tags: ["Embeddings", "RAG", "NLP"],
    url: "https://dashboard.cohere.com",
    badge: "Free",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    title: "Replicate",
    description:
      "Deploy and run ML models via simple REST API. Stable Diffusion, ControlNet, Whisper, LLaVA, and thousands more.",
    tags: ["Image Gen", "Vision", "Audio"],
    url: "https://replicate.com",
  },
];

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

export const tools: ResourceCard[] = [
  {
    title: "Google Colab",
    description: "Browser-based Python notebooks with free compute for quick ML experiments.",
    tags: ["Notebook", "Python", "GPU"],
    url: "https://colab.research.google.com",
    badge: "Notebook",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    title: "GitHub",
    description: "Host repositories, collaborate as a team, and submit project source code.",
    tags: ["Git", "Collaboration", "Submission"],
    url: "https://github.com",
  },
];

export const learning: ResourceCard[] = [
  {
    title: "Fast.ai Practical Deep Learning",
    description: "Hands-on deep learning lessons for building useful AI systems quickly.",
    tags: ["Deep Learning", "Course"],
    url: "https://course.fast.ai",
  },
  {
    title: "Google Machine Learning Crash Course",
    description: "Short ML lessons covering core concepts, TensorFlow examples, and evaluation basics.",
    tags: ["ML Basics", "TensorFlow"],
    url: "https://developers.google.com/machine-learning/crash-course",
  },
];

export const templates: ResourceCard[] = [
  ...pptTemplates,
  {
    title: "Next.js Starter",
    description: "A production-friendly React framework starter for dashboards, web apps, and AI frontends.",
    tags: ["React", "Next.js", "Frontend"],
    url: "https://nextjs.org/docs/app/getting-started/installation",
  },
];

export const cloud: ResourceCard[] = [
  {
    title: "Vercel",
    description: "Deploy frontend apps and API routes quickly from GitHub repositories.",
    tags: ["Deploy", "Frontend", "Hosting"],
    url: "https://vercel.com",
  },
  {
    title: "Google Cloud Free Program",
    description: "Cloud credits and free-tier services for hosting, storage, and AI experiments.",
    tags: ["Cloud", "Credits", "Compute"],
    url: "https://cloud.google.com/free",
    badge: "Free Tier",
    badgeColor: "bg-amber-100 text-amber-700",
  },
];
