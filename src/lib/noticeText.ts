export const SCHOOL_NAME = 'Ujala Public School';
export const SCHOOL_NAME_UR = 'اجالا پبلک اسکول';

const GENERAL_GREETING: Record<'English' | 'Urdu', string> = {
  English: 'Parent or Guardian',
  Urdu: 'محترم والدین',
};

export function renderNoticeText(template: string, language: 'English' | 'Urdu', studentName: string | null) {
  const name = studentName ?? GENERAL_GREETING[language];
  return template.replace(/{{student_name}}/g, name).replace(/{{school_name}}/g, SCHOOL_NAME);
}
