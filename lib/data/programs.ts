export type Program = {
  name: string;
  avg: string;
  req: string;
  deadline: string;
  code: string;
};

export type University = {
  key: string;
  name: string;
  short: string;
  programs: Program[];
};

/** Planning references only; confirm current requirements and deadlines with each university. */
export const UNIVERSITIES: University[] = [
  {
    key: 'waterloo',
    name: 'University of Waterloo',
    short: 'Waterloo',
    programs: [
      {
        name: 'Computer Science (BCS)',
        avg: '95%+',
        req: 'Admission Information Form (AIF), Euclid Math Contest (strongly recommended), Video Interview.',
        deadline: 'Feb 15',
        code: 'waterloo_cs',
      },
      {
        name: 'Engineering (All Streams - BASc)',
        avg: '93%+',
        req: 'Mandatory AIF, Online Video Interview (Kira Talent), Adjusted Factor consideration.',
        deadline: 'Feb 1',
        code: 'waterloo_eng',
      },
      {
        name: 'Computing and Financial Management (CFM)',
        avg: '93%+',
        req: 'Mandatory AIF and Online Video Interview.',
        deadline: 'Feb 15',
        code: 'waterloo_cs',
      },
      {
        name: 'Accounting and Financial Management (AFM)',
        avg: '88%+',
        req: 'Admission Information Form (AIF) & Online Admission Interview.',
        deadline: 'Feb 15',
        code: 'queens_comm',
      },
      {
        name: 'Geography & Aviation / Science & Aviation',
        avg: '85%+',
        req: 'Aviation Information Form, personal profile, and flight test screening.',
        deadline: 'Feb 15',
        code: 'waterloo_eng',
      },
    ],
  },
  {
    key: 'uoft',
    name: 'University of Toronto',
    short: 'U of T',
    programs: [
      {
        name: 'Faculty of Applied Science & Engineering',
        avg: '93%+',
        req: 'Online Student Profile, Extracurricular list, Video interview & written question component.',
        deadline: 'Jan 15',
        code: 'uoft_eng',
      },
      {
        name: 'Rotman Commerce',
        avg: '88% - 92%',
        req: 'Supplemental Application including timed written essay and video response questions.',
        deadline: 'Feb 1',
        code: 'rotman',
      },
      {
        name: 'Computer Science (St. George / UTM)',
        avg: '93%+',
        req: 'Supplemental Application Form (SAF) / Computer Science Supplemental Application.',
        deadline: 'Feb 1',
        code: 'waterloo_cs',
      },
      {
        name: 'John H. Daniels Faculty of Architecture',
        avg: '85%+',
        req: "'One Idea' application prompt and optional creative portfolio submission.",
        deadline: 'Feb 1',
        code: 'uoft_daniels',
      },
      {
        name: 'Kinesiology & Physical Education',
        avg: '82%+',
        req: 'Statement of Intent / Supplementary Profile.',
        deadline: 'Feb 1',
        code: 'queens_health',
      },
      {
        name: 'Music (Performance / History)',
        avg: '75%+',
        req: 'Music Questionnaire, theory testing, and auditions.',
        deadline: 'Jan 15',
        code: 'york_ampd',
      },
    ],
  },
  {
    key: 'mcmaster',
    name: 'McMaster University',
    short: 'McMaster',
    programs: [
      {
        name: 'Health Sciences (BHSc)',
        avg: '95%+',
        req: 'Supplementary Application Essay questions assessing critical thinking and unorthodox perspectives.',
        deadline: 'Feb 1',
        code: 'mac_health',
      },
      {
        name: 'Engineering & iBioMed',
        avg: '90%+',
        req: 'Kira Talent video and written component evaluating problem-solving and collaboration.',
        deadline: 'Jan 28',
        code: 'mcmaster_eng',
      },
      {
        name: 'Integrated Business and Humanities (IBH)',
        avg: '88% - 91%',
        req: 'Supplemental application form and Kira Talent online interview.',
        deadline: 'Feb 1',
        code: 'mcmaster_ibh',
      },
      {
        name: 'Arts & Science',
        avg: '90%+',
        req: 'Mandatory Supplementary Application evaluating interdisciplinary writing and self-reflection.',
        deadline: 'Feb 1',
        code: 'mac_health',
      },
      {
        name: 'Nursing (BScN)',
        avg: '88%+',
        req: 'CASPer situational judgment test.',
        deadline: 'Early Feb',
        code: 'queens_health',
      },
    ],
  },
  {
    key: 'queens',
    name: "Queen's University",
    short: "Queen's",
    programs: [
      {
        name: 'Smith School of Commerce',
        avg: '90%+',
        req: 'Personal Statement of Experience (PSE), Supplementary Essay (SE), and Kira Talent video interview.',
        deadline: 'Feb 15',
        code: 'queens_comm',
      },
      {
        name: 'Health Sciences',
        avg: '93%+',
        req: 'Declaration of Supplementary Experience / Essay components evaluating context and healthcare interest.',
        deadline: 'Feb 15',
        code: 'queens_health',
      },
      {
        name: 'Bachelor of Nursing (BNSc)',
        avg: '88%+',
        req: 'Personal Statement of Experience (PSE).',
        deadline: 'Feb 15',
        code: 'queens_comm',
      },
      {
        name: 'Computing / Engineering',
        avg: '88%+',
        req: 'Optional/Recommended Personal Statement of Experience (PSE) for borderline applicants.',
        deadline: 'Feb 15',
        code: 'waterloo_eng',
      },
    ],
  },
  {
    key: 'western',
    name: 'Western University & Ivey',
    short: 'Western / Ivey',
    programs: [
      {
        name: 'Ivey Business School (AEO)',
        avg: '90%+',
        req: 'Separate Ivey application highlighting leadership, extracurricular breadth/depth, references, and Kira video.',
        deadline: 'Jan 15',
        code: 'ivey',
      },
      {
        name: 'Engineering',
        avg: '88%+',
        req: 'CASPer online situational judgment test.',
        deadline: 'March',
        code: 'waterloo_eng',
      },
      {
        name: 'Schulich School of Medicine (Medical Sciences)',
        avg: '90%+',
        req: 'National Health Forum / Supplementary questionnaire.',
        deadline: 'Feb 15',
        code: 'queens_health',
      },
    ],
  },
  {
    key: 'york',
    name: 'York University',
    short: 'York / Schulich',
    programs: [
      {
        name: 'Schulich School of Business',
        avg: '90%+',
        req: 'Online application form, leadership profile, and a timed video interview question.',
        deadline: 'Feb 1',
        code: 'schulich',
      },
      {
        name: 'AMPD (Film, Acting, Design, Music)',
        avg: '80% - 85%',
        req: 'Statement of Intent, creative portfolio, auditions, or portfolio reviews depending on major.',
        deadline: 'Feb 15',
        code: 'york_ampd',
      },
      {
        name: 'Bachelor of Education (BEd)',
        avg: '80%+',
        req: 'Supplementary Information Form (SIF) including 2 online letters of reference.',
        deadline: 'Feb 1',
        code: 'laurier_bba',
      },
    ],
  },
  {
    key: 'laurier',
    name: 'Wilfrid Laurier University',
    short: 'Laurier',
    programs: [
      {
        name: 'Bachelor of Business Administration (BBA - Waterloo/Brantford)',
        avg: '88%+',
        req: 'Student Profile (ABS) detailing employment, extracurriculars, and personal achievements.',
        deadline: 'Feb 15',
        code: 'laurier_bba',
      },
      {
        name: 'Double Degree (Laurier BBA & Waterloo CS/Math)',
        avg: '94%+',
        req: 'Both Laurier ABS and Waterloo AIF / Video Interview.',
        deadline: 'Feb 1 / 15',
        code: 'waterloo_cs',
      },
    ],
  },
  {
    key: 'tmu',
    name: 'Toronto Metropolitan University & Others',
    short: 'TMU & Others',
    programs: [
      {
        name: 'The Creative School (Media Production, Journalism, Performance)',
        avg: '80%+',
        req: 'Creative portfolio, statements of intent, or auditions.',
        deadline: 'Feb 15',
        code: 'tmu_creative',
      },
      {
        name: 'Architectural Science',
        avg: '85%+',
        req: 'Mandatory portfolio submission and architectural questionnaire.',
        deadline: 'Feb 15',
        code: 'uoft_daniels',
      },
      {
        name: 'University of Ottawa — Telfer School of Management',
        avg: '84%+',
        req: 'Declaration of Experience form for top-applicant consideration.',
        deadline: 'Mar 31',
        code: 'schulich',
      },
    ],
  },
];

export const ALL_PROGRAMS: Program[] = UNIVERSITIES.flatMap((u) => u.programs);

export function findProgram(code: string): Program | undefined {
  return ALL_PROGRAMS.find((p) => p.code === code);
}

export function universityForCode(code: string): University | undefined {
  return UNIVERSITIES.find((u) => u.programs.some((p) => p.code === code));
}
