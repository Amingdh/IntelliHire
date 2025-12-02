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

  useEffect(() => {
    const loadResumes = async () => {
      setLoadingResumes(true);

      const resumes = (await kv.list('resume:*', true)) as KVItem[];

      const parsedResumes = resumes?.map((resume) => (
          JSON.parse(resume.value) as Resume
      ))

      setResumes(parsedResumes || []);
      setLoadingResumes(false);
    }

    loadResumes()
  }, []);

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

    <section id="insights" className="main-section">
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
      {loadingResumes && (
          <div className="flex flex-col items-center justify-center">
            <img src="/images/resume-scan-2.gif" className="w-[200px]" />
          </div>
      )}

      {!loadingResumes && resumes.length > 0 && (
        <div className="resumes-section">
          {resumes.map((resume) => (
              <ResumeCard key={resume.id} resume={resume} />
          ))}
        </div>
      )}

      {!loadingResumes && resumes?.length === 0 && (
          <div className="flex flex-col items-center justify-center mt-10 gap-4">
            <Link to="/upload" className="primary-button w-fit text-xl font-semibold">
              Upload Resume
            </Link>
          </div>
      )}
    </section>
  </main>
}
