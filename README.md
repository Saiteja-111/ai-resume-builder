AI Resume Builder

An intelligent AI-powered Resume Builder that helps users create, enhance, analyze, and optimize resumes for ATS (Applicant Tracking Systems).

Built with React, Node.js, MongoDB, and AI integration (Groq / LLaMA models).

🌟 Features
🧑‍💼 Resume Creation
Create professional resumes with multiple templates
Add personal info, skills, projects, experience, education, achievements
Live preview while editing
🎨 Customization
Multiple resume templates (Classic, Modern, Minimal, Image-based)
Accent color selection
Profile image upload with background removal
🤖 AI Features
✨ Enhance professional summary
💼 Improve job descriptions
🔍 Analyze resume (ATS score + feedback)
⚡ Auto-fix resume using AI (domain-based optimization)
📊 Resume Analysis
Score out of 10
Missing fields detection
Suggestions for improvement
ATS keyword optimization
🔗 Sharing & Export
Public/Private resume toggle
Shareable resume link
Download as PDF (Print feature)
🛠️ Tech Stack
Frontend
⚛️ React.js
🎨 Tailwind CSS
🔄 Redux Toolkit
🔗 React Router
Backend
🟢 Node.js
🚀 Express.js
🍃 MongoDB (Mongoose)
AI Integration
🤖 Groq API (LLaMA 3.3 70B model)
Other Tools
📄 pdfjs (PDF parsing)
🖼️ ImageKit (image upload & processing)
📂 Project Structure
client/
 ├── components/
 ├── pages/
 ├── templates/
 ├── configs/

server/
 ├── controllers/
 ├── models/
 ├── routes/
 ├── configs/
⚙️ Installation & Setup
1️⃣ Clone the repository
git clone https://github.com/your-username/ai-resume-builder.git
cd ai-resume-builder
2️⃣ Install dependencies
Frontend
cd client
npm install
npm run dev
Backend
cd server
npm install
npm run dev
🔑 Environment Variables

Create .env file in server:

MONGO_URI=your_mongodb_uri
GROQ_API_KEY=your_groq_api_key
IMAGEKIT_PUBLIC_KEY=your_key
IMAGEKIT_PRIVATE_KEY=your_key
IMAGEKIT_URL_ENDPOINT=your_url
JWT_SECRET=your_secret
📸 Screenshots
Resume Builder UI
AI Analysis Panel
Resume Templates

(Add screenshots here)

🚀 Future Improvements
Drag & drop sections
Resume templates marketplace
AI interview preparation
Multi-language resumes
Export to DOCX
👨‍💻 Author

Sai Teja
📧 saiteja611@gmail.com
🔗 LinkedIn: https://linkedin.com
💻 GitHub: https://github.com

⭐ Support

If you like this project:

👉 Give it a ⭐ on GitHub
👉 Share with others
