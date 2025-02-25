import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom'

// Mock ResizeObserver which is not available in jsdom
class MockResizeObserver {
  constructor(callback) {
    this.callback = callback;
    this.observations = new Map();
  }
  
  observe(target) {
    this.observations.set(target, { target });
  }
  
  unobserve(target) {
    this.observations.delete(target);
  }
  
  disconnect() {
    this.observations.clear();
  }
}

// Set up global mocks before tests run
global.ResizeObserver = MockResizeObserver;

afterEach(() => {
  cleanup()
}) 