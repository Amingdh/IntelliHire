export const resumes: Resume[] = [
    {
        id: "1",
        companyName: "Google",
        jobTitle: "Frontend Developer",
        imagePath: "/images/resume_01.png",
        resumePath: "/resumes/resume-1.pdf",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        feedback: {
            overallScore: 85,
            ATS: {
                score: 90,
                tips: [],
            },
            toneAndStyle: {
                score: 90,
                tips: [],
            },
            content: {
                score: 90,
                tips: [],
            },
            structure: {
                score: 90,
                tips: [],
            },
            skills: {
                score: 90,
                tips: [],
            },
        },
    },
    {
        id: "2",
        companyName: "Microsoft",
        jobTitle: "Cloud Engineer",
        imagePath: "/images/resume_02.png",
        resumePath: "/resumes/resume-2.pdf",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        feedback: {
            overallScore: 55,
            ATS: {
                score: 90,
                tips: [],
            },
            toneAndStyle: {
                score: 90,
                tips: [],
            },
            content: {
                score: 90,
                tips: [],
            },
            structure: {
                score: 90,
                tips: [],
            },
            skills: {
                score: 90,
                tips: [],
            },
        },
    },
    {
        id: "3",
        companyName: "Apple",
        jobTitle: "iOS Developer",
        imagePath: "/images/resume_03.png",
        resumePath: "/resumes/resume-3.pdf",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        feedback: {
            overallScore: 75,
            ATS: {
                score: 90,
                tips: [],
            },
            toneAndStyle: {
                score: 90,
                tips: [],
            },
            content: {
                score: 90,
                tips: [],
            },
            structure: {
                score: 90,
                tips: [],
            },
            skills: {
                score: 90,
                tips: [],
            },
        },
    },
    {
        id: "4",
        companyName: "Google",
        jobTitle: "Frontend Developer",
        imagePath: "/images/resume_01.png",
        resumePath: "/resumes/resume-1.pdf",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        feedback: {
            overallScore: 85,
            ATS: {
                score: 90,
                tips: [],
            },
            toneAndStyle: {
                score: 90,
                tips: [],
            },
            content: {
                score: 90,
                tips: [],
            },
            structure: {
                score: 90,
                tips: [],
            },
            skills: {
                score: 90,
                tips: [],
            },
        },
    },
    {
        id: "5",
        companyName: "Microsoft",
        jobTitle: "Cloud Engineer",
        imagePath: "/images/resume_02.png",
        resumePath: "/resumes/resume-2.pdf",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        feedback: {
            overallScore: 55,
            ATS: {
                score: 90,
                tips: [],
            },
            toneAndStyle: {
                score: 90,
                tips: [],
            },
            content: {
                score: 90,
                tips: [],
            },
            structure: {
                score: 90,
                tips: [],
            },
            skills: {
                score: 90,
                tips: [],
            },
        },
    },
    {
        id: "6",
        companyName: "Apple",
        jobTitle: "iOS Developer",
        imagePath: "/images/resume_03.png",
        resumePath: "/resumes/resume-3.pdf",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        feedback: {
            overallScore: 75,
            ATS: {
                score: 90,
                tips: [],
            },
            toneAndStyle: {
                score: 90,
                tips: [],
            },
            content: {
                score: 90,
                tips: [],
            },
            structure: {
                score: 90,
                tips: [],
            },
            skills: {
                score: 90,
                tips: [],
            },
        },
    },
];

export const AIResponseFormat = `
      interface Feedback {
      overallScore: number; //max 100
      ATS: {
        score: number; //rate based on ATS suitability
        tips: {
          type: "good" | "improve";
          tip: string; //give 3-4 tips
        }[];
      };
      toneAndStyle: {
        score: number; //max 100
        tips: {
          type: "good" | "improve";
          tip: string; //make it a short "title" for the actual explanation
          explanation: string; //explain in detail here
        }[]; //give 3-4 tips
      };
      content: {
        score: number; //max 100
        tips: {
          type: "good" | "improve";
          tip: string; //make it a short "title" for the actual explanation
          explanation: string; //explain in detail here
        }[]; //give 3-4 tips
      };
      structure: {
        score: number; //max 100
        tips: {
          type: "good" | "improve";
          tip: string; //make it a short "title" for the actual explanation
          explanation: string; //explain in detail here
        }[]; //give 3-4 tips
      };
      skills: {
        score: number; //max 100
        tips: {
          type: "good" | "improve";
          tip: string; //make it a short "title" for the actual explanation
          explanation: string; //explain in detail here
        }[]; //give 3-4 tips
      };
    }`;

export const prepareInstructions = ({jobTitle, jobDescription}: { jobTitle: string; jobDescription: string; }) =>
    `You are an expert in ATS (Applicant Tracking System) and resume analysis.
      Please analyze and rate this resume and suggest how to improve it.
      Use the following grading scale to keep scores consistent:
      - 90-100: Resume is highly aligned with the job and ATS best practices.
      - 75-89: Strong resume with a few targeted improvements needed.
      - 60-74: Generally solid but missing structure, clarity, or key keywords.
      - 40-59: Requires notable revisions before submission.
      - <40: Major formatting/content issues that block ATS parsing.
      Always make sure the numeric score reflects the sentiment of your written tips.
      Be thorough and detailed. Don't be afraid to point out any mistakes or areas for improvement.
      If there is a lot to improve, don't hesitate to give low scores. This is to help the user to improve their resume.
      If available, use the job description for the job user is applying to to give more detailed feedback.
      If provided, take the job description into consideration.
      The job title is: ${jobTitle}
      The job description is: ${jobDescription}
      Provide the feedback using the following format:
      ${AIResponseFormat}
      Return the analysis as an JSON object, without any other text and without the backticks.
      Do not include any other text or comments.`;

export const prepareCandidateStrengthsInstructions = ({jobTitle, jobDescription}: { jobTitle: string; jobDescription: string; }) =>
    `You are an expert HR recruiter analyzing a candidate's resume for a recruitment decision.
      Analyze this candidate's resume and identify their key strengths that make them a strong fit for this position.
      The job title is: ${jobTitle}
      The job description is: ${jobDescription}
      
      Provide a comprehensive analysis focusing on:
      1. Technical Skills & Expertise - What technical skills and tools do they excel at?
      2. Experience & Achievements - What notable achievements and relevant experience do they have?
      3. Education & Certifications - What educational background and certifications do they possess?
      4. Soft Skills & Leadership - What soft skills, leadership qualities, or team collaboration abilities do they demonstrate?
      5. Cultural Fit - How well do their values, work style, and career goals align with the role?
      
      For each category, provide:
      - A score from 0-100 indicating how strong they are in that area
      - 3-5 specific bullet points highlighting their strengths
      
      Return the analysis in the following JSON format:
      {
        "strengths": [
          {
            "category": "Technical Skills & Expertise",
            "score": 85,
            "points": [
              "5+ years of experience with React and TypeScript",
              "Strong background in cloud infrastructure (AWS, Azure)",
              "Proven track record in building scalable applications"
            ]
          },
          {
            "category": "Experience & Achievements",
            "score": 90,
            "points": [
              "Led a team of 5 developers to deliver a major product launch",
              "Reduced application load time by 40% through optimization",
              "Managed projects worth $2M+ in annual revenue"
            ]
          },
          {
            "category": "Education & Certifications",
            "score": 75,
            "points": [
              "Bachelor's degree in Computer Science from top university",
              "AWS Certified Solutions Architect",
              "Completed advanced courses in machine learning"
            ]
          },
          {
            "category": "Soft Skills & Leadership",
            "score": 80,
            "points": [
              "Excellent communication skills demonstrated through client presentations",
              "Strong problem-solving abilities shown in complex project scenarios",
              "Proven ability to mentor junior developers"
            ]
          },
          {
            "category": "Cultural Fit",
            "score": 85,
            "points": [
              "Values align with company's innovation-focused culture",
              "Demonstrates growth mindset and continuous learning",
              "Shows commitment to collaborative work environment"
            ]
          }
        ]
      }
      
      Return ONLY the JSON object, without any other text, markdown formatting, or backticks.`;
