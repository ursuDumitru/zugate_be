const uploadController = (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
  
    console.log('File uploaded:', req.file);
  
    // Return the uploaded file's information
    res.json({
      message: 'File uploaded successfully',
      file: req.file,
    });
  };
  
  module.exports = uploadController;
  