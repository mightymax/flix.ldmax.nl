declare module 'tify' {
  export default class Tify {
    constructor(options: {container: HTMLElement; manifestUrl: string; language?: string; translationsDirUrl?: string});
    destroy(): void;
  }
}
