const multer = require('multer');

const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  const allowed = ['text/csv', 'text/plain', 'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'];
  const extAllowed = ['.csv', '.txt', '.pdf', '.xlsx', '.xls', '.docx'];
  const ext = '.' + file.originalname.split('.').pop().toLowerCase();

  if (allowed.includes(file.mimetype) || extAllowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV, Excel, PDF, Word (.docx), and TXT files are supported.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

module.exports = upload;
