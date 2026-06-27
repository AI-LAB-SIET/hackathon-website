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

export const datasets: ResourceCard[] = [
  {
    title: "Kaggle Datasets",
    description:
      "Over 50,000 public datasets spanning healthcare, NLP, finance, and computer vision. Directly notebook-ready.",
    tags: ["All Domains", "CSV", "Images"],
    url: "https://www.kaggle.com/datasets",
    badge: "Massive",
    badgeColor: "bg-amber-100 text-amber-700",
  },
  {
    title: "Hugging Face Datasets",
    description:
      "100,000+ curated NLP, vision, and audio datasets. Load in one line with the `datasets` Python library.",
    tags: ["NLP", "Vision", "Audio"],
    url: "https://huggingface.co/datasets",
    badge: "Recommended",
    badgeColor: "bg-emerald-100 text-emerald-700",
  },
  {
    title: "Google Dataset Search",
    description:
      "Google's search engine for open datasets. Find publicly available datasets from universities, governments, and labs.",
    tags: ["Discovery", "All Domains"],
    url: "https://datasetsearch.research.google.com",
  },
  {
    title: "NIH Open Data",
    description:
      "Biomedical datasets for AI in Healthcare track — genomics, clinical trials, medical imaging, and more.",
    tags: ["Healthcare", "Genomics", "Imaging"],
    url: "https://www.nlm.nih.gov/NIHbmic/nih_data_sharing_repositories.html",
    badge: "Healthcare",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    title: "Open Buildings (Google)",
    description:
      "Open dataset of 1.8 billion building footprints for smart city and campus solutions.",
    tags: ["Geospatial", "Smart Campus"],
    url: "https://sites.research.google/open-buildings/",
  },
  {
    title: "UC Irvine ML Repository",
    description:
      "Classic benchmark datasets for machine learning — 650+ datasets covering regression, classification, and clustering.",
    tags: ["Benchmark", "Classic ML"],
    url: "https://archive.ics.uci.edu",
  },
];

export const tools: ResourceCard[] = [
  {
    title: "LangChain",
    description:
      "Framework for building LLM-powered applications — chains, agents, RAG pipelines, memory, and tool integrations.",
    tags: ["Python", "Agents", "RAG"],
    url: "https://python.langchain.com",
    badge: "Must Have",
    badgeColor: "bg-emerald-100 text-emerald-700",
  },
  {
    title: "LlamaIndex",
    description:
      "Data framework for connecting LLMs to external data sources. Excellent for document QA and knowledge graph agents.",
    tags: ["RAG", "Indexing", "Python"],
    url: "https://www.llamaindex.ai",
    badge: "Recommended",
    badgeColor: "bg-emerald-100 text-emerald-700",
  },
  {
    title: "Streamlit",
    description:
      "Turn Python scripts into shareable web apps in minutes. Perfect for quick AI demos and prototypes.",
    tags: ["Frontend", "Python", "Fast"],
    url: "https://streamlit.io",
  },
  {
    title: "FastAPI",
    description:
      "High-performance Python API framework. Ideal for building REST endpoints to expose your ML models.",
    tags: ["Backend", "REST", "Python"],
    url: "https://fastapi.tiangolo.com",
  },
  {
    title: "Weights & Biases",
    description:
      "ML experiment tracking, model versioning, and dataset management. Visualize training runs in real-time.",
    tags: ["MLOps", "Tracking", "Free"],
    url: "https://wandb.ai",
    badge: "Free for students",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    title: "Ollama",
    description:
      "Run Llama 3, Mistral, Phi-3, and more locally on your machine — no API key needed, full privacy.",
    tags: ["Local", "Open Source", "Privacy"],
    url: "https://ollama.ai",
  },
];

export const learning: ResourceCard[] = [
  {
    title: "fast.ai Practical Deep Learning",
    description:
      "World-class free deep learning course — top-down approach from building apps first to understanding theory.",
    tags: ["Course", "Deep Learning", "Free"],
    url: "https://course.fast.ai",
    badge: "Free",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    title: "Andrej Karpathy – Neural Networks",
    description:
      "From zero to building GPT from scratch. Best lecture series for understanding LLMs at the code level.",
    tags: ["Video", "LLM", "Fundamentals"],
    url: "https://www.youtube.com/playlist?list=PLAqhIrjkxbuWI23v9cThsA9GvCAUhRvKZ",
    badge: "Highly Rated",
    badgeColor: "bg-purple-100 text-purple-700",
  },
  {
    title: "Hugging Face NLP Course",
    description:
      "Official transformers, datasets, and tokenizers course from Hugging Face. Covers BERT, GPT, and fine-tuning.",
    tags: ["NLP", "Transformers", "Free"],
    url: "https://huggingface.co/learn/nlp-course",
    badge: "Free",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    title: "LangChain Docs & Cookbook",
    description:
      "Official LangChain documentation and cookbook with end-to-end examples for agents, RAG, and tool use.",
    tags: ["Agents", "RAG", "Docs"],
    url: "https://python.langchain.com/docs/tutorials/",
  },
  {
    title: "Papers With Code",
    description:
      "Browse the latest AI research papers alongside open-source implementations. Filter by task, dataset, and benchmark.",
    tags: ["Research", "SOTA", "Papers"],
    url: "https://paperswithcode.com",
  },
  {
    title: "Google ML Crash Course",
    description:
      "Google's free ML fundamentals course — covers linear models, neural nets, fairness, and TensorFlow basics.",
    tags: ["Course", "Fundamentals", "Free"],
    url: "https://developers.google.com/machine-learning/crash-course",
    badge: "Free",
    badgeColor: "bg-blue-100 text-blue-700",
  },
];

export const templates: ResourceCard[] = [
  {
    title: "RAG Pipeline Starter",
    description:
      "Complete Python template for a Retrieval Augmented Generation pipeline with LangChain, ChromaDB, and FastAPI backend.",
    tags: ["Python", "RAG", "LangChain"],
    url: "https://github.com/langchain-ai/rag-from-scratch",
    badge: "Starter Kit",
    badgeColor: "bg-emerald-100 text-emerald-700",
  },
  {
    title: "AI Healthcare Dashboard",
    description:
      "Streamlit + Pandas template for a patient data analytics dashboard with FHIR-compatible data ingestion.",
    tags: ["Healthcare", "Streamlit", "Dashboard"],
    url: "https://github.com/streamlit/demo-medical-imaging",
  },
  {
    title: "Multi-Agent Framework",
    description:
      "LangGraph-powered multi-agent template with supervisor, research, and executor agents. Ready to extend.",
    tags: ["Agents", "LangGraph", "Python"],
    url: "https://github.com/langchain-ai/langgraph",
    badge: "Recommended",
    badgeColor: "bg-emerald-100 text-emerald-700",
  },
  {
    title: "Next.js AI Chat App",
    description:
      "Full-stack AI chatbot with streaming responses using Vercel AI SDK, Next.js 14, and Tailwind CSS.",
    tags: ["Next.js", "Full Stack", "Chat"],
    url: "https://github.com/vercel/ai-chatbot",
  },
  {
    title: "Whisper Transcription API",
    description:
      "FastAPI + OpenAI Whisper template for real-time audio transcription and speaker diarization.",
    tags: ["Audio", "FastAPI", "Speech"],
    url: "https://github.com/openai/whisper",
  },
  {
    title: "Vector DB + Embeddings",
    description:
      "Starter for semantic search using sentence-transformers, Qdrant vector database, and a simple REST endpoint.",
    tags: ["Embeddings", "Search", "Qdrant"],
    url: "https://github.com/qdrant/qdrant",
  },
];

export const cloud: ResourceCard[] = [
  {
    title: "Google Cloud for Startups",
    description:
      "Up to $2,000 in free Google Cloud credits for students. Access to Vertex AI, BigQuery, and TPU compute.",
    tags: ["GCP", "$2K Credits", "Vertex AI"],
    url: "https://cloud.google.com/free",
    badge: "$2,000",
    badgeColor: "bg-emerald-100 text-emerald-700",
  },
  {
    title: "GitHub Education Pack",
    description:
      "Free GitHub Pro, Copilot, Azure credits, Heroku, MongoDB Atlas, and 100+ other developer tools for students.",
    tags: ["GitHub", "Copilot", "Azure"],
    url: "https://education.github.com/pack",
    badge: "Students Free",
    badgeColor: "bg-purple-100 text-purple-700",
  },
  {
    title: "AWS Educate",
    description:
      "Access AWS services without a credit card. Covers EC2, S3, SageMaker, and Bedrock for AI model hosting.",
    tags: ["AWS", "SageMaker", "Free"],
    url: "https://aws.amazon.com/education/awseducate/",
    badge: "Free",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    title: "Vercel",
    description:
      "Deploy Next.js, Python APIs, and static sites globally for free. Hobby tier includes edge functions and analytics.",
    tags: ["Deployment", "Serverless", "Free"],
    url: "https://vercel.com",
    badge: "Free Tier",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    title: "Railway",
    description:
      "Deploy containerized backends with zero-config. Supports Python, Node, Go — free $5 monthly credits.",
    tags: ["Containers", "Backend", "$5 Free"],
    url: "https://railway.app",
  },
  {
    title: "Hugging Face Spaces",
    description:
      "Host Gradio and Streamlit demos for free directly on Hugging Face. GPU-accelerated spaces available.",
    tags: ["Demo Hosting", "Gradio", "GPU"],
    url: "https://huggingface.co/spaces",
    badge: "Free",
    badgeColor: "bg-blue-100 text-blue-700",
  },
];
