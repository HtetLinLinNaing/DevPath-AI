import type { RoadmapResponse } from "@/lib/contracts/roadmap";
import styles from "./results.module.css";

type Props = { phases: RoadmapResponse["roadmap"]; requirementNames: Map<string, string> };

function List({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return <div><h4>{title}</h4><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></div>;
}

export function RoadmapPhases({ phases, requirementNames }: Props) {
  return <div className={styles.stack}>{phases.map((phase) => (
    <article className={styles.block} data-testid="roadmap-phase" key={phase.phase}>
      <header className={styles.blockHeader}><span className={styles.phaseNumber}>{String(phase.phase).padStart(2, "0")}</span><div><h3>{phase.title}</h3><p>{phase.objective}</p></div><span className={styles.effort}>{phase.estimatedHours.minimum}-{phase.estimatedHours.maximum}h / {phase.estimatedWeeks.minimum}-{phase.estimatedWeeks.maximum} weeks</span></header>
      <p><strong>Why now:</strong> {phase.sequenceReason}</p>
      <div className={styles.detailGrid}>
        <List title="In scope" items={phase.topics} />
        <List title="Out of scope" items={phase.outOfScope} />
        <List title="Acceptance criteria" items={phase.acceptanceCriteria} />
        <List title="Interview checks" items={phase.interviewChecks} />
      </div>
      <dl className={styles.definition}><div><dt>Hands-on activity</dt><dd>{phase.handsOnActivity}</dd></div><div><dt>Deliverable</dt><dd>{phase.deliverable}</dd></div><div><dt>Requirements addressed</dt><dd>{phase.requirementIds.map((id) => requirementNames.get(id) ?? id).join(", ")}</dd></div></dl>
    </article>
  ))}</div>;
}
