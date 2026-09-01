type RecordLike = Record<string, any>;

function normalizeFileUrl(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const normalized = value.replace(/\\/g, "/");
  const apiUploadsPath = "/api/accreditation/uploads/files/";
  const uploadsPath = "/uploads/files/";
  const uploadsIndex = normalized.lastIndexOf(apiUploadsPath);

  if (uploadsIndex >= 0) {
    return normalized.slice(uploadsIndex);
  }

  const relativeIndex = normalized.lastIndexOf(apiUploadsPath.slice(1));

  if (relativeIndex >= 0) {
    return `/${normalized.slice(relativeIndex)}`;
  }

  const plainUploadsIndex = normalized.lastIndexOf(uploadsPath);

  if (plainUploadsIndex >= 0) {
    const suffix = normalized.slice(plainUploadsIndex + uploadsPath.length);
    return `${apiUploadsPath}${suffix}`;
  }

  return value;
}

function normalizeRecordFileFields<T extends RecordLike>(
  record: T,
  fields: string[]
): T {
  const mutableRecord = record as RecordLike;

  for (const field of fields) {
    if (field in mutableRecord) {
      mutableRecord[field] = normalizeFileUrl(
        mutableRecord[field]
      );
    }
  }

  return record;
}

export function normalizeFileFields<T>(
  data: T,
  fields: string[]
): T {
  if (Array.isArray(data)) {
    return data.map((item) =>
      normalizeFileFields(item, fields)
    ) as T;
  }

  if (data && typeof data === "object") {
    const maybeModel = data as RecordLike;

    if (
      "dataValues" in maybeModel &&
      maybeModel.dataValues &&
      typeof maybeModel.dataValues === "object"
    ) {
      normalizeRecordFileFields(
        maybeModel.dataValues,
        fields
      );
    }

    normalizeRecordFileFields(
      maybeModel,
      fields
    );
  }

  return data;
}
