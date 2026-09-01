type RecordLike = Record<string, any>;

const API_UPLOADS_PATH =
  "/api/admission/uploads/files/";

const UPLOADS_PATH = "/uploads/files/";

export function buildFileUrl(
  filename: string
): string {
  return `${API_UPLOADS_PATH}${filename}`;
}

function normalizeFileUrl(
  value: unknown
): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const normalized = value.replace(
    /\\/g,
    "/"
  );

  const apiUploadsIndex =
    normalized.lastIndexOf(
      API_UPLOADS_PATH
    );

  if (apiUploadsIndex >= 0) {
    return normalized.slice(
      apiUploadsIndex
    );
  }

  const relativeIndex =
    normalized.lastIndexOf(
      API_UPLOADS_PATH.slice(1)
    );

  if (relativeIndex >= 0) {
    return `/${normalized.slice(
      relativeIndex
    )}`;
  }

  const uploadsIndex =
    normalized.lastIndexOf(
      UPLOADS_PATH
    );

  if (uploadsIndex >= 0) {
    const suffix = normalized.slice(
      uploadsIndex +
        UPLOADS_PATH.length
    );

    return `${API_UPLOADS_PATH}${suffix}`;
  }

  return value;
}

function normalizeRecordFileFields<
  T extends RecordLike
>(
  record: T,
  fields: string[]
): T {
  const mutable =
    record as RecordLike;

  for (const field of fields) {
    if (field in mutable) {
      mutable[field] =
        normalizeFileUrl(
          mutable[field]
        );
    }
  }

  return record;
}

export function normalizeFileFields<
  T
>(
  data: T,
  fields: string[]
): T {
  if (Array.isArray(data)) {
    return data.map((item) =>
      normalizeFileFields(
        item,
        fields
      )
    ) as T;
  }

  if (
    data &&
    typeof data === "object"
  ) {
    const obj =
      data as RecordLike;

    if (
      "dataValues" in obj &&
      obj.dataValues &&
      typeof obj.dataValues ===
        "object"
    ) {
      normalizeRecordFileFields(
        obj.dataValues,
        fields
      );
    }

    normalizeRecordFileFields(
      obj,
      fields
    );
  }

  return data;
}