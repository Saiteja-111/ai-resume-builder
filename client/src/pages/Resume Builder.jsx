import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { dummyResumeData } from "../assets/assets";
import {
  ArrowLeftIcon,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  DownloadIcon,
  Trophy,
  EyeIcon,
  EyeOffIcon,
  FileText,
  FolderIcon,
  GraduationCap,
  Share2Icon,
  Sparkles,
  User,
} from "lucide-react";
import PersonalInfoForm from "../components/PersonalInfoForm";
import ResumePreview from "../components/ResumePreview";
import TemplateSelector from "../components/TemplateSelector";
import ColorPicker from "../components/ColorPicker";
import ProfessionalSummaryForm from "../components/ProfessionalSummaryForm";
import ExperienceForm from "../components/ExperienceForm";
import EducationForm from "../components/EducationForm";
import ProjectForm from "../components/ProjectForm";
import SkillsForm from "../components/SkillsForm";
import Achievements from "../components/Achievements";
import { useSelector } from "react-redux";
import api from "../configs/api";
import toast from "react-hot-toast";

const ResumeBuilder = () => {
  const { resumeId } = useParams();
  const { token } = useSelector((state) => state.auth);

  const [resumeData, setResumeData] = useState({
    _id: "",
    title: "",
    personal_info: {},
    professional_summary: "",
    experience: [],
    education: [],
    project: [],
    skills: [],
    achievements: [],
    template: "classic",
    accent_color: "#3B82F6",
    public: false,
  });

  const loadExistingResume = async () => {
    try {
      const { data } = await api.get("/api/resumes/get/" + resumeId, {
        headers: { Authorization: token },
      });
      if (data.resume) {
        setResumeData(data.resume);
        document.title = data.resume.title;
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [removeBackground, setRemoveBackground] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [showFixModal, setShowFixModal] = useState(false);
  const [domain, setDomain] = useState("");
  const [experience, setExperience] = useState(0);
  const [isFixing, setIsFixing] = useState(false);

  const sections = [
    { id: "personal", name: "Personal Info", icon: User },
    { id: "summary", name: "Summary", icon: FileText },
    { id: "experience", name: "Experience", icon: Briefcase },
    { id: "education", name: "Education", icon: GraduationCap },
    { id: "projects", name: "Projects", icon: FolderIcon },
    { id: "skills", name: "Skills", icon: Sparkles },
    { id: "achievements", name: "Achievements", icon: Trophy },
  ];

  const activeSection = sections[activeSectionIndex];

  useEffect(() => {
    loadExistingResume();
  }, []);

  const changeResumeVisibility = async () => {
    try {
      const formData = new FormData();
      formData.append("resumeId", resumeId);
      formData.append(
        "resumeData",
        JSON.stringify({ public: !resumeData.public }),
      );

      const { data } = await api.put("/api/resumes/update", formData, {
        headers: { Authorization: token },
      });

      setResumeData({ ...resumeData, public: !resumeData.public });
      toast.success(data.message);
    } catch (error) {
      console.error("Error saving resume:", error);
    }
  };

  const handleShare = () => {
    const frontendUrl = window.location.href.split("/app/")[0];
    const resumeUrl = frontendUrl + "/view/" + resumeId;

    if (navigator.share) {
      navigator.share({ url: resumeUrl, text: "My Resume" });
    } else {
      alert("Share not supported on this browser.");
    }
  };

  const downloadResume = () => {
    window.print();
  };

  const saveResume = async () => {
    try {
      let updatedResumeData = structuredClone(resumeData);

      // remove image from updatedResumeData
      if (typeof resumeData.personal_info.image === "object") {
        delete updatedResumeData.personal_info.image;
      }

      const formData = new FormData();
      formData.append("resumeId", resumeId);
      formData.append("resumeData", JSON.stringify(updatedResumeData));
      removeBackground && formData.append("removeBackground", "yes");
      typeof resumeData.personal_info.image === "object" &&
        formData.append("image", resumeData.personal_info.image);

      const { data } = await api.put("/api/resumes/update", formData, {
        headers: { Authorization: token },
      });

      setResumeData(data.resume);
      toast.success(data.message);
    } catch (error) {
      console.error("Error saving resume:", error);
    }
  };
  const handleAnalyze = async () => {
    try {
      setLoadingAnalysis(true);

      const { data } = await api.post(
        "/api/ai/analyze-resume",
        { resumeData },
        { headers: { Authorization: token } },
      );

      setAnalysis(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to analyze resume");
    } finally {
      setLoadingAnalysis(false);
    }
  };
  const handleFixResume = async () => {
    try {
      if (!domain) {
        return toast.error("Please select a domain");
      }

      setIsFixing(true);

      const { data } = await api.post(
        "/api/ai/fix-resume",
        { resumeData, domain, experience },
        { headers: { Authorization: token } },
      );

      try {
        const fixedData = data.updatedResume || data;

const safeData = {
  ...fixedData,

  achievements: (fixedData.achievements || []).map((a) =>
    typeof a === "string"
      ? a
      : `${a.title || ""} ${a.description || ""}`
  ),

  project: (fixedData.project || []).map((p) => ({
    ...p,
    description:
      typeof p.description === "string"
        ? p.description
        : JSON.stringify(p.description),
  })),

  experience: (fixedData.experience || []).map((exp) => ({
    ...exp,
    description:
      typeof exp.description === "string"
        ? exp.description
        : JSON.stringify(exp.description),
  })),
};

setResumeData((prev) => ({
  ...prev,
  personal_info: safeData.personal_info || prev.personal_info,
  professional_summary:
    safeData.professional_summary || prev.professional_summary,
  experience: safeData.experience || prev.experience,
  education: safeData.education || prev.education,
  project: safeData.project || prev.project,
  skills: safeData.skills || prev.skills,
  achievements: safeData.achievements || prev.achievements,
}));
      } catch (err) {
        console.error("Invalid AI response:", err);
        toast.error("AI returned invalid resume format");
      }
      setShowFixModal(false);

      toast.success("Resume improved successfully 🚀");
    } catch (error) {
      console.error(error);
      toast.error("Failed to fix resume");
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Link
          to={"/app"}
          className="inline-flex gap-2 items-center text-slate-500 hover:text-slate-700 transition-all"
        >
          <ArrowLeftIcon className="size-4" /> Back to Dashboard
        </Link>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-8">
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Panel - Form */}
          <div className="relative lg:col-span-5 rounded-lg overflow-hidden">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 pt-1">
              {/* progress bar using activeSectionIndex */}
              <hr className="absolute top-0 left-0 right-0 border-2 border-gray-200" />
              <hr
                className="absolute top-0 left-0  h-1 bg-linear-to-r from-green-500 to-green-600 border-none transition-all duration-2000"
                style={{
                  width: `${(activeSectionIndex * 100) / (sections.length - 1)}%`,
                }}
              />

              {/* Section Navigation */}
              <div className="flex justify-between items-center mb-6 border-b border-gray-300 py-1">
                <div className="flex items-center gap-2">
                  <TemplateSelector
                    selectedTemplate={resumeData.template}
                    onChange={(template) =>
                      setResumeData((prev) => ({ ...prev, template }))
                    }
                  />
                  <ColorPicker
                    selectedColor={resumeData.accent_color}
                    onChange={(color) =>
                      setResumeData((prev) => ({
                        ...prev,
                        accent_color: color,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center">
                  {activeSectionIndex !== 0 && (
                    <button
                      onClick={() =>
                        setActiveSectionIndex((prevIndex) =>
                          Math.max(prevIndex - 1, 0),
                        )
                      }
                      className="flex items-center gap-1 p-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
                      disabled={activeSectionIndex === 0}
                    >
                      <ChevronLeft className="size-4" /> Previous
                    </button>
                  )}
                  <button
                    onClick={() =>
                      setActiveSectionIndex((prevIndex) =>
                        Math.min(prevIndex + 1, sections.length - 1),
                      )
                    }
                    className={`flex items-center gap-1 p-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all ${activeSectionIndex === sections.length - 1 && "opacity-50"}`}
                    disabled={activeSectionIndex === sections.length - 1}
                  >
                    Next <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>

              {/* Form Content */}
              <div className="space-y-6">
                {activeSection.id === "personal" && (
                  <PersonalInfoForm
                    data={resumeData.personal_info}
                    onChange={(data) =>
                      setResumeData((prev) => ({
                        ...prev,
                        personal_info: data,
                      }))
                    }
                    removeBackground={removeBackground}
                    setRemoveBackground={setRemoveBackground}
                  />
                )}
                {activeSection.id === "summary" && (
                  <ProfessionalSummaryForm
                    data={resumeData.professional_summary}
                    onChange={(data) =>
                      setResumeData((prev) => ({
                        ...prev,
                        professional_summary: data,
                      }))
                    }
                    setResumeData={setResumeData}
                  />
                )}
                {activeSection.id === "experience" && (
                  <ExperienceForm
                    data={resumeData.experience}
                    onChange={(data) =>
                      setResumeData((prev) => ({ ...prev, experience: data }))
                    }
                  />
                )}
                {activeSection.id === "education" && (
                  <EducationForm
                    data={resumeData.education}
                    onChange={(data) =>
                      setResumeData((prev) => ({ ...prev, education: data }))
                    }
                  />
                )}
                {activeSection.id === "projects" && (
                  <ProjectForm
                    data={resumeData.project}
                    onChange={(data) =>
                      setResumeData((prev) => ({ ...prev, project: data }))
                    }
                  />
                )}
                {activeSection.id === "skills" && (
                  <SkillsForm
                    data={resumeData.skills}
                    onChange={(data) =>
                      setResumeData((prev) => ({ ...prev, skills: data }))
                    }
                  />
                )}
                {activeSection.id === "achievements" && (
                  <Achievements
                    data={resumeData.achievements}
                    onChange={(data) =>
                      setResumeData((prev) => ({ ...prev, achievements: data }))
                    }
                  />
                )}
              </div>
              <button
                onClick={() => {
                  toast.promise(saveResume, { loading: "Saving..." });
                }}
                className="bg-linear-to-br from-green-100 to-green-200 ring-green-300 text-green-600 ring hover:ring-green-400 transition-all rounded-md px-6 py-2 mt-6 text-sm"
              >
                Save Changes
              </button>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="lg:col-span-7 max-lg:mt-6">
            <div className="relative w-full">
              <div className="absolute bottom-3 left-0 right-0 flex items-center justify-end gap-2">
                {resumeData.public && (
                  <button
                    onClick={handleShare}
                    className="flex items-center p-2 px-4 gap-2 text-xs bg-linear-to-br from-blue-100 to-blue-200 text-blue-600 rounded-lg ring-blue-300 hover:ring transition-colors"
                  >
                    <Share2Icon className="size-4" /> Share
                  </button>
                )}
                <button
                  onClick={changeResumeVisibility}
                  className="flex items-center p-2 px-4 gap-2 text-xs bg-linear-to-br from-purple-100 to-purple-200 text-purple-600 ring-purple-300 rounded-lg hover:ring transition-colors"
                >
                  {resumeData.public ? (
                    <EyeIcon className="size-4" />
                  ) : (
                    <EyeOffIcon className="size-4" />
                  )}
                  {resumeData.public ? "Public" : "Private"}
                </button>
                <button
                  onClick={handleAnalyze}
                  className="flex items-center gap-2 px-4 py-2 text-xs bg-linear-to-br from-indigo-100 to-indigo-200 text-indigo-600 rounded-lg ring-indigo-300 hover:ring transition-colors"
                >
                  <Sparkles className="size-4" /> Analyze
                </button>
                <button
                  onClick={() => setShowFixModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-xs bg-linear-to-br from-pink-100 to-pink-200 text-pink-600 rounded-lg ring-pink-300 hover:ring transition-colors"
                >
                  ⚡ Fix Resume
                </button>
                <button
                  onClick={downloadResume}
                  className="flex items-center gap-2 px-6 py-2 text-xs bg-linear-to-br from-green-100 to-green-200 text-green-600 rounded-lg ring-green-300 hover:ring transition-colors"
                >
                  <DownloadIcon className="size-4" /> Download
                </button>
              </div>
            </div>

            <ResumePreview
              data={resumeData}
              template={resumeData.template}
              accentColor={resumeData.accent_color}
            />
            {loadingAnalysis && (
              <div className="mt-4 text-center text-blue-600 font-medium">
                🔍 Analyzing your resume...
              </div>
            )}

            {analysis && (
              <div className="mt-6 p-5 bg-white rounded-xl shadow border">
                {/* ❌ STRUCTURE ERROR UI */}
                {analysis.structureIssue && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded">
                    <h2 className="text-red-600 font-bold text-lg">
                      ❌ Incorrect Resume Structure
                    </h2>

                    <p className="mt-2 text-sm">{analysis.message}</p>

                    <p className="mt-3 font-medium">Missing Fields:</p>
                    <ul className="list-disc ml-5 text-sm">
                      {analysis.missingFields.map((field, i) => (
                        <li key={i}>{field}</li>
                      ))}
                    </ul>

                    <p className="mt-4 font-medium">Correct Structure:</p>
                    <pre className="text-xs bg-white p-3 rounded overflow-auto border">
                      {JSON.stringify(analysis.correctStructure, null, 2)}
                    </pre>
                  </div>
                )}

                {/* ✅ NORMAL ANALYSIS UI */}
                {!analysis.structureIssue && (
                  <>
                    {/* Score */}
                    <h2
                      className={`text-2xl font-bold mb-4 ${
                        analysis.score >= 8
                          ? "text-green-600"
                          : analysis.score >= 5
                            ? "text-yellow-500"
                            : "text-red-600"
                      }`}
                    >
                      ⭐ Score: {analysis.score} / 10
                    </h2>

                    {/* Feedback */}
                    <div className="mb-4">
                      <h3 className="font-semibold text-lg mb-1">
                        📊 Feedback
                      </h3>
                      {Object.entries(analysis.feedback || {}).map(
                        ([key, value]) => (
                          <p key={key}>
                            <strong>{key}:</strong> {value}
                          </p>
                        ),
                      )}
                    </div>

                    {/* Missing */}
                    <div className="mb-4">
                      <h3 className="font-semibold text-lg mb-1">
                        ❌ Missing Fields
                      </h3>
                      {(analysis.missingFields || []).length === 0 ? (
                        <p>None 🎉</p>
                      ) : (
                        analysis.missingFields.map((item, i) => (
                          <p key={i}>• {item}</p>
                        ))
                      )}
                    </div>

                    {/* Suggestions */}
                    <div>
                      <h3 className="font-semibold text-lg mb-1">
                        💡 Suggestions
                      </h3>
                      {(analysis.suggestions || []).map((item, i) => (
                        <p key={i}>• {item}</p>
                      ))}
                    </div>
                    {analysis.highlights?.length > 0 && (
                      <div className="mt-4">
                        <h3 className="font-semibold text-lg mb-1 text-green-600">
                          🌟 Highlights
                        </h3>
                        {analysis.highlights.map((item, i) => (
                          <p key={i}>• {item}</p>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {showFixModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">⚡ Fix Resume with AI</h2>

            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full border p-2 mb-3 rounded"
            >
              <option value="">Select Domain</option>
              <option>Frontend Developer</option>
              <option>Backend Developer</option>
              <option>Full Stack Developer</option>
              <option>AI Engineer</option>
              <option>Data Analyst</option>
              <option>DevOps Engineer</option>
              <option>Cybersecurity</option>
            </select>

            <select
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="w-full border p-2 mb-4 rounded"
            >
              <option value={0}>Fresher (0)</option>
              <option value={1}>1 year</option>
              <option value={2}>2 years</option>
              <option value={3}>3 years</option>
              <option value={4}>4 years</option>
              <option value={5}>5+ years</option>
            </select>

            <button
              onClick={handleFixResume}
              className="w-full bg-green-600 text-white py-2 rounded"
              disabled={isFixing}
            >
              {isFixing ? "Fixing..." : "Generate Resume"}
            </button>

            <button
              onClick={() => setShowFixModal(false)}
              className="mt-3 text-sm text-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeBuilder;
