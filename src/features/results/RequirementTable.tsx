import type { RoadmapResponse } from "@/lib/contracts/roadmap";
import styles from "./results.module.css";

type Props = { requirements: RoadmapResponse["requirements"] };

export function RequirementTable({ requirements }: Props) {
  return (
    <div className={styles.tableScroll}>
      <table className={styles.requirementTable}>
        <caption>Job requirement coverage and supporting evidence</caption>
        <thead><tr><th>Requirement</th><th>Evidence from job</th><th>Importance</th><th>Coverage</th><th>Confidence</th><th>Assessment</th></tr></thead>
        <tbody>
          {requirements.map((item) => (
            <tr key={item.id}>
              <th scope="row">{item.name}</th>
              <td>{item.sourceEvidence}</td>
              <td><span className={styles.status}>{item.importance}</span></td>
              <td><span className={`${styles.status} ${styles[item.coverage]}`}>{item.coverage}</span></td>
              <td>{item.confidence}</td>
              <td>{item.rationale}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
