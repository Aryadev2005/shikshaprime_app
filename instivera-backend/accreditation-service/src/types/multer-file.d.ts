declare module "multer" {
  export type File = Express.Multer.File & {
    location?: string;
  };
}
