export type SimulatorProgram = {
  code: string;
  label: string;
  group: string;
  university: string;
  prompts: string[];
};

/** Simulator prompt bank — mirrors the source site exactly. */
export const SIMULATOR_PROGRAMS: SimulatorProgram[] = [
  {
    code: 'queens_comm',
    label: "Queen's Smith Commerce",
    group: 'Business & Commerce',
    university: "Queen's University",
    prompts: [
      'Describe a time when you took initiative to solve an unexpected problem within a team. What was the outcome?',
      'What core value defines your leadership style, and how have you demonstrated it in your school involvement?',
    ],
  },
  {
    code: 'ivey',
    label: 'Western Ivey AEO',
    group: 'Business & Commerce',
    university: 'Western University',
    prompts: [
      'Tell us about a time you experienced a significant setback or failure. How did you adapt and what did you learn?',
      'What is one global business trend or challenge that fascinates you, and why?',
    ],
  },
  {
    code: 'schulich',
    label: 'York Schulich BBA',
    group: 'Business & Commerce',
    university: 'York University',
    prompts: [
      'How do you define ethical leadership when faced with conflicting group interests?',
      'Describe a project where you managed tight deadlines and resource constraints. What was your strategy?',
    ],
  },
  {
    code: 'rotman',
    label: 'UofT Rotman Commerce',
    group: 'Business & Commerce',
    university: 'University of Toronto',
    prompts: [
      'Describe a situation where you had to balance heavy conflicting commitments. How did you prioritize?',
      'What unique perspective or experience do you bring to our diverse student cohort?',
    ],
  },
  {
    code: 'laurier_bba',
    label: 'Laurier BBA (Co-op)',
    group: 'Business & Commerce',
    university: 'Wilfrid Laurier University',
    prompts: [
      'Detail your most meaningful extracurricular involvement and how it shaped your professional goals.',
      'Give an example of how you motivated a disengaged teammate during a group project.',
    ],
  },
  {
    code: 'mcmaster_ibh',
    label: 'McMaster IBH',
    group: 'Business & Commerce',
    university: 'McMaster University',
    prompts: [
      'How can business principles be effectively integrated with humanitarian or social goals?',
      'Describe a time you persuaded a group to adopt an unconventional approach.',
    ],
  },
  {
    code: 'waterloo_eng',
    label: 'Waterloo Engineering (AIF / Video)',
    group: 'Engineering & Computer Science',
    university: 'University of Waterloo',
    prompts: [
      'Engineering Problem Solving: Describe a complex technical or design challenge you tackled in a club or personal project. How did you troubleshoot failures?',
      'Why Waterloo Engineering? Beyond academics and co-op, what specific aspects of our ecosystem align with your career goals?',
    ],
  },
  {
    code: 'waterloo_cs',
    label: 'Waterloo Computer Science (AIF)',
    group: 'Engineering & Computer Science',
    university: 'University of Waterloo',
    prompts: [
      'AIF Prompt: Discuss a software project, algorithmic puzzle, or coding challenge that pushed your problem-solving limits.',
      'Why Computer Science at Waterloo? How do your extracurriculars and background prepare you for rigorous theoretical and practical CS?',
    ],
  },
  {
    code: 'uoft_eng',
    label: 'UofT St. George Engineering',
    group: 'Engineering & Computer Science',
    university: 'University of Toronto',
    prompts: [
      'U of T Engineering Video Prompt: Tell us about a time you had to learn a completely new skill or concept under strict time pressure.',
      'Describe a situation where an engineering or scientific solution had unintended consequences. How would you mitigate them?',
    ],
  },
  {
    code: 'mcmaster_eng',
    label: 'McMaster Engineering / iBioMed',
    group: 'Engineering & Computer Science',
    university: 'McMaster University',
    prompts: [
      'Kira Video Prompt: How do you handle constructive criticism when working in high-stakes team environments?',
      'Describe an instance where you identified an inefficiency in your school or community and designed a practical solution.',
    ],
  },
  {
    code: 'queens_health',
    label: "Queen's Health Sciences",
    group: 'Health Sciences & Nursing',
    university: "Queen's University",
    prompts: [
      'Kira Written/Video Prompt: Discuss a contemporary ethical dilemma in healthcare delivery. What factors should policymakers weigh first?',
      'What personal experience has most shaped your empathy and commitment to healthcare?',
    ],
  },
  {
    code: 'mac_health',
    label: 'McMaster Health Sciences (BHSc)',
    group: 'Health Sciences & Nursing',
    university: 'McMaster University',
    prompts: [
      "McMaster BHSc Essay Prompt: 'Education is not the learning of facts, but the training of the mind to think.' Discuss a time your perspective on a firmly held belief was fundamentally challenged.",
      'If you could allocate a multi-million dollar public health grant between preventative community wellness and advanced acute care hospital research, how would you divide it and why?',
    ],
  },
  {
    code: 'uoft_daniels',
    label: 'UofT Daniels Architecture (One Idea)',
    group: 'Arts, Design & Architecture',
    university: 'University of Toronto',
    prompts: [
      'Daniels One Idea Prompt: Describe an architectural or spatial design issue in your local urban environment. Propose one concrete intervention to improve human interaction with the space.',
    ],
  },
  {
    code: 'tmu_creative',
    label: 'TMU Creative School / Architecture',
    group: 'Arts, Design & Architecture',
    university: 'Toronto Metropolitan University',
    prompts: [
      'Creative School Portfolio Essay: Discuss a piece of media, design, or journalism from the past year that shifted public discourse. What made its narrative effective?',
    ],
  },
  {
    code: 'york_ampd',
    label: 'York AMPD (Film/Acting/Design)',
    group: 'Arts, Design & Architecture',
    university: 'York University',
    prompts: [
      'AMPD Statement of Intent: What artistic medium or storytelling form allows you to express your worldview most effectively, and why?',
    ],
  },
];

export const PROGRAM_GROUPS = [
  'Business & Commerce',
  'Engineering & Computer Science',
  'Health Sciences & Nursing',
  'Arts, Design & Architecture',
] as const;

export function getSimulatorProgram(code: string): SimulatorProgram | undefined {
  return SIMULATOR_PROGRAMS.find((p) => p.code === code);
}
