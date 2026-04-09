export const uploadFile = async (req, res) => {
  const { id, year } = req.body;

  if (!id || !req.file || !year)
    return res.status(400).json({ error: "Missing fields" });

  try {
    const exists = await Upload.findOne({ docId: id });
    if (exists) return res.status(409).json({ error: "ID already exists" });

    const newUpload = await Upload.create({
      docId: id,
      filePath: req.file.filename,
      year: parseInt(year),
    });

    res.status(201).json({ message: "Upload successful" });
  } catch (err) {
    res.status(500).json({ error: "Upload failed" });
  }
};
