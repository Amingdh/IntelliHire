import type { Route } from "./+types/home";
import Navbar from "~/components/Navbar";
import ResumeCard from "~/components/ResumeCard";
import {usePuterStore} from "~/lib/puter";
import {Link, useNavigate} from "react-router";
import {useEffect, useMemo, useState} from "react";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "IntelliHire" },
    { name: "description", content: "Smart feedback for your dream job!" },
  ];
}

export default function Home() {
  const { auth, kv } = usePuterStore();
  const navigate = useNavigate();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loadingResumes, setLoadingResumes] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'company'>('date');
  const [scoreFilter, setScoreFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const hasResumes = resumes.length > 0;

  const formattedResumeCount = useMemo(
      () => resumes.length.toString().padStart(2, "0"),
      [resumes.length]
  );

  const averageScore = useMemo(() => {
    if (!resumes.length) return 0;
    const total = resumes.reduce(
        (sum, resume) => sum + (resume.feedback?.overallScore || 0),
        0
    );
    return Math.round(total / resumes.length);
  }, [resumes]);

  const heroSubtitle = hasResumes
      ? "Review your submissions, compare ATS scores, and understand which resume lands you interviews."
      : "Upload your first resume to unlock instant ATS scores, detailed feedback, and confident job applications.";

  useEffect(() => {
    if(!auth.isAuthenticated) navigate('/auth?next=/');
  }, [auth.isAuthenticated])

  const loadResumes = async () => {
    setLoadingResumes(true);

    const resumes = (await kv.list('resume:*', true)) as KVItem[];

    const parsedResumes = resumes?.map((resume) => {
      const data = JSON.parse(resume.value) as Resume;
      // Add default dates for old resumes without timestamps
      if (!data.createdAt) {
        data.createdAt = new Date().toISOString();
        data.updatedAt = new Date().toISOString();
      }
      return data;
    }) || [];

    setResumes(parsedResumes);
    setLoadingResumes(false);
  };

  useEffect(() => {
    loadResumes()
  }, []);

  const filteredAndSortedResumes = useMemo(() => {
    let filtered = [...resumes];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(resume => 
        resume.companyName?.toLowerCase().includes(query) ||
        resume.jobTitle?.toLowerCase().includes(query) ||
        resume.jobDescription?.toLowerCase().includes(query)
      );
    }

    // Score filter
    if (scoreFilter !== 'all') {
      filtered = filtered.filter(resume => {
        const score = resume.feedback?.overallScore || 0;
        if (scoreFilter === 'high') return score >= 80;
        if (scoreFilter === 'medium') return score >= 60 && score < 80;
        if (scoreFilter === 'low') return score < 60;
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
      }
      if (sortBy === 'score') {
        return (b.feedback?.overallScore || 0) - (a.feedback?.overallScore || 0);
      }
      if (sortBy === 'company') {
        return (a.companyName || '').localeCompare(b.companyName || '');
      }
      return 0;
    });

    return filtered;
  }, [resumes, searchQuery, sortBy, scoreFilter]);

  return <main className="page home-page">
    <Navbar />

    <section className="hero">
      <div className="hero-grid">
        <div className="hero-copy">
          <span className="hero-pill">AI ATS Copilot</span>
          <h1>Track Your Applications & Resume Ratings</h1>
          <p className="subheading">{heroSubtitle}</p>
          <div className="cta-group">
            <Link to="/upload" className="primary-button hero-cta">
              Upload Resume
            </Link>
            <a href="#insights" className="secondary-button">See resume insights</a>
          </div>
            <div className="hero-stats">
            <div className="stat-card glass-panel">
              <span className="stat-label">Active resumes</span>
              <p className="stat-value">{formattedResumeCount}</p>
              <p className="stat-helper">Tracked in workspace</p>
            </div>
            <div className="stat-card glass-panel">
              <span className="stat-label">Avg ATS score</span>
              <p className="stat-value">{averageScore}%</p>
              <p className="stat-helper">Across submissions</p>
            </div>
          </div>
        </div>
        <div className="hero-visual">
          <div className="hero-card glass-panel">
            <p className="eyebrow">What you get</p>
            <ul className="hero-checklist">
              <li>
                <span className="check-icon">
                  <img src="/icons/check.svg" alt="check" />
                </span>
                <div>
                  <p>Instant ATS diagnostics</p>
                  <small>See how each resume aligns with role requirements.</small>
                </div>
              </li>
              <li>
                <span className="check-icon">
                  <img src="/icons/check.svg" alt="check" />
                </span>
                <div>
                  <p>Actionable guidance</p>
                  <small>Targeted tips covering tone, structure, and skills.</small>
                </div>
              </li>
              <li>
                <span className="check-icon">
                  <img src="/icons/check.svg" alt="check" />
                </span>
                <div>
                  <p>Visual history</p>
                  <small>Preview every submission and compare versions.</small>
                </div>
              </li>
            </ul>
            <div className="hero-card-footer">
              <p className="stat-label">Ready to improve?</p>
              <p className="stat-value text-lg">Drop your resume to begin</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    {hasResumes && resumes.filter(r => r.isSelected).length > 0 && (
      <section className="main-section scroll-fade-in">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Top Candidates</p>
            <h2 className="section-title">Selected Candidates</h2>
            <p className="subheading">
              {resumes.filter(r => r.isSelected).length} candidate{resumes.filter(r => r.isSelected).length !== 1 ? 's' : ''} selected for review
            </p>
          </div>
          <Link to="/candidates" className="primary-button w-fit">
            View All Candidates
          </Link>
        </div>
        <div className="resumes-section animate-stagger">
          {resumes
            .filter(r => r.isSelected)
            .sort((a, b) => (b.feedback?.overallScore || 0) - (a.feedback?.overallScore || 0))
            .slice(0, 3)
            .map((resume) => (
              <ResumeCard 
                key={resume.id} 
                resume={resume}
                onDelete={() => {
                  setResumes(prev => prev.filter(r => r.id !== resume.id));
                }}
                onSelectionChange={loadResumes}
              />
            ))}
        </div>
      </section>
    )}

    <section id="insights" className="main-section scroll-fade-in">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Workspace</p>
          <h2 className="section-title">Resume insights</h2>
          <p className="subheading">
            {hasResumes
                ? "Review your submissions and check AI-powered feedback."
                : "No resumes found yet. Upload your first resume to get feedback."}
          </p>
        </div>
        <Link to="/upload" className="secondary-button w-fit">
          New upload
        </Link>
      </div>

      {hasResumes && (
        <div className="search-filters glass-panel w-full">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="flex-1 w-full md:w-auto">
              <input
                type="text"
                placeholder="Search by company, job title, or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex flex-row gap-3 items-center">
              <label className="text-sm text-dark-200 whitespace-nowrap">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'score' | 'company')}
                className="p-2 rounded-xl border border-gray-200 bg-white focus:outline-none"
              >
                <option value="date">Date</option>
                <option value="score">Score</option>
                <option value="company">Company</option>
              </select>
            </div>
            <div className="flex flex-row gap-3 items-center">
              <label className="text-sm text-dark-200 whitespace-nowrap">Filter:</label>
              <select
                value={scoreFilter}
                onChange={(e) => setScoreFilter(e.target.value as 'all' | 'high' | 'medium' | 'low')}
                className="p-2 rounded-xl border border-gray-200 bg-white focus:outline-none"
              >
                <option value="all">All Scores</option>
                <option value="high">High (80+)</option>
                <option value="medium">Medium (60-79)</option>
                <option value="low">Low (&lt;60)</option>
              </select>
            </div>
          </div>
          {filteredAndSortedResumes.length !== resumes.length && (
            <p className="text-sm text-gray-500 mt-2">
              Showing {filteredAndSortedResumes.length} of {resumes.length} resumes
            </p>
          )}
        </div>
      )}
      {loadingResumes && (
          <div className="flex flex-col items-center justify-center">
            <img src="/images/resume-scan-2.gif" className="w-[200px]" />
          </div>
      )}

      {!loadingResumes && filteredAndSortedResumes.length > 0 && (
        <div className="resumes-section animate-stagger">
          {filteredAndSortedResumes.map((resume) => (
              <ResumeCard 
                key={resume.id} 
                resume={resume}
                onDelete={() => {
                  setResumes(prev => prev.filter(r => r.id !== resume.id));
                }}
                onSelectionChange={() => {
                  loadResumes();
                }}
              />
          ))}
        </div>
      )}

      {!loadingResumes && hasResumes && filteredAndSortedResumes.length === 0 && (
        <div className="flex flex-col items-center justify-center mt-10 gap-4">
          <p className="text-gray-500">No resumes match your search criteria.</p>
          <button 
            onClick={() => {
              setSearchQuery('');
              setScoreFilter('all');
            }}
            className="secondary-button"
          >
            Clear Filters
          </button>
        </div>
      )}

      {!loadingResumes && resumes.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-10 gap-4">
            <Link to="/upload" className="primary-button w-fit text-xl font-semibold">
              Upload Resume
            </Link>
          </div>
      )}
    </section>
  </main>
}
