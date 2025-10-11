export type Attachment = {
  type: "image" | "video" | "audio" | "file";
  file: File;
  url?: string;
};
