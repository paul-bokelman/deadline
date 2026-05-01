import { FileTypeList } from '../types/FileType';

const fileTypeList: FileTypeList = {
  bmpFile: { appId: 'quickView', id: 'bmpFile', iconId: 'bmpFile' },
  cdTrack: { appId: 'quickView', id: 'cdTrack', iconId: 'cdTrack' },
  helpFile: { appId: 'help', id: 'helpFile', iconId: 'helpFile' },
  jpegFile: { appId: 'quickView', id: 'jpegFile', iconId: 'bmpFile' },
  midiFile: { appId: 'quickView', id: 'midiFile', iconId: 'midiFile' },
  msDosApp: { appId: 'quickView', id: 'msDosApp', iconId: 'program' },
  notepadDoc: { appId: 'notepad', id: 'notepadDoc', iconId: 'notepadDoc' },
  pngFile: { appId: 'quickView', id: 'pngFile', iconId: 'bmpFile' },
  videoFile: { appId: 'quickView', id: 'videoFile', iconId: 'videoFile' },
  waveFile: { appId: 'quickView', id: 'waveFile', iconId: 'waveFile' },
  wordpadDoc: { appId: 'notepad', id: 'wordpadDoc', iconId: 'wordpadDoc' },
} as const;

export default fileTypeList;
