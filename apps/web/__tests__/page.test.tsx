import { render, screen } from '@testing-library/react';
import Home from '../src/app/page';

describe('Home', () => {
  it('renders a heading', () => {
    render(<Home />);

    const heading = screen.getByRole('heading', {
      name: /to get started, edit the page.tsx file./i,
    });

    expect(heading).toBeInTheDocument();
  });
});
