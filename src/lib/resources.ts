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
    title: "Visual Studio Code",
    description: "The most popular code editor with rich extensions for Python, TypeScript, Docker, and AI tooling. Fully free.",
    tags: ["Editor", "Free", "Extensions"],
    url: "https://code.visualstudio.com",
    badge: "Recommended",
    badgeColor: "bg-emerald-100 text-emerald-700",
  },
  {
    title: "GitHub Copilot",
    description: "AI pair programmer that auto-completes code, writes tests, and explains functions. Free for students.",
    tags: ["AI", "Code Gen", "Free for Students"],
    url: "https://github.com/features/copilot",
    badge: "Free",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    title: "LangChain",
    description: "Framework for building LLM-powered applications with chains, agents, and memory. Supports Python and JavaScript.",
    tags: ["LLM", "Agents", "RAG"],
    url: "https://www.langchain.com",
    badge: "Popular",
    badgeColor: "bg-amber-100 text-amber-700",
  },
  {
    title: "FastAPI",
    description: "High-performance Python API framework with automatic OpenAPI docs. Ideal for ML model serving.",
    tags: ["Python", "API", "REST"],
    url: "https://fastapi.tiangolo.com",
    badge: "Recommended",
    badgeColor: "bg-emerald-100 text-emerald-700",
  },
];

export const learning: ResourceCard[] = [
  {
    title: "Fast.ai – Practical Deep Learning",
    description: "Top-down, practical deep learning course by Jeremy Howard. Build real models from day one. Completely free.",
    tags: ["Deep Learning", "Free", "Beginner-Friendly"],
    url: "https://course.fast.ai",
    badge: "Recommended",
    badgeColor: "bg-emerald-100 text-emerald-700",
  },
  {
    title: "Google ML Crash Course",
    description: "Free, self-paced ML fundamentals course from Google. Covers TensorFlow, linear models, and neural networks.",
    tags: ["ML", "Google", "Free"],
    url: "https://developers.google.com/machine-learning/crash-course",
    badge: "Free",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    title: "DeepLearning.AI Short Courses",
    description: "1–2 hour free courses on LangChain, RAG, prompt engineering, and fine-tuning by Andrew Ng.",
    tags: ["LLM", "RAG", "Free"],
    url: "https://www.deeplearning.ai/short-courses",
    badge: "Free",
    badgeColor: "bg-blue-100 text-blue-700",
  },
];

export const templates: ResourceCard[] = [
  {
    title: "Next.js AI Chatbot Starter",
    description: "Official Vercel AI SDK starter with streaming chat and multi-model support out of the box.",
    tags: ["Next.js", "AI", "TypeScript"],
    url: "https://github.com/vercel/ai-chatbot",
    badge: "Official",
    badgeColor: "bg-emerald-100 text-emerald-700",
  },
  {
    title: "FastAPI + React Full-Stack Template",
    description: "Full-stack template with FastAPI backend, React frontend, PostgreSQL, and Docker Compose. Ready to fork.",
    tags: ["Full Stack", "FastAPI", "React"],
    url: "https://github.com/tiangolo/full-stack-fastapi-template",
    badge: "Popular",
    badgeColor: "bg-amber-100 text-amber-700",
  },
  {
    title: "LangChain RAG Template",
    description: "Production-ready RAG template with vector store, ingestion pipeline, and query engine.",
    tags: ["RAG", "Python", "LangChain"],
    url: "https://github.com/langchain-ai/rag-app-template",
  },
];

export const cloud: ResourceCard[] = [
  {
    title: "Google Cloud – \$300 Free Credits",
    description: "New accounts receive \$300 in free credits valid for 90 days. Access Vertex AI, Cloud Run, and GKE.",
    tags: ["Cloud", "GPU", "Credits"],
    url: "https://cloud.google.com/free",
    badge: "Free",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    title: "Microsoft Azure for Students",
    description: "Free Azure credits for students — no credit card required. Includes VMs, storage, and Azure AI services.",
    tags: ["Cloud", "Students", "Free"],
    url: "https://azure.microsoft.com/en-in/free/students",
    badge: "Free",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    title: "Vercel – Frontend Hosting",
    description: "Deploy Next.js and React frontends instantly from GitHub. Free tier includes custom domains and serverless functions.",
    tags: ["Frontend", "Free", "Serverless"],
    url: "https://vercel.com",
    badge: "Free",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    title: "Railway – Instant Deployments",
    description: "Deploy backends, APIs, and databases in seconds. \$5 free monthly credits with no cold starts.",
    tags: ["Deploy", "Backend", "Free"],
    url: "https://railway.app",
    badge: "Recommended",
    badgeColor: "bg-emerald-100 text-emerald-700",
  },
];
