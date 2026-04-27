import { GameFlags } from '../state';

export type ZipExtractionLevel = GameFlags['zipExtractionLevel'];

export const getZipNameForLevel = (level: ZipExtractionLevel): string => {
  if (level === 2) {
    return 'FINAL_v2_FINAL_actuallyfinal_USE_THIS_ONE_v3.docx.exe.pdf_REAL.zip';
  }
  if (level === 3) {
    return 'FINAL_v2_FINAL_actuallyfinal_USE_THIS_ONE_v3.docx.exe.pdf_REAL_REAL.zip';
  }
  return 'FINAL_v2_FINAL_actuallyfinal_USE_THIS_ONE_v3.docx.exe.pdf.zip';
};
