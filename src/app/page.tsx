import { GeneratorExperience } from "@/features/generator/GeneratorExperience";

export default function HomePage() {
  return (
    <>
      <header className="productHeader"><a href="#main-content" className="brand">DevPath<span>AI</span></a><span className="headerMeta">Job-readiness planner</span></header>
      <main id="main-content" className="pageShell"><GeneratorExperience /></main>
    </>
  );
}
