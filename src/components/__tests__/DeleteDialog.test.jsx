import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import DeleteDialog from '../DeleteDialog';

// Mock the Headless UI components
import { Fragment } from 'react';

// Need to fully mock the headless UI components
vi.mock('@headlessui/react', () => {
  return {
    Dialog: Object.assign(
      ({ children, className, ...props }) => <div data-testid="dialog" {...props}>{children}</div>,
      {
        Panel: ({ children, className }) => <div data-testid="dialog-panel" className={className}>{children}</div>,
        Title: ({ children, className }) => <h3 data-testid="dialog-title" className={className}>{children}</h3>
      }
    ),
    Transition: {
      Root: ({ show, children, as }) => {
        // Handle Fragment by rendering its children directly
        if (as === Fragment) {
          return show ? <>{children}</> : null;
        }
        const Component = as || 'div';
        return show ? <Component data-testid="transition-root">{children}</Component> : null;
      },
      Child: ({ children, as }) => {
        // Handle Fragment by rendering its children directly
        if (as === Fragment) {
          return <>{children}</>;
        }
        const Component = as || 'div';
        return <Component data-testid="transition-child">{children}</Component>;
      }
    }
  };
});

// Mock HeroIcons
vi.mock('@heroicons/react/24/outline', () => ({
  ExclamationTriangleIcon: () => <div data-testid="exclamation-icon" />
}));

describe('DeleteDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();
  const taskTitle = 'Test Task';
  
  it('renders nothing when not open', () => {
    const { container } = render(
      <DeleteDialog 
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        taskTitle={taskTitle}
      />
    );
    
    expect(container).toBeEmptyDOMElement();
  });
  
  it('renders the dialog with correct title when open', () => {
    render(
      <DeleteDialog 
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        taskTitle={taskTitle}
      />
    );
    
    expect(screen.getByText('Delete Task')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete "Test Task"/)).toBeInTheDocument();
  });
  
  it('calls onClose when Cancel button is clicked', () => {
    render(
      <DeleteDialog 
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        taskTitle={taskTitle}
      />
    );
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
  
  it('calls onConfirm when Delete button is clicked', () => {
    render(
      <DeleteDialog 
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        taskTitle={taskTitle}
      />
    );
    
    fireEvent.click(screen.getByText('Delete'));
    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });
});