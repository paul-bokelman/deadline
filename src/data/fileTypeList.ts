import { FileTypeList } from '../types/FileType';

const fileTypeList: FileTypeList = {
  bmpFile: { appId: 'quickView', id: 'bmpFile', iconId: 'bmpFile' },
  cdTrack: { appId: 'cdPlayer', id: 'cdTrack', iconId: 'cdTrack' },
  helpFile: { appId: 'help', id: 'helpFile', iconId: 'helpFile' },
  jpegFile: { appId: 'quickView', id: 'jpegFile', iconId: 'bmpFile' },
  midiFile: { appId: 'mediaPlayer', id: 'midiFile', iconId: 'midiFile' },
  msDosApp: { appId: 'msDos', id: 'msDosApp', iconId: 'program' },
  notepadDoc: { appId: 'notepad', id: 'notepadDoc', iconId: 'notepadDoc' },
  pngFile: { appId: 'quickView', id: 'pngFile', iconId: 'bmpFile' },
  videoFile: { appId: 'mediaPlayer', id: 'videoFile', iconId: 'videoFile' },
  waveFile: { appId: 'mediaPlayer', id: 'waveFile', iconId: 'waveFile' },
  wordpadDoc: { appId: 'wordpad', id: 'wordpadDoc', iconId: 'wordpadDoc' },
} as const;

export default fileTypeList;
