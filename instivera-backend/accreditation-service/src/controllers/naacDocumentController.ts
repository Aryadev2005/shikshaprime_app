import { Response, NextFunction } from "express";
import { AppError } from "../utils/appError";
import { File as MulterFile } from "multer";
import { normalizeFileFields } from "../utils/fileUrl";
import { getTenantModels } from "../models";

function cleanString(value: unknown): string | null {
  if (value === undefined || value === null)
    return null;

  const trimmed = String(value).trim();

  return trimmed.length > 0
    ? trimmed
    : null;
}

function requiredString(
  value: unknown,
  field: string
): string {
  const cleaned =
    cleanString(value);

  if (!cleaned) {
    throw new AppError(
      `${field} is required`,
      400
    );
  }

  return cleaned;
}

function numberOrNull(
  value: unknown
): number | null {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const num = Number(value);

  return Number.isNaN(num)
    ? null
    : num;
}

function booleanValue(
  value: unknown,
  defaultValue = true
): boolean {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return defaultValue;
  }

  if (typeof value === "boolean") {
    return value;
  }

  return ["true", "1", "yes"].includes(
    String(value).toLowerCase()
  );
}

function firstValue(
  ...values: unknown[]
): unknown {
  return values.find(
    (v) =>
      v !== undefined &&
      v !== null &&
      v !== ""
  );
}

function bodySource(
  req: any
): Record<string, any> {
  return (
    req.body?.data ||
    req.body?.payload ||
    req.body ||
    {}
  );
}

function bodyValue(
  body: Record<string, any>,
  ...keys: string[]
) {
  return firstValue(
    ...keys.map((k) => body?.[k])
  );
}

function parseDocumentsInput(
  value: unknown
): any[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed
        : [];
    } catch {
      return [];
    }
  }

  return [];
}

function normalizeStoredDocuments(
  value: unknown
): any[] {
  return parseDocumentsInput(value).map(
    (document) => ({
      ...document,
      file_path:
        normalizeFileFields(
          { file_path: document?.file_path },
          ["file_path"]
        )?.file_path || document?.file_path,
    })
  );
}

function parseIndexList(
  value: unknown
): number[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => Number(item))
      .filter((item) => !Number.isNaN(item));
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isNaN(parsed)
      ? []
      : [parsed];
  }

  return [];
}

function getUploadedDocumentFiles(
  req: any
): MulterFile[] {
  const files =
    (req.files as MulterFile[]) || [];

  return files.filter((file) =>
    ["document_files", "documents"].includes(
      file.fieldname
    )
  );
}

function uploadedDocumentUrl(
  file?: MulterFile | null
): string | null {
  if (!file?.filename) {
    return null;
  }

  return `/api/accreditation/uploads/files/${file.filename}`;
}

function buildDocumentsPayload({
  incomingDocuments,
  uploadedFiles,
  uploadedFileIndexes = [],
  existingDocuments = [],
  requireFileUpload = false,
  preserveMissingExistingDocuments = true,
}: {
  incomingDocuments: any[];
  uploadedFiles: MulterFile[];
  uploadedFileIndexes?: number[];
  existingDocuments?: any[];
  requireFileUpload?: boolean;
  preserveMissingExistingDocuments?: boolean;
}) {
  const maxUploadedIndex =
    uploadedFileIndexes.length > 0
      ? Math.max(...uploadedFileIndexes)
      : -1;

  const totalDocuments = Math.max(
    incomingDocuments.length,
    maxUploadedIndex + 1,
    preserveMissingExistingDocuments
      ? existingDocuments.length
      : 0
  );

  if (
    requireFileUpload &&
    uploadedFiles.length === 0
  ) {
    throw new AppError(
      "File upload is required",
      400
    );
  }

  const documents = [];
  const uploadedFileMap = new Map<
    number,
    MulterFile
  >();

  uploadedFiles.forEach(
    (file, uploadedIndex) => {
      const documentIndex =
        uploadedFileIndexes[
          uploadedIndex
        ];

      if (
        documentIndex !== undefined &&
        !Number.isNaN(documentIndex)
      ) {
        uploadedFileMap.set(
          documentIndex,
          file
        );
      }
    }
  );

  for (
    let index = 0;
    index < totalDocuments;
    index += 1
  ) {
    const incomingDoc =
      incomingDocuments[index] || {};
    const existingDoc =
      existingDocuments[index] || {};
    const uploadedFile =
      uploadedFileMap.get(index);

    if (uploadedFile) {
      documents.push({
        document_name:
          cleanString(
            incomingDoc.document_name
          ) ||
          cleanString(
            existingDoc.document_name
          ) ||
          cleanString(
            uploadedFile.originalname
          ),
        original_file_name:
          uploadedFile.originalname,
        file_path:
          uploadedDocumentUrl(uploadedFile),
        file_size_kb: Math.ceil(
          uploadedFile.size / 1024
        ),
        file_type:
          uploadedFile.mimetype,
      });
      continue;
    }

    const existingPath =
      cleanString(incomingDoc.file_path) ||
      cleanString(existingDoc.file_path);

    if (!existingPath) {
      if (requireFileUpload) {
        throw new AppError(
          `File upload is required for document ${index + 1}`,
          400
        );
      }
      continue;
    }

    documents.push({
      document_name:
        cleanString(
          incomingDoc.document_name
        ) ||
        cleanString(
          existingDoc.document_name
        ),
      original_file_name:
        cleanString(
          incomingDoc.original_file_name
        ) ||
        cleanString(
          existingDoc.original_file_name
        ),
      file_path: existingPath,
      file_size_kb:
        numberOrNull(
          incomingDoc.file_size_kb
        ) ??
        numberOrNull(
          existingDoc.file_size_kb
        ),
      file_type:
        cleanString(
          incomingDoc.file_type
        ) ||
        cleanString(
          existingDoc.file_type
        ),
    });
  }

  return documents;
}

export async function createNaacDoc(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const { NaacDocs } =
      getTenantModels(req.tenant);

    const body = bodySource(req);
    const incomingDocuments =
      parseDocumentsInput(
        bodyValue(body, "documents")
      );
    const uploadedFileIndexes =
      parseIndexList(
        bodyValue(
          body,
          "document_file_indexes"
        )
      );
    const uploadedFiles =
      getUploadedDocumentFiles(req);

    const payload = {
      tenant_id: req.tenant_id || 1,

      academic_year_id: numberOrNull(
        bodyValue(body, "academic_year_id")
      ),

      title: requiredString(
        bodyValue(body, "title"),
        "title"
      ),

      description: cleanString(
        bodyValue(body, "description")
      ),

      doc_type: requiredString(
        bodyValue(body, "doc_type"),
        "doc_type"
      ) as
        | "PDF"
        | "IMAGE"
        | "DOC"
        | "EXCEL"
        | "OTHER",

      documents:
        buildDocumentsPayload({
          incomingDocuments,
          uploadedFiles,
          uploadedFileIndexes,
          requireFileUpload: true,
        }),

      is_public: booleanValue(
        bodyValue(body, "is_public"),
        true
      ),

      uploaded_by: requiredString(
        bodyValue(body, "uploaded_by"),
        "uploaded_by"
      ),

      status: (cleanString(
        bodyValue(body, "status")
      ) || "SAVED") as
        | "SAVED"
        | "FINAL",

      is_deleted: false,
    };

    const data =
      await NaacDocs.create(payload);

    return res.status(201).json({
      status: "success",
      message: "Document created successfully",
      data,
    });

  } catch (error) {
    next(error);
  }
}

export async function getNaacDocs(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const { NaacDocs } =
      getTenantModels(req.tenant);

    const where: Record<string, any> = { is_deleted: false, tenant_id: req.tenant_id || 1 };

    const id = numberOrNull(req.query.id);
    if (id) where.id = id;

    const academicYearId = numberOrNull(
      req.query.academic_year_id
    );
    if (academicYearId)
      where.academic_year_id =
        academicYearId;

    const records =
      await NaacDocs.findAll({
        where,
        order: [["id", "DESC"]],
      });

    const normalizedRecords =
      records.map((record: any) => {
        const documents =
          normalizeStoredDocuments(
            record.documents
          );

        if ("dataValues" in record) {
          record.dataValues.documents =
            documents;
        }

        record.documents = documents;
        return record;
      });

    return res.status(200).json({
      status: "success",
      data: normalizedRecords,
    });

  } catch (error) {
    next(error);
  }
}

export async function updateNaacDoc(
  req: any,
  res: Response,
  next: NextFunction
) {
  try {
    const { NaacDocs } =
      getTenantModels(req.tenant);

    const id = numberOrNull(req.params.id);

    if (!id) {
      throw new AppError(
        "Document id is required",
        400
      );
    }

    const record =
      await NaacDocs.findByPk(id);

    if (!record) {
      throw new AppError(
        "Document not found",
        404
      );
    }

    const body = bodySource(req);
    const incomingDocuments =
      parseDocumentsInput(
        bodyValue(body, "documents")
      );
    const uploadedFileIndexes =
      parseIndexList(
        bodyValue(
          body,
          "document_file_indexes"
        )
      );
    const uploadedFiles =
      getUploadedDocumentFiles(req);
    const existingDocs =
      normalizeStoredDocuments(
        record.documents
      );

    const payload = {
      tenant_id: req.tenant_id || 1,

      academic_year_id:
        bodyValue(body, "academic_year_id") !== undefined
          ? numberOrNull(
              bodyValue(body, "academic_year_id")
            )
          : record.academic_year_id,

      title:
        bodyValue(body, "title") !== undefined
          ? requiredString(
              bodyValue(body, "title"),
              "title"
            )
          : record.title,

      description:
        bodyValue(body, "description") !== undefined
          ? cleanString(
              bodyValue(body, "description")
            )
          : record.description,

      doc_type:
        bodyValue(body, "doc_type") !== undefined
          ? (requiredString(
              bodyValue(body, "doc_type"),
              "doc_type"
            ) as
              | "PDF"
              | "IMAGE"
              | "DOC"
              | "EXCEL"
              | "OTHER")
          : record.doc_type,

      documents:
        bodyValue(body, "documents") !== undefined ||
        uploadedFiles.length > 0
          ? buildDocumentsPayload({
              incomingDocuments,
              uploadedFiles,
              uploadedFileIndexes,
              existingDocuments: existingDocs,
              preserveMissingExistingDocuments: false,
            })
          : existingDocs,

      is_public:
        bodyValue(body, "is_public") !== undefined
          ? booleanValue(
              bodyValue(body, "is_public")
            )
          : record.is_public,

      uploaded_by:
        bodyValue(body, "uploaded_by") !== undefined
          ? requiredString(
              bodyValue(body, "uploaded_by"),
              "uploaded_by"
            )
          : record.uploaded_by,

      status:
        bodyValue(body, "status") !== undefined
          ? (requiredString(
              bodyValue(body, "status"),
              "status"
            ) as "SAVED" | "FINAL")
          : record.status,
    };

    await record.update(payload);

    const normalizedDocuments =
      normalizeStoredDocuments(
        record.documents
      );

    if ("dataValues" in record) {
      record.dataValues.documents =
        normalizedDocuments;
    }

    record.documents =
      normalizedDocuments;

    return res.status(200).json({
      status: "success",
      message: "Document updated successfully",
      data: record,
    });

  } catch (error) {
    next(error);
  }
}
