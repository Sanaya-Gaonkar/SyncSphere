import app from './app.js';

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`[SyncSphere PIM API] Server listening on port ${PORT}`);
  console.log(`[SyncSphere PIM API] Environment: ${process.env.NODE_ENV || 'development'}`);
});
