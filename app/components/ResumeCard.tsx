import {Link} from "react-router";
import ScoreCircle from "~/components/ScoreCircle";
import {useEffect, useState} from "react";
import {usePuterStore} from "~/lib/puter";

interface ResumeCardProps {
    resume: Resume;
    onDelete?: () => void;
    onSelectionChange?: () => void;
}

const ResumeCard = ({ resume: { id, companyName, jobTitle, feedback, imagePath, createdAt, updatedAt, isSelected }, onDelete, onSelectionChange }: ResumeCardProps) => {
    const { fs, kv } = usePuterStore();
    const [resumeUrl, setResumeUrl] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isToggling, setIsToggling] = useState(false);

    useEffect(() => {
        const loadResume = async () => {
            const blob = await fs.read(imagePath);
            if(!blob) return;
            let url = URL.createObjectURL(blob);
            setResumeUrl(url);
        }

        loadResume();
    }, [imagePath]);

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!showDeleteConfirm) {
            setShowDeleteConfirm(true);
            return;
        }

        setIsDeleting(true);
        try {
            const resume = await kv.get(`resume:${id}`);
            if (resume) {
                const data = JSON.parse(resume);
                // Delete files
                await fs.delete(data.resumePath).catch(() => {});
                await fs.delete(data.imagePath).catch(() => {});
                // Delete from KV store
                await kv.delete(`resume:${id}`);
            }
            onDelete?.();
        } catch (error) {
            console.error('Failed to delete resume:', error);
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const handleToggleSelection = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        setIsToggling(true);
        try {
            const resume = await kv.get(`resume:${id}`);
            if (resume) {
                const data = JSON.parse(resume);
                const updated = {
                    ...data,
                    isSelected: !data.isSelected,
                    updatedAt: new Date().toISOString(),
                };
                await kv.set(`resume:${id}`, JSON.stringify(updated));
                onSelectionChange?.();
            }
        } catch (error) {
            console.error('Failed to toggle selection:', error);
        } finally {
            setIsToggling(false);
        }
    };

    return (
        <div className="resume-card scroll-fade-in relative">
            {onDelete && (
                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="absolute top-4 right-4 z-10 p-2 rounded-full bg-red-50 hover:bg-red-100 transition-colors"
                    title={showDeleteConfirm ? "Confirm deletion" : "Delete resume"}
                >
                    {isDeleting ? (
                        <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    ) : showDeleteConfirm ? (
                        <img src="/icons/check.svg" alt="confirm" className="w-5 h-5" />
                    ) : (
                        <img src="/icons/cross.svg" alt="delete" className="w-5 h-5" />
                    )}
                </button>
            )}
            {showDeleteConfirm && (
                <div className="absolute inset-0 bg-red-50/90 rounded-3xl flex items-center justify-center z-20 backdrop-blur-sm">
                    <div className="text-center p-4">
                        <p className="font-semibold text-red-700 mb-2">Delete this resume?</p>
                        <p className="text-sm text-gray-600 mb-3">This action cannot be undone.</p>
                        <div className="flex gap-2 justify-center">
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setShowDeleteConfirm(false);
                                }}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <Link to={`/resume/${id}`} className="block">
                <div className="resume-card-header">
                    <div className="flex flex-col gap-1">
                        <span className="eyebrow">Application</span>
                        {companyName && <h2 className="!text-black font-bold break-words">{companyName}</h2>}
                        {jobTitle && <h3 className="text-lg break-words text-gray-500">{jobTitle}</h3>}
                        {!companyName && !jobTitle && <h2 className="!text-black font-bold">Resume preview</h2>}
                    </div>
                    <div className="flex-shrink-0">
                        <ScoreCircle score={feedback.overallScore} />
                    </div>
                </div>
            <div className="resume-card__meta">
                {companyName && <span className="pill">{companyName}</span>}
                {jobTitle && <span className="pill pill--ghost">{jobTitle}</span>}
                {!companyName && !jobTitle && <span className="pill pill--ghost">General profile</span>}
                {isSelected && (
                    <span className="pill bg-green-100 text-green-700">
                        Selected
                    </span>
                )}
            </div>
            {resumeUrl && (
                <div className="resume-card__preview gradient-border scroll-fade-in">
                    <div className="w-full h-full">
                        <img
                            src={resumeUrl}
                            alt="resume"
                            className="w-full h-[320px] max-sm:h-[200px] object-cover object-top rounded-xl"
                        />
                    </div>
                </div>
            )}
                <div className="resume-card__foot">
                    <div className="flex flex-col gap-1">
                        <p className="stat-label">Latest ATS score</p>
                        <span className="stat-value text-xl">{feedback.ATS.score}%</span>
                    </div>
                    {updatedAt && (
                        <div className="flex flex-col items-end gap-1">
                            <p className="stat-label text-xs">Updated</p>
                            <p className="text-xs text-gray-500">{formatDate(updatedAt)}</p>
                        </div>
                    )}
                </div>
                <div className="flex gap-2 pt-2 border-t border-gray-200">
                    <button
                        onClick={handleToggleSelection}
                        disabled={isToggling}
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition-colors ${
                            isSelected
                                ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                        }`}
                    >
                        {isToggling ? '...' : isSelected ? 'Remove from Selection' : 'Select Candidate'}
                    </button>
                </div>
            </Link>
        </div>
    )
}
export default ResumeCard
