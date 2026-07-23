import type { RoadmapResponse } from "@/lib/contracts/roadmap";
import styles from "./results.module.css";

type Props = { projects: RoadmapResponse["projects"]; requirementNames: Map<string, string> };

export function Projects({ projects, requirementNames }: Props) {
  return <div className={styles.projectGrid}>{projects.map((project, index) => (
    <article className={styles.block} data-testid="portfolio-project" key={project.title}>
      <span className={styles.kicker}>Project {index + 1}</span><h3>{project.title}</h3><p>{project.problemStatement}</p>
      <dl className={styles.definition}>
        <div><dt>Requirements proved</dt><dd>{project.requirementIds.map((id) => requirementNames.get(id) ?? id).join(", ")}</dd></div>
        <div><dt>Demonstration</dt><dd>{project.demonstrationMethod}</dd></div>
      </dl>
      <div className={styles.detailGrid}>
        <div><h4>Technology choices</h4><ul>{project.technologies.map(({ name, reason }) => <li key={name}><strong>{name}:</strong> {reason}</li>)}</ul></div>
        <div><h4>Core features</h4><ul>{project.coreFeatures.map((item) => <li key={item}>{item}</li>)}</ul></div>
        <div><h4>Non-goals</h4><ul>{project.nonGoals.map((item) => <li key={item}>{item}</li>)}</ul></div>
        <div><h4>Acceptance criteria</h4><ul>{project.acceptanceCriteria.map((item) => <li key={item}>{item}</li>)}</ul></div>
        <div><h4>Portfolio evidence</h4><ul>{project.portfolioEvidence.map((item) => <li key={item}>{item}</li>)}</ul></div>
      </div>
    </article>
  ))}</div>;
}
