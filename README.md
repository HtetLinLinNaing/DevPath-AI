# DevPath AI

An AI-powered career mentor that helps freshers and developers discover career paths, identify skill gaps, and generate personalized learning roadmaps.

---

## 🚀 Overview

DevPath AI helps aspiring developers and junior engineers make informed career decisions by analyzing their skills, interests, experience, and goals. The platform provides personalized career recommendations, learning roadmaps, job readiness assessments, and AI-powered mentoring.

---

## ✨ Features

### Skill Assessment

Evaluate users based on:

- Technical skills
- Work experience
- Interests
- Career goals

### Career Recommendations

Recommend suitable career paths such as:

- Frontend Developer
- Backend Developer
- Full Stack Developer
- DevOps Engineer
- Data Analyst
- AI Engineer

### Personalized Learning Roadmap

Generate tailored learning plans including:

- Skills to learn
- Suggested projects
- Learning milestones
- Recommended resources

### Job Readiness Score

Provide:

- Readiness percentage
- Strengths
- Skill gaps
- Suggested next actions

### AI Mentor

Users can ask questions such as:

- What should I learn next?
- Am I job-ready?
- Which projects should I build?
- How can I become a mid-level developer?

### Progress Tracking

Track:

- Completed skills
- Roadmap progress
- Learning milestones
- Career growth

---

## 🏗️ Tech Stack

### Frontend

- Next.js
- TypeScript
- Tailwind CSS
- HeroUI

### Backend

- ASP.NET Core Web API
- C#
- Entity Framework Core

### Database

- PostgreSQL

### AI

- OpenAI API

### Authentication

- JWT Authentication

### Deployment

- Vercel (Frontend)
- Railway / Render / Azure (Backend)
- PostgreSQL Cloud Database

---

## 📁 Project Structure

```text
devpath-ai/
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── services/
│   ├── hooks/
│   ├── types/
│   └── utils/
│
├── backend/
│   ├── Controllers/
│   ├── Services/
│   ├── Repositories/
│   ├── Models/
│   ├── DTOs/
│   ├── Data/
│   ├── Middleware/
│   └── AI/
│
├── database/
│   └── schema.sql
│
├── docs/
│   ├── architecture.md
│   ├── api-spec.md
│   └── user-flow.md
│
└── README.md
```

---

## 🗄️ Core Entities

### User

```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "passwordHash": "string"
}
```

### Assessment

```json
{
  "id": "uuid",
  "userId": "uuid",
  "experienceLevel": "Junior",
  "skills": [],
  "interests": [],
  "goals": []
}
```

### Career Recommendation

```json
{
  "id": "uuid",
  "userId": "uuid",
  "careerPath": "Backend Developer",
  "confidenceScore": 85
}
```

### Roadmap

```json
{
  "id": "uuid",
  "userId": "uuid",
  "careerPath": "Backend Developer",
  "milestones": []
}
```

### Progress

```json
{
  "id": "uuid",
  "userId": "uuid",
  "completedSkills": [],
  "completionPercentage": 40
}
```

---

## 🔄 User Flow

1. User registers and logs in.
2. User completes skill assessment.
3. AI analyzes assessment results.
4. Career path recommendations are generated.
5. Personalized roadmap is created.
6. Job readiness score is calculated.
7. User tracks progress through dashboard.
8. User interacts with AI mentor for guidance.

---

## ✅ Definition of Done

- [ ] User registration and login
- [ ] Skill assessment form
- [ ] Career recommendation engine
- [ ] Personalized roadmap generation
- [ ] Job readiness score calculation
- [ ] AI mentor chat
- [ ] Progress tracking dashboard
- [ ] Responsive UI
- [ ] Online deployment
- [ ] Documentation and demo

---

## 🎯 Future Improvements

- Resume analysis
- LinkedIn profile analysis
- GitHub repository analysis
- Interview preparation assistant
- Learning resource recommendations
- Team collaboration features
- Community mentorship

---

## 👨‍💻 Author

Created by **Htet Lin Lin Naing**

DevPath AI — Helping developers find their path with confidence.
