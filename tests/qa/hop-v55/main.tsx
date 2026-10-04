import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../../src/index.css';
import { HopV55FixturePreview } from '../../../src/ui/hopV55/FixturePreview';
createRoot(document.getElementById('root')!).render(<React.StrictMode><HopV55FixturePreview /></React.StrictMode>);
