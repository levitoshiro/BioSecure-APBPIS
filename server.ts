import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import multer from 'multer';
import fs from 'fs';
import { HyperchaoticSystem } from './src/services/encryption.js';
import crypto from 'crypto';

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Note: In a real environment, you'd use 'kubo-rpc-client' for IPFS
// and 'ethers' for Blockchain. Here we mock them for the demo.

const upload = multer({ dest: 'uploads/' });

if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Mock Database for records and logs
  const recordsDb: any[] = [];
  const accessLogs: any[] = [];

  app.use(express.json());

  // API Routes
  app.get('/api/records', (req: Request, res: Response) => {
    const { role, userId } = req.query;
    if (role === 'admin' || role === 'doctor') {
      return res.json(recordsDb);
    }
    return res.json(recordsDb.filter(r => r.ownerId === userId));
  });

  app.get('/api/logs', (req: Request, res: Response) => {
    const { role } = req.query;
    if (role !== 'admin') return res.status(403).json({ error: 'Unauthorized' });
    res.json(accessLogs);
  });

  app.post('/api/encrypt', upload.fields([
    { name: 'face', maxCount: 1 },
    { name: 'iris', maxCount: 1 },
    { name: 'document', maxCount: 1 }
  ]), async (req: MulterRequest, res: Response) => {
    try {
      const { ownerId, patientName } = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      if (!files.face || !files.iris || !files.document) {
        return res.status(400).json({ error: 'Missing required files (face, iris, or document)' });
      }
      
      const faceBuffer = fs.readFileSync(files.face[0].path);
      const irisBuffer = fs.readFileSync(files.iris[0].path);
      const combinedHash = crypto.createHash('sha256')
        .update(faceBuffer)
        .update(irisBuffer)
        .digest();
      
      const biometricVector = new Float32Array(2048);
      for(let i=0; i<2048; i++) {
        biometricVector[i] = (combinedHash[i % combinedHash.length] / 255) * 2 - 1;
      }

      const systemKey = process.env.SYSTEM_KEY || 'Hospital_Private_Master_Key_2026';
      
      const docBuffer = fs.readFileSync(files.document[0].path);
      const seeds = HyperchaoticSystem.generateSeeds(biometricVector, systemKey);
      const chaos = new HyperchaoticSystem();
      const { seqX, seqKey } = chaos.generateKeystream(seeds, docBuffer.length);
      
      const encrypted = chaos.encrypt(docBuffer, seqX, seqKey);
      const hash = crypto.createHash('sha512').update(encrypted).digest('hex');
      
      const cid = `Qm${crypto.randomBytes(16).toString('hex')}`;
      const encryptedPath = `uploads/${cid}.enc`;
      fs.writeFileSync(encryptedPath, encrypted);
      
      const txHash = `0x${crypto.randomBytes(32).toString('hex')}`;

      const newRecord = {
        id: Math.random().toString(36).substr(2, 9),
        name: files.document[0].originalname,
        cid,
        hash,
        txHash,
        timestamp: new Date().toLocaleString(),
        ownerId,
        patientName,
        seeds // Store seeds for emergency admin access (In real app, this would be encrypted with Admin Master Key)
      };
      recordsDb.push(newRecord);

      res.json({
        success: true,
        record: newRecord,
        biometricKey: combinedHash.toString('hex'),
        message: 'SVG encrypted using multimodal biometrics'
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Encryption failed' });
    }
  });

  app.post('/api/decrypt', upload.fields([
    { name: 'face', maxCount: 1 },
    { name: 'iris', maxCount: 1 }
  ]), async (req: MulterRequest, res: Response) => {
    try {
      const { cid, hash, userId, role, doctorPin } = req.body;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      const record = recordsDb.find(r => r.cid === cid);
      if (!record) return res.status(404).json({ error: 'Record not found' });

      // Permission check
      if (role === 'patient' && record.ownerId !== userId) {
        return res.status(403).json({ error: 'Unauthorized access to this record' });
      }

      // Additional Doctor Verification
      if (role === 'doctor' && doctorPin !== '123456') {
        return res.status(401).json({ error: 'Invalid Doctor Authorization PIN' });
      }

      if (!files.face || !files.iris) {
        return res.status(400).json({ error: 'Missing biometric files for re-verification' });
      }

      const encryptedPath = `uploads/${cid}.enc`;
      if (!fs.existsSync(encryptedPath)) return res.status(404).json({ error: 'Encrypted file not found' });

      const encrypted = fs.readFileSync(encryptedPath);
      
      // Integrity Check
      const currentHash = crypto.createHash('sha512').update(encrypted).digest('hex');
      if (currentHash !== hash) {
        return res.status(403).json({ error: 'Integrity check failed: Data tampering detected' });
      }

      // Re-generate Biometric Vector
      const faceBuffer = fs.readFileSync(files.face[0].path);
      const irisBuffer = fs.readFileSync(files.iris[0].path);
      const combinedHash = crypto.createHash('sha256')
        .update(faceBuffer)
        .update(irisBuffer)
        .digest();
      
      const biometricVector = new Float32Array(2048);
      for(let i=0; i<2048; i++) {
        biometricVector[i] = (combinedHash[i % combinedHash.length] / 255) * 2 - 1;
      }

      const systemKey = process.env.SYSTEM_KEY || 'Hospital_Private_Master_Key_2026';
      const seeds = HyperchaoticSystem.generateSeeds(biometricVector, systemKey);

      // Biometric Verification: Compare generated seeds with stored seeds
      const seedsMatch = record.seeds.every((s: number, i: number) => Math.abs(s - seeds[i]) < 1e-10);
      if (!seedsMatch) {
        return res.status(401).json({ error: 'Biometric verification failed: Identity mismatch' });
      }

      const chaos = new HyperchaoticSystem();
      const { seqX, seqKey } = chaos.generateKeystream(seeds, encrypted.length);
      
      const decrypted = chaos.decrypt(encrypted, seqX, seqKey);
      
      res.send(decrypted);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Decryption failed' });
    }
  });

  app.post('/api/emergency-decrypt', async (req: Request, res: Response) => {
    try {
      const { cid, adminId, reason } = req.body;
      const record = recordsDb.find(r => r.cid === cid);
      if (!record) return res.status(404).json({ error: 'Record not found' });

      // In a real app, verify adminId and role
      const encryptedPath = `uploads/${cid}.enc`;
      const encrypted = fs.readFileSync(encryptedPath);

      const chaos = new HyperchaoticSystem();
      const { seqX, seqKey } = chaos.generateKeystream(record.seeds, encrypted.length);
      const decrypted = chaos.decrypt(encrypted, seqX, seqKey);

      // Log the emergency access
      accessLogs.push({
        timestamp: new Date().toLocaleString(),
        adminId,
        patientName: record.patientName,
        recordId: record.id,
        reason,
        type: 'EMERGENCY_OVERRIDE'
      });

      res.send(decrypted);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Emergency decryption failed' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global error handler to ensure JSON responses for API errors
  app.use((err: any, req: Request, res: Response, next: express.NextFunction) => {
    console.error('Global error:', err);
    if (req.path.startsWith('/api/')) {
      res.status(500).json({ error: err.message || 'Internal Server Error' });
    } else {
      next(err);
    }
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
