"use client";

import { Chip, Progress } from "@heroui/react";
import type { RoadmapResponse } from "@/lib/contracts/roadmap";
import styles from "./results.module.css";

type Props = { requirements: RoadmapResponse["requirements"] };

const coverageValue = {
  covered: 100,
  partial: 58,
  uncertain: 32,
  missing: 12,
} as const;

const coverageColor = {
  covered: "success",
  partial: "warning",
  uncertain: "warning",
  missing: "danger",
} as const;

export function RequirementTable({ requirements }: Props) {
  return (
    <div className={styles.tableScroll}>
      <table className={styles.requirementTable}>
        <caption>Job requirements compared with your current skills and evidence</caption>
        <thead><tr><th>Job requires</th><th>What the job says</th><th>Priority</th><th>Your coverage</th><th>Confidence</th><th>What this means</th></tr></thead>
        <tbody>
          {requirements.map((item) => (
            <tr key={item.id}>
              <th scope="row">{item.name}</th>
              <td data-label="What the job says">{item.sourceEvidence}</td>
              <td data-label="Priority"><Chip className={styles.themeChip} size="sm" variant="flat">{item.importance}</Chip></td>
              <td data-label="Your coverage">
                <div className={styles.coverageCell}>
                  <Progress
                    aria-label={`${item.name} coverage: ${item.coverage}`}
                    color={coverageColor[item.coverage]}
                    size="sm"
                    value={coverageValue[item.coverage]}
                  />
                  <strong className={styles[item.coverage]}>{item.coverage}</strong>
                </div>
              </td>
              <td data-label="Confidence"><span className={styles.confidence}>{item.confidence}</span></td>
              <td data-label="What this means">{item.rationale}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
