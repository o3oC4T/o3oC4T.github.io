// Personal content from Yeong Choi's supplied Notion portfolio.
// Unknown dates, placements, abstracts, and links are intentionally omitted.
import { theme } from './theme.js';
export const profile = {
  name: '최영',
  englishName: 'Yeong Choi',
  email: 'ilhsh4874@gmail.com',
  universityEmail: 'ilhsh4874@korea.ac.kr',
  github: 'https://github.com/o3oC4T',
  instagram: 'https://www.instagram.com/ilh_sh/',
  discord: 'you_me._.',
  university: '고려대학교',
  department: '인공지능사이버보안학과',
  fields: ['Digital Forensics', 'Incident Response', 'AI'],
};

export const icons = {
  document: ['M5 2H14L20 8V22H5Z', 'M14 2V8H20', 'M8 12H17M8 16H17M8 19H14'],
  trophy: ['M7 3H17V9A5 5 0 0 1 7 9Z', 'M7 5H3V8A4 4 0 0 0 7 12M17 5H21V8A4 4 0 0 1 17 12', 'M12 14V20M7 22H17M9 20H15'],
  nodes: ['M9 3H15V9H9Z', 'M2 16H8V22H2ZM16 16H22V22H16Z', 'M12 9V13M5 16V13H19V16'],
  flag: ['M5 3H13L15 5H21V15H14L12 13H5Z', 'M5 2V22'],
  medal: ['M12 9A6 6 0 1 0 12 21A6 6 0 1 0 12 9Z', 'M8 10L3 2H9L12 7L15 2H21L16 10', 'M12 12L13 14L15 14L13.5 16L14 18L12 17L10 18L10.5 16L9 14H11Z'],
  book: ['M12 5C9 2 5 2 2 3V20C6 19 9 19 12 22C15 19 18 19 22 20V3C18 2 15 2 12 5Z', 'M12 5V22M5 7H9M5 11H9M15 7H19M15 11H19'],
};

export const research = [
  {
    title: 'Evidence-Scoped Multi-Agent Network Defense with Predicate Chains',
    venue: 'WISA 2026 · Poster Session',
    role: 'Co-First Author',
    number: '202',
    tags: ['Multi-Agent', 'Network Defense', 'Predicate Chains'],
  },
  {
    title: 'Evidence-Grounded Chain Reconstruction for Attack Investigation',
    venue: 'WISA 2026 · Poster Session',
    role: 'Co-Second Author',
    number: '200',
    tags: ['Evidence-Grounded', 'Chain Reconstruction', 'Attack Investigation'],
  },
];

export const ctf = [
  { name: 'DEFCON 34', result: '7th place', note: 'Jinddabi’s · Finalist · Leader', featured: true },
  { name: 'Black Hat MEA 2026', result: '3rd place', featured: true },
  { name: 'ASIS CTF Quals 2026', result: '3rd place', featured: true },
  { name: 'INCOGNITO CTF QUALS 2026', result: '최우수상' },
  { name: 'HackTheon Sejong 2026', result: '우수상', note: 'Finalist' },
  { name: 'CCE 2026', result: 'Finalist' },
  { name: '대구사이버공격방어대회', result: 'Finalist' },
];

export const rubiya = [
  { name: 'ASIS CTF Finals 2025', result: '3rd place' },
  { name: 'UofCTF 2025', result: '8th place' },
  { name: '0xL4ugh CTF', result: '4th place' },
  { name: 'LilacCTF 2026', result: '21st place' },
  { name: 'PascalCTF 2026', result: '3rd place' },
  { name: 'LA CTF 2026', result: '17th place' },
  { name: '0xFUN CTF', result: '4th place' },
  { name: 'BITS CTF', result: '2nd place' },
  { name: 'BKCTF 2026', result: '11th place' },
  { name: 'THJCC CTF 2026', result: '1st place' },
  { name: 'UniVsThreats26 Quals CTF', result: '2nd place' },
  { name: 'EHAX CTF 2026', result: '12th place' },
];

export const team = [
  { name: 'MntcrlCTF 2026', result: 'Winner · 1st place', featured: true },
  { name: 'NCTF', result: '3rd place' },
  { name: 'PutcCTF 2026', result: '3rd place' },
  { name: 'TaipanByte CTF', result: '11th place' },
  { name: 'AxiomCTF 2026 Quals', result: '13th place' },
  { name: 'THEM?!CTF 2026', result: '10th place' },
];

export const honors = [
  { name: '2026 한국산업단지공단 모의 해킹메일 경진대회', result: '특상 · 1등', featured: true },
  { name: 'HDFC 2026', result: '우수상' },
  { name: 'Sejong AX hackathon', result: 'Excellence Award' },
  { name: '제 10회 정보보호영재교육원 개인전', result: '장려상 · 7등' },
  { name: '제 10회 정보보호영재교육원 경진대회', result: '장려상 · 5등' },
  { name: '제 9회 정보보호영재교육원 개인전', result: '노력상 · 11등' },
];

export const education = [
  { period: '2026 — 현재', school: '고려대학교', course: '인공지능사이버보안학과 · 재학', current: true },
  { period: '2023 — 2026', school: '포항고등학교', course: '졸업' },
  { period: '2024', school: '대구대학교 정보보호영재교육원', course: '고등전문사사' },
  { period: '2023', school: '대구대학교 정보보호영재교육원', course: '고등기초심화' },
  { period: '2022', school: '경북대학교 과학영재교육원', course: '전문사사' },
  { period: '2021', school: '경북대학교 과학영재교육원', course: '중등심화' },
  { period: '2020', school: '경북대학교 과학영재교육원', course: '중등기초' },
  { period: '2019', school: '경북대학교 과학영재교육원', course: '초등과정' },
  { period: '2018', school: '대구대학교 융합과학영재교육원', course: '초등과정' },
];

export const cards = [
  { id: 'research', label: 'Research', symbol: 'document', accent: 'pink', color: theme.colors.pink, eyebrow: 'PAPERS & POSTERS', subtitle: '근거를 연결하는 보안 연구.', description: 'WISA 2026 Poster Session의 두 연구와 저자 역할을 소개합니다.', meta: ['WISA 2026', '2 Posters', 'AI × Security'] },
  { id: 'ctf', label: 'CTF', symbol: 'trophy', accent: 'sky', color: theme.colors.sky, eyebrow: 'CAPTURE THE FLAG', subtitle: '문제를 풀고, 한계를 넓히다.', description: '국내외 보안 경진대회에서의 본선 진출과 수상 기록입니다.', meta: ['Competitions', 'Finals', 'Awards'] },
  { id: 'rubiyalab', label: 'RubiyaLAB', symbol: 'nodes', accent: 'lilac', color: theme.colors.lilac, eyebrow: 'TEAM / MEMBER', subtitle: '함께 풀어낸 기록.', description: 'RubiyaLAB CTF 팀원으로 참여한 대회와 팀의 성적입니다.', meta: ['CTF Team', 'Member', '12 Results'] },
  { id: 'team-o3o', label: 'Team o3o', symbol: 'flag', accent: 'peach', color: theme.colors.peach, eyebrow: 'ACADEMIC TEAM / LEADER', subtitle: '팀과 함께 만드는 다음 단계.', description: '학술팀 Team o3o의 리더로 활동하며 쌓은 대회 기록입니다.', meta: ['Academic Team', 'Leader', '6 Results'] },
  { id: 'honors', label: 'Honors', symbol: 'medal', accent: 'mint', color: theme.colors.mint, eyebrow: 'RECOGNITION & ACTIVITIES', subtitle: '배움이 성과로 이어지는 순간.', description: '정보보호 영재교육, 보안 경진대회, 해커톤의 수상과 그 밖의 활동입니다.', meta: ['Awards', 'Hackathon', 'Activities'] },
  { id: 'education', label: 'Education', symbol: 'book', accent: 'rainbow', color: theme.colors.rainbow, eyebrow: 'LEARNING / 2018 — PRESENT', subtitle: '호기심에서 시작한 여정.', description: '과학 영재교육에서 인공지능사이버보안 전공까지, 배움의 기록입니다.', meta: ['Korea University', 'AICS', '2026 — Present'] },
];
