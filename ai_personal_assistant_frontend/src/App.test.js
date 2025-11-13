import { render, screen } from '@testing-library/react';
import App from './App';

test('renders SmartAssist header', () => {
  render(<App />);
  const heading = screen.getByRole('heading', { name: /SmartAssist/i });
  expect(heading).toBeInTheDocument();
});
