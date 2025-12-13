import {Link, useNavigate, useParams} from "react-router";
import {useEffect, useState} from "react";
import {usePuterStore} from "~/lib/puter";
import Summary from "~/components/Summary";
import ATS from "~/components/ATS";
import Details from "~/components/Details";
import {normalizeAtsScore} from "~/lib/utils";
import {prepareInstructions} from "../../constants";

export const meta = () => ([
    { title: 'IntelliHire | Review' },
    { name: 'description', content: 'Detailed overview of your resume' },
])

const Resume = () => {
    const { auth, isLoading, fs, kv, ai } = usePuterStore();
    const { id } = useParams();
    const [imageUrl, setImageUrl] = useState('');
    const [resumeUrl, setResumeUrl] = useState('');
    const [feedback, setFeedback] = useState<Feedback | null>(null);
    const [resumeData, setResumeData] = useState<Resume | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isReanalyzing, setIsReanalyzing] = useState(false);
    const [editForm, setEditForm] = useState({ companyName: '', jobTitle: '', jobDescription: '' });
    const navigate = useNavigate();

    useEffect(() => {
        if(!isLoading && !auth.isAuthenticated) navigate(`/auth?next=/resume/${id}`);
    }, [isLoading])

    useEffect(() => {
        const loadResume = async () => {
            const resume = await kv.get(`resume:${id}`);

            if(!resume) {
                navigate('/');
                return;
            }

            const data = JSON.parse(resume) as Resume;
            
            // Add default dates for old resumes
            if (!data.createdAt) {
                data.createdAt = new Date().toISOString();
            }
            if (!data.updatedAt) {
                data.updatedAt = data.createdAt;
            }

            setResumeData(data);
            setEditForm({
                companyName: data.companyName || '',
                jobTitle: data.jobTitle || '',
                jobDescription: data.jobDescription || '',
            });

            const resumeBlob = await fs.read(data.resumePath);
            if(!resumeBlob) return;

            const pdfBlob = new Blob([resumeBlob], { type: 'application/pdf' });
            const resumeUrl = URL.createObjectURL(pdfBlob);
            setResumeUrl(resumeUrl);

            const imageBlob = await fs.read(data.imagePath);
            if(!imageBlob) return;
            const imageUrl = URL.createObjectURL(imageBlob);
            setImageUrl(imageUrl);

            setFeedback(data.feedback);
        }

        loadResume();
    }, [id]);

    const handleSaveEdit = async () => {
        if (!resumeData) return;

        const updatedData = {
            ...resumeData,
            companyName: editForm.companyName,
            jobTitle: editForm.jobTitle,
            jobDescription: editForm.jobDescription,
            updatedAt: new Date().toISOString(),
        };

        await kv.set(`resume:${id}`, JSON.stringify(updatedData));
        setResumeData(updatedData);
        setIsEditing(false);
    };

    const handleReanalyze = async () => {
        if (!resumeData) return;

        setIsReanalyzing(true);
        try {
            const feedback = await ai.feedback(
                resumeData.resumePath,
                prepareInstructions({ 
                    jobTitle: editForm.jobTitle || resumeData.jobTitle || '', 
                    jobDescription: editForm.jobDescription || resumeData.jobDescription || '' 
                })
            );

            if (!feedback) {
                alert('Failed to re-analyze resume');
                return;
            }

            const feedbackText = typeof feedback.message.content === 'string'
                ? feedback.message.content
                : feedback.message.content[0].text;

            const parsedFeedback = JSON.parse(feedbackText);
            const supportingScores = [
                parsedFeedback?.toneAndStyle?.score,
                parsedFeedback?.content?.score,
                parsedFeedback?.structure?.score,
                parsedFeedback?.skills?.score,
            ].filter((value: number | undefined) => typeof value === 'number');

            parsedFeedback.ATS.score = normalizeAtsScore(parsedFeedback.ATS.score, supportingScores as number[]);

            const updatedData = {
                ...resumeData,
                companyName: editForm.companyName,
                jobTitle: editForm.jobTitle,
                jobDescription: editForm.jobDescription,
                feedback: parsedFeedback,
                updatedAt: new Date().toISOString(),
            };

            await kv.set(`resume:${id}`, JSON.stringify(updatedData));
            setResumeData(updatedData);
            setFeedback(parsedFeedback);
            setIsEditing(false);
            setIsReanalyzing(false);
        } catch (error) {
            console.error('Re-analysis failed:', error);
            alert('Failed to re-analyze resume');
            setIsReanalyzing(false);
        }
    };

    const handleDelete = async () => {
        if (!resumeData || !confirm('Are you sure you want to delete this resume? This action cannot be undone.')) {
            return;
        }

        try {
            await fs.delete(resumeData.resumePath).catch(() => {});
            await fs.delete(resumeData.imagePath).catch(() => {});
            await kv.delete(`resume:${id}`);
            navigate('/');
        } catch (error) {
            console.error('Failed to delete resume:', error);
            alert('Failed to delete resume');
        }
    };

    const handleToggleSelection = async () => {
        if (!resumeData) return;

        const updated = {
            ...resumeData,
            isSelected: !resumeData.isSelected,
            updatedAt: new Date().toISOString(),
        };

        await kv.set(`resume:${id}`, JSON.stringify(updated));
        setResumeData(updated);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <main className="!pt-0">
            <nav className="resume-nav">
                <Link to="/" className="back-button">
                    <img src="/icons/back.svg" alt="logo" className="w-2.5 h-2.5" />
                    <span className="text-gray-800 text-sm font-semibold">Back to Homepage</span>
                </Link>
                <div className="flex gap-2">
                    {!isEditing ? (
                        <>
                            <button
                                onClick={handleToggleSelection}
                                className={resumeData?.isSelected 
                                    ? "px-4 py-2 rounded-full border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                                    : "primary-button"
                                }
                            >
                                {resumeData?.isSelected ? 'Remove from Selection' : 'Select Candidate'}
                            </button>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="secondary-button"
                            >
                                Edit Details
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-4 py-2 rounded-full border border-red-200 text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                            >
                                Delete
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => {
                                    setIsEditing(false);
                                    setEditForm({
                                        companyName: resumeData?.companyName || '',
                                        jobTitle: resumeData?.jobTitle || '',
                                        jobDescription: resumeData?.jobDescription || '',
                                    });
                                }}
                                className="secondary-button"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="primary-button"
                            >
                                Save Changes
                            </button>
                            <button
                                onClick={handleReanalyze}
                                disabled={isReanalyzing}
                                className="primary-button"
                            >
                                {isReanalyzing ? 'Re-analyzing...' : 'Save & Re-analyze'}
                            </button>
                        </>
                    )}
                </div>
            </nav>
            <div className="flex flex-row w-full max-lg:flex-col-reverse">
                <section className="feedback-section bg-[url('/images/bg-small.svg') bg-cover h-[100vh] sticky top-0 items-center justify-center">
                    {imageUrl && resumeUrl && (
                        <div className="animate-in fade-in duration-1000 gradient-border max-sm:m-0 h-[90%] max-wxl:h-fit w-fit">
                            <a href={resumeUrl} target="_blank" rel="noopener noreferrer">
                                <img
                                    src={imageUrl}
                                    className="w-full h-full object-contain rounded-2xl"
                                    title="resume"
                                />
                            </a>
                        </div>
                    )}
                </section>
                <section className="feedback-section">
                    <div className="flex flex-col gap-4 mb-6">
                        <h2 className="text-4xl !text-black font-bold">Resume Review</h2>
                        {resumeData && (
                            <div className="flex flex-col gap-2 text-sm text-gray-500">
                                {resumeData.createdAt && (
                                    <p>Created: {formatDate(resumeData.createdAt)}</p>
                                )}
                                {resumeData.updatedAt && resumeData.updatedAt !== resumeData.createdAt && (
                                    <p>Last updated: {formatDate(resumeData.updatedAt)}</p>
                                )}
                            </div>
                        )}
                    </div>

                    {isEditing ? (
                        <div className="glass-panel flex flex-col gap-4">
                            <h3 className="text-2xl font-bold">Edit Resume Details</h3>
                            <div className="form-div">
                                <label htmlFor="edit-company">Company Name</label>
                                <input
                                    type="text"
                                    id="edit-company"
                                    value={editForm.companyName}
                                    onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                                    placeholder="Company Name"
                                />
                            </div>
                            <div className="form-div">
                                <label htmlFor="edit-title">Job Title</label>
                                <input
                                    type="text"
                                    id="edit-title"
                                    value={editForm.jobTitle}
                                    onChange={(e) => setEditForm({ ...editForm, jobTitle: e.target.value })}
                                    placeholder="Job Title"
                                />
                            </div>
                            <div className="form-div">
                                <label htmlFor="edit-description">Job Description</label>
                                <textarea
                                    id="edit-description"
                                    rows={8}
                                    value={editForm.jobDescription}
                                    onChange={(e) => setEditForm({ ...editForm, jobDescription: e.target.value })}
                                    placeholder="Job Description"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setIsEditing(false);
                                        setEditForm({
                                            companyName: resumeData?.companyName || '',
                                            jobTitle: resumeData?.jobTitle || '',
                                            jobDescription: resumeData?.jobDescription || '',
                                        });
                                    }}
                                    className="secondary-button"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    className="primary-button"
                                >
                                    Save Changes
                                </button>
                                <button
                                    onClick={handleReanalyze}
                                    disabled={isReanalyzing}
                                    className="primary-button"
                                >
                                    {isReanalyzing ? 'Re-analyzing...' : 'Save & Re-analyze'}
                                </button>
                            </div>
                            {isReanalyzing && (
                                <div className="flex flex-col items-center gap-2">
                                    <img src="/images/resume-scan-2.gif" className="w-[200px]" />
                                    <p className="text-gray-500">Re-analyzing resume with updated job description...</p>
                                </div>
                            )}
                        </div>
                    ) : feedback ? (
                        <div className="flex flex-col gap-8 animate-in fade-in duration-1000">
                            <Summary feedback={feedback} />
                            <ATS score={feedback.ATS.score || 0} suggestions={feedback.ATS.tips || []} />
                            <Details feedback={feedback} />
                        </div>
                    ) : (
                        <img src="/images/resume-scan-2.gif" className="w-full" />
                    )}
                </section>
            </div>
        </main>
    )
}
export default Resume
