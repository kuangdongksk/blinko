import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Load .env from root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: `${__dirname}/.env` });

const prisma = new PrismaClient();

async function enableRegistration() {
  try {
    console.log('Enabling user registration...');

    // Check if config already exists
    const existingConfig = await prisma.config.findFirst({
      where: { key: 'isAllowRegister' }
    });

    if (existingConfig) {
      // Update existing config
      await prisma.config.update({
        where: { id: existingConfig.id },
        data: { config: { type: 'boolean', value: true } }
      });
      console.log('✅ Registration enabled successfully (updated existing config)!');
    } else {
      // Create new config
      await prisma.config.create({
        data: {
          key: 'isAllowRegister',
          config: { type: 'boolean', value: true }
        }
      });
      console.log('✅ Registration enabled successfully (created new config)!');
    }

    // Verify the change
    const verifyConfig = await prisma.config.findFirst({
      where: { key: 'isAllowRegister' }
    });

    console.log('Current registration setting:', {
      key: verifyConfig.key,
      value: verifyConfig.config.value,
      type: verifyConfig.config.type
    });

  } catch (error) {
    console.error('❌ Error enabling registration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

enableRegistration();
