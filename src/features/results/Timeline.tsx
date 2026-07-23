import type { RoadmapResponse } from "@/lib/contracts/roadmap";
import styles from "./results.module.css";

export function Timeline({ timeline }: { timeline: RoadmapResponse["timeline"] }) {
  return <>
    <div className={styles.timelineSummary}>
      <div><strong>{timeline.weeklyHoursAssumption} hours per week</strong><span>Study assumption</span></div>
      <div><strong>{timeline.estimatedWeeks.minimum}-{timeline.estimatedWeeks.maximum} weeks</strong><span>Estimated duration</span></div>
      <div><strong>Start applying in week {timeline.applicationStartWeek}</strong><span>Application marker</span></div>
      <div><strong>{timeline.targetDateAssessment}</strong><span>Target date</span></div>
    </div>
    <p>{timeline.targetDateExplanation}</p>
    <ol className={styles.weeks}>{timeline.weeks.map((week) => <li key={week.week}><span>Week {week.week}</span><div><strong>{week.focus}</strong><p>{week.deliverables.join("; ")}</p><small>Phases {week.phaseNumbers.join(", ")}</small></div></li>)}</ol>
  </>;
}
