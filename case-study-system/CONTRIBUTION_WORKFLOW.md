# Case Study Contribution Workflow

**Version:** 1.0
**Supported Languages:** English, 한국어, 日本語

---

## Overview

The Case Study System guides users from initial submission through peer review to publication. This document outlines the complete workflow, acceptance criteria, and best practices.

---

## Workflow States & Transitions

```
┌─────────────┐
│   DRAFT     │  User writing, saving progress
└──────┬──────┘
       │ (Submit for Review)
       ▼
┌──────────────────┐
│ AWAITING REVIEW  │  Queue for peer review (1-3 weeks)
└──────┬───────────┘
       │
       ├─ (Request Changes) ──▶ DRAFT (author revises)
       │
       ├─ (Approved) ──▶ ┌──────────────┐
       │                 │  SCHEDULED   │  Publish on set date
       │                 └──────┬───────┘
       │                        │ (Publish)
       │                        ▼
       │                 ┌──────────────┐
       │                 │ PUBLISHED    │  Live on platform
       │                 └──────────────┘
       │
       └─ (Rejected) ──▶ ARCHIVED  (can resubmit)
```

---

## Detailed Workflow Stages

### Stage 1: DRAFT

**Purpose:** Author creates and refines case study

**Duration:** Self-paced (typically 1-4 weeks depending on complexity)

**Entry Point:**
- Click "Create New Case Study"
- System generates form with template
- Auto-saves every 5 minutes

**Key Features:**
- Full editor with markdown preview
- Auto-save to user account
- Save as private draft (not visible to others)
- Can invite collaborators to edit together
- Download as PDF (private)

**Exit Actions:**
- **Save Draft:** Continue working later
- **Preview:** See how it will look published
- **Submit for Review:** Move to review stage (requires all required fields)

**Required Before Submission:**
```
✓ Title (min 10 characters)
✓ Executive Summary (150-200 words)
✓ Challenge Statement (200-300 words)
✓ Implementation Overview (300+ words)
✓ Key Metrics (minimum 5)
✓ One team/project photo
✓ Proof of metrics (screenshot/data export)
```

**Tips for Authors:**
- Write for a 6th-grade reading level (Flesch-Kincaid grade)
- Use active voice and concrete examples
- Include 3-5 screenshots showing before/after
- Provide code snippets (10-20 lines max each)
- Be honest about challenges and failures
- Include metrics from monitoring/analytics tools

---

### Stage 2: AWAITING REVIEW

**Purpose:** Moderators verify quality, accuracy, and completeness

**Duration:** 1-3 weeks (depends on review queue)

**Process:**

1. **Automated Checks (1-2 hours)**
   - Grammar & spelling check
   - Readability score calculation
   - Link validation
   - Image quality verification
   - Metrics format validation

2. **Assigned Reviewer (3-7 days)**
   - Domain expert assigned based on industry/category
   - Reviews for:
     - Technical accuracy
     - Clarity and organization
     - Completeness
     - Appropriate metrics
     - Compliance with guidelines
   - Provides feedback via inline comments

3. **Author Response & Revision (1-2 weeks)**
   - Author receives review feedback
   - Can respond to comments
   - Makes requested changes
   - Resubmits for approval

**Review Feedback Example:**
```
Reviewer: @jane_tech_writer
Comment: "Executive Summary"
Location: Section 1.1
Issue: Readability score is 45 (target 60+)
Type: Improvement Needed

Suggestion: Shorten sentences. "We developed a platform
that processes X, handles Y, and delivers Z to 50K users"
is clearer than the current version.

Auto-linked resources: [Hemingway Editor](#)
```

**Exit Actions:**
- **Request Changes:** Author revises (returns to DRAFT status)
- **Approved:** Moved to SCHEDULED status
- **Rejected:** Moved to ARCHIVED with feedback for resubmission

**Rejection Criteria:**
- Inaccurate or unverifiable metrics
- Harmful or unethical content
- Spam or promotional content
- Incomplete required sections
- Plagiarism or copyright issues

---

### Stage 3: SCHEDULED (Approved, Awaiting Publication)

**Purpose:** Approved content scheduled for publication

**Duration:** 1-7 days (author selects publication date)

**Features:**
- Content locked (no changes after approval)
- Author can select publication date
- Get email reminder 24 hours before publish
- Social media assets auto-generated
- Announcement email drafted

**Pre-Publication Checklist:**
- [ ] Final readability check
- [ ] All links active and relevant
- [ ] Images optimized for web
- [ ] Author bio and photo ready
- [ ] Language versions prepared (if applicable)

**Publication Actions:**
- **Publish Now:** Immediate publication
- **Schedule:** Set automatic publication date
- **Unpublish Draft:** Return to DRAFT for major revisions

---

### Stage 4: PUBLISHED

**Purpose:** Case study live on platform, discoverable, shareable

**Duration:** Permanent (unless author requests removal)

**Features:**
- Publicly visible and searchable
- Appears in relevant category pages
- Included in search results
- Shareable via link (social media, email)
- Comments and reactions enabled
- Analytics tracking (views, engagement)

**Post-Publication:**
- Weekly view/engagement metrics
- Author can respond to comments
- Editor can flag for updates if needed
- Annual review to ensure accuracy
- Can be updated (creates version history)

**End of Life:**
- Mark as "Legacy" if technology outdated
- Author can request removal
- Archive after 5+ years of inactivity

---

## Submission Form Structure

### Section 1: Case Study Metadata
```yaml
Title:
[text input - max 100 chars]

Slug (URL):
[auto-generated from title, editable]

Author Information:
- Full Name: [text]
- Email: [email]
- Organization: [text]
- Website/LinkedIn: [url, optional]
- Author Bio: [textarea - max 200 chars]
- Author Photo: [image upload - 400x400px]

Industry Category:
[dropdown: Web Dev, Mobile, Data Science, DevOps, Cloud, Other]

Use Case Category:
[dropdown: Bug Fixing, Feature Development, Code Review,
           Refactoring, Testing, Documentation, Infrastructure]

Team Size:
[dropdown: Solo, Small (2-5), Medium (6-15), Large (16+)]

Difficulty Level:
[dropdown: Beginner-Friendly, Intermediate, Advanced]

Visibility:
[radio: Public, Private (team-only), Draft]
```

### Section 2: Executive Summary
```yaml
Executive Summary (150-200 words):
[textarea with character counter]

Key Impact Summary:
[3-5 key bullet points highlighting main results]

Project Timeline:
[Start date] to [End date]
Estimated reading time: [auto-calculated]
```

### Section 3: Project Overview
```yaml
Industry Context:
[textarea - describe market, challenges]

Team Composition Table:
[Form to add team members with role, count, experience]

Primary Tech Stack:
[Multi-select from pre-defined list + custom additions]

Project Goals (1-5):
[List with success criteria for each]
```

### Section 4: Challenge Statement
```yaml
Primary Problem Description:
[textarea, 200-300 words]

Initial Constraints:
[Checklist: Timeline, Resources, Talent, Technical debt, etc.]

Success Criteria:
[Form to add 3+ specific, measurable outcomes]
```

### Section 5: Claude Code Approach
```yaml
Features Used:
[Checkboxes: Code generation, Bug fixing, Refactoring,
             Test generation, Documentation, Other]

Agent Configuration:
[Text area describing how agents were set up]

Custom Skills Created:
[Table: Skill Name, Purpose, Created By]
- Add/Remove rows dynamically

Workflows Enabled:
[Checkboxes for pre-defined workflows]
```

### Section 6: Implementation Walkthrough
```yaml
Number of Phases: [number input, 1-5]

For Each Phase:
- Phase Name: [text]
- Duration: [weeks]
- Objectives: [bullet points]
- Steps Taken: [numbered list]
- Key Decisions: [bullet points]
- Challenges: [description]
- Resolution: [description]
- Code Snippets: [before/after code blocks]
- Tools Used: [list]
- Metrics During Phase: [metrics table]
```

### Section 7: Before & After Comparison
```yaml
Add Custom Metrics:
[Dynamic table to add metrics with before/after values]

Pre-fill Common Metrics:
- Code Duplication %
- Test Coverage %
- Cyclomatic Complexity
- Code Review Time
- Lines of Code/Dev/Day
- Bugs Found Post-Deploy
- Team Satisfaction (1-10)
- Technical Debt Issues
- Time to Production
- etc.

Visualization Type:
[Select: Table, Chart, Text description]
```

### Section 8: Lessons Learned
```yaml
What Worked Well (1-5):
For each:
- Title: [text]
- Impact Level: [High, Medium, Low]
- Description: [textarea]
- Recommendation: [textarea]

Challenges & Solutions (1-5):
For each:
- Challenge: [text]
- Root Cause: [textarea]
- Solution: [textarea]
- Result: [textarea]

Anti-patterns to Avoid:
[List with explanations]

Key Insights:
[List of 3-5 key insights]

Team Recommendations:
[Actionable advice for similar projects]
```

### Section 9: CLAUDE.md & Skills
```yaml
CLAUDE.md Configuration:
[Code block editor with syntax highlighting]

Custom Skills Created:
[Table: Skill Name, File Path, Purpose]

Workflows Activated:
[Checkboxes for pre-defined workflows with descriptions]

Configuration Evolution:
[Timeline showing how CLAUDE.md evolved]
```

### Section 10: Metrics & Results
```yaml
Timeline/Velocity:
[Gantt chart or ASCII timeline]

Quantitative Results Table:
[Dynamic table with metrics, before/after, % change]

ROI Calculation:
[Auto-calculated based on metrics entered]

Risk Reduction:
[Table showing risk types and before/after]

Learning Curve:
[Timeline of improvements]
```

### Section 11: Conclusion & Resources
```yaml
Summary of Achievement:
[textarea]

Key Success Factors:
[3-5 bullet points]

What We'd Do Differently:
[Bullet points]

Internal Documentation Links:
[URLs to docs, guides, etc.]

External Resources:
[URLs to external docs, tools]

Team Contacts:
[Names and roles of key people]

Related Case Studies:
[Links to other relevant case studies]
```

### Section 12: Multi-Language Support
```yaml
Available Languages:
[Checkboxes: English, 한국어, 日本語]

Original Language:
[Radio: English, Korean, Japanese]

Translation:
[For each language other than original]
- [ ] I will provide translation
- [ ] Please auto-translate (disclaimer shown)
- [ ] Will translate later (marked as draft)

Translated Content:
[Editor for each language with tabs]
```

---

## Quality Guidelines for Authors

### Writing Quality

#### Readability Standards
- **Target Grade Level:** 8 (easy to understand)
- **Flesch Reading Ease:** 60-70 (Standard)
- **Average Sentence Length:** 15-20 words
- **Paragraph Length:** 3-5 sentences
- **Passive Voice:** < 10%

**Tool:** System provides real-time readability feedback

#### Clarity Checklist
- [ ] Each section has a clear purpose
- [ ] Jargon explained on first use
- [ ] Examples are concrete and relatable
- [ ] Conclusions directly support claims
- [ ] No unnecessary hedging ("might," "possibly," "perhaps")

#### Structure Checklist
- [ ] Logical flow from section to section
- [ ] Headings are descriptive
- [ ] Code snippets are formatted correctly
- [ ] Tables have clear headers
- [ ] Lists use parallel structure

### Evidence & Metrics

#### Required Evidence
- **Metrics:** Must come from monitoring/analytics tools (screenshots required)
  - Example: DataDog dashboard, Google Analytics, custom metrics
  - Show: Before vs. After with dates
- **Code Snippets:** Include 3-5 examples showing key improvements
  - Format: Code blocks with language specified
  - Keep to 10-20 lines per snippet
  - Highlight key changes with comments
- **Team/Project Photos:** 1-2 high-quality images (min 1000px width)
  - Show: Team working, product in use, or relevant context
  - Can be blurred for privacy
- **Timeline Evidence:** Screenshots or exports of project management tools
  - Show: Velocity, burndown, or timeline

#### Metric Verification
All quantitative claims must be substantiated:

**Strong Evidence:**
- "We reduced deployment time from 2 hours to 15 minutes (verified via GitHub Actions logs, avg of 10 deployments)"
- "Code coverage improved from 62% to 92% (verified via Jest coverage reports)"

**Weak Evidence:**
- "We probably saved lots of time"
- "Our team was much happier"
- "The code was significantly better"

**Guidance:**
- If you claim a metric, provide proof
- Use ranges if exact numbers unavailable
- Explain methodology if non-standard

### Technical Accuracy

#### Verification Requirements
- All technical facts must be accurate
- If describing Claude Code features, they must be current (as of 2026)
- Code examples must be syntactically correct
- Third-party tools/services referenced must exist

#### Reviewer Verification
Reviewers will:
- Check all claims against documentation
- Verify metrics are plausible
- Test code examples if feasible
- Validate tool/service references
- Request corrections if needed

### Completeness Checklist

**Minimum Requirements:**
- [ ] All 12 sections substantially filled
- [ ] 2000+ words total content
- [ ] 5+ metrics provided
- [ ] 3+ code or configuration examples
- [ ] 2+ supporting images
- [ ] 3+ lessons or insights
- [ ] Clear before/after comparison

**Strongly Recommended:**
- [ ] 3000+ words (more comprehensive)
- [ ] 8+ metrics (thorough documentation)
- [ ] 5+ code examples (practical guidance)
- [ ] 3+ images (visual support)
- [ ] Video walkthrough (if complex)
- [ ] Downloadable CLAUDE.md file

---

## Review Criteria for Moderators

### Editorial Review Checklist

#### Content Quality (40 points)
- [ ] Readability score 60+: 10 points
- [ ] Clear, logical structure: 10 points
- [ ] Concrete examples & evidence: 10 points
- [ ] Appropriate length & depth: 5 points
- [ ] Engaging and well-written: 5 points

#### Technical Accuracy (30 points)
- [ ] Claims are accurate & verifiable: 10 points
- [ ] Code examples are correct: 10 points
- [ ] Metrics properly documented: 10 points

#### Completeness (20 points)
- [ ] All required sections present: 10 points
- [ ] Metrics and evidence provided: 10 points

#### Appropriateness (10 points)
- [ ] Content aligned with guidelines: 5 points
- [ ] No plagiarism or copyright issues: 5 points

**Approval Threshold:** 80+ points (out of 100)

**Minor Issues (60-79):** Request revisions, can approve with changes
**Major Issues (< 60):** Reject with detailed feedback for resubmission

### Reviewer Feedback Template

```markdown
## Review Summary

**Status:** [Approved | Request Changes | Rejected]
**Score:** [X] / 100
**Reviewer:** @[reviewer_name]
**Date:** YYYY-MM-DD

## Strengths
1. [Positive aspects]
2. [What's well done]
3. [Unique insights]

## Areas for Improvement

### Critical (Must Fix)
- [ ] **Issue:** [Description]
  - **Location:** [Section, line number]
  - **Severity:** [Blocker | High | Medium]
  - **Suggestion:** [How to fix]

### Important (Should Fix)
- [ ] **Issue:** [Description]
  - **Location:** [Section, line number]
  - **Suggestion:** [How to fix]

### Nice to Have (Optional)
- [ ] **Suggestion:** [Enhancement idea]

## Metrics & Evidence

- [ ] All claims substantiated with evidence
- [ ] Metrics format correct
- [ ] Screenshots/data provided
- [ ] Calculation methodology clear

## Final Notes

[Additional context, questions, or praise]

---

**Next Steps:** Author has 2 weeks to respond to feedback and resubmit.
```

---

## Review Timeline & SLA

```
Day 1-2:   Automated checks run
Day 3-5:   Reviewer assigned & initial review
Day 6-10:  Feedback provided to author
Day 11-17: Author revises and resubmits
Day 18-21: Final review and approval
Day 22-28: Author schedules publication
```

**For Urgent Cases:** Email managing-editor@claudecode.com to request expedited review (48-72 hours)

---

## Version Control & Updates

### Case Study Updates
After publication, authors can request updates:

**Minor Updates (typos, link fixes):** < 1 week turnaround
**Significant Updates (new metrics, expanded sections):** Creates new version
**Major Revisions:** Re-reviewed like original submission

### Version History
Platform maintains version history:
- Original publication date
- All revision dates
- Change summaries
- Ability to revert if needed

---

## Incentives & Recognition

### Featured Case Studies
Monthly "Featured Case Study" selection:
- Author interview/spotlight
- Social media promotion
- Featured on homepage for 1 month
- Included in weekly newsletter

### Badges
Authors can earn badges:
- First Case Study Published
- Comprehensive Case Study (3000+ words)
- Expert Reviewer (10+ reviews completed)
- Influencer (10K+ views)
- Top Rated (4.5+ star average)

---

## Contributor Guidelines

### Conflict of Interest
- Disclose if promoting your own products/services
- Acknowledge if case study involves client work
- Note if company paid for review/publication

### Attribution & Ethics
- Obtain permission from team members mentioned
- Anonymize sensitive company/customer data
- Don't claim credit for others' work
- Acknowledge open source tools/libraries

### Promotional Content
**Allowed:**
- Mentioning tools you used
- Linking to relevant documentation
- Recommending best practices
- Honest product/service discussion

**Not Allowed:**
- Promotional language ("best," "greatest," "only solution")
- Misleading metrics
- Paying for reviews or prominence
- Astroturfing (fake stories)

---

## Support & Resources

### Author Support
- [Writing Tips & Best Practices](#)
- [How to Get Great Metrics](#)
- [Markdown Reference Guide](#)
- [FAQ for Case Study Authors](#)

### Reviewer Guidelines
- [How to Review a Case Study](#)
- [Quality Standards Checklist](#)
- [Reviewer Training Course](#)
- [FAQ for Reviewers](#)

### Contact
- **Questions?** cases@claudecode.com
- **Technical Issues?** support@claudecode.com
- **Content Issues?** moderator@claudecode.com

---

**Document Version:** 1.0
**Last Updated:** 2026-03-12
**Status:** Active
**Languages:** English | [한국어](#) | [日本語](#)
