import { Request, Response } from "express";
import { getTenantModels } from "../models";
import path from "path";
import fs from "fs";
import { uploadsDir } from "../middleware/fileUploadMiddleware";

export const getAllMedia = async (req: Request, res: Response) => {
  try {
    const tenant = (req as any).tenant;
    if (!tenant) return res.status(400).json({ status: "error", message: "Tenant missing" });

    const { MediaLibrary } = getTenantModels(tenant);

    const media = await MediaLibrary.findAll({
      order: [['created_at', 'DESC']]
    });

    return res.status(200).json({
      status: "success",
      data: media,
    });
  } catch (error: any) {
    console.error("Error fetching media library:", error);
    return res.status(500).json({ status: "error", message: error.message || "Internal server error" });
  }
};

export const uploadMedia = async (req: Request, res: Response) => {
  try {
    const tenant = (req as any).tenant;
    if (!tenant) return res.status(400).json({ status: "error", message: "Tenant missing" });

    if (!req.file) {
      return res.status(400).json({ status: "error", message: "No file uploaded" });
    }

    const { MediaLibrary } = getTenantModels(tenant);

    const file_path = `/uploads/files/${req.file.filename}`;
    
    const newMedia = await MediaLibrary.create({
      file_name: req.file.originalname,
      file_path: file_path,
      mime_type: req.file.mimetype,
      file_size: req.file.size
    });

    return res.status(201).json({
      status: "success",
      message: "Media uploaded successfully",
      data: newMedia,
    });
  } catch (error: any) {
    console.error("Error uploading media:", error);
    return res.status(500).json({ status: "error", message: error.message || "Internal server error" });
  }
};

export const deleteMedia = async (req: Request, res: Response) => {
  try {
    const tenant = (req as any).tenant;
    if (!tenant) return res.status(400).json({ status: "error", message: "Tenant missing" });

    const { MediaLibrary } = getTenantModels(tenant);
    const { id } = req.params;

    const media: any = await MediaLibrary.findByPk(Number(id));
    
    if (!media) {
      return res.status(404).json({ status: "error", message: "Media not found" });
    }

    // Try to physically delete the file if it exists
    try {
      const filename = path.basename(media.file_path);
      const filePathOnDisk = path.join(uploadsDir, filename);
      if (fs.existsSync(filePathOnDisk)) {
        fs.unlinkSync(filePathOnDisk);
      }
    } catch (fsError) {
      console.error(`Failed to delete physical file for media ${id}:`, fsError);
    }

    await MediaLibrary.destroy({ where: { id: Number(id) } });

    return res.status(200).json({
      status: "success",
      message: "Media deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting media:", error);
    return res.status(500).json({ status: "error", message: error.message || "Internal server error" });
  }
};
