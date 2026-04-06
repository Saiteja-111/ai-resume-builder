import pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";
import Resume from "../models/Resume.js";
import ai from "../configs/ai.js";

const MODEL = "llama-3.3-70b-versatile";

const getErrorDetails = (error) => {
  return {
    message: error?.message || "Unknown error",
    status: error?.status || error?.response?.status || 500,
    data: error?.response?.data || error?.error || null,
  };
};

// Helper to call Groq API
const callGroq = async (systemPrompt, userContent) => {
  const response = await ai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
  });

  return response.choices[0]?.message?.content?.trim() || "";
};

// ✅ Enhance Professional Summary
export const enhanceProfessionalSummary = async (req, res) => {
  try {
    const { userContent } = req.body;

    if (!userContent || !userContent.trim()) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const enhancedContent = await callGroq(
      "You are an expert resume writer. Enhance the professional summary in 2-3 lines. Make it ATS-friendly and impactful. Return only text.",
      userContent,
    );

    return res.status(200).json({ enhancedContent });
  } catch (error) {
    const details = getErrorDetails(error);
    console.error("AI ERROR FULL:", error);

    return res.status(details.status).json({
      message: details.message,
      data: details.data,
    });
  }
};

// ✅ Enhance Job Description
export const enhanceJobDescription = async (req, res) => {
  try {
    const { userContent } = req.body;

    if (!userContent || !userContent.trim()) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const enhancedContent = await callGroq(
      "Enhance the job description using action verbs and achievements. Keep it short and ATS-friendly. Return only text.",
      userContent,
    );

    return res.status(200).json({ enhancedContent });
  } catch (error) {
    const details = getErrorDetails(error);
    console.error("AI ERROR FULL:", error);

    return res.status(details.status).json({
      message: details.message,
      data: details.data,
    });
  }
};

// ✅ Upload Resume (AI Parsing)
export const uploadResume = async (req, res) => {
  try {
    const file = req.file;
    const { title } = req.body;
    const userId = req.userId;

    if (!file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // ✅ Convert PDF → text using pdfjs
    const uint8Array = new Uint8Array(file.buffer);
    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;

    let resumeText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();

      const strings = content.items.map((item) => item.str);
      resumeText += strings.join(" ") + "\n";
    }

    if (!resumeText || !resumeText.trim()) {
      return res
        .status(400)
        .json({ message: "Could not extract text from PDF" });
    }

    const systemPrompt = `
Extract structured resume data from the given resume text.

Return ONLY valid JSON.
Do NOT include markdown or explanation.

Use this exact structure:
{
  "personal_info": {
    "full_name": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "github": "",
    "website": ""
  },
  "professional_summary": "",
  "experience": [],
  "education": [],
  "skills": [],
  "project": [],
  "achievements": []

}
`;

    let extractedData = await callGroq(systemPrompt, resumeText);

    extractedData = extractedData
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    let parsedData;

    try {
      parsedData = JSON.parse(extractedData);
      // ✅ Ensure personal_info exists
      if (!parsedData.personal_info) {
        parsedData.personal_info = {};
      }

      // ✅ GitHub fallback
      if (!parsedData.personal_info.github) {
        parsedData.personal_info.github = "https://github.com/yourusername";
      }

      // ✅ Achievements fallback
      if (!parsedData.achievements) {
        parsedData.achievements = [];
      }
    } catch (err) {
      console.error("JSON PARSE ERROR:", extractedData);
      return res.status(500).json({
        message: "AI returned invalid JSON",
        raw: extractedData,
      });
    }

    const newResume = await Resume.create({
      userId,
      title,
      ...parsedData,
    });

    return res.status(200).json({ resumeId: newResume._id });
  } catch (error) {
    const details = getErrorDetails(error);
    console.error("UPLOAD ERROR FULL:", error);

    return res.status(details.status).json({
      message: details.message,
      data: details.data,
    });
  }
};

export const analyzeResume = async (req, res) => {
  try {
    const { resumeData } = req.body;

    if (!resumeData) {
      return res.status(400).json({ message: "No resume data provided" });
    }

    const personal = resumeData.personal_info || {};
    const summary = resumeData.professional_summary || "";
    const experience = resumeData.experience || [];
    const skills = resumeData.skills || [];
    const projects = resumeData.project || [];
    const education = resumeData.education || [];
    const achievements = resumeData.achievements || [];

    const textData = JSON.stringify(resumeData).toLowerCase();

    let score = 10;
    let feedback = {};
    let missingFields = [];
    let suggestions = [];
    let highlights = [];

    // =========================
    // ✅ BASIC DETAILS CHECK
    // =========================
    if (!personal.full_name) {
      score -= 1;
      missingFields.push("full_name");
      suggestions.push("Add your full name.");
    }

    if (!personal.email) {
      score -= 1;
      missingFields.push("email");
      suggestions.push("Add a professional email.");
    }

    if (!personal.phone) {
      score -= 1;
      missingFields.push("phone");
      suggestions.push("Add your phone number.");
    }

    if (!personal.linkedin) {
      suggestions.push("Add LinkedIn profile for credibility.");
    }

    if (!personal.github) {
      suggestions.push("Add GitHub if you are a developer.");
    }

    // =========================
    // ✅ SUMMARY QUALITY
    // =========================
    const hasValidSummary = summary && summary.trim().length > 30;

    if (!hasValidSummary) {
      score -= 1;
      feedback.summary = "Weak or missing professional summary.";
      missingFields.push("professional_summary");
      suggestions.push("Write a strong 2–3 line summary with skills + goal.");
    }

    // =========================
    // ✅ STRUCTURE CHECK
    // =========================
    const hasValidSkills =
      Array.isArray(skills) &&
      skills.filter((s) => s && s.trim() !== "").length >= 3;

    const hasValidExperience =
      Array.isArray(experience) && experience.some((exp) => exp?.description);

    const hasValidEducation =
      Array.isArray(education) && education.some((edu) => edu?.institution);

    if (!hasValidSkills) {
      score -= 1;
      missingFields.push("skills");
      suggestions.push("Add at least 5 relevant technical skills.");
    }

    if (!hasValidExperience) {
      score -= 2;
      missingFields.push("experience");
      suggestions.push("Add experience with responsibilities and results.");
    }

    if (!hasValidEducation) {
      score -= 1;
      missingFields.push("education");
      suggestions.push("Add your education details.");
    }

    // =========================
    // ✅ PROJECTS CHECK
    // =========================
    const hasValidProjects =
      Array.isArray(projects) &&
      projects.some((p) => p?.name && p?.description);

    if (!hasValidProjects) {
      score -= 2;
      missingFields.push("project");
      feedback.projects = "No strong projects found.";
      suggestions.push("Add 2–3 strong projects with description.");
    }

    // =========================
    // ✅ ACHIEVEMENTS CHECK
    // =========================
    if (!achievements.length) {
      score -= 1;
      missingFields.push("achievements");
      suggestions.push("Add achievements (certifications, awards, rankings).");
    }

    // =========================
    // ✅ PROJECT QUALITY CHECK
    // =========================
    let weakProjects = [];

    projects.forEach((proj, index) => {
      const desc = (proj.description || "").toLowerCase();

      const hasTech =
        desc.includes("react") ||
        desc.includes("node") ||
        desc.includes("api") ||
        desc.includes("mongodb") ||
        desc.includes("python") ||
        desc.includes("java");

      const hasImpact =
        desc.includes("%") ||
        desc.match(/\d+/) ||
        desc.includes("improved") ||
        desc.includes("optimized");

      const hasActionVerb =
        desc.includes("developed") ||
        desc.includes("built") ||
        desc.includes("designed");

      if (!desc || desc.length < 20) {
        weakProjects.push(`Project ${index + 1} has very weak description`);
      } else if (!hasTech) {
        weakProjects.push(`Project ${index + 1} missing tech stack`);
      } else if (!hasActionVerb) {
        weakProjects.push(`Project ${index + 1} lacks action verbs`);
      } else if (!hasImpact) {
        weakProjects.push(`Project ${index + 1} has no measurable impact`);
      }
    });

    if (weakProjects.length > 0) {
      score -= 1;
      feedback.projectsQuality = "Some projects are weak.";
      suggestions.push(
        "Improve project descriptions: include tech stack, action verbs, and measurable results.",
      );
    }

    // =========================
    // ✅ MEASURABLE IMPACT
    // =========================
    const hasImpact =
      textData.includes("%") ||
      textData.match(/\d+/) ||
      textData.includes("improved") ||
      textData.includes("increased") ||
      textData.includes("optimized");

    if (!hasImpact) {
      score -= 1;
      missingFields.push("impact");
      feedback.impact = "No measurable impact found.";
      suggestions.push("Add numbers (e.g., improved performance by 30%).");
    }

    // =========================
    // ✅ ATS KEYWORDS
    // =========================
    if (skills.length < 5) {
      score -= 1;
      feedback.ats = "Low ATS keyword optimization.";
      suggestions.push("Add more keywords like React, Node.js, MongoDB.");
    }

    // =========================
    // ✅ PROBLEM SOLVING
    // =========================
    if (!textData.includes("developed") && !textData.includes("built")) {
      score -= 1;
      feedback.problemSolving = "Weak problem-solving evidence.";
      suggestions.push("Use action verbs like built, developed, designed.");
    }

    // =========================
    // ✅ CLEAN FORMATTING
    // =========================
    if (summary.length < 20) {
      feedback.formatting = "Summary formatting is weak.";
      suggestions.push("Improve readability and sentence clarity.");
    }

    // =========================
    // ❌ UNWANTED CONTENT
    // =========================
    if (textData.includes("i am") || textData.includes("myself")) {
      suggestions.push(
        "Avoid informal words like 'I am', 'myself'. Use professional tone.",
      );
    }

    // =========================
    // ⭐ HIGHLIGHTS (IF GOOD RESUME)
    // =========================
    if (score >= 9) {
      highlights.push("Excellent structure and formatting.");
      highlights.push("Strong ATS optimization.");
      highlights.push("Well-written and professional resume.");
    }

    if (score > 10) score = 10;
    if (score < 1) score = 1;

    return res.json({
      score,
      feedback,
      missingFields,
      suggestions,
      highlights,
    });
  } catch (error) {
    console.error("ANALYZE ERROR:", error);
    return res.status(500).json({ message: "Analysis failed" });
  }
};

export const fixResumeWithAI = async (req, res) => {
  try {
    const { resumeData, domain, experience } = req.body;

    if (!resumeData || !domain) {
      return res.status(400).json({ message: "Missing data" });
    }

    const systemPrompt = `
You are an expert resume writer.

Your job:
- Fix and improve the resume
- Fill ALL missing fields (IMPORTANT)
- Make it ATS optimized
- Domain: ${domain}
- Experience: ${experience} years

STRICT RULES:
- ALWAYS include github if missing (generate a professional placeholder if not given)
- ALWAYS include linkedin
- ALWAYS include skills, projects, education, experience
- Do NOT leave any field empty

If github not provided:
→ generate like: https://github.com/username

Return ONLY JSON.

Structure:
{
  "personal_info": {
    "full_name": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedin": "",
    "github": "",
    "website": ""
  },
  "professional_summary": "",
  "experience": [],
  "education": [],
  "skills": [],
  "project": [],
  "achievements": []
}
`;

    const userPrompt = `
Here is the resume:
${JSON.stringify(resumeData)}
`;

    const response = await ai.chat.completions.create({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    let content = response.choices[0].message.content;

    // ✅ Extract ONLY JSON part
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error("INVALID AI RESPONSE:", content);
      return res.status(500).json({
        message: "AI did not return valid JSON",
        raw: content,
      });
    }

    const cleaned = jsonMatch[0];

    const parsed = JSON.parse(cleaned);

    // ✅ FIX PROJECT (IMPORTANT)
    parsed.project = (parsed.project || []).map((p) => ({
      name: typeof p.name === "string" ? p.name : "",
      description:
        typeof p.description === "string"
          ? p.description
          : Array.isArray(p.description)
            ? p.description.join(", ")
            : typeof p.description === "object"
              ? Object.values(p.description).join(", ")
              : "",
    }));

    // ✅ FIX EXPERIENCE (VERY IMPORTANT)
    parsed.experience = (parsed.experience || []).map((exp) => ({
      ...exp,
      description:
        typeof exp.description === "string"
          ? exp.description
          : Array.isArray(exp.description)
            ? exp.description.join("\n")
            : typeof exp.description === "object"
              ? Object.values(exp.description).join("\n")
              : "",
    }));

    // ✅ Ensure personal_info exists
    if (!parsed.personal_info) {
      parsed.personal_info = {};
    }

    // ✅ Profession fallback
    if (!parsed.personal_info.profession) {
      parsed.personal_info.profession = `${domain}`;
    }

    // ✅ Website fallback
    if (!parsed.personal_info.website) {
      parsed.personal_info.website = `https://${parsed.personal_info.full_name
        ?.toLowerCase()
        .replace(/\s/g, "")}.dev`;
    }

    // ✅ GitHub fallback
    if (!parsed.personal_info.github) {
      parsed.personal_info.github = "https://github.com/yourusername";
    }

    // ✅ Achievements fallback
    if (!parsed.achievements) {
      parsed.achievements = [
        "Built scalable applications",
        "Improved performance by 30%",
      ];
    }

    return res.json(parsed);
  } catch (error) {
    console.error("FIX RESUME ERROR:", error);
    res.status(500).json({ message: "Failed to fix resume" });
  }
};
