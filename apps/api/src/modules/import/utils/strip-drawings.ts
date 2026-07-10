import JSZip from "jszip";

// Excel/Numbers/LibreOffice sometimes re-save the branded header's embedded logo
// in a drawing XML structure that ExcelJS's reader can't reconcile, throwing
// "Cannot read properties of undefined (reading 'anchors')" while loading an
// otherwise-valid workbook. Import only needs cell values, never images, so we
// strip every drawing/media part (and the worksheet's reference to it) from the
// zip before handing the buffer to ExcelJS — sidestepping that fragile code path
// entirely regardless of which tool re-saved the file.
//
// Legacy cell comments (VML "notes") hit the same class of bug: a sheet with real
// comments has a VmlDrawing relationship pointing at xl/drawings/vmlDrawingN.vml —
// a file that lives under xl/drawings/ and therefore gets deleted above. ExcelJS's
// reconcile() then dereferences that now-missing file via the still-present
// relationship and throws "Cannot read properties of undefined (reading 'comments')".
// Since import never reads comments either, we drop the comments parts and BOTH
// the comments and vmlDrawing relationships/references, not just plain drawings.
export async function stripDrawingsFromXlsx(buffer: Buffer): Promise<Buffer> {
  const zip = await JSZip.loadAsync(buffer);

  const toRemove: string[] = [];
  zip.forEach((relativePath) => {
    if (/^xl\/(drawings|media)\//.test(relativePath) || /^xl\/comments\d+\.xml$/.test(relativePath)) {
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
    const stripped = xml.replace(
      /<Relationship[^>]*Type="[^"]*\/(?:drawing|vmlDrawing|comments)"[^>]*\/>/g,
      "",
    );
    zip.file(relsPath, stripped);
  }

  const sheetFiles = Object.keys(zip.files).filter((path) =>
    /^xl\/worksheets\/sheet\d+\.xml$/.test(path),
  );
  for (const sheetPath of sheetFiles) {
    const file = zip.file(sheetPath);
    if (!file) continue;
    const xml = await file.async("string");
    const stripped = xml
      .replace(/<drawing[^>]*\/>/g, "")
      .replace(/<legacyDrawing[^>]*\/>/g, "");
    zip.file(sheetPath, stripped);
  }

  return zip.generateAsync({ type: "nodebuffer" });
}
