"use client";

import { Autocomplete, AutocompleteItem, Input } from "@heroui/react";
import { Plus, Sparkles, Trash2, X } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";

import { RoadmapRequestSchema, type RoadmapRequest } from "@/lib/contracts/roadmap";
import type { RoadmapDraft } from "@/features/generator/generator-machine";
import styles from "./generator.module.css";

type Props = {
  input: RoadmapDraft;
  submitting: boolean;
  onChange: (input: RoadmapDraft) => void;
  onSubmit: (input: RoadmapRequest) => void;
  onCancel: () => void;
};

type FieldErrors = Record<string, string>;

const experienceOptions = ["0", "1", "2", "3", "4-5", "6+"] as const;

export function GeneratorForm({ input, submitting, onChange, onSubmit, onCancel }: Props) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const nextSkillId = useRef(input.profile.skills.length);
  const skillIds = useRef(input.profile.skills.map((_, index) => `skill-${index}`));

  const setRoot = <K extends keyof RoadmapDraft>(key: K, value: RoadmapDraft[K]) => {
    onChange({ ...input, [key]: value });
  };
  const setProfile = <K extends keyof RoadmapDraft["profile"]>(key: K, value: RoadmapDraft["profile"][K]) => {
    onChange({ ...input, profile: { ...input.profile, [key]: value } });
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = RoadmapRequestSchema.safeParse({ ...input, consentToAIProcessing: true });
    if (parsed.success) {
      setErrors({});
      onSubmit(parsed.data);
      return;
    }

    const nextErrors: FieldErrors = {};
    parsed.error.issues.forEach((issue) => {
      const path = issue.path.join(".");
      if (!nextErrors[path]) nextErrors[path] = issue.message;
    });
    setErrors(nextErrors);
    const firstPath = Object.keys(nextErrors)[0];
    if (firstPath) {
      document.querySelector<HTMLElement>(`[name="${firstPath}"]`)?.focus();
    }
  };

  const addSkill = () => {
    skillIds.current.push(`skill-${nextSkillId.current++}`);
    setProfile("skills", [...input.profile.skills, { name: "", proficiency: "aware" }]);
  };

  const removeSkill = (index: number) => {
    if (input.profile.skills.length === 1) return;
    skillIds.current.splice(index, 1);
    setProfile("skills", input.profile.skills.filter((_, skillIndex) => skillIndex !== index));
  };

  const updateSkill = (index: number, update: Partial<RoadmapDraft["profile"]["skills"][number]>) => {
    setProfile("skills", input.profile.skills.map((skill, skillIndex) => (
      skillIndex === index ? { ...skill, ...update } : skill
    )));
  };

  return (
    <form className={styles.form} onSubmit={submit} noValidate>
      {Object.keys(errors).length > 0 && (
        <div className={styles.formAlert} role="alert">Please correct the highlighted fields.</div>
      )}

      <div className={styles.formGrid}>
        <section className={styles.jobPanel} aria-labelledby="job-heading">
          <div className={styles.sectionHeading}>
            <div><span className={styles.step}>01</span><h2 id="job-heading">Target opportunity</h2></div>
          </div>
          <div className={styles.field}>
            <label className={styles.requiredLabel} htmlFor="job-description">Job description</label>
            <textarea
              id="job-description"
              name="jobDescription"
              value={input.jobDescription}
              onChange={(event) => setRoot("jobDescription", event.target.value)}
              aria-invalid={Boolean(errors.jobDescription)}
              aria-describedby="job-description-meta"
              disabled={submitting}
              required
              rows={18}
              placeholder="Paste the complete role description, including responsibilities and requirements."
            />
            <span id="job-description-meta" className={styles.fieldMeta}>
              <span className={styles.error}>{errors.jobDescription}</span>
              <span>{input.jobDescription.length.toLocaleString()} / 20,000</span>
            </span>
          </div>
          <label className={styles.field}>
            <span className={styles.requiredLabel}>Target role</span>
            <input
              name="targetRole"
              value={input.targetRole}
              onChange={(event) => setRoot("targetRole", event.target.value)}
              aria-invalid={Boolean(errors.targetRole)}
              disabled={submitting}
              required
              placeholder="Backend Engineer"
            />
            <span className={styles.error}>{errors.targetRole}</span>
          </label>
        </section>

        <section className={styles.profilePanel} aria-labelledby="profile-heading">
          <div className={styles.sectionHeading}>
            <div><span className={styles.step}>02</span><h2 id="profile-heading">Current position</h2></div>
          </div>
          <div className={styles.twoColumns}>
            <div className={styles.field}>
              <Input
                classNames={{
                  base: styles.heroControl,
                  input: styles.heroInput,
                  inputWrapper: styles.heroInputWrapper,
                  label: styles.heroLabel,
                }}
                isDisabled={submitting}
                isInvalid={Boolean(errors["profile.currentRole"])}
                isRequired
                label="Current role or status"
                labelPlacement="outside"
                name="profile.currentRole"
                placeholder="Junior Developer"
                radius="sm"
                size="sm"
                type="text"
                value={input.profile.currentRole}
                variant="bordered"
                onValueChange={(value) => setProfile("currentRole", value)}
              />
              <span className={styles.error}>{errors["profile.currentRole"]}</span>
            </div>
            <div className={styles.field}>
              <Autocomplete
                allowsCustomValue={false}
                classNames={{
                  base: styles.heroControl,
                  clearButton: styles.autocompleteButton,
                  selectorButton: styles.autocompleteButton,
                }}
                inputProps={{
                  classNames: {
                    input: styles.heroInput,
                    inputWrapper: styles.heroInputWrapper,
                    label: styles.heroLabel,
                  },
                }}
                isDisabled={submitting}
                isRequired
                label="Years of relevant experience"
                labelPlacement="outside"
                name="profile.yearsExperience"
                placeholder="Select experience"
                radius="sm"
                selectedKey={input.profile.yearsExperience}
                size="sm"
                variant="bordered"
                onSelectionChange={(key) => {
                  const value = String(key) as RoadmapDraft["profile"]["yearsExperience"];
                  if (experienceOptions.includes(value)) setProfile("yearsExperience", value);
                }}
              >
                {experienceOptions.map((value) => (
                  <AutocompleteItem key={value}>{value}</AutocompleteItem>
                ))}
              </Autocomplete>
            </div>
          </div>

          <div className={styles.skillsHeader}>
            <span className={styles.requiredLabel}>Skills and proficiency</span>
            <button type="button" className={styles.textButton} onClick={addSkill} disabled={submitting}><Plus size={16} /> Add skill</button>
          </div>
          <div className={styles.skillList}>
            {input.profile.skills.map((skill, index) => (
              <div className={styles.skillRow} key={skillIds.current[index]}>
                <label className={styles.srOnly} htmlFor={`skill-name-${index}`}>Skill {index + 1} name</label>
                <input id={`skill-name-${index}`} name={`profile.skills.${index}.name`} value={skill.name} onChange={(event) => updateSkill(index, { name: event.target.value })} disabled={submitting} required placeholder="JavaScript" />
                <label className={styles.srOnly} htmlFor={`skill-level-${index}`}>Skill {index + 1} proficiency</label>
                <select id={`skill-level-${index}`} value={skill.proficiency} onChange={(event) => updateSkill(index, { proficiency: event.target.value as typeof skill.proficiency })} disabled={submitting} required>
                  <option value="aware">Aware</option><option value="practiced">Practiced</option><option value="applied">Applied</option><option value="production">Production</option>
                </select>
                {input.profile.skills.length > 1 && <button type="button" className={styles.iconButton} aria-label={`Remove skill ${index + 1}`} onClick={() => removeSkill(index)} disabled={submitting}><Trash2 size={17} /></button>}
                <span className={styles.rowError}>{errors[`profile.skills.${index}.name`]}</span>
              </div>
            ))}
          </div>
          <span className={styles.error}>{errors["profile.skills"]}</span>

          <div className={styles.twoColumns}>
            <label className={styles.field}><span className={styles.requiredLabel}>Weekly study time</span><select name="profile.weeklyHours" value={input.profile.weeklyHours} onChange={(event) => setProfile("weeklyHours", event.target.value as RoadmapDraft["profile"]["weeklyHours"])} disabled={submitting} required>{['1-5', '6-10', '11-15', '16-20', '20+'].map((value) => <option key={value} value={value}>{value} hours</option>)}</select></label>
            <label className={styles.field}><span>Target application date</span><input type="date" name="profile.targetApplicationDate" value={input.profile.targetApplicationDate} onChange={(event) => setProfile("targetApplicationDate", event.target.value)} disabled={submitting} /><span className={styles.error}>{errors["profile.targetApplicationDate"]}</span></label>
            <label className={styles.field}><span>Learning budget</span><select name="profile.learningBudget" value={input.profile.learningBudget} onChange={(event) => setProfile("learningBudget", event.target.value as RoadmapDraft["profile"]["learningBudget"])} disabled={submitting}><option value="free-only">Free only</option><option value="limited-paid">Limited paid</option><option value="flexible">Flexible</option></select></label>
            <label className={styles.field}><span>Education (optional)</span><input name="profile.education" value={input.profile.education} onChange={(event) => setProfile("education", event.target.value)} disabled={submitting} placeholder="Degree, bootcamp, or self-taught" /></label>
          </div>
          <label className={styles.field}><span>Additional constraints (optional)</span><textarea name="profile.constraints" value={input.profile.constraints} onChange={(event) => setProfile("constraints", event.target.value)} disabled={submitting} rows={3} placeholder="Budget, schedule, or learning preferences" /><span className={styles.error}>{errors["profile.constraints"]}</span></label>
        </section>
      </div>

      <div className={styles.actionBar}>
        <div className={styles.actions}>
          {submitting && <button type="button" className={styles.secondaryButton} onClick={onCancel}><X size={17} /> Cancel generation</button>}
          <button type="submit" className={styles.primaryButton} disabled={submitting} aria-label={submitting ? "Generating roadmap" : "Generate my roadmap"}><Sparkles size={18} />{submitting ? "Generating..." : "Generate my roadmap"}</button>
        </div>
      </div>
    </form>
  );
}
