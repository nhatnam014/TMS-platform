import JSZip from "jszip";

// Excel/Numbers/LibreOffice sometimes re-save the branded header's embedded logo
// in a drawing XML structure that ExcelJS's reader can't reconcile, throwing
// "Cannot read properties of undefined (reading 'anchors')" while loading an
// otherwise-valid workbook. Import only needs cell values, never images, so we
// strip every drawing/media part (and the worksheet's reference to it) from the
// zip before handing the buffer to ExcelJS — sidestepping that fragile code path
// entirely regardless of which tool re-saved the file.
export async function stripDrawingsFromXlsx(buffer: Buffer): Promise<Buffer> {
  const zip = await JSZip.loadAsync(buffer);

  const toRemove: string[] = [];
  zip.forEach((relativePath) => {
    if (/^xl\/(drawings|media)\//.test(relativePath)) {
      toRemove.push(relativePath);
    }
  });
  toRemove.forEach((path) => zip.remove(path));

  const relsFiles = Object.keys(zip.files).filter((path) =>
    /^xl\/worksheets\/_rels\/.*\.xml\.rels$/.test(path),
  );
  for (const relsPath of relsFiles) {
    const file = zip.file(relsPath);
    if (!file) continue;
    const xml = await file.async("string");
    const stripped = xml.replace(/<Relationship[^>]*Type="[^"]*\/drawing"[^>]*\/>/g, "");
    zip.file(relsPath, stripped);
  }

  const sheetFiles = Object.keys(zip.files).filter((path) =>
    /^xl\/worksheets\/sheet\d+\.xml$/.test(path),
  );
  for (const sheetPath of sheetFiles) {
    const file = zip.file(sheetPath);
    if (!file) continue;
    const xml = await file.async("string");
    const stripped = xml.replace(/<drawing[^>]*\/>/g, "");
    zip.file(sheetPath, stripped);
  }

  return zip.generateAsync({ type: "nodebuffer" });
}
