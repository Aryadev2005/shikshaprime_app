import { NextFunction, Request, Response } from 'express';
import { NoticeService } from '../services/noticeService';


export class NoticeController {

  static async getRecentNotices(req, res: Response, next: NextFunction): Promise<void> {
    try {
      const notices = await NoticeService.getRecentNotices(req.tenant);

      res.status(200).json({
        status: 1,
        data: { data: notices,count: notices.length },
        message: "Notices are fetched successfully"        
      });
    } catch (error) {
      next(error);
    }
  }
  /**
   * Get all notices with pagination
   */
  static async getAllNotices(req, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;

      const { rows, count } = await NoticeService.getAllNotices(page, pageSize, req.tenant);

      res.status(200).json({
        status: 1,
        data: { 
            data: rows,
            pagination: {
                currentPage: page,
                pageSize,
                totalRecords: count,
                totalPages: Math.ceil(count / pageSize),
            },
            message: "Notices are fetched successfully"
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single notice by ID
   */
  static async getNoticeById(req, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (Array.isArray(id)) {
        // handle array case explicitly
        throw new Error("Invalid parameter: id should not be an array");
      }
      const notice = await NoticeService.getNoticeById(parseInt(String(id)), req.tenant);

      if (!notice) {
        res.status(404).json({ message: 'Notice not found' });
        return;
      }

      const toAbsoluteUrl = (p?: string | null) => {
        if (!p) return null;
        return p.startsWith('/') ? `${req.protocol}://${req.get('host')}${p}` : p;      
      };
      let document = null;
      if (notice.attachment) {
        document = { notice_attachment: toAbsoluteUrl((notice as any).attachment) };
      }         

      res.status(200).json({ 
        status: 1,
        data: { notice, document },
        message: "Notice is fetched successfully"
    });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new notice
   */
  static async createNotice(req, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, description, from_date, to_date } = req.body;

      // Handle file upload if provided
    let attachment: string = null;
    if (req.file) {
      // Generate the file URL path based on the uploaded file
      attachment = `/api/identity/files/documents/${req.file.filename}`;
    }

      const notice = await NoticeService.createNotice({
        title,
        description,
        attachment,
        from_date,
        to_date,
      }, req.tenant);

      res.status(201).json({
        status: 1,
        data: notice,
        message: "Notice is created successfully"
    });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a notice by ID
   */
  static async deleteNotice(req, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      if (Array.isArray(id)) {
        // handle array case explicitly
        throw new Error("Invalid parameter: id should not be an array");
      }
      const deleted = await NoticeService.deleteNotice( parseInt(String(id)), req.tenant);

      if (!deleted) {
        res.status(404).json({ message: 'Notice not found' });
        return;
      }

      res.status(200).json({ message: 'Notice deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
