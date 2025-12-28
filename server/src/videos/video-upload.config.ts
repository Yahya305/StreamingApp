import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as os from 'os';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

export const videoUploadOptions: MulterOptions = {
  storage: diskStorage({
    destination: os.tmpdir(),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(
        null,
        file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname),
      );
    },
  }),
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.match(/\/(mp4|quicktime|x-matroska|avi)$/)) {
      return cb(
        new BadRequestException('Only video files are allowed!'),
        false,
      );
    }
    cb(null, true);
  },
};
