"use client";

import { Card, CardBody, Chip } from "@heroui/react";
import { CheckCircle2, Clock3, Flag } from "lucide-react";
import type { RoadmapResponse } from "@/lib/contracts/roadmap";
import styles from "./results.module.css";

type Props = {
  phases: RoadmapResponse["roadmap"];
  requirementNames: Map<string, string>;
};

export function RoadmapPhases({ phases, requirementNames }: Props) {
  return (
    <ol className={styles.roadmapFlow}>
      {phases.map((phase) => (
        <li data-testid="roadmap-phase" key={phase.phase}>
          <span className={styles.roadmapNode}>{phase.phase}</span>
          <Card className={styles.phaseCard} shadow="sm">
            <CardBody className="p-2">
              <header className={styles.phaseHeader}>
                <div>
                  <span className={styles.phaseLabel}>Phase {phase.phase}</span>
                  <h3>{phase.title}</h3>
                </div>
                <Chip
                  size="sm"
                  variant="flat"
                  startContent={<Clock3 size={13} />}
                >
                  {phase.estimatedWeeks.minimum}-{phase.estimatedWeeks.maximum}{" "}
                  weeks
                </Chip>
              </header>
              <p className={styles.phaseObjective}>{phase.objective}</p>
              <div className={styles.phaseEssential}>
                <div>
                  <Flag size={16} />
                  <span>
                    <small>Build</small>
                    {phase.deliverable}
                  </span>
                </div>
                <div>
                  <CheckCircle2 size={16} />
                  <span>
                    <small>Done when</small>
                    {phase.acceptanceCriteria[0]}
                  </span>
                </div>
              </div>
              <div className={styles.phaseTags}>
                {phase.topics.slice(0, 3).map((topic) => (
                  <Chip
                    className={styles.themeChip}
                    key={topic}
                    size="sm"
                    variant="bordered"
                  >
                    {topic}
                  </Chip>
                ))}
              </div>
              <p className={styles.phaseRequirements}>
                {phase.requirementIds
                  .map((id) => requirementNames.get(id) ?? id)
                  .join(" · ")}
              </p>
            </CardBody>
          </Card>
        </li>
      ))}
    </ol>
  );
}
