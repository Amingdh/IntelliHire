import {Link} from "react-router";
import ScoreCircle from "~/components/ScoreCircle";
import {useEffect, useState} from "react";
import {usePuterStore} from "~/lib/puter";

const ResumeCard = ({ resume: { id, companyName, jobTitle, feedback, imagePath } }: { resume: Resume }) => {
    const { fs } = usePuterStore();
    const [resumeUrl, setResumeUrl] = useState('');

    useEffect(() => {
        const loadResume = async () => {
            const blob = await fs.read(imagePath);
            if(!blob) return;
            let url = URL.createObjectURL(blob);
            setResumeUrl(url);
        }

        loadResume();
    }, [imagePath]);

    return (
        <Link to={`/resume/${id}`} className="resume-card animate-in fade-in duration-1000">
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
            </div>
            {resumeUrl && (
                <div className="resume-card__preview gradient-border animate-in fade-in duration-1000">
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
                <p className="stat-label">Latest ATS score</p>
                <span className="stat-value text-xl">{feedback.ATS.score}%</span>
            </div>
        </Link>
    )
}
export default ResumeCard
