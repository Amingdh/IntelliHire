import {Link, useNavigate} from "react-router";
import {useEffect, useState, useMemo} from "react";
import {usePuterStore} from "~/lib/puter";
import Navbar from "~/components/Navbar";
import ScoreCircle from "~/components/ScoreCircle";
import {prepareCandidateStrengthsInstructions} from "../../constants";

export const meta = () => ([
    { title: 'IntelliHire | Top Candidates' },
    { name: 'description', content: 'Compare and evaluate top candidates for your position' },
])

const Candidates = () => {
    const { auth, isLoading, kv, fs, ai } = usePuterStore();
    const navigate = useNavigate();
    const [selectedCandidates, setSelectedCandidates] = useState<Resume[]>([]);
    const [loadingCandidates, setLoadingCandidates] = useState(false);
    const [analyzingId, setAnalyzingId] = useState<string | null>(null);
    const [allResumes, setAllResumes] = useState<Resume[]>([]);

    useEffect(() => {
        if(!isLoading && !auth.isAuthenticated) navigate('/auth?next=/candidates');
    }, [isLoading, auth.isAuthenticated]);

    useEffect(() => {
        const loadCandidates = async () => {
            setLoadingCandidates(true);
            const resumes = (await kv.list('resume:*', true)) as KVItem[];
            const parsedResumes = resumes?.map((resume) => {
                const data = JSON.parse(resume.value) as Resume;
                if (!data.createdAt) {
                    data.createdAt = new Date().toISOString();
                    data.updatedAt = new Date().toISOString();
                }
                return data;
            }) || [];

            setAllResumes(parsedResumes);
            const selected = parsedResumes.filter(r => r.isSelected);
            setSelectedCandidates(selected);
            setLoadingCandidates(false);
        };

        loadCandidates();
    }, []);

    const handleAnalyzeStrengths = async (candidate: Resume) => {
        if (!candidate.jobTitle || !candidate.jobDescription) {
            alert('Job title and description are required to analyze candidate strengths');
            return;
        }

        setAnalyzingId(candidate.id);
        try {
            const response = await ai.feedback(
                candidate.resumePath,
                prepareCandidateStrengthsInstructions({
                    jobTitle: candidate.jobTitle,
                    jobDescription: candidate.jobDescription
                })
            );

            if (!response) {
                alert('Failed to analyze candidate strengths');
                return;
            }

            const responseText = typeof response.message.content === 'string'
                ? response.message.content
                : response.message.content[0].text;

            // Clean the response text (remove markdown code blocks if present)
            const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const parsed = JSON.parse(cleanedText);

            const updatedCandidate = {
                ...candidate,
                strengths: parsed.strengths || [],
                updatedAt: new Date().toISOString(),
            };

            await kv.set(`resume:${candidate.id}`, JSON.stringify(updatedCandidate));
            
            setSelectedCandidates(prev => 
                prev.map(c => c.id === candidate.id ? updatedCandidate : c)
            );
            setAllResumes(prev =>
                prev.map(c => c.id === candidate.id ? updatedCandidate : c)
            );
        } catch (error) {
            console.error('Failed to analyze strengths:', error);
            alert('Failed to analyze candidate strengths. Please try again.');
        } finally {
            setAnalyzingId(null);
        }
    };

    const handleToggleSelection = async (candidate: Resume) => {
        const updated = {
            ...candidate,
            isSelected: !candidate.isSelected,
            updatedAt: new Date().toISOString(),
        };

        await kv.set(`resume:${candidate.id}`, JSON.stringify(updated));
        
        if (updated.isSelected) {
            setSelectedCandidates(prev => [...prev, updated]);
        } else {
            setSelectedCandidates(prev => prev.filter(c => c.id !== candidate.id));
        }
        
        setAllResumes(prev =>
            prev.map(c => c.id === candidate.id ? updated : c)
        );
    };

    const averageScore = useMemo(() => {
        if (!selectedCandidates.length) return 0;
        const total = selectedCandidates.reduce(
            (sum, candidate) => sum + (candidate.feedback?.overallScore || 0),
            0
        );
        return Math.round(total / selectedCandidates.length);
    }, [selectedCandidates]);

    const topCandidates = useMemo(() => {
        return [...selectedCandidates].sort((a, b) => 
            (b.feedback?.overallScore || 0) - (a.feedback?.overallScore || 0)
        );
    }, [selectedCandidates]);

    return (
        <main className="page">
            <Navbar />

            <section className="hero">
                <div className="hero-copy">
                    <span className="hero-pill">AI Recruitment Agent</span>
                    <h1>Top Candidates Selection</h1>
                    <p className="subheading">
                        Review and compare your shortlisted candidates. Get AI-powered insights on each candidate's strengths.
                    </p>
                </div>
            </section>

            {loadingCandidates ? (
                <div className="flex flex-col items-center justify-center">
                    <img src="/images/resume-scan-2.gif" className="w-[200px]" />
                </div>
            ) : (
                <>
                    {selectedCandidates.length > 0 ? (
                        <>
                            <section className="main-section scroll-fade-in">
                                <div className="section-heading">
                                    <div>
                                        <p className="eyebrow">Selected Candidates</p>
                                        <h2 className="section-title">
                                            {selectedCandidates.length} Candidate{selectedCandidates.length !== 1 ? 's' : ''} Selected
                                        </h2>
                                        <p className="subheading">
                                            Average ATS Score: {averageScore}%
                                        </p>
                                    </div>
                                    <Link to="/" className="secondary-button w-fit">
                                        Browse All Resumes
                                    </Link>
                                </div>

                                <div className="candidates-grid animate-stagger">
                                    {topCandidates.map((candidate) => (
                                        <div key={candidate.id} className="candidate-card glass-panel">
                                            <div className="candidate-card-header">
                                                <div className="flex flex-col gap-2 flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="text-2xl font-bold text-black">
                                                            {candidate.candidateName || 'Candidate'}
                                                        </h3>
                                                        {candidate.isSelected && (
                                                            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                                                                Selected
                                                            </span>
                                                        )}
                                                    </div>
                                                    {candidate.companyName && (
                                                        <p className="text-lg text-gray-600">
                                                            {candidate.companyName} • {candidate.jobTitle}
                                                        </p>
                                                    )}
                                                    {candidate.candidateEmail && (
                                                        <p className="text-sm text-gray-500">
                                                            {candidate.candidateEmail}
                                                        </p>
                                                    )}
                                                </div>
                                                <ScoreCircle score={candidate.feedback?.overallScore || 0} />
                                            </div>

                                            <div className="candidate-scores">
                                                <div className="score-item">
                                                    <span className="score-label">ATS Score</span>
                                                    <span className="score-value">{candidate.feedback?.ATS.score || 0}%</span>
                                                </div>
                                                <div className="score-item">
                                                    <span className="score-label">Content</span>
                                                    <span className="score-value">{candidate.feedback?.content.score || 0}%</span>
                                                </div>
                                                <div className="score-item">
                                                    <span className="score-label">Skills</span>
                                                    <span className="score-value">{candidate.feedback?.skills.score || 0}%</span>
                                                </div>
                                            </div>

                                            {!candidate.strengths || candidate.strengths.length === 0 ? (
                                                <button
                                                    onClick={() => handleAnalyzeStrengths(candidate)}
                                                    disabled={analyzingId === candidate.id}
                                                    className="primary-button w-full mt-4"
                                                >
                                                    {analyzingId === candidate.id ? 'Analyzing...' : 'Analyze Strengths'}
                                                </button>
                                            ) : (
                                                <div className="candidate-strengths">
                                                    <h4 className="text-lg font-semibold mb-3">Key Strengths</h4>
                                                    {candidate.strengths.map((strength, idx) => (
                                                        <div key={idx} className="strength-category">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <h5 className="font-semibold text-gray-800">{strength.category}</h5>
                                                                <span className="text-sm font-medium text-indigo-600">
                                                                    {strength.score}/100
                                                                </span>
                                                            </div>
                                                            <ul className="strength-points">
                                                                {strength.points.map((point, pointIdx) => (
                                                                    <li key={pointIdx} className="flex items-start gap-2">
                                                                        <img src="/icons/check.svg" alt="check" className="w-4 h-4 mt-1 flex-shrink-0" />
                                                                        <span className="text-sm text-gray-700">{point}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    ))}
                                                    <button
                                                        onClick={() => handleAnalyzeStrengths(candidate)}
                                                        disabled={analyzingId === candidate.id}
                                                        className="secondary-button w-full mt-4"
                                                    >
                                                        {analyzingId === candidate.id ? 'Re-analyzing...' : 'Refresh Analysis'}
                                                    </button>
                                                </div>
                                            )}

                                            <div className="candidate-actions">
                                                <Link
                                                    to={`/resume/${candidate.id}`}
                                                    className="secondary-button flex-1 text-center"
                                                >
                                                    View Details
                                                </Link>
                                                <button
                                                    onClick={() => handleToggleSelection(candidate)}
                                                    className="px-4 py-2 rounded-full border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="main-section scroll-fade-in">
                                <div className="section-heading">
                                    <div>
                                        <p className="eyebrow">All Candidates</p>
                                        <h2 className="section-title">Browse All Resumes</h2>
                                        <p className="subheading">
                                            Select candidates to add them to your shortlist
                                        </p>
                                    </div>
                                </div>

                                <div className="candidates-grid animate-stagger">
                                    {allResumes
                                        .filter(r => !r.isSelected)
                                        .sort((a, b) => (b.feedback?.overallScore || 0) - (a.feedback?.overallScore || 0))
                                        .map((candidate) => (
                                            <div key={candidate.id} className="candidate-card glass-panel">
                                                <div className="candidate-card-header">
                                                    <div className="flex flex-col gap-2 flex-1">
                                                        <h3 className="text-xl font-bold text-black">
                                                            {candidate.candidateName || 'Candidate'}
                                                        </h3>
                                                        {candidate.companyName && (
                                                            <p className="text-sm text-gray-600">
                                                                {candidate.companyName} • {candidate.jobTitle}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <ScoreCircle score={candidate.feedback?.overallScore || 0} />
                                                </div>

                                                <div className="candidate-scores">
                                                    <div className="score-item">
                                                        <span className="score-label">ATS Score</span>
                                                        <span className="score-value">{candidate.feedback?.ATS.score || 0}%</span>
                                                    </div>
                                                </div>

                                                <div className="candidate-actions">
                                                    <Link
                                                        to={`/resume/${candidate.id}`}
                                                        className="secondary-button flex-1 text-center"
                                                    >
                                                        View Details
                                                    </Link>
                                                    <button
                                                        onClick={() => handleToggleSelection(candidate)}
                                                        className="primary-button"
                                                    >
                                                        Select
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </section>
                        </>
                    ) : (
                        <section className="main-section scroll-fade-in">
                            <div className="flex flex-col items-center justify-center gap-6 py-12">
                                <div className="text-center">
                                    <h2 className="text-3xl font-bold mb-2">No Candidates Selected</h2>
                                    <p className="text-gray-600 mb-6">
                                        Start by selecting candidates from your resume pool to build your shortlist.
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <Link to="/" className="primary-button">
                                        Browse Resumes
                                    </Link>
                                    <Link to="/upload" className="secondary-button">
                                        Upload Resume
                                    </Link>
                                </div>
                            </div>

                            {allResumes.length > 0 && (
                                <div className="mt-8">
                                    <div className="section-heading mb-6">
                                        <div>
                                            <p className="eyebrow">Available Candidates</p>
                                            <h2 className="section-title">All Resumes</h2>
                                            <p className="subheading">
                                                Select candidates to add them to your shortlist
                                            </p>
                                        </div>
                                    </div>

                                    <div className="candidates-grid animate-stagger">
                                        {allResumes
                                            .sort((a, b) => (b.feedback?.overallScore || 0) - (a.feedback?.overallScore || 0))
                                            .map((candidate) => (
                                                <div key={candidate.id} className="candidate-card glass-panel">
                                                    <div className="candidate-card-header">
                                                        <div className="flex flex-col gap-2 flex-1">
                                                            <h3 className="text-xl font-bold text-black">
                                                                {candidate.candidateName || 'Candidate'}
                                                            </h3>
                                                            {candidate.companyName && (
                                                                <p className="text-sm text-gray-600">
                                                                    {candidate.companyName} • {candidate.jobTitle}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <ScoreCircle score={candidate.feedback?.overallScore || 0} />
                                                    </div>

                                                    <div className="candidate-scores">
                                                        <div className="score-item">
                                                            <span className="score-label">ATS Score</span>
                                                            <span className="score-value">{candidate.feedback?.ATS.score || 0}%</span>
                                                        </div>
                                                    </div>

                                                    <div className="candidate-actions">
                                                        <Link
                                                            to={`/resume/${candidate.id}`}
                                                            className="secondary-button flex-1 text-center"
                                                        >
                                                            View Details
                                                        </Link>
                                                        <button
                                                            onClick={() => handleToggleSelection(candidate)}
                                                            className="primary-button"
                                                        >
                                                            Select
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                </div>
                            )}
                        </section>
                    )}
                </>
            )}
        </main>
    );
};

export default Candidates;

