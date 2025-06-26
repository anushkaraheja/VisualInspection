import packageInfo from '../package.json';
import env from './env';

const app = {
  version: packageInfo.version,
  name: 'BrickRed Vision AI Portal',
  groupLogoUrl:
    'https://brickredsys.com/wp-content/uploads/2024/01/BR-Group-Logo.png',
  logoUrl:
    'https://brickredsys.com/wp-content/uploads/2025/02/visionailogo.png',
  url: env.appUrl,
};

export default app;
