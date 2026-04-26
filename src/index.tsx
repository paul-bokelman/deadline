import { h, render } from 'preact';

import Win96Container from './components/containers/Win96Container/Win96Container';

import './theme/variables.css';
import './index.css';

const appRoot = document.getElementById('root');

if (!appRoot) {
  throw new Error('Root element was not found');
}

render(<Win96Container />, appRoot);
