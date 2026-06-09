import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Search, 
  Filter, 
  RefreshCcw, 
  Plus, 
  MoreVertical, 
  Sparkles, 
  PauseCircle, 
  PlayCircle, 
  Trash2, 
  X,
  ExternalLink,
  Mail,
  ChevronRight,
  Clock,
  Code
} from 'lucide-react';
import { cn } from '@/src/lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';

interface Job {
  idx?: number;
  id: string;
  job_title: string;
  location: string;
  experience: string;
  visa?: string;
  skills: string; // Stored as comma-separated string in DB
  role_overview: string;
  raw_email: string;
  source?: string;
  created_at: string;
  status: 'active' | 'paused'; // UI state
  gmail_thread_id?: string;
  gmail_message_id?: string;
  _info?: string;
}

const mockJobs: Job[] = [
  {
    idx: 1,
    id: 'f89b0f6b-981b-4833-996d-a681d1ff74be',
    job_title: 'Sr. Power BI Developer',
    location: 'Austin',
    experience: '7+ years',
    visa: 'H4 EAD, USC',
    skills: 'Power BI development, SQL, Business Intelligence solutions, DAX, Power Query, ETL concepts, Azure Data Services, Snowflake, cloud analytics platforms, SSRS, SSIS, Microsoft BI tools, data governance, compliance standards',
    role_overview: 'Support an enterprise-wide data consolidation initiative for a leading Medical Device organization.',
    raw_email: 'Local to TX only\n\nRole: Sr. Power BI Developer\nLocation: Austin\nWork Type: Hybrid\nDuration: Contract\nVisa : H4 EAD , USC\nJob Summary\n\nWe are seeking an experienced Sr. Power BI Developer to support an\nenterprise-wide data consolidation initiative for a leading Medical Device\norganization.',
    source: 'gmail',
    created_at: '2026-05-12 06:25:44+00',
    status: 'active'
  },
  {
    id: '2',
    job_title: 'AWS Cloud Architect',
    location: 'Seattle',
    experience: '10+ years',
    visa: 'USC, GC',
    skills: 'AWS, Terraform, Kubernetes, Multi-Region Architecture, Cloud Security, Python, Jenkins, Ansible',
    role_overview: 'Lead the migration of legacy workloads to a serverless AWS environment for a FinTech giant.',
    raw_email: 'Seattle based. Urgent requirement for AWS Architect. Must have terraform and K8s expertise. 12 month contract.',
    created_at: '2026-05-11 09:12:00+00',
    status: 'active'
  },
  {
    id: '3',
    job_title: 'iOS Developer',
    location: 'Cupertino',
    experience: '4-6 years',
    skills: 'Swift, SwiftUI, Combine, XCTest, CoreData, Git, AVFoundation',
    role_overview: 'Build the next generation of video streaming features for a major social media platform.',
    raw_email: 'Looking for a Swift ninja. High experience in SwiftUI and Combine. Join our mobile team in CA.',
    created_at: '2026-05-10 14:30:00+00',
    status: 'active'
  },
  {
    id: '4',
    job_title: 'Cybersecurity Analyst',
    location: 'Washington D.C.',
    experience: '3+ years',
    visa: 'USC',
    skills: 'SIEM, Pentesting, SOC, CISSP, Wireshark, Threat Hunting, Network Security',
    role_overview: 'Monitor and respond to security threats for a government contractor specializing in defense.',
    raw_email: 'SOC Analyst needed in DC. Must have active clearance or be clearable. Lead shift monitoring.',
    created_at: '2026-05-09 11:00:00+00',
    status: 'active'
  },
  {
    id: '5',
    job_title: 'MLOps Engineer',
    location: 'Remote',
    experience: '5+ years',
    skills: 'PyTorch, MLflow, Docker, GCP Vertex AI, Kubernetes, Python, Feature Stores',
    role_overview: 'Bridge the gap between data science and production for an AI startup.',
    raw_email: 'Hey, need an MLOps pro to help us scale our inference pipelines on GCP. Python and K8s are musts.',
    created_at: '2026-05-08 16:45:00+00',
    status: 'paused'
  },
  {
    id: '6',
    job_title: 'Principal Product Designer',
    location: 'San Francisco',
    experience: '8+ years',
    skills: 'Figma, Design Systems, Prototyping, UX Research, Design Leadership',
    role_overview: 'Lead the design vision for our core B2B SaaS product.',
    raw_email: 'Sr. Product Designer - 100% remote or SF. Looking for heavy hitters who can own the entire design system.',
    created_at: '2026-05-07 10:20:00+00',
    status: 'active'
  },
  {
    id: '7',
    job_title: 'DevOps Lead',
    location: 'London',
    experience: '7+ years',
    skills: 'Azure, CI/CD, Terraform, Helm, Prometheus, Grafana, Shell Scripting',
    role_overview: 'Modernize the deployment pipeline for a high-frequency trading firm.',
    raw_email: 'London based HFT looking for a DevOps Lead. Azure focus. High performance environments.',
    created_at: '2026-05-06 08:30:00+00',
    status: 'active'
  },
  {
    id: '8',
    job_title: 'Full Stack Developer',
    location: 'Berlin',
    experience: '4+ years',
    skills: 'React, Node.js, TypeScript, PostgreSQL, GraphQL, AWS',
    role_overview: 'Join a hyper-growth e-commerce startup building sustainable fashion platforms.',
    raw_email: 'Berlin startup. Fullstack React/Node. Join us early. Equity included.',
    created_at: '2026-05-05 13:15:00+00',
    status: 'active'
  },
  {
    id: '9',
    job_title: 'Data Engineer',
    location: 'Chicago',
    experience: '5+ years',
    skills: 'Spark, Airflow, Databricks, Python, Snowflake, SQL, ETL',
    role_overview: 'Build robust data pipelines to support large-scale analytics for a logistics company.',
    raw_email: 'Data Engineer - PySpark expertise needed. Migration to Databricks project.',
    created_at: '2026-05-04 15:40:00+00',
    status: 'active'
  },
  {
    id: '10',
    job_title: 'Android Developer',
    location: 'Mountain View',
    experience: '5+ years',
    skills: 'Kotlin, Compose, Coroutines, Dagger Hilt, MVVM, Room',
    role_overview: 'Develop core features for a global mapping application.',
    raw_email: 'Kotlin/Compose expert. Mountain View or NYC. Large scale app experience needed.',
    created_at: '2026-05-03 10:00:00+00',
    status: 'active'
  },
  {
    id: '11',
    job_title: 'Solutions Architect',
    location: 'Toronto',
    experience: '10+ years',
    skills: 'Java, Microservices, Spring Boot, Cloud Native, Kafka, DDD',
    role_overview: 'Design complex enterprise solutions for a major banking group.',
    raw_email: 'Architect needed for digital banking transformation. Java/Spring background preferred.',
    created_at: '2026-05-02 09:30:00+00',
    status: 'active'
  },
  {
    id: '12',
    job_title: 'AI Researcher',
    location: 'Boston',
    experience: '3+ years',
    skills: 'LLMs, Transformers, Python, RAG, Fine-tuning, Vector DBs, LangChain',
    role_overview: 'Research and implement cutting-edge LLM applications for healthcare data.',
    raw_email: 'PhD or strong MS in AI. Working on latest RAG techniques for medical records.',
    created_at: '2026-05-01 14:00:00+00',
    status: 'active'
  },
  {
    id: '13',
    job_title: 'Senior QA Automation',
    location: 'Remote',
    experience: '6+ years',
    skills: 'Playwright, Cypress, JavaScript, CI/CD, Selenium, API Testing',
    role_overview: 'Define the automation strategy for a leading project management tool.',
    raw_email: 'Playwright experts only. Full automation lead role. Join a distributed team.',
    created_at: '2026-04-30 11:45:00+00',
    status: 'active'
  },
  {
    id: '14',
    job_title: 'UX Researcher',
    location: 'New York',
    experience: '4+ years',
    skills: 'User Interviews, Usability Testing, Surveys, Quantitative Analysis, Persona Building',
    role_overview: 'Understand complex user behaviors in the travel and hospitality industry.',
    raw_email: 'Travel startup hiring UX Researcher. NYC based preferred but open to remote.',
    created_at: '2026-04-29 16:00:00+00',
    status: 'paused'
  },
  {
    id: '15',
    job_title: 'SRE Specialist',
    location: 'Dublin',
    experience: '5+ years',
    skills: 'GCP, Terraform, Monitoring, On-call, SRE Principles, Go, Linux Admin',
    role_overview: 'Maintain 99.99% availability for a global video conferencing platform.',
    raw_email: 'Dublin SRE team expansion. GCP focus. Looking for reliability engineers who code.',
    created_at: '2026-04-28 08:30:00+00',
    status: 'active'
  },
  {
    id: '16',
    job_title: 'Salesforce Developer',
    location: 'Hyderabad',
    experience: '6+ years',
    skills: 'Apex, LWC, Visualforce, Salesforce Flows, Integration APIs, Copado',
    role_overview: 'Customize and scale Salesforce for a multinational consulting firm.',
    raw_email: 'Looking for a Senior SFDC Dev. Expertise in LWC and Apex integrations. Remote work.',
    created_at: '2026-04-27 12:00:00+00',
    status: 'active'
  },
  {
    id: '17',
    job_title: 'Product Manager, AI',
    location: 'Palo Alto',
    experience: '5+ years',
    skills: 'Product Strategy, AI/ML Productization, Agile, Data-driven Decisions, GTM',
    role_overview: 'Own the roadmap for a new generative AI product line.',
    raw_email: 'PM for AI infra company. Needs strong technical background. Equity heavy comp.',
    created_at: '2026-04-26 10:40:00+00',
    status: 'active'
  },
  {
    id: '18',
    job_title: 'Embedded Systems Engineer',
    location: 'Munich',
    experience: '7+ years',
    skills: 'C/C++, RTOS, ARM, CAN bus, Linux Kernel, Firmware, Oscilloscopes',
    role_overview: 'Develop safety-critical firmware for next-gen autonomous vehicles.',
    raw_email: 'Automotive embedded role in Munich. C++ and RTOS expertise. English speaking role.',
    created_at: '2026-04-25 09:15:00+00',
    status: 'active'
  },
  {
    id: '19',
    job_title: 'PHP/Laravel Developer',
    location: 'Remote',
    experience: '4+ years',
    skills: 'PHP 8.2, Laravel, Vue.js, MySQL, Redis, AWS Lambda',
    role_overview: 'Maintain and scale a high-traffic SaaS platform for education.',
    raw_email: 'EdTech company looking for Laravel experts. Modern stack, high autonomy.',
    created_at: '2026-04-24 15:30:00+00',
    status: 'active'
  },
  {
    id: '20',
    job_title: 'Security Architect',
    location: 'Singapore',
    experience: '12+ years',
    visa: 'EP Eligible',
    skills: 'Cloud Security, Zero Trust, Compliance, ISO 27001, GRC, Team Lead',
    role_overview: 'Define the global security posture for a major fintech hub.',
    raw_email: 'Singapore based architect needed. Senior role, reporting to CISO. Financial sector.',
    created_at: '2026-04-23 11:20:00+00',
    status: 'active'
  },
  {
    id: '21',
    job_title: 'Unity Game Developer',
    location: 'Stockholm',
    experience: '5+ years',
    skills: 'C#, Unity 3D, Shaders, HLSL, Game Physics, AR/VR, Mobile Optimization',
    role_overview: 'Create immersive AR experiences for a world-famous toy brand.',
    raw_email: 'Unity dev for AR project. Shaders and perf optimization skills. Stockholm studio.',
    created_at: '2026-04-22 14:45:00+00',
    status: 'active'
  },
  {
    id: '22',
    job_title: 'Frontend Lead',
    location: 'Amsterdam',
    experience: '8+ years',
    skills: 'React, Next.js, TurboRepo, Performance, Micro-frontends, Tailwind',
    role_overview: 'Lead the frontend architecture for an international flight booking site.',
    raw_email: 'Lead Frontend - Amsterdam HQ. Performance focus, Next.js tech stack.',
    created_at: '2026-04-21 08:00:00+00',
    status: 'active'
  },
  {
    id: '23',
    job_title: 'Big Data Architect',
    location: 'New Jersey',
    experience: '10+ years',
    visa: 'H1B, USC',
    skills: 'Hadoop, Spark, Cassandra, Hive, Presto, Kubernetes, Java',
    role_overview: 'Design enterprise-level big data platforms for a telecommunications leader.',
    raw_email: 'Architecture role in NJ. Massive datasets. Core platform team hiring.',
    created_at: '2026-04-20 16:30:00+00',
    status: 'active'
  },
  {
    id: '24',
    job_title: 'Marketing Manager',
    location: 'Remote',
    experience: '5+ years',
    skills: 'B2B Marketing, Lead Gen, Content Strategy, SEO, Analytics, CRM',
    role_overview: 'Drive growth and user acquisition for a developer tools company.',
    raw_email: 'Startup hiring first Marketing Manager. Growth focused. Must love dev tools.',
    created_at: '2026-04-19 10:00:00+00',
    status: 'active'
  },
  {
    id: '25',
    job_title: 'Machine Learning Engineer',
    location: 'Tel Aviv',
    experience: '4+ years',
    skills: 'TensorFlow, Scikit-learn, Python, Computer Vision, CNN, OpenCV',
    role_overview: 'Develop visual recognition models for an agricultural tech startup.',
    raw_email: 'CV experts. Python/Deep Learning. Join a fast-paced Israeli startup.',
    created_at: '2026-04-18 09:40:00+00',
    status: 'active'
  },
  {
    idx: 26,
    id: 'job-26',
    job_title: 'Shopify Plus Developer',
    location: 'Remote',
    experience: '3+ years',
    skills: 'Liquid, JavaScript, Shopify APIs, GraphQL, Theme Kit, Slate',
    role_overview: 'Build custom themes and apps for high-volume e-commerce brands.',
    raw_email: 'E-commerce agency needs Shopify expert. Custom apps and theme builds.',
    created_at: '2026-04-17 13:20:00',
    status: 'active'
  },
  {
    id: 'job-27',
    job_title: 'Golang Backend Dev',
    location: 'Zürich',
    experience: '5+ years',
    skills: 'Go, gRPC, Protobuf, PostgreSQL, Kubernetes, Redis',
    role_overview: 'Develop high-performance microservices for a private banking cloud.',
    raw_email: 'Go developer in Zurich. Banking project. English speaking. Great benefits.',
    created_at: '2026-04-16 11:15:00',
    status: 'active'
  },
  {
    id: 'job-28',
    job_title: 'Head of Recruiting',
    location: 'San Francisco',
    experience: '12+ years',
    skills: 'Talent Strategy, Executive Search, Team Leadership, ATS, Employer Branding',
    role_overview: 'Scale a unicorn startup from 200 to 1000 employees globally.',
    raw_email: 'Executive hire: Head of Talent. Series C startup. Must have scaled fast.',
    created_at: '2026-04-15 08:30:00',
    status: 'active'
  },
  {
    id: 'job-29',
    job_title: 'Network Engineer',
    location: 'Dallas',
    experience: '6+ years',
    visa: 'H1B, USC, GC',
    skills: 'Cisco CCNA/CCNP, BGP, OSPF, VPN, Network Automation, Python',
    role_overview: 'Manage enterprise-level networking for a global data center provider.',
    raw_email: 'Dallas based network engineer. Cisco certified. Automation experience plus.',
    created_at: '2026-04-14 15:45:00',
    status: 'active'
  },
  {
    id: 'job-30',
    job_title: 'Senior Data Scientist',
    location: 'London',
    experience: '6+ years',
    skills: 'Stats, Bayesian Inference, Python, SQL, Experimentation, Tableau',
    role_overview: 'Optimize clinical trials through advanced statistical modeling.',
    raw_email: 'MedTech London. Data Science role. PhD preferred. Focus on experimentation.',
    created_at: '2026-04-13 10:20:00',
    status: 'active'
  },
  {
    id: 'job-31',
    job_title: 'Content Designer',
    location: 'Remote',
    experience: '4+ years',
    skills: 'UX Writing, Strategy, Content Systems, Product Design collab, Research',
    role_overview: 'Shape the voice and tone of a new mental health mobile application.',
    raw_email: 'Startup hiring UX writer/content designer. Empathy-led design focus.',
    created_at: '2026-04-12 14:00:00',
    status: 'active'
  },
  {
    id: 'job-32',
    job_title: 'Scrum Master',
    location: 'Toronto',
    experience: '8+ years',
    skills: 'Agile, Scrum, Kanban, Jira, Facilitation, Coaching, Stakeholder Management',
    role_overview: 'Drive agile maturity for multiple squads in a digital retail company.',
    raw_email: 'Experienced Scrum Master for retail tech. 3 squads. Toronto/Hybrid.',
    created_at: '2026-04-11 09:30:00',
    status: 'active'
  },
  {
    id: 'job-33',
    job_title: 'Financial Analyst',
    location: 'New York',
    experience: '3+ years',
    skills: 'Financial Modeling, Excel, SQL, FP&A, Valuation, Tableau',
    role_overview: 'Support the FP&A team of a global investment firm.',
    raw_email: 'NYC Finance role. Junior to mid-level. Strong modeling skills needed.',
    created_at: '2026-04-10 11:45:00',
    status: 'active'
  },
  {
    id: 'job-34',
    job_title: 'Blockchain Developer',
    location: 'Remote',
    experience: '5+ years',
    skills: 'Solidity, Ethereum, Web3.js, Rust, Smart Contracts, Security Audits',
    role_overview: 'Build secure DeFi protocols for a decentralized lending platform.',
    raw_email: 'Web3 developer. Solidity and Rust. High security standards. Token equity.',
    created_at: '2026-04-09 16:20:00',
    status: 'active'
  },
  {
    id: 'job-35',
    job_title: 'Flutter Developer',
    location: 'Dubai',
    experience: '4+ years',
    skills: 'Dart, Flutter, Provider, BLoC, GraphQL, Firebase, Mobile UI',
    role_overview: 'Build high-performance super-apps for a Middle Eastern retail giant.',
    raw_email: 'Dubai based Flutter role. Relocation provided. Leading e-commerce firm.',
    created_at: '2026-04-08 12:15:00',
    status: 'active'
  },
  {
    id: 'job-36',
    job_title: 'Legal Counsel, Tech',
    location: 'San Francisco',
    experience: '7+ years',
    skills: 'Commercial Law, SaaS Agreements, GDPR, IP Law, Negotiation',
    role_overview: 'Handle commercial contracts and global privacy for a Sequoia-backed SaaS.',
    raw_email: 'In-house legal role. SF based. Tech focus, privacy and contracts.',
    created_at: '2026-04-07 10:40:00',
    status: 'active'
  },
  {
    id: 'job-37',
    job_title: 'Database Administrator',
    location: 'Atlanta',
    experience: '8+ years',
    visa: 'USC, GC',
    skills: 'Oracle, PostgreSQL, Performance Tuning, Backup & Recovery, Automation',
    role_overview: 'Manage large-scale database clusters for a Fortune 500 company.',
    raw_email: 'DBA needed in ATL. Oracle to Postgres migration expertise desired.',
    created_at: '2026-04-06 09:15:00',
    status: 'active'
  },
  {
    id: 'job-38',
    job_title: 'Customer Success Lead',
    location: 'London',
    experience: '6+ years',
    skills: 'CS Strategy, Churn Management, Upselling, CRM, Team Leadership',
    role_overview: 'Manage the high-touch customer segment for a martech company.',
    raw_email: 'CS lead role. London HQ. 20 high-value accounts. Bonus on retention.',
    created_at: '2026-04-05 15:30:00',
    status: 'active'
  },
  {
    id: 'job-39',
    job_title: 'System Architect',
    location: 'Munich',
    experience: '12+ years',
    skills: 'Embedded, Linux, Hardware/Software Co-design, Automotive Standards, Security',
    role_overview: 'Architect the complete infotainment system for a premium car maker.',
    raw_email: 'Sr. Architect - Infotainment. Munich. Automotive OS experience key.',
    created_at: '2026-04-04 11:20:00',
    status: 'active'
  },
  {
    id: 'job-40',
    job_title: 'Data Analyst',
    location: 'Remote',
    experience: '3+ years',
    skills: 'A/B Testing, SQL, Python, Mixpanel, Amplitude, Looker',
    role_overview: 'Analyze product features and user journeys for a social utility app.',
    raw_email: 'Product analyst. Mixpanel/SQL. Remote first. Join our growth squad.',
    created_at: '2026-04-03 14:45:00',
    status: 'active'
  },
  {
    id: 'job-41',
    job_title: 'C++ Engineer (Trading)',
    location: 'Chicago',
    experience: '7+ years',
    skills: 'C++20, Low Latency, Multithreading, Template Metaprogramming, Linux',
    role_overview: 'Optimize market data feed handlers for sub-microsecond latency.',
    raw_email: 'Chicago HFT recruiting. Expert C++ skills. Low latency infra team.',
    created_at: '2026-04-02 08:50:00',
    status: 'active'
  },
  {
    id: 'job-42',
    job_title: 'HR Business Partner',
    location: 'Paris',
    experience: '10+ years',
    skills: 'Employee Relations, Labor Law (FR), Organizational Change, Talent Dev',
    role_overview: 'Support the EMEA engineering leadership team on all people topics.',
    raw_email: 'Senior HRBP - Paris based. Tech sector experience. Scale-up background.',
    created_at: '2026-04-01 16:30:00',
    status: 'active'
  },
  {
    id: 'job-43',
    job_title: 'Rust Developer',
    location: 'Remote',
    experience: '4+ years',
    skills: 'Rust, Async, WASM, Tokio, Systems Programming, Cryptography',
    role_overview: 'Build high-performance core infrastructure for an open-source project.',
    raw_email: 'Rustaceans welcome. Core engine team. Focus on WASM and async RUST.',
    created_at: '2026-03-31 10:00:00',
    status: 'active'
  },
  {
    id: 'job-44',
    job_title: 'SEO Strategist',
    location: 'Sydney',
    experience: '5+ years',
    skills: 'Technical SEO, Content Strategy, Link Building, GSC, SEMRush',
    role_overview: 'Dominate organic search results for a global real estate platform.',
    raw_email: 'Sydney based SEO role. Large scale domain management. Analytics savvy.',
    created_at: '2026-03-30 09:40:00',
    status: 'active'
  },
  {
    id: 'job-45',
    job_title: 'VP of Engineering',
    location: 'Austin',
    experience: '15+ years',
    skills: 'Engineering Leadership, Scalability, Culture, Budgeting, Roadmaps',
    role_overview: 'Lead an engineering organization of 150+ during a major product pivot.',
    raw_email: 'Executive search: VP Eng. Austin. Must have managed directors and VPs.',
    created_at: '2026-03-29 13:20:00',
    status: 'active'
  },
  {
    id: 'job-46',
    job_title: 'Brand Designer',
    location: 'Berlin',
    experience: '6+ years',
    skills: 'Brand Identity, Typography, Illustration, Motion, Art Direction',
    role_overview: 'Redefine the visual identity for a popular european delivery service.',
    raw_email: 'Brand design role. Berlin studio. Portfolio must show strong identity work.',
    created_at: '2026-03-28 11:15:00',
    status: 'active'
  },
  {
    id: 'job-47',
    job_title: 'Cloud Security Eng',
    location: 'San Jose',
    experience: '8+ years',
    visa: 'USC, GC',
    skills: 'Prisma Cloud, Wiz, AWS Security, IAM, Terraform, Python',
    role_overview: 'Automate security controls across a multi-cloud environment.',
    raw_email: 'Cloud security automation role. Prisma/Wiz experience. 100% remote options.',
    created_at: '2026-03-27 08:30:00',
    status: 'active'
  },
  {
    id: 'job-48',
    job_title: 'React Native Dev',
    location: 'Remote',
    experience: '4+ years',
    skills: 'React Native, Expo, TypeScript, Redux, Native Bridges, Fastlane',
    role_overview: 'Bridge the web and mobile experience for a leading fintech application.',
    raw_email: 'RN developer - Expo and Native modules experience. Fintech project.',
    created_at: '2026-03-26 15:45:00',
    status: 'active'
  },
  {
    id: 'job-49',
    job_title: 'Technical Writer',
    location: 'San Francisco',
    experience: '5+ years',
    skills: 'API Docs, Markdown, Git, Technical Communication, Developer Experience',
    role_overview: 'Write the gold-standard documentation for a set of new web APIs.',
    raw_email: 'API Documentation expert. DX focus. Join a developer relations team.',
    created_at: '2026-03-25 10:20:00',
    status: 'active'
  },
  {
    id: 'job-50',
    job_title: 'Supply Chain Analyst',
    location: 'Shenzhen',
    experience: '6+ years',
    skills: 'Logistics, Planning, SQL, Inventory Management, Vendor Relations',
    role_overview: 'Optimize the component sourcing and assembly for a hardware startup.',
    raw_email: 'Supply chain pro in China. Sourcing and logistics optimization focus.',
    created_at: '2026-03-24 14:00:00',
    status: 'active'
  }
];

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'sent'>('all');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setJobs(data as Job[]);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.job_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'pending') return matchesSearch && job._info !== 'sent';
    if (statusFilter === 'sent') return matchesSearch && job._info === 'sent';
    return matchesSearch;
  });

  const navigate = useNavigate();

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      setJobs(jobs.map(job => 
        job.id === id ? { ...job, status: newStatus as 'active' | 'paused' } : job
      ));
    } catch (error) {
      console.error('Error toggling job status:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchJobs();
    setIsRefreshing(false);
  };

  return (
    <div className="space-y-6 relative overflow-x-hidden min-h-[calc(100vh-120px)]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">V Drive Jobs</h1>
          <p className="text-slate-500 text-sm font-medium">Pipeline for all active and paused talent requests.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleRefresh}
            className={cn(
              "p-2 bg-white border border-slate-200 text-slate-500 rounded-lg shadow-sm hover:bg-slate-50 transition-all active:scale-95",
              isRefreshing && "animate-spin"
            )}
          >
            <RefreshCcw className="w-4 h-4" />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">
            <Plus className="w-4 h-4" />
            Post New Job
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by job title or recruiter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              {(['all', 'pending', 'sent'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[10px] font-black font-medium tracking-tight transition-all",
                    statusFilter === s 
                      ? (s === 'sent' ? "bg-blue-600 text-white shadow-sm" : "bg-slate-900 text-white shadow-sm")
                      : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-auto flex-1">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              <tr>
                <th className="px-6 py-4">Job Title</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4">Required Skills</th>
                <th className="px-6 py-4">Experience</th>
                <th className="px-6 py-4 text-right">Created</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredJobs.map((job) => (
                <tr 
                  key={job.id} 
                  className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                  onClick={() => setSelectedJob(job)}
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors tracking-tight">{job.job_title}</span>
                      <span className="text-[10px] font-medium text-slate-400">{job.location} • {job.source || 'Direct'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded text-[10px] font-bold font-medium tracking-tight inline-flex items-center gap-1.5 shadow-sm border",
                      job._info === 'sent' ? "bg-blue-50 text-blue-700 border-blue-100" :
                      job.status === 'active' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                      "bg-slate-100 text-slate-500 border-slate-200"
                    )}>
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        job._info === 'sent' ? "bg-blue-500" : 
                        job.status === 'active' ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                      )} />
                      {job._info === 'sent' ? 'Sent' : job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {job.skills.split(',').slice(0, 3).map((skill, idx) => (
                        <span key={`${skill.trim()}-${idx}`} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">
                          {skill.trim()}
                        </span>
                      ))}
                      {job.skills.split(',').length > 3 && (
                        <span className="px-2 py-0.5 bg-slate-50 text-slate-400 rounded text-[10px] font-bold">
                          +{job.skills.split(',').length - 3} more
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-600">{job.experience}</td>
                  <td className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 tracking-tighter">
                    {job.created_at.split(' ')[0]}
                  </td>
                  <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2">
                       <button 
                        title="Match Candidates"
                        onClick={() => navigate('/smart-match', { state: { jobId: job.id } })}
                        className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => toggleStatus(job.id, job.status)}
                        className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors"
                        title={job.status === 'active' ? 'Pause Job' : 'Resume Job'}
                      >
                        {job.status === 'active' ? <PauseCircle className="w-4 h-4" /> : <PlayCircle className="w-4 h-4 text-emerald-500" />}
                      </button>
                      <button className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side Drawer Detail */}
      <AnimatePresence>
        {selectedJob && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedJob(null)}
              className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-xl bg-white shadow-2xl z-50 border-l border-slate-200 flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-xl">
                    <Briefcase className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">{selectedJob.job_title}</h2>
                    <p className="text-xs text-slate-500 font-medium">{selectedJob.location} • {selectedJob.visa || 'Any Visa'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedJob(null)}
                  className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-10 selection:bg-blue-100">
                <section>
                  <h3 className="text-[10px] font-bold text-slate-400 font-medium tracking-tight mb-4 flex items-center gap-2">
                    <ChevronRight className="w-3 h-3" />
                    Role Overview
                  </h3>
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 italic text-slate-700 leading-relaxed text-sm">
                    "{selectedJob.role_overview}"
                  </div>
                  <div className="mt-6 flex flex-wrap gap-2">
                    {selectedJob.skills.split(',').map((skill, idx) => (
                      <span key={`${skill.trim()}-${idx}`} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold flex items-center gap-2 border border-blue-100/50">
                        <Code className="w-3 h-3" />
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </section>

                <section>
                  <h3 className="text-[10px] font-bold text-slate-400 font-medium tracking-tight mb-4 flex items-center gap-2">
                    <Mail className="w-3 h-3" />
                    Internal Communication
                  </h3>
                  <div className="relative">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-200 rounded-full" />
                    <div className="ml-6 font-mono text-[11px] leading-relaxed text-slate-500 whitespace-pre-wrap bg-slate-50/50 p-4 rounded-xl border border-slate-100 shadow-inner">
                      {selectedJob.raw_email}
                    </div>
                  </div>
                </section>

                <section className="bg-slate-900 rounded-2xl p-6 text-white overflow-hidden relative group font-sans">
                  <Sparkles className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5 group-hover:scale-110 transition-transform duration-500" />
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-lg mb-1">V Drive Smart Match</h4>
                      <p className="text-slate-400 text-xs">Ready to scan 1,280 candidates for this role.</p>
                    </div>
                    <button 
                      onClick={() => navigate('/smart-match', { state: { jobId: selectedJob.id } })}
                      className="px-4 py-2 bg-white text-slate-900 rounded-lg text-xs font-black shadow-sm active:scale-95 transition-all"
                    >
                      RUN MATCH
                    </button>
                  </div>
                </section>
                
                <section className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 font-medium tracking-tight mb-1">System Status</p>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-sm font-bold text-slate-900">{(selectedJob.status || 'unknown').toUpperCase()}</span>
                    </div>
                  </div>
                  <div className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                    <p className="text-[10px] font-bold text-slate-400 font-medium tracking-tight mb-1">Created At</p>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-300" />
                      <span className="text-sm font-bold text-slate-900">{selectedJob.created_at.split(' ')[0]}</span>
                    </div>
                  </div>
                </section>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-4">
                <button className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-100 hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  View Public Posting
                </button>
                <button className="px-4 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
