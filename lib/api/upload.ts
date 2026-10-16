/** A file chosen with a native picker, reduced to what a multipart upload needs. */
export type PickedFile = {
  uri: string;
  name?: string | null;
  mimeType?: string | null;
};

/**
 * Builds the multipart body for a file upload. `fields` are appended as strings
 * (blank/null values are skipped); the optional `file` is attached under
 * `fileKey` as React Native's `{ uri, name, type }` file object.
 *
 * The client sends FormData untouched so fetch can set the multipart boundary.
 */
export function buildUploadForm(
  fields: Record<string, string | number | null | undefined>,
  file?: PickedFile | null,
  fileKey = 'file'
): FormData {
  const form = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    if (value === null || value === undefined || value === '') continue;
    form.append(key, String(value));
  }

  if (file) {
    form.append(fileKey, {
      uri: file.uri,
      name: file.name || 'upload',
      type: file.mimeType || 'application/octet-stream',
    } as unknown as Blob);
  }

  return form;
}
