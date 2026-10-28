export interface ArchivalObject {
  id: string;
  name: string[];
  description: string[];
  imageUrl: string[];
  dateCreated: string[];
  media?: {
    id: string;
    manifestUrl?: string;
    contentUrl?: string;
    thumbnailUrl?: string;
    license?: string;
    copyrightNotice?: string;
  }[];
}
