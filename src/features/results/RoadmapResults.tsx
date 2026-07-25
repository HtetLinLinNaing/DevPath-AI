import { ArrowLeft, Download, Printer, RefreshCw, Trash2 } from "lucide-react";

import type { RoadmapResponse } from "@/lib/contracts/roadmap";
import { Projects } from "./Projects";
import { RequirementTable } from "./RequirementTable";
import { RoadmapPhases } from "./RoadmapPhases";
import { Timeline } from "./Timeline";
import styles from "./results.module.css";

type Props = {
  result: RoadmapResponse;
  onEdit: () => void;
  onRegenerate: () => void;
  onDownload: () => void;
  onPrint: () => void;
  onClear: () => void;
  onSectionViewed?: (sectionId: string) => void;
};

const titleCase = (value: string) => value.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export function RoadmapResults({ result, onEdit, onRegenerate, onDownload, onPrint, onClear, onSectionViewed }: Props) {
  const requirementNames = new Map(result.requirements.map(({ id, name }) => [id, name]));
  const sections = ["summary", "requirements", "roadmap", "projects", "timeline", ...(result.certifications.length ? ["certifications"] : []), "advice"];
  return (
    <article className={styles.results} aria-label={`${result.readiness.targetRole} roadmap`}>
      <header className={styles.hero} id="summary">
        <div><span className={styles.kicker}>Your job-readiness roadmap</span><h1>{result.readiness.targetRole}</h1><p>{result.readiness.roleFocus}</p><small className={styles.metadata}>Generated {new Date(result.generatedAt).toLocaleString()} - Schema {result.schemaVersion}</small></div>
        <div className={styles.readiness}><span className={styles.status}>{titleCase(result.readiness.band)}</span><strong>{result.readiness.seniority}</strong><small>Current readiness</small></div>
      </header>
      <div className={styles.actionRow} aria-label="Roadmap actions">
        <button type="button" onClick={onEdit}><ArrowLeft size={16} /> Edit inputs</button><button type="button" onClick={onRegenerate}><RefreshCw size={16} /> Generate again</button><button type="button" onClick={onDownload}><Download size={16} /> Download Markdown</button><button type="button" onClick={onPrint}><Printer size={16} /> Print / Save PDF</button><button type="button" onClick={onClear}><Trash2 size={16} /> Clear my data</button>
      </div>
      <nav className={styles.sectionNav} aria-label="Roadmap sections">{sections.map((section) => <a key={section} href={`#${section}`} onClick={() => onSectionViewed?.(section)}>{titleCase(section)}</a>)}</nav>

      <section className={styles.band} aria-labelledby="summary-heading"><h2 id="summary-heading">Readiness summary</h2><p>{result.readiness.rationale}</p><ol className={styles.actions}>{result.readiness.topActions.map((action) => <li key={action}>{action}</li>)}</ol><div className={styles.callout}><strong>When to apply</strong><p>{result.readiness.applicationRecommendation}</p></div></section>
      <section className={styles.band} id="requirements" aria-labelledby="requirements-heading"><div className={styles.sectionTitle}><span>01</span><div><h2 id="requirements-heading">Job requirements vs your skills</h2><p>See exactly where you match and where proof is missing.</p></div></div><RequirementTable requirements={result.requirements} /></section>
      <section className={styles.band} id="roadmap" aria-labelledby="roadmap-heading"><div className={styles.sectionTitle}><span>02</span><div><h2 id="roadmap-heading">Your shortest learning path</h2><p>Follow the phases in order. Build the proof, then move forward.</p></div></div><RoadmapPhases phases={result.roadmap} requirementNames={requirementNames} /></section>
      <section className={styles.band} id="projects" aria-labelledby="projects-heading"><h2 id="projects-heading">Proof-of-readiness projects</h2><Projects projects={result.projects} requirementNames={requirementNames} /></section>
      <section className={styles.band} id="timeline" aria-labelledby="timeline-heading"><h2 id="timeline-heading">Timeline</h2><Timeline timeline={result.timeline} /></section>
      {result.certifications.length > 0 && <section className={styles.band} id="certifications" aria-labelledby="certifications-heading"><h2 id="certifications-heading">Certifications</h2><div className={styles.stack}>{result.certifications.map((certification) => <article className={styles.block} key={certification.name}><h3>{certification.name}</h3><p>{certification.provider} - {certification.difficulty}</p><p>{certification.relevance}</p><p><strong>Requirements:</strong> {certification.requirementIds.map((id) => requirementNames.get(id) ?? id).join(", ")}</p><p><strong>Study estimate:</strong> {certification.estimatedStudyHours.minimum}-{certification.estimatedStudyHours.maximum} hours</p><p><strong>Timing:</strong> {titleCase(certification.timing)}</p><p>{certification.verificationWarning}</p></article>)}</div></section>}
      <section className={styles.band} id="advice" aria-labelledby="advice-heading"><h2 id="advice-heading">Final advice</h2><ul className={styles.advice}>{result.finalAdvice.map((item) => <li key={item}>{item}</li>)}</ul></section>
    </article>
  );
}
