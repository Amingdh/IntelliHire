import {type FormEvent, useState} from 'react'
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import {usePuterStore} from "~/lib/puter";
import {useNavigate} from "react-router";
import {convertPdfToImage} from "~/lib/pdf2img";
import {generateUUID, normalizeAtsScore} from "~/lib/utils";
import {prepareInstructions} from "../../constants";

const Upload = () => {
    const { auth, isLoading, fs, ai, kv } = usePuterStore();
    const navigate = useNavigate();
    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const handleFileSelect = (file: File | null) => {
        setFile(file)
    }

    const handleAnalyze = async ({ companyName, jobTitle, jobDescription, file }: { companyName: string, jobTitle: string, jobDescription: string, file: File  }) => {
        setIsProcessing(true);

        setStatusText('Uploading the file...');
        const uploadedFile = await fs.upload([file]);
        if(!uploadedFile) return setStatusText('Error: Failed to upload file');

        setStatusText('Converting to image...');
        const imageFile = await convertPdfToImage(file);
        if(!imageFile.file) return setStatusText('Error: Failed to convert PDF to image');

        setStatusText('Uploading the image...');
        const uploadedImage = await fs.upload([imageFile.file]);
        if(!uploadedImage) return setStatusText('Error: Failed to upload image');

        setStatusText('Preparing data...');
        const uuid = generateUUID();
        const data = {
            id: uuid,
            resumePath: uploadedFile.path,
            imagePath: uploadedImage.path,
            companyName, jobTitle, jobDescription,
            feedback: '',
        }
        await kv.set(`resume:${uuid}`, JSON.stringify(data));

        setStatusText('Analyzing...');

        const feedback = await ai.feedback(
            uploadedFile.path,
            prepareInstructions({ jobTitle, jobDescription })
        )
        if (!feedback) return setStatusText('Error: Failed to analyze resume');

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

        data.feedback = parsedFeedback;
        await kv.set(`resume:${uuid}`, JSON.stringify(data));
        setStatusText('Analysis complete, redirecting...');
        console.log(data);
        navigate(`/resume/${uuid}`);
    }

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget.closest('form');
        if(!form) return;
        const formData = new FormData(form);

        const companyName = formData.get('company-name') as string;
        const jobTitle = formData.get('job-title') as string;
        const jobDescription = formData.get('job-description') as string;

        if(!file) return;

        handleAnalyze({ companyName, jobTitle, jobDescription, file });
    }

    return (
        <main className="page upload-page">
            <Navbar />

            <section className="upload-section">
                <div className="upload-grid">
                    <div className="upload-info glass-panel">
                        <span className="hero-pill">Guided workflow</span>
                        <h1>Smart feedback for your dream job</h1>
                        <p className="subheading">
                            Drop your resume, add the role you are targeting, and let IntelliHire surface ATS scores,
                            structured feedback, and actionable tweaks.
                        </p>
                        <ul className="upload-checklist">
                            <li>
                                <img src="/icons/check.svg" alt="check" />
                                Match resumes with specific job descriptions.
                            </li>
                            <li>
                                <img src="/icons/check.svg" alt="check" />
                                Preview your document and track every submission.
                            </li>
                            <li>
                                <img src="/icons/check.svg" alt="check" />
                                Get tone, content, structure, and skills breakdowns.
                            </li>
                        </ul>
                    </div>
                    <div className="upload-card glass-panel">
                        {isProcessing ? (
                            <div className="processing-state">
                                <h2>{statusText}</h2>
                                <img src="/images/resume-scan.gif" className="w-full" />
                            </div>
                        ) : (
                            <form id="upload-form" onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
                                <div className="form-div">
                                    <label htmlFor="company-name">Company Name</label>
                                    <input type="text" name="company-name" placeholder="Company Name" id="company-name" />
                                </div>
                                <div className="form-div">
                                    <label htmlFor="job-title">Job Title</label>
                                    <input type="text" name="job-title" placeholder="Job Title" id="job-title" />
                                </div>
                                <div className="form-div">
                                    <label htmlFor="job-description">Job Description</label>
                                    <textarea rows={5} name="job-description" placeholder="Job Description" id="job-description" />
                                </div>

                                <div className="form-div">
                                    <label htmlFor="uploader">Upload Resume</label>
                                    <FileUploader onFileSelect={handleFileSelect} />
                                </div>

                                <button className="primary-button" type="submit">
                                    Analyze Resume
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </section>
        </main>
    )
}
export default Upload
