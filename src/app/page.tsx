import { GeneratorExperience } from "@/features/generator/GeneratorExperience";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function HomePage() {
  return (
    <>
      <header className="productHeader">
        <h1>
          <a href="#main-content" className="brand" aria-label="devPathAI home">
            DevPath-<span>AI</span>
          </a>
        </h1>
        <ThemeToggle />
      </header>
      <main id="main-content" className="pageShell">
        <GeneratorExperience />
      </main>
    </>
  );
}
